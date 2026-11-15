/* ==========================================================================
   Mediterranean Sea Climate Observatory — Client-Side Statistical Engine
   Team Solari-X | NASA Space Apps "Be An Earth System Trend Detective"
   Modules: Stats (parametric & rank trend tests) and Adv (HAC, memory, breaks)
   ========================================================================== */

/* ---------- Trend statistics (runs in the browser) ---------- */
const Stats = (() => {
  /** Compute arithmetic mean of a numeric array. */
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

  /** Lanczos approximation of log-gamma ln(Gamma(x)). */
  function lgamma(x) {
    const c = [
      76.18009172947146,
      -86.50532032941677,
      24.01409824083091,
      -1.231739572450155,
      0.1208650973866179e-2,
      -0.5395239384953e-5
    ];
    let y = x;
    let t = x + 5.5;
    t -= (x + 0.5) * Math.log(t);
    let s = 1.000000000190015;
    for (let j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }

  /** Modified Lentz continued fraction for incomplete beta function. */
  function betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  /** Regularized incomplete beta I_x(a, b). */
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2)
      ? bt * betacf(a, b, x) / a
      : 1 - bt * betacf(b, a, 1 - x) / b;
  }

  /** Two-sided p-value for Student's t statistic with df degrees of freedom. */
  const tP = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5);

  /** Critical t value for two-sided confidence level via bisection. */
  function tCrit(df, conf = 0.95) {
    let lo = 0, hi = 50;
    const p = 1 - conf;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      (tP(mid, df) > p) ? (lo = mid) : (hi = mid);
    }
    return (lo + hi) / 2;
  }

  /** Complementary error function erfc(x) via rational Chebyshev approximation. */
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(
      -z * z - 1.26551223 +
      t * (1.00002368 +
      t * (0.37409196 +
      t * (0.09678418 +
      t * (-0.18628806 +
      t * (0.27886807 +
      t * (-1.13520398 +
      t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277))))))))
    );
    return x >= 0 ? r : 2 - r;
  }

  /** Two-sided normal p-value from z-score. */
  const normP2 = z => erfc(Math.abs(z) / Math.SQRT2);

  /** Ordinary Least Squares linear regression with Student's t-test and lag-1 residual autocorrelation. */
  function ols(x, y) {
    const n = x.length, mx = mean(x), my = mean(y);
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
      sxx += (x[i] - mx) ** 2;
      sxy += (x[i] - mx) * (y[i] - my);
    }
    const slope = sxy / sxx, icpt = my - slope * mx;
    let sse = 0;
    const res = [];
    for (let i = 0; i < n; i++) {
      const r = y[i] - (icpt + slope * x[i]);
      res.push(r);
      sse += r * r;
    }
    const df = n - 2, s2 = sse / df, se = Math.sqrt(s2 / sxx);
    const t = slope / se, p = tP(t, df), tc = tCrit(df);
    let r2 = 0;
    {
      let sst = 0;
      for (const v of y) sst += (v - my) ** 2;
      r2 = sst ? 1 - sse / sst : 0;
    }
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      den += res[i] ** 2;
      if (i) num += res[i] * res[i - 1];
    }
    return {
      n,
      slope,
      icpt,
      se,
      t,
      df,
      p,
      tc,
      ciLo: slope - tc * se,
      ciHi: slope + tc * se,
      r2,
      s: Math.sqrt(s2),
      mx,
      sxx,
      lag1: den ? num / den : 0
    };
  }

  /** Tie-corrected Mann-Kendall rank trend test and Kendall tau-b. */
  function mannKendall(y) {
    const n = y.length;
    let S = 0;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) S += Math.sign(y[j] - y[i]);
    }
    const counts = {};
    y.forEach(v => (counts[v] = (counts[v] || 0) + 1));
    let tie = 0;
    Object.values(counts).forEach(t => {
      if (t > 1) tie += t * (t - 1) * (2 * t + 5);
    });
    const varS = (n * (n - 1) * (2 * n + 5) - tie) / 18;
    const z = S === 0 ? 0 : (S - Math.sign(S)) / Math.sqrt(varS);
    const n1 = n * (n - 1) / 2;
    let tt = 0;
    Object.values(counts).forEach(t => (tt += t * (t - 1) / 2));
    return { S, z, p: normP2(z), tau: S / Math.sqrt((n1 - tt) * n1) };
  }

  /** Non-parametric Theil-Sen median pairwise slope and 95% confidence interval. */
  function theilSen(x, y) {
    const n = x.length, sl = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) sl.push((y[j] - y[i]) / (x[j] - x[i]));
    }
    sl.sort((a, b) => a - b);
    const med = a => {
      const m = a.length >> 1;
      return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
    };
    const slope = med(sl);
    const N = sl.length, varS = n * (n - 1) * (2 * n + 5) / 18, c = 1.959964 * Math.sqrt(varS);
    const lo = Math.max(Math.round((N - c) / 2) - 1, 0), hi = Math.min(Math.round((N + c) / 2), N - 1);
    const r = x.map((xi, i) => y[i] - slope * xi);
    return { slope, ciLo: sl[lo], ciHi: sl[hi], icpt: med(r.slice().sort((a, b) => a - b)) };
  }

  /** Run OLS, Mann-Kendall, and Theil-Sen together on (x, y). */
  function analyse(x, y) {
    const o = ols(x, y), m = mannKendall(y), s = theilSen(x, y);
    return { ols: o, mk: m, sen: s };
  }

  return { analyse, ols, mannKendall, theilSen, tCrit, tP, mean };
})();

/* ---------- Advanced trend detection ---------- */
const Adv = (() => {
  const S = Stats;
  const normCdf = z => 1 - 0.5 * (function (x) {
    const zz = Math.abs(x), t = 1 / (1 + 0.5 * zz);
    const r = t * Math.exp(
      -zz * zz - 1.26551223 +
      t * (1.00002368 +
      t * (0.37409196 +
      t * (0.09678418 +
      t * (-0.18628806 +
      t * (0.27886807 +
      t * (-1.13520398 +
      t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277))))))))
    );
    return x >= 0 ? r : 2 - r;
  })(z / Math.SQRT2);
  const normP2 = z => 2 * (1 - normCdf(Math.abs(z)));

  /** Newey-West (Bartlett kernel) HAC standard error of the OLS slope. */
  function hac(x, y, lags) {
    const o = S.ols(x, y), n = x.length, mx = o.mx;
    const u = x.map((xi, i) => (xi - mx) * (y[i] - (o.icpt + o.slope * xi)));
    let s = u.reduce((a, v) => a + v * v, 0);
    for (let l = 1; l <= lags; l++) {
      let g = 0;
      for (let i = l; i < n; i++) g += u[i] * u[i - l];
      s += 2 * (1 - l / (lags + 1)) * g;
    }
    const se = Math.sqrt(s) / o.sxx;
    const z = o.slope / se, p = normP2(z), c = 1.959964;
    return { se, z, p, lo: o.slope - c * se, hi: o.slope + c * se, lags };
  }

  /** Hamed-Rao variance-corrected Mann-Kendall test accounting for residual autocorrelation. */
  function mkHR(x, y) {
    const n = y.length, o = S.ols(x, y), mk = S.mannKendall(y);
    const res = y.map((v, i) => v - (o.icpt + o.slope * x[i]));
    const idx = res.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const rk = new Array(n);
    idx.forEach((p, r) => (rk[p[1]] = r + 1));
    const m = rk.reduce((a, v) => a + v, 0) / n;
    const den = rk.reduce((a, v) => a + (v - m) ** 2, 0);
    let corr = 1;
    const maxl = Math.min(n - 3, Math.floor(n / 3));
    for (let l = 1; l <= maxl; l++) {
      let num = 0;
      for (let i = l; i < n; i++) num += (rk[i] - m) * (rk[i - l] - m);
      const r = num / den, bound = 1.959964 / Math.sqrt(n);
      if (Math.abs(r) > bound) {
        corr += 2 / (n * (n - 1) * (n - 2)) * (n - l) * (n - l - 1) * (n - l - 2) * r;
      }
    }
    corr = Math.max(corr, 0.1);
    const varS = n * (n - 1) * (2 * n + 5) / 18 * corr, S0 = mk.S;
    const z = S0 === 0 ? 0 : (S0 - Math.sign(S0)) / Math.sqrt(varS);
    return { z, p: normP2(z), factor: corr };
  }

  /** Pettitt rank-based single change-point test. */
  function pettitt(x, y) {
    const n = y.length;
    let best = 0, kt = 0;
    for (let t = 0; t < n - 1; t++) {
      let U = 0;
      for (let i = 0; i <= t; i++) {
        for (let j = t + 1; j < n; j++) U += Math.sign(y[j] - y[i]);
      }
      if (Math.abs(U) > best) {
        best = Math.abs(U);
        kt = t;
      }
    }
    const p = Math.min(1, 2 * Math.exp(-6 * best * best / (n ** 3 + n ** 2)));
    const a = y.slice(0, kt + 1), b = y.slice(kt + 1);
    return { year: x[kt], idx: kt, p, K: best, meanBefore: S.mean(a), meanAfter: S.mean(b) };
  }

  /** Continuous two-segment (hinge) regression, best breakpoint by SSE; F-test vs single line. */
  function hinge(x, y, minSeg) {
    const n = y.length;
    minSeg = minSeg || 4;
    let best = null;
    const lin = S.ols(x, y);
    const sse1 = lin.s * lin.s * (n - 2);
    for (let k = minSeg; k <= n - minSeg - 1; k++) {
      const bk = x[k], h = x.map(v => Math.max(0, v - bk));
      const f = ols2(x, h, y);
      if (!best || f.sse < best.sse) best = Object.assign({ k, bk }, f);
    }
    if (!best) return null;
    const df2 = n - 4, F = ((sse1 - best.sse) / 2) / (best.sse / df2);
    const p = Math.pow(df2 / (df2 + 2 * F), df2 / 2);
    return Object.assign(best, { F, p: Math.min(1, p), slope1: best.b1, slope2: best.b1 + best.b2 });
  }

  /** Helper 3-parameter OLS for hinge regression. */
  function ols2(x, h, y) {
    const n = y.length, X = x.map((xi, i) => [1, xi - x[0], h[i]]);
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], B = [0, 0, 0];
    X.forEach((r, i) => {
      for (let a = 0; a < 3; a++) {
        B[a] += r[a] * y[i];
        for (let b = 0; b < 3; b++) A[a][b] += r[a] * r[b];
      }
    });
    const c = solve3(A, B);
    let sse = 0;
    X.forEach((r, i) => {
      const f = c[0] * r[0] + c[1] * r[1] + c[2] * r[2];
      sse += (y[i] - f) ** 2;
    });
    return { sse, b0: c[0], b1: c[1], b2: c[2], x0: x[0] };
  }

  /** Gaussian elimination with partial pivoting for 3x3 linear system. */
  function solve3(A, B) {
    const M = A.map((r, i) => r.concat(B[i]));
    for (let i = 0; i < 3; i++) {
      let p = i;
      for (let r = i + 1; r < 3; r++) {
        if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      }
      [M[i], M[p]] = [M[p], M[i]];
      for (let r = i + 1; r < 3; r++) {
        const f = M[r][i] / M[i][i];
        for (let c = i; c < 4; c++) M[r][c] -= f * M[i][c];
      }
    }
    const s = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
      let v = M[i][3];
      for (let c = i + 1; c < 3; c++) v -= M[i][c] * s[c];
      s[i] = v / M[i][i];
    }
    return s;
  }

  /** Quadratic curvature test for trend acceleration or deceleration. */
  function accel(x, y) {
    const n = y.length, mx = S.mean(x), t = x.map(v => v - mx), q = t.map(v => v * v);
    const qm = S.mean(q), qc = q.map(v => v - qm);
    const B = [0, 0, 0];
    const X = t.map((v, i) => [1, v, qc[i]]);
    const AA = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    X.forEach((r, i) => {
      for (let a = 0; a < 3; a++) {
        B[a] += r[a] * y[i];
        for (let b = 0; b < 3; b++) AA[a][b] += r[a] * r[b];
      }
    });
    const c = solve3(AA, B);
    let sse = 0;
    X.forEach((r, i) => {
      sse += (y[i] - (c[0] * r[0] + c[1] * r[1] + c[2] * r[2])) ** 2;
    });
    const df = n - 3, s2 = sse / df;
    const inv = inv3(AA), se = Math.sqrt(s2 * inv[2][2]);
    const tt = c[2] / se, p = S.tP(tt, df);
    return { c2: c[2], se, t: tt, df, p, per2decade: 2 * c[2] * 100 };
  }

  /** Explicit 3x3 matrix inverse via adjugate and determinant. */
  function inv3(m) {
    const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2];
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [
      [A, -(b * i - c * h), b * f - c * e].map(v => v / det),
      [B, a * i - c * g, -(a * f - c * d)].map(v => v / det),
      [C, -(a * h - b * g), a * e - b * d].map(v => v / det)
    ];
  }

  /** Rolling-window OLS slope and 95% confidence interval across width w. */
  function rolling(x, y, w) {
    const out = [];
    for (let i = 0; i + w <= x.length; i++) {
      const o = S.ols(x.slice(i, i + w), y.slice(i, i + w));
      out.push({
        x: (x[i] + x[i + w - 1]) / 2,
        slope: o.slope,
        lo: o.ciLo,
        hi: o.ciHi,
        p: o.p,
        x0: x[i],
        x1: x[i + w - 1]
      });
    }
    return out;
  }

  return { hac, mkHR, pettitt, hinge, accel, rolling };
})();

(function (root) {
  root.Stats = Stats;
  root.Adv = Adv;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { Stats, Adv };
  }
})(typeof window !== "undefined" ? window : globalThis);
