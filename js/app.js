/* ==========================================================================
   Mediterranean Sea Climate Observatory — UI & Interactive Visualizations
   Team Solari-X | Loads window.CLIMATE_DATA, window.MAP_DATA, Stats, and Adv
   ========================================================================== */
(function () {
  "use strict";
  var raw = window.CLIMATE_DATA;
  var MAP = window.MAP_DATA;
  var MINUS = "−";

  /* ---------- theme state & persistence ---------- */
  function syncThemeButton(theme) {
    var btn = $("theme-toggle");
    if (!btn) return;
    btn.textContent = theme === "light" ? "Dark mode" : "Light mode";
    btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("solarix-theme"); } catch (e) {}
    var theme = saved || document.documentElement.getAttribute("data-theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    syncThemeButton(theme);
    var btn = $("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        var next = cur === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("solarix-theme", next); } catch (e) {}
        syncThemeButton(next);
      });
    }
  }

  /* ---------- variable catalog ---------- */
  var VARS = {
    sst: {
      name: "Sea surface temperature", tag: "NOAA OI v2 · satellite era", color: "--s-sst", place: "basin",
      rows: function () { return raw.knmi.sstoiv2_monthly_mean; }, scale: 1, anomaly: false, unit: "°C", dp: 3, pub: "sstoiv2_monthly_mean",
      def: "The temperature of the top layer of the sea, blended from satellite and ship and buoy readings, averaged over the whole basin and over each year.",
      measured: "Infrared satellite sensors plus in-situ measurements", product: "NOAA OI SST v2 (monthly mean, annualized) via KNMI",
      region: "Mediterranean bounding box (KNMI)", why: "Warm water drives stronger stratification, marine heatwaves and species shifts."
    },
    had: {
      name: "Long-term sea surface temperature", tag: "HadISST1 · since 1870", color: "--s-had", place: "basin",
      rows: function () { return raw.knmi.hadisst1; }, scale: 1, anomaly: false, unit: "°C", dp: 4, pub: "hadisst1",
      def: "A reconstruction of sea surface temperature back to 1870, built from ship records and later satellites. It shows the slow, century-scale background warming.",
      measured: "Ship, buoy and satellite compilation", product: "HadISST1, Met Office Hadley Centre, via KNMI",
      region: "Mediterranean bounding box (KNMI)", why: "A 156-year baseline shows how unusual recent warming is."
    },
    sla: {
      name: "Sea level anomaly", tag: "Copernicus altimetry · 1993–2021", color: "--s-sla", place: "basin",
      rows: function () { return raw.knmi.copernicus_sla; }, scale: 1000, anomaly: false, unit: "mm", dp: 2, pub: "copernicus_sla",
      def: "How far the sea surface sits above or below a long-term reference height. Warming water expands and melting land ice adds water, so the anomaly climbs.",
      measured: "Radar altimeters on satellites", product: "Copernicus sea-level anomalies via KNMI",
      region: "Mediterranean bounding box (KNMI)", why: "Rising seas raise flood and erosion risk along every Mediterranean coast."
    },
    ohc: {
      name: "Ocean heat content, 0–400 m", tag: "UKMO EN4 · 1950–2025", color: "--s-ohc", place: "basin",
      rows: function () { return raw.knmi.en4_ohc400; }, scale: 1e-9, anomaly: true, unit: "10⁹ J/m²", dp: 3, pub: "en4_ohc400",
      def: "The heat stored in the upper 400 meters of water for each square meter of sea. Shown here as the difference from the 1950–2025 average.",
      measured: "Profiling floats, ship casts and gliders, gridded by objective analysis", product: "UKMO EN4 ocean heat content 0–400 m via KNMI",
      region: "Mediterranean bounding box (KNMI)", why: "Most of the heat trapped by greenhouse gases ends up in the ocean."
    },
    sal: {
      name: "Surface salinity", tag: "UKMO EN4 · 1900–2025", color: "--s-sal", place: "basin",
      rows: function () { return raw.knmi.en4_sos; }, scale: 1, anomaly: true, unit: "", dp: 4, pub: "en4_sos",
      def: "The saltiness of surface water on the practical salinity scale, which has no units. Shown here as the difference from the 1900–2025 average.",
      measured: "Ship samples and profiling floats", product: "UKMO EN4 surface salinity via KNMI",
      region: "Mediterranean bounding box (KNMI)", why: "Salinity shapes circulation and how easily the surface layer mixes."
    },
    chl: {
      name: "Chlorophyll-a concentration", tag: "Copernicus ocean color · SDG 14", color: "--s-chl", place: "basin",
      rows: function () { return raw.chlorophyll; }, scale: 1, anomaly: false, unit: "mg m⁻³", dp: 5, pub: "chl",
      def: "The amount of green pigment in surface water, used to estimate how much phytoplankton is growing. Phytoplankton are the base of the marine food web.",
      measured: "Ocean-color satellite sensors", product: "OMI_HEALTH_CHL_MEDSEA_OCEANCOLOUR_area_averaged_mean (annual mean, years with at least 10 valid months)",
      region: "Mediterranean sea mask, area weighted (Copernicus)", why: "Official indicator for SDG 14 targets on ocean health and eutrophication."
    },
    rain: {
      name: "Alexandria rain", tag: "NASA GPM IMERG · Egypt", color: "--s-rain", place: "alex", short: "Alexandria",
      rows: function () { return raw.alexandria_precipitation; }, scale: 1, anomaly: false, unit: "mm", dp: 1, pub: "rain",
      def: "Total rain that fell in a year at one 0.1° grid cell on the Egyptian coast, estimated by satellite and summed from half-hourly rates.",
      measured: "Passive microwave and radar constellation, calibrated to rain gauges", product: "GPM IMERG Final L3 half-hourly, GPM_3IMERGHH.07 (years with at least 95% of records)",
      region: "Alexandria, Egypt: 31.25°N, 29.95°E (land cell)", why: "Intense coastal storms bring flash floods and carry runoff toward the sea."
    },
    rain_ath: {
      name: "Athens rain", tag: "NASA GPM IMERG · Greece", color: "--s-ath", place: "ath", short: "Athens",
      rows: function () { return raw.gpm.athens; }, scale: 1, anomaly: false, unit: "mm", dp: 1, pub: "rain_ath",
      def: "Total rain that fell in a year at the 0.1° grid cell around Athens, estimated by satellite and summed from half-hourly rates. Eastern Mediterranean, sheltered by mountains to the west.",
      measured: "Passive microwave and radar constellation, calibrated to rain gauges", product: "GPM IMERG Final L3 half-hourly, GPM_3IMERGHH.07 (complete years only, at least 95% of records)",
      region: "Athens, Greece: 38.05°N, 23.65°E (land cell)", why: "Mediterranean cyclones and urban flash floods make Attica rain a public-safety and water-supply question."
    },
    rain_bcn: {
      name: "Barcelona rain", tag: "NASA GPM IMERG · Spain", color: "--s-bcn", place: "bcn", short: "Barcelona",
      rows: function () { return raw.gpm.barcelona; }, scale: 1, anomaly: false, unit: "mm", dp: 1, pub: "rain_bcn",
      def: "Total rain that fell in a year at the 0.1° grid cell around Barcelona, estimated by satellite and summed from half-hourly rates. Western Mediterranean, with strong autumn storms.",
      measured: "Passive microwave and radar constellation, calibrated to rain gauges", product: "GPM IMERG Final L3 half-hourly, GPM_3IMERGHH.07 (complete years only, at least 95% of records)",
      region: "Barcelona, Spain: 41.45°N, 2.15°E (land cell)", why: "Intense autumn rain drives flash floods on the Catalan coast and sediment delivery to the sea."
    }
  };
  var ORDER = ["sst", "sla", "chl", "rain", "rain_ath", "rain_bcn", "ohc", "had", "sal"];
  var PLACES = {
    basin: { name: "Mediterranean basin", sub: "6 sea records" },
    alex: { name: "Alexandria", sub: "East Med · Egypt" },
    ath: { name: "Athens", sub: "East Med · Greece" },
    bcn: { name: "Barcelona", sub: "West Med · Spain" }
  };

  function series(id) {
    var v = VARS[id], r = v.rows(), ys = r.map(function (d) { return d.year; }), vals = r.map(function (d) { return d.value * v.scale; });
    if (v.anomaly) { var m = Stats.mean(vals); vals = vals.map(function (x) { return x - m; }); }
    return { x: ys, y: vals };
  }

  /* published results, normalized */
  function pub(id) {
    var v = VARS[id], t;
    var f = function (o, k) { return o[k] === undefined ? NaN : parseFloat(o[k]); };
    if (v.pub === "rain_ath" || v.pub === "rain_bcn") {
      t = raw.gpm_trends[v.pub === "rain_ath" ? "athens" : "barcelona"];
      return { period: "2001–2024", n: 24, slope: t.slope_per_decade, lo: t.ci95_low_per_decade, hi: t.ci95_high_per_decade, p: t.hac_p_value, q: t.bh_q_value, sen: t.sen_slope_per_decade, senLo: t.sen_ci_low_per_decade, senHi: t.sen_ci_high_per_decade, tau: t.mann_kendall_tau, mkp: t.mann_kendall_p_value, first: 2001, last: 2024 };
    }
    if (v.pub === "chl" || v.pub === "rain") {
      t = raw.trends_all[v.pub === "chl" ? 0 : 1];
      return { period: t.period_start + "–" + t.period_end, n: +t.n_years, slope: f(t, "slope_per_decade"), lo: f(t, "ci95_low_per_decade"), hi: f(t, "ci95_high_per_decade"), p: f(t, "hac_p_value"), q: f(t, "bh_q_value"), sen: f(t, "sen_slope_per_decade"), senLo: f(t, "sen_ci_low_per_decade"), senHi: f(t, "sen_ci_high_per_decade"), tau: f(t, "mann_kendall_tau"), mkp: f(t, "mann_kendall_p_value"), first: +t.period_start, last: +t.period_end };
    }
    t = raw.trends_knmi.filter(function (o) { return o.field_id === v.pub; })[0];
    return { period: t.period, n: +t.n_complete_years, slope: f(t, "ols_slope_per_decade"), lo: f(t, "hac95_ci_low_per_decade"), hi: f(t, "hac95_ci_high_per_decade"), p: f(t, "hac_p_value"), q: f(t, "hac_bh_q_value"), sen: f(t, "sen_slope_per_decade"), senLo: f(t, "sen95_ci_low_per_decade"), senHi: f(t, "sen95_ci_high_per_decade"), tau: f(t, "mann_kendall_tau"), mkp: f(t, "mann_kendall_p_unadjusted"), first: +t.first_year, last: +t.last_year };
  }
  function verdictOf(hacOk, mkOk) { return hacOk && mkOk ? "both" : (hacOk || mkOk ? "mixed" : "none"); }
  var VERDICT_LABEL = { both: "Tests agree", mixed: "Mixed evidence", none: "Not significant" };

  /* ---------- formatting ---------- */
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  function sup(n) { return String(n).split("").map(function (c) { return SUP[c] || c; }).join(""); }
  function fnum(v, dp, sign) {
    if (!isFinite(v)) return "n/a";
    var s = Math.abs(v).toFixed(dp);
    if (+s === 0) return s;
    return (v < 0 ? MINUS : (sign ? "+" : "")) + s;
  }
  function fp(p) {
    if (!isFinite(p)) return "n/a";
    if (p < 1e-15) return "< 10" + sup(-15);
    if (p < 0.001) { var e = Math.floor(Math.log10(p)); var m = p / Math.pow(10, e); return m.toFixed(1) + " × 10" + sup(e); }
    return p.toFixed(p < 0.01 ? 4 : 3);
  }
  function peq(p) { var t = fp(p); return t.charAt(0) === "<" ? "p " + t : "p = " + t; }
  function cv(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }

  /* ---------- plotly helpers ---------- */
  function baseLayout(extra) {
    var o = {
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: '"IBM Plex Sans", system-ui, sans-serif', color: cv("--fg-2"), size: 12 },
      margin: { l: 64, r: 18, t: 18, b: 52 },
      xaxis: { gridcolor: cv("--grid"), zeroline: false, linecolor: cv("--line"), tickfont: { color: cv("--fg-3") }, title: { standoff: 10 } },
      yaxis: { gridcolor: cv("--grid"), zerolinecolor: cv("--line"), zerolinewidth: 1, linecolor: "rgba(0,0,0,0)", tickfont: { color: cv("--fg-3") }, title: { standoff: 10 } },
      hovermode: "x unified",
      hoverlabel: { bgcolor: cv("--panel-2"), bordercolor: cv("--line"), font: { family: '"IBM Plex Sans", sans-serif', color: cv("--fg"), size: 12 } },
      showlegend: false
    };
    for (var k in extra) {
      if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k]) && o[k]) { o[k] = Object.assign({}, o[k], extra[k]); }
      else o[k] = extra[k];
    }
    return o;
  }
  var CFG = { responsive: true, displayModeBar: false };
  function draw(id, traces, layout) { var el = $(id); if (!el || !window.Plotly) return; Plotly.react(el, traces, layout, CFG); }
  function ytitle(t) { return { text: t, font: { color: cv("--fg-2"), size: 12 } }; }

  /* ---------- sparkline ---------- */
  function spark(xs, ys, colorVar) {
    var W = 200, H = 38, pad = 3, mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys), x0 = xs[0], x1 = xs[xs.length - 1];
    var pts = xs.map(function (x, i) { return [pad + (x - x0) / (x1 - x0) * (W - 2 * pad), H - pad - (ys[i] - mn) / (mx - mn || 1) * (H - 2 * pad)]; });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("");
    var last = pts[pts.length - 1];
    return '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + line + "L" + last[0].toFixed(1) + " " + H + "L" + pts[0][0].toFixed(1) + " " + H + 'Z" fill="var(' + colorVar + ')" fill-opacity=".14"/>' +
      '<path d="' + line + '" fill="none" stroke="var(' + colorVar + ')" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.2" fill="var(' + colorVar + ')" stroke="var(--panel)" stroke-width="1.5"/></svg>';
  }

  /* ---------- tabs & routing ---------- */
  var TABS = [["overview", "Overview"], ["detective", "Data Detective"], ["rain", "Rain compare"], ["variables", "Variables"], ["seasons", "Seasonality"], ["map", "Region map"], ["statistics", "Statistics"], ["guardrails", "Guardrails"]];
  var current = null;
  function buildTabs() {
    $("tabs").innerHTML = TABS.map(function (t) { return '<button class="tab" role="tab" id="tab-' + t[0] + '" aria-controls="panel-' + t[0] + '" data-tab="' + t[0] + '">' + t[1] + "</button>"; }).join("");
    $("tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) go(b.getAttribute("data-tab")); });
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) { go(b.getAttribute("data-go")); window.scrollTo({ top: 0 }); } });
  }
  function go(id) { if (location.hash.slice(1) !== id) location.hash = id; else activate(id); }
  function activate(id) {
    if (!TABS.some(function (t) { return t[0] === id; })) id = "overview";
    current = id;
    $("hero").hidden = id !== "overview";
    TABS.forEach(function (t) {
      var on = t[0] === id;
      $("panel-" + t[0]).hidden = !on;
      var b = $("tab-" + t[0]); b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1;
    });
    renderTab(id);
  }
  function renderTab(id) {
    if (id === "overview") renderOverview();
    else if (id === "detective") renderDetective();
    else if (id === "rain") renderRain();
    else if (id === "seasons") renderSeasons();
    else if (id === "map") renderMap();
  }

  /* ---------- KPIs ---------- */
  var KPI_IDS = ["sst", "sla", "chl", "rain"];
  var KPI_LABEL = { sst: "Sea surface temperature", sla: "Sea level", chl: "Chlorophyll-a", rain: "Alexandria rain" };
  var KPI_UNIT = { sst: "°C / decade", sla: "mm / decade", chl: "mg m⁻³ / decade", rain: "mm / decade" };
  var KPI_DP = { sst: 3, sla: 1, chl: 4, rain: 1 };
  function buildKpis() {
    $("kpis").innerHTML = KPI_IDS.map(function (id) {
      var p = pub(id), s = series(id), vd = verdictOf(p.q < 0.05, p.mkp < 0.05), v = VARS[id];
      return '<button class="kpi" data-case="' + id + '" aria-label="Investigate ' + esc(KPI_LABEL[id]) + '">' +
        '<div class="k-top"><span class="swatch" style="background:var(' + v.color + ')"></span>' + esc(KPI_LABEL[id]) + "</div>" +
        '<div class="k-val num">' + fnum(p.slope, KPI_DP[id], true) + "<small>" + KPI_UNIT[id] + "</small></div>" +
        spark(s.x, s.y, v.color) +
        '<div class="k-sub num">' + p.period + " · p " + (p.p < 1e-15 ? "< 10" + sup(-15) : "= " + fp(p.p)) + "</div>" +
        '<span class="status ' + (vd === "both" ? "" : vd) + '"><i></i>' + VERDICT_LABEL[vd] + "</span></button>";
    }).join("");
    $("kpis").addEventListener("click", function (e) { var b = e.target.closest("[data-case]"); if (b) { loadCase(b.getAttribute("data-case")); go("detective"); window.scrollTo({ top: 0 }); } });
  }

  /* ---------- overview ---------- */
  var zOn = { sst: true, sla: true, chl: true, rain: true };
  function zscore(s) { var m = Stats.mean(s.y), sd = Math.sqrt(s.y.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (s.y.length - 1)); return { x: s.x, y: s.y.map(function (v) { return (v - m) / sd; }) }; }
  function renderOverview() {
    $("zchips").innerHTML = KPI_IDS.map(function (id) {
      return '<button class="chip legend-chip' + (zOn[id] ? "" : " off") + '" data-z="' + id + '" aria-pressed="' + zOn[id] + '"><span class="swatch" style="background:var(' + VARS[id].color + ')"></span>' + esc(KPI_LABEL[id]) + "</button>";
    }).join("");
    var traces = KPI_IDS.filter(function (id) { return zOn[id]; }).map(function (id) {
      var z = zscore(series(id));
      return { x: z.x, y: z.y, name: KPI_LABEL[id], mode: "lines+markers", line: { color: cv(VARS[id].color), width: 2, dash: id === "rain" ? "dot" : "solid" }, marker: { size: 6, color: cv(VARS[id].color), line: { width: 1.5, color: cv("--panel") } }, hovertemplate: "%{y:.2f} σ" };
    });
    draw("plot-z", traces, baseLayout({ xaxis: { range: [1981, 2026], title: { text: "Year" }, dtick: 5 }, yaxis: { title: ytitle("Standard deviations from the record's own mean") }, margin: { l: 70 } }));
    var f = [];
    var ps = pub("sst"), pl = pub("sla"), pc = pub("chl"), pr = pub("rain"), ph = pub("had");
    f.push("<span><b>Fast warming.</b> Satellite-era SST rose " + fnum(ps.slope, 2) + " °C per decade since 1982, about " + Math.round(ps.slope / ph.slope) + " times the " + fnum(ph.slope, 3) + " °C per decade long-run rate in HadISST1 since 1870.</span>");
    f.push("<span><b>Rising sea.</b> Altimetry shows " + fnum(pl.slope, 1) + " mm per decade of sea level rise from 1993 to 2021, from thermal expansion and added water.</span>");
    f.push("<span><b>Fading chlorophyll.</b> Basin chlorophyll fell " + fnum(Math.abs(pc.slope), 4) + " mg m⁻³ per decade (HAC " + peq(pc.p) + "), consistent with a more strongly layered, less productive surface.</span>");
    f.push("<span><b>Wetter, but uncertain.</b> Alexandria rain gained " + fnum(pr.slope, 1) + " mm per decade (HAC " + peq(pr.p) + "), yet Mann–Kendall gives " + peq(pr.mkp) + ". A few storm years drive it.</span>");
    var pa = pub("rain_ath"), pb = pub("rain_bcn"), ma = Stats.mean(series("rain_ath").y), mb = Stats.mean(series("rain_bcn").y);
    f.push("<span><b>No shared rain signal.</b> Athens (" + fnum(pa.slope / ma * 100, 0, true) + "% per decade) and Barcelona (" + fnum(pb.slope / mb * 100, 0, true) + "%) trend the other way from Alexandria, but neither differs from zero (HAC " + peq(pa.p) + " and " + peq(pb.p) + ").</span>");
    $("findings").innerHTML = f.map(function (h) { return "<li>" + h + "</li>"; }).join("");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-z]"); if (!b) return;
    var id = b.getAttribute("data-z"), n = KPI_IDS.filter(function (k) { return zOn[k]; }).length;
    if (zOn[id] && n === 1) return;
    zOn[id] = !zOn[id]; renderOverview();
  });

  /* ---------- Data Detective ---------- */
  var CASES = [
    { id: "sst", title: "Is the sea warming?", hint: "Satellite SST, 1982–2025", v: "sst" },
    { id: "sla", title: "Is the sea rising?", hint: "Altimetry, 1993–2021", v: "sla" },
    { id: "chl", title: "Is the sea losing its green?", hint: "Chlorophyll-a, SDG 14", v: "chl" },
    { id: "rain", title: "Is Alexandria getting wetter?", hint: "A trend that splits the tests", v: "rain" },
    { id: "ath", title: "Is Athens getting drier?", hint: "NASA GPM, 2001–2024", v: "rain_ath" },
    { id: "bcn", title: "Is Barcelona getting drier?", hint: "NASA GPM, 2001–2024", v: "rain_bcn" },
    { id: "short", title: "Too early to tell?", hint: "SST 1982–1998 looks flat", v: "sst", end: 1998 }
  ];
  var st = { v: "sst", place: "basin", a: 1982, b: 2025, band: true, sen: false, cp: false, win: null, demo: null, caseId: "sst" };
  function range(id) { var s = series(id); return [s.x[0], s.x[s.x.length - 1]]; }
  var MINSPAN = 10;

  function loadCase(id) {
    var c = CASES.filter(function (k) { return k.id === id; })[0] || CASES[0];
    stopDemo();
    st.v = c.v; st.place = VARS[c.v].place; var r = range(c.v); st.a = r[0]; st.b = c.end || r[1]; st.caseId = c.id;
    if (current === "detective") renderDetective();
  }
  function buildCases() {
    $("cases").innerHTML = CASES.map(function (c) { return '<button class="case" data-c="' + c.id + '" aria-pressed="false"><b>' + esc(c.title) + "</b><span>" + esc(c.hint) + "</span></button>"; }).join("");
    $("cases").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) loadCase(b.getAttribute("data-c")); });
  }
  function buildControls() {
    $("place-seg").innerHTML = Object.keys(PLACES).map(function (k) { return '<button data-p="' + k + '" aria-pressed="false">' + PLACES[k].name + "<small>" + PLACES[k].sub + "</small></button>"; }).join("");
    $("place-seg").addEventListener("click", function (e) {
      var b = e.target.closest("[data-p]"); if (!b) return; stopDemo(); st.place = b.getAttribute("data-p");
      var first = ORDER.filter(function (i) { return VARS[i].place === st.place; })[0];
      if (VARS[st.v].place !== st.place) { st.v = first; var r = range(first); st.a = r[0]; st.b = r[1]; st.caseId = null; }
      renderDetective();
    });
    $("varlist").addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]"); if (!b) return; stopDemo(); st.v = b.getAttribute("data-v"); var r = range(st.v); st.a = r[0]; st.b = r[1]; st.caseId = null; renderDetective();
    });
    $("r-start").addEventListener("input", function () { stopDemo(); st.a = +this.value; if (st.b - st.a < MINSPAN) st.b = Math.min(range(st.v)[1], st.a + MINSPAN); if (st.b - st.a < MINSPAN) st.a = st.b - MINSPAN; st.caseId = null; renderDetective(); });
    $("r-end").addEventListener("input", function () { stopDemo(); st.b = +this.value; if (st.b - st.a < MINSPAN) st.a = Math.max(range(st.v)[0], st.b - MINSPAN); if (st.b - st.a < MINSPAN) st.b = st.a + MINSPAN; st.caseId = null; renderDetective(); });
    $("btn-full").addEventListener("click", function () { stopDemo(); var r = range(st.v); st.a = r[0]; st.b = r[1]; st.caseId = null; renderDetective(); });
    $("btn-demo").addEventListener("click", runDemo);
    $("t-band").addEventListener("click", function () { st.band = !st.band; renderDetective(); });
    $("t-sen").addEventListener("click", function () { st.sen = !st.sen; renderDetective(); });
    $("t-cp").addEventListener("click", function () { st.cp = !st.cp; renderDetective(); });
    $("win-chips").addEventListener("click", function (e) { var b = e.target.closest("[data-w]"); if (b) { st.win = +b.getAttribute("data-w"); renderDetective(); } });
    $("btn-copy").addEventListener("click", copyCsv);
    if ($("btn-download")) $("btn-download").addEventListener("click", downloadCsv);
  }
  function stopDemo() { if (st.demo) { clearInterval(st.demo); st.demo = null; $("btn-demo").textContent = "Watch the trend appear"; } }
  function runDemo() {
    if (st.demo) { stopDemo(); return; }
    var r = range(st.v), full = r[1], start = r[0];
    st.a = start;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { st.b = full; renderDetective(); return; }
    st.b = start + MINSPAN; $("btn-demo").textContent = "Stop"; renderDetective();
    st.demo = setInterval(function () {
      if (st.b >= full) { stopDemo(); return; }
      st.b += 1; renderDetective();
    }, 340);
  }

  var lastFit = null;
  function renderDetective() {
    var v = VARS[st.v], full = series(st.v), r = range(st.v);
    st.a = Math.max(r[0], Math.min(st.a, r[1] - MINSPAN)); st.b = Math.max(st.a + MINSPAN, Math.min(st.b, r[1]));
    /* controls */
    Array.prototype.forEach.call($("place-seg").children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-p") === st.place); });
    $("varlist").innerHTML = ORDER.filter(function (i) { return VARS[i].place === st.place; }).map(function (i) {
      return '<button class="varbtn" data-v="' + i + '" aria-pressed="' + (i === st.v) + '" style="--vc:var(' + VARS[i].color + ')"><span>' + esc(VARS[i].name) + "<small>" + esc(VARS[i].tag) + "</small></span></button>";
    }).join("");
    Array.prototype.forEach.call($("cases").children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-c") === st.caseId); });
    var rs = $("r-start"), re = $("r-end");
    rs.min = re.min = r[0]; rs.max = re.max = r[1]; rs.value = st.a; re.value = st.b;
    $("o-start").textContent = st.a; $("o-end").textContent = st.b;
    $("span-note").textContent = (st.b - st.a + 1) + " years selected of " + (r[1] - r[0] + 1) + " available";
    $("t-band").setAttribute("aria-pressed", st.band); $("t-sen").setAttribute("aria-pressed", st.sen); $("t-cp").setAttribute("aria-pressed", st.cp);

    /* about */
    $("about").innerHTML = '<span class="tag">About this variable</span><h4>' + esc(v.name) + "</h4><p>" + esc(v.def) + '</p><div class="meta"><span><b>Unit</b> ' + esc(v.unit || "unitless") + "</span><span><b>Source</b> " + esc(v.product) + "</span><span><b>Region</b> " + esc(v.region) + "</span></div>";

    /* analysis */
    var xs = [], ys = [];
    full.x.forEach(function (x, i) { if (x >= st.a && x <= st.b) { xs.push(x); ys.push(full.y[i]); } });
    var A = Stats.analyse(xs, ys), o = A.ols, dp = v.dp;
    var dec = function (z) { return z * 10; };
    lastFit = { xs: xs, ys: ys, o: o };
    var lagsN = o.n <= 12 ? 1 : (o.n <= 27 ? 2 : 3);
    var H = Adv.hac(xs, ys, lagsN), HR = Adv.mkHR(xs, ys), PT = Adv.pettitt(xs, ys), HG = Adv.hinge(xs, ys, 4), AC = Adv.accel(xs, ys);

    /* chart */
    var traces = [];
    var ctxX = [], ctxY = [];
    full.x.forEach(function (x, i) { if (x < st.a || x > st.b) { ctxX.push(x); ctxY.push(full.y[i]); } });
    traces.push({ x: ctxX, y: ctxY, name: "Outside period", mode: "markers", marker: { size: 6, color: cv("--fg-3"), opacity: 0.45 }, hovertemplate: "%{y:." + Math.max(dp - 1, 1) + "f} (not used)" });
    if (st.band) {
      var bx = [], lo = [], hi = [];
      for (var x = st.a; x <= st.b; x++) { var fit = o.icpt + o.slope * x, se = o.s * Math.sqrt(1 / o.n + Math.pow(x - o.mx, 2) / o.sxx); bx.push(x); lo.push(fit - o.tc * se); hi.push(fit + o.tc * se); }
      traces.push({ x: bx.concat(bx.slice().reverse()), y: hi.concat(lo.slice().reverse()), fill: "toself", fillcolor: cv("--band"), line: { width: 0 }, hoverinfo: "skip", name: "95% band", mode: "lines" });
    }
    traces.push({ x: xs, y: ys, name: v.name, mode: "lines+markers", line: { color: cv(v.color), width: 2 }, marker: { size: 6, color: cv(v.color), line: { width: 1.5, color: cv("--panel") } }, hovertemplate: "%{y:." + Math.max(dp - 1, 1) + "f} " + v.unit });
    traces.push({ x: [st.a, st.b], y: [o.icpt + o.slope * st.a, o.icpt + o.slope * st.b], name: "Least-squares trend", mode: "lines", line: { color: cv("--fg"), width: 2, dash: "dash" }, hoverinfo: "skip" });
    if (st.sen) traces.push({ x: [st.a, st.b], y: [A.sen.icpt + A.sen.slope * st.a, A.sen.icpt + A.sen.slope * st.b], name: "Theil–Sen trend", mode: "lines", line: { color: cv("--sun"), width: 2, dash: "dot" }, hoverinfo: "skip" });
    if (st.cp && HG) {
      var hx = [st.a, HG.bk, st.b], hy = hx.map(function (x) { return HG.b0 + HG.b1 * (x - HG.x0) + HG.b2 * Math.max(0, x - HG.bk); });
      traces.push({ x: hx, y: hy, name: "Two-slope fit", mode: "lines", line: { color: cv("--sun"), width: 2.5 }, hoverinfo: "skip" });
      var ymn = Math.min.apply(null, full.y), ymx = Math.max.apply(null, full.y);
      traces.push({ x: [PT.year, PT.year], y: [ymn, ymx], name: "Shift year (Pettitt)", mode: "lines", line: { color: cv("--fg-3"), width: 1.5, dash: "dot" }, hoverinfo: "skip" });
    }
    var yl = v.anomaly ? "Difference from record mean" + (v.unit ? " (" + v.unit + ")" : "") : v.name + (v.unit ? " (" + v.unit + ")" : "");
    var pad = 1.5;
    draw("plot-det", traces, baseLayout({ showlegend: true, legend: { orientation: "h", x: 0, y: 1.1, font: { color: cv("--fg-2"), size: 12 } }, margin: { t: 34, l: 74 }, xaxis: { range: [r[0] - pad, r[1] + pad], title: { text: "Year" } }, yaxis: { title: ytitle(yl), tickformat: dp > 3 ? ".3f" : "" } }));

    /* verdict */
    var tests = [
      { n: "t-test on the slope", note: "Assumes independent years", p: o.p },
      { n: "HAC-robust slope (Newey–West)", note: "Allows for year-to-year memory", p: H.p },
      { n: "Mann–Kendall", note: "Rank based, no straight line assumed", p: A.mk.p },
      { n: "Mann–Kendall, memory-corrected (Hamed–Rao)", note: "Rank based and allows for memory", p: HR.p }
    ];
    var nsig = tests.filter(function (t) { return t.p < 0.05; }).length;
    var vd = nsig === 4 ? "both" : (nsig === 0 ? "none" : "mixed"), up = o.slope > 0;
    var unit = v.unit ? " " + v.unit : "", span = st.b - st.a + 1;
    var head = vd === "both" ? "Significant " + (up ? "increase" : "decrease") + ": all four tests agree" : vd === "mixed" ? nsig + " of 4 tests find a significant trend" : "No significant trend in this period";
    var body;
    if (vd === "none") body = v.name + " changed by " + fnum(dec(o.slope), dp, true) + unit + " per decade between " + st.a + " and " + st.b + ", but no test rejects a flat line. The 95% interval (" + fnum(dec(o.ciLo), dp) + " to " + fnum(dec(o.ciHi), dp) + ") includes zero.";
    else {
      body = v.name + " " + (up ? "rose" : "fell") + " by " + fnum(Math.abs(dec(o.slope)), dp) + unit + " per decade between " + st.a + " and " + st.b + " (95% CI " + fnum(dec(o.ciLo), dp) + " to " + fnum(dec(o.ciHi), dp) + ")";
      if (vd === "mixed") body += ". Not significant under: " + tests.filter(function (t) { return t.p >= 0.05; }).map(function (t) { return t.n; }).join("; ") + ".";
      else body += ".";
    }
    var extra = [];
    if (vd !== "both" && span < 25) extra.push("With only " + span + " years, a longer record may turn this into a significant result. Try “Watch the trend appear”.");
    else if (vd === "none") extra.push("Finding no trend is still a finding. Try another window or a longer record.");
    if (o.lag1 > 0.5) extra.push("Residual autocorrelation is high (r₁ = " + o.lag1.toFixed(2) + "), so trust the HAC and memory-corrected results over the plain t-test.");
    $("verdict").className = "verdict" + (vd === "none" ? " none" : "");
    $("verdict").innerHTML = '<span class="status ' + (vd === "both" ? "" : vd) + '"><i></i>' + VERDICT_LABEL[vd] + '</span><div><h4>' + esc(head) + "</h4><p>" + esc(body) + "</p>" + (extra.length ? "<p>" + esc(extra.join(" ")) + "</p>" : "") + "</div>";

    /* readouts */
    var unitDec = (v.unit ? v.unit + " " : "") + "per decade";
    var sc = Math.max(Math.abs(dec(o.ciLo)), Math.abs(dec(o.ciHi)), Math.abs(dec(o.slope))) * 1.25 || 1;
    var pos = function (val) { return ((val / sc + 1) / 2 * 100).toFixed(1) + "%"; };
    var barL = Math.min(dec(o.ciLo), dec(o.ciHi)), barH = Math.max(dec(o.ciLo), dec(o.ciHi));
    var lagTxt = o.lag1 > 0.5 ? "High: years are strongly linked" : (o.lag1 > 0.3 ? "Moderate" : "Low: years look independent");
    var cells = [
      '<div class="cell"><div class="c-l">Rate of change</div><div class="c-v num">' + fnum(dec(o.slope), dp, true) + " <small>" + esc(unitDec) + '</small></div><div class="c-s">Least-squares slope · R² = ' + o.r2.toFixed(2) + " · " + o.n + " years</div></div>",
      '<div class="cell"><div class="c-l">95% confidence interval</div><div class="c-m num">' + fnum(dec(o.ciLo), dp, true) + " to " + fnum(dec(o.ciHi), dp, true) + '</div><div class="ci-strip" aria-hidden="true"><div class="ax"></div><div class="zero" style="left:50%"></div><div class="bar" style="left:' + pos(barL) + ";width:calc(" + pos(barH) + " - " + pos(barL) + ')"></div><div class="pt" style="left:' + pos(dec(o.slope)) + '"></div></div><div class="ci-lab"><span>' + fnum(-sc, dp) + '</span><span>0</span><span>' + fnum(sc, dp, true) + '</span></div><div class="c-s">' + (o.ciLo * o.ciHi > 0 ? "Excludes zero." : "Includes zero.") + "</div></div>",
      '<div class="cell"><div class="c-l">t-test on the slope</div><div class="c-v num">' + peq(o.p) + '</div><div class="c-m num">t = ' + fnum(o.t, 2) + ", df = " + o.df + '</div><div class="c-s">Is the slope different from zero? Assumes independent years.</div></div>',
      '<div class="cell"><div class="c-l">Mann–Kendall test</div><div class="c-v num">' + peq(A.mk.p) + '</div><div class="c-m num">τ = ' + fnum(A.mk.tau, 2, true) + ", z = " + fnum(A.mk.z, 2) + '</div><div class="c-s">Rank-based. No straight-line or normality assumption.</div></div>',
      '<div class="cell"><div class="c-l">Theil–Sen slope</div><div class="c-v num">' + fnum(dec(A.sen.slope), dp, true) + " <small>" + esc(unitDec) + '</small></div><div class="c-m num">95% CI ' + fnum(dec(A.sen.ciLo), dp) + " to " + fnum(dec(A.sen.ciHi), dp) + '</div><div class="c-s">Median of all pairwise slopes. Resists outlier years.</div></div>',
      '<div class="cell"><div class="c-l">Year-to-year memory</div><div class="c-v num">r₁ = ' + o.lag1.toFixed(2) + '</div><div class="c-s">' + lagTxt + ". High values mean the t-test overstates certainty.</div></div>"
    ];
    $("readouts").innerHTML = cells.join("");

    /* published comparison */
    var P = pub(st.v), atFull = st.a === P.first && st.b === P.last, same = atFull;
    $("pub-note").innerHTML = same
      ? "<b>Published full-period result</b> (OLS with Newey–West HAC errors): " + fnum(P.slope, dp, true) + unit + " per decade, 95% CI " + fnum(P.lo, dp) + " to " + fnum(P.hi, dp) + ", " + peq(P.p) + ". HAC allows for autocorrelation, so it is the more conservative p-value."
      : "Published HAC results (" + P.period + "): " + fnum(P.slope, dp, true) + unit + " per decade, " + peq(P.p) + ". They apply to the full record; the numbers above are recomputed for your selected years.";

    /* table */
    $("det-rows").innerHTML = xs.map(function (x, i) { var f = o.icpt + o.slope * x; return '<tr><td class="n">' + x + '</td><td class="n">' + ys[i].toFixed(Math.max(dp, 3)) + '</td><td class="n">' + f.toFixed(Math.max(dp, 3)) + '</td><td class="n">' + fnum(ys[i] - f, Math.max(dp, 3), true) + "</td></tr>"; }).join("");
    renderAdvanced(v, dp, xs, ys, o, tests, H, HR, PT, HG, AC);
  }
  function pBadge(p) { return p < 0.05 ? '<span class="pass"><i></i>Significant</span>' : '<span class="pass no"><i></i>Not significant</span>'; }
  function renderAdvanced(v, dp, xs, ys, o, tests, H, HR, PT, HG, AC) {
    var unit = v.unit ? " " + v.unit : "", dec = function (z) { return z * 10; }, nsig = tests.filter(function (t) { return t.p < 0.05; }).length;
    var meter = '<span class="meter" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<b class="' + (i < nsig ? "on" : "") + '"></b>'; }).join("") + "</span>";
    $("evidence").innerHTML = '<table class="evid"><thead><tr><th>Test</th><th>What it allows for</th><th>p-value</th><th>Result</th></tr></thead><tbody>' +
      tests.map(function (t) { return "<tr><td>" + esc(t.n) + "</td><td class=\"muted\">" + esc(t.note) + '</td><td class="n">' + fp(t.p) + "</td><td>" + pBadge(t.p) + "</td></tr>"; }).join("") +
      '</tbody><tfoot><tr><td colspan="4"><b>Evidence score</b> &nbsp; ' + meter + ' <span class="num" style="margin-left:6px">' + nsig + " of 4 tests significant</span></td></tr></tfoot></table>";

    var cells = [];
    cells.push('<div class="cell"><div class="c-l">HAC-robust slope</div><div class="c-v num">' + fnum(dec(H.se > 0 ? o.slope : 0), dp, true) + " <small>" + esc((v.unit ? v.unit + " " : "") + "per decade") + '</small></div><div class="c-m num">95% CI ' + fnum(dec(H.lo), dp) + " to " + fnum(dec(H.hi), dp) + '</div><div class="c-s">Newey–West errors, ' + H.lags + " lag" + (H.lags > 1 ? "s" : "") + ". " + peq(H.p) + ". Wider than the plain interval when years are correlated.</div></div>");
    var inflate = HR.factor;
    cells.push('<div class="cell"><div class="c-l">Memory-corrected Mann–Kendall</div><div class="c-v num">' + peq(HR.p) + '</div><div class="c-m num">variance × ' + inflate.toFixed(2) + '</div><div class="c-s">' + (inflate > 1.5 ? "Strong memory in the data: the correction cuts the significance a lot." : inflate < 0.9 ? "Negative memory: the correction tightens the test." : "Little memory: results match the plain test.") + "</div></div>");
    cells.push('<div class="cell"><div class="c-l">Abrupt shift (Pettitt)</div><div class="c-v num">' + (PT.p < 0.05 ? PT.year : "None") + '</div><div class="c-m num">' + peq(PT.p) + '</div><div class="c-s">' + (PT.p < 0.05 ? "Level changes from " + fnum(PT.meanBefore, dp) + " to " + fnum(PT.meanAfter, dp) + unit + " around " + PT.year + ". A steady trend can also trigger this; compare with the two-slope fit." : "No single step change stands out in this period.") + "</div></div>");
    if (HG) {
      var d1 = dec(HG.slope1), d2 = dec(HG.slope2), sig = HG.p < 0.05;
      cells.push('<div class="cell"><div class="c-l">Two-slope fit</div><div class="c-v num">' + Math.round(HG.bk) + '</div><div class="c-m num">' + fnum(d1, dp, true) + " → " + fnum(d2, dp, true) + '</div><div class="c-s">Slope per decade before and after the best breakpoint. ' + (sig ? "Two slopes fit better than one (F-test " + peq(HG.p) + ")." : "Two slopes do not fit significantly better than one (" + peq(HG.p) + ").") + " Breakpoint is chosen from the data, so p is approximate.</div></div>");
    } else cells.push('<div class="cell"><div class="c-l">Two-slope fit</div><div class="c-s">Needs at least 10 years.</div></div>');
    var acc = AC.p < 0.05 ? (AC.c2 * o.slope > 0 ? "Speeding up" : "Slowing down") : "Steady rate";
    cells.push('<div class="cell"><div class="c-l">Is the rate changing?</div><div class="c-v num">' + acc + '</div><div class="c-m num">' + fnum(AC.per2decade, dp + 1, true) + ' per decade²</div><div class="c-s">Curvature test: ' + peq(AC.p) + ". " + (AC.p < 0.05 ? "The rate itself is changing by this much every decade." : "A straight line describes this period about as well as a curve.") + "</div></div>");
    $("adv-cells").innerHTML = cells.join("");

    /* rolling slope */
    var n = xs.length, opts = [10, 15, 20].filter(function (w) { return n - w >= 2; });
    var chips = $("win-chips"), plot = $("plot-roll");
    if (!opts.length) { chips.innerHTML = ""; if (window.Plotly) Plotly.purge(plot); plot.innerHTML = '<p class="muted" style="padding:20px 0">Select at least 12 years to see sliding-window slopes.</p>'; return; }
    var w = opts.indexOf(st.win) >= 0 ? st.win : (opts.indexOf(15) >= 0 ? 15 : opts[opts.length - 1]);
    chips.innerHTML = opts.map(function (k) { return '<button class="chip" data-w="' + k + '" aria-pressed="' + (k === w) + '">' + k + "-year window</button>"; }).join("");
    var R = Adv.rolling(xs, ys, w), xr = R.map(function (r) { return r.x; });
    var unitDec = v.unit ? v.unit + " per decade" : "per decade";
    var traces = [
      { x: xr.concat(xr.slice().reverse()), y: R.map(function (r) { return dec(r.hi); }).concat(R.map(function (r) { return dec(r.lo); }).reverse()), fill: "toself", fillcolor: cv("--band"), line: { width: 0 }, hoverinfo: "skip", mode: "lines", name: "95% interval" },
      { x: xr, y: R.map(function (r) { return dec(r.slope); }), name: w + "-year slope", mode: "lines+markers", line: { color: cv(v.color), width: 2 }, marker: { size: 6, color: cv(v.color), line: { width: 1.5, color: cv("--panel") } }, customdata: R.map(function (r) { return [r.x0, r.x1, r.p < 0.05 ? "significant" : "not significant"]; }), hovertemplate: "%{y:." + dp + "f} per decade<br>%{customdata[0]}–%{customdata[1]} · %{customdata[2]}" }
    ];
    var sigShare = R.filter(function (r) { return r.p < 0.05; }).length;
    $("roll-sub").textContent = "Slope of every " + w + "-year window, with its 95% interval. " + sigShare + " of " + R.length + " windows are significant on their own.";
    draw("plot-roll", traces, baseLayout({ showlegend: true, legend: { orientation: "h", x: 0, y: 1.14, font: { color: cv("--fg-2"), size: 12 } }, margin: { t: 34, l: 74 }, xaxis: { title: { text: "Window center year" } }, yaxis: { title: ytitle("Slope (" + unitDec + ")"), zeroline: true, zerolinecolor: cv("--fg-3"), zerolinewidth: 1.5 } }));
  }

  function buildCsvString() {
    if (!lastFit) return "";
    var v = VARS[st.v], o = lastFit.o;
    var header = "year,value_" + (v.unit || "unitless").replace(/\s+/g, "_") + ",ols_trend,residual";
    var rows = lastFit.xs.map(function (x, i) {
      var fit = o.icpt + o.slope * x;
      return x + "," + lastFit.ys[i] + "," + fit.toFixed(6) + "," + (lastFit.ys[i] - fit).toFixed(6);
    });
    return header + "\n" + rows.join("\n");
  }

  function copyCsv() {
    if (!lastFit) return;
    var csv = buildCsvString();
    var msg = $("copy-msg");
    function ok() { msg.textContent = "Copied " + lastFit.xs.length + " rows."; }
    function fb() {
      var ta = document.createElement("textarea"); ta.value = csv; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { msg.textContent = "Select the table and copy it manually."; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(csv).then(ok, fb); else fb();
  }

  function downloadCsv() {
    if (!lastFit) return;
    var csv = buildCsvString();
    var fname = "solari-x-" + st.v + "-" + st.a + "-" + st.b + ".csv";
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    var msg = $("copy-msg");
    if (msg) msg.textContent = "Downloaded " + fname;
  }

  /* ---------- variables guide ---------- */
  function buildGuide() {
    $("vguide").innerHTML = ORDER.map(function (id) {
      var v = VARS[id], r = range(id);
      return '<article class="vcard" style="--vc:var(' + v.color + ')"><div><span class="eyebrow">' + esc(v.tag) + "</span></div><h4>" + esc(v.name) + "</h4><p>" + esc(v.def) + "</p><dl>" +
        "<dt>Unit</dt><dd>" + esc(v.unit || "unitless") + "</dd><dt>Record</dt><dd class=\"num\">" + r[0] + "–" + r[1] + " (" + (r[1] - r[0] + 1) + " years)</dd><dt>Measured by</dt><dd>" + esc(v.measured) + "</dd><dt>Place</dt><dd>" + esc(v.region) + "</dd><dt>Why it matters</dt><dd>" + esc(v.why) + "</dd></dl>" +
        '<div><button class="btn sm" data-inv="' + id + '">Investigate this variable</button></div></article>';
    }).join("");
    $("vguide").addEventListener("click", function (e) {
      var b = e.target.closest("[data-inv]"); if (!b) return; var id = b.getAttribute("data-inv");
      stopDemo(); st.v = id; st.place = VARS[id].place; var r = range(id); st.a = r[0]; st.b = r[1]; st.caseId = null; go("detective"); window.scrollTo({ top: 0 });
    });
  }

  /* ---------- seasonality ---------- */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function renderSeasons() {
    var c = raw.chlorophyll_seasonality, p = raw.precipitation_seasonality;
    draw("plot-chl-season", [{ x: MONTHS, y: c.map(function (d) { return d.mean; }), type: "bar", marker: { color: cv("--s-chl") }, error_y: { type: "data", array: c.map(function (d) { return d.std; }), visible: true, color: cv("--fg-3"), thickness: 1.5, width: 4 }, hovertemplate: "%{y:.3f} mg m⁻³ ± 1 SD" }],
      baseLayout({ bargap: 0.35, yaxis: { title: ytitle("Chlorophyll-a (mg m⁻³)"), rangemode: "tozero" }, xaxis: { fixedrange: true } }));
    var stn = [["rain", "Alexandria", p], ["rain_ath", "Athens", raw.gpm.athens_season], ["rain_bcn", "Barcelona", raw.gpm.barcelona_season]];
    var lg = { orientation: "h", x: 0, y: 1.14, font: { color: cv("--fg-2"), size: 12 } };
    draw("plot-rain-season", stn.map(function (t) { return { x: MONTHS, y: t[2].map(function (d) { return d.mean_depth; }), type: "bar", name: t[1], marker: { color: cv(VARS[t[0]].color) }, hovertemplate: "%{y:.1f} mm" }; }),
      baseLayout({ barmode: "group", bargap: 0.25, bargroupgap: 0.08, showlegend: true, legend: lg, margin: { t: 34 }, yaxis: { title: ytitle("Mean monthly rain (mm)"), rangemode: "tozero" }, xaxis: { fixedrange: true } }));
    draw("plot-rain-rate", stn.map(function (t) { return { x: MONTHS, y: t[2].map(function (d) { return d.max_rate; }), mode: "lines+markers", name: t[1], line: { color: cv(VARS[t[0]].color), width: 2 }, marker: { size: 6, color: cv(VARS[t[0]].color), line: { width: 1.5, color: cv("--panel") } }, hovertemplate: "%{y:.1f} mm/h" }; }),
      baseLayout({ showlegend: true, legend: lg, margin: { t: 34 }, yaxis: { title: ytitle("Peak rain rate (mm/h)"), rangemode: "tozero" }, xaxis: { fixedrange: true } }));
  }

  /* ---------- map ---------- */
  function renderMap() {
    var W = MAP.W, H = MAP.H, k = MAP.knmi, c = MAP.cop, g = "", pts = "";
    [["alex", "Alexandria", "--s-rain", "end", -12, -18], ["ath", "Athens", "--s-ath", "start", 12, -16], ["bcn", "Barcelona", "--s-bcn", "start", 14, -16]].forEach(function (q) {
      var a = MAP[q[0]];
      pts += '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="14" fill="var(' + q[2] + ')" fill-opacity=".25"/><circle cx="' + a[0] + '" cy="' + a[1] + '" r="6.5" fill="var(' + q[2] + ')" stroke="var(--bg)" stroke-width="2"/>' +
        '<text x="' + (a[0] + q[4]) + '" y="' + (a[1] + q[5]) + '" text-anchor="' + q[3] + '" fill="var(--fg)" font-size="13" font-weight="600" font-family="IBM Plex Sans, sans-serif" paint-order="stroke" stroke="var(--sea)" stroke-width="3">' + q[1] + "</text>";
    });
    MAP.grat.forEach(function (t) {
      if (t.t === "v") g += '<line x1="' + t.v + '" y1="0" x2="' + t.v + '" y2="' + H + '" stroke="var(--grid)" stroke-width="1"/><text x="' + (t.v + 4) + '" y="' + (H - 8) + '" fill="var(--fg-3)" font-size="11" font-family="IBM Plex Mono, monospace">' + t.l + "</text>";
      else g += '<line x1="0" y1="' + t.v + '" x2="' + W + '" y2="' + t.v + '" stroke="var(--grid)" stroke-width="1"/><text x="6" y="' + (t.v - 5) + '" fill="var(--fg-3)" font-size="11" font-family="IBM Plex Mono, monospace">' + t.l + "</text>";
    });
    $("mapbox").innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Map of the Mediterranean showing the KNMI box, the Copernicus extent and the Alexandria, Athens and Barcelona grid cells">' +
      '<rect width="' + W + '" height="' + H + '" fill="var(--sea)"/>' + g +
      '<path d="' + MAP.d + '" fill="var(--land)" stroke="var(--line)" stroke-width="0.9" stroke-linejoin="round"/>' +
      '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" fill="var(--s-chl)" fill-opacity=".07" stroke="var(--s-chl)" stroke-width="2"/>' +
      '<rect x="' + k.x + '" y="' + k.y + '" width="' + k.w + '" height="' + k.h + '" fill="none" stroke="var(--s-sla)" stroke-width="2" stroke-dasharray="8 6"/>' +
      pts + "</svg>";
  }

  /* ---------- statistics table ---------- */
  function buildStats() {
    var rows = ["sst", "sla", "chl", "rain", "rain_ath", "rain_bcn", "ohc", "had", "sal"].map(function (id) {
      var v = VARS[id], p = pub(id), vd = verdictOf(p.q < 0.05, p.mkp < 0.05), dp = v.dp, u = v.unit ? " " + v.unit : "";
      return "<tr><td><b>" + esc(v.name) + '</b><div class="muted" style="font-size:11.5px">' + esc(v.tag) + '</div></td><td><span class="status ' + (vd === "both" ? "" : vd) + '"><i></i>' + VERDICT_LABEL[vd] + "</span></td><td class=\"n\">" + p.period + " (" + p.n + ')</td><td class="n">' + fnum(p.slope, dp, true) + u + '</td><td class="n">' + fnum(p.lo, dp) + " to " + fnum(p.hi, dp) + '</td><td class="n">' + fp(p.p) + '</td><td class="n">' + fnum(p.sen, dp, true) + '</td><td class="n">' + fnum(p.tau, 2, true) + " (" + fp(p.mkp) + ')</td><td class="n">' + fp(p.q) + "</td></tr>";
    });
    $("stat-body").innerHTML = rows.join("");
  }

  /* ---------- rain compare ---------- */
  var RS = [["rain", "Alexandria"], ["rain_ath", "Athens"], ["rain_bcn", "Barcelona"]];
  var rOn = { rain: true, rain_ath: true, rain_bcn: true };
  var RGRID = { rain: "31.25°N, 29.95°E", rain_ath: "38.05°N, 23.65°E", rain_bcn: "41.45°N, 2.15°E" };
  var SEAS = function (id) { return id === "rain" ? raw.precipitation_seasonality : id === "rain_ath" ? raw.gpm.athens_season : raw.gpm.barcelona_season; };
  var MFULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-r]"); if (!b) return;
    var id = b.getAttribute("data-r"), n = RS.filter(function (r) { return rOn[r[0]]; }).length;
    if (rOn[id] && n === 1) return; rOn[id] = !rOn[id]; renderRain();
  });
  function renderRain() {
    $("rchips").innerHTML = RS.map(function (r) { return '<button class="chip legend-chip' + (rOn[r[0]] ? "" : " off") + '" data-r="' + r[0] + '" aria-pressed="' + rOn[r[0]] + '"><span class="swatch" style="background:var(' + VARS[r[0]].color + ')"></span>' + r[1] + "</button>"; }).join("");
    var traces = [], ann = [], S = {};
    RS.forEach(function (r) {
      var id = r[0], sr = series(id); S[id] = sr;
      if (!rOn[id]) return;
      var o = Stats.ols(sr.x, sr.y), c = cv(VARS[id].color);
      traces.push({ x: sr.x, y: sr.y, name: r[1], mode: "lines+markers", line: { color: c, width: 2 }, marker: { size: 6, color: c, line: { width: 1.5, color: cv("--panel") } }, hovertemplate: "%{y:.0f} mm" });
      traces.push({ x: [sr.x[0], sr.x[sr.x.length - 1]], y: [o.icpt + o.slope * sr.x[0], o.icpt + o.slope * sr.x[sr.x.length - 1]], name: r[1] + " trend", mode: "lines", line: { color: c, width: 1.5, dash: "dash" }, hoverinfo: "skip", showlegend: false });
      ann.push({ x: sr.x[sr.x.length - 1], y: sr.y[sr.y.length - 1], text: r[1], xanchor: "left", xshift: 8, showarrow: false, font: { color: cv("--fg"), size: 12 } });
    });
    draw("plot-rain-all", traces, baseLayout({ margin: { l: 70, r: 96, t: 18, b: 52 }, annotations: ann, xaxis: { range: [2000.3, 2024.8], dtick: 2, title: { text: "Year" } }, yaxis: { title: ytitle("Annual rain (mm)"), rangemode: "tozero" } }));

    /* forest plot: % of average per decade */
    var P = {}, pct = [], lo = [], hi = [], cols = [], names = [];
    RS.forEach(function (r) {
      var id = r[0], p = pub(id), m = Stats.mean(S[id].y); P[id] = { p: p, m: m };
      pct.push(p.slope / m * 100); lo.push(p.slope / m * 100 - p.lo / m * 100); hi.push(p.hi / m * 100 - p.slope / m * 100); cols.push(cv(VARS[id].color)); names.push(r[1]);
    });
    draw("plot-forest", [{ x: pct, y: names, mode: "markers", marker: { size: 13, color: cols, line: { width: 2, color: cv("--panel") } }, error_x: { type: "data", symmetric: false, array: hi, arrayminus: lo, color: cv("--fg-3"), thickness: 2, width: 7 }, hovertemplate: "%{x:.1f}% per decade<extra></extra>" }],
      baseLayout({ hovermode: "closest", margin: { l: 96, r: 24, t: 14, b: 56 }, xaxis: { title: { text: "Change per decade (% of the point's average)" }, zeroline: true, zerolinecolor: cv("--fg-3"), zerolinewidth: 1.5 }, yaxis: { autorange: "reversed", gridcolor: "rgba(0,0,0,0)" } }));

    /* correlations */
    var pairs = [["rain", "rain_ath"], ["rain", "rain_bcn"], ["rain_ath", "rain_bcn"]], best = null;
    var rows = pairs.map(function (pr) {
      var o = Stats.ols(S[pr[0]].y, S[pr[1]].y), r = Math.sign(o.slope) * Math.sqrt(o.r2), left = r < 0 ? (50 + r * 50) : 50, w = Math.abs(r) * 50;
      if (!best || Math.abs(r) > Math.abs(best.r)) best = { r: r, p: o.p, a: VARS[pr[0]].short, b: VARS[pr[1]].short };
      return '<div><div style="display:flex;justify-content:space-between;gap:10px;font-size:13px"><span>' + VARS[pr[0]].short + " ↔ " + VARS[pr[1]].short + '</span><span class="mono num">r = ' + fnum(r, 2, true) + " · " + peq(o.p) + '</span></div><div class="ci-strip" aria-hidden="true"><div class="ax"></div><div class="zero" style="left:50%"></div><div class="bar" style="left:' + left + "%;width:" + w + '%"></div></div></div>';
    });
    $("corr").innerHTML = rows.join("");
    $("corr-note").textContent = "The strongest link is " + best.a + " with " + best.b + " (r = " + fnum(best.r, 2, true) + ", " + peq(best.p) + "). The other pairs are close to unrelated, so each point is close to an independent test of whether Mediterranean rain is changing.";

    /* trend table */
    var fam = { rain: raw.gpm_trends.alexandria_family_q, rain_ath: raw.gpm_trends.athens.bh_q_value, rain_bcn: raw.gpm_trends.barcelona.bh_q_value };
    $("rain-body").innerHTML = RS.map(function (r) {
      var id = r[0], p = P[id].p, q = fam[id], vd = verdictOf(q < 0.05, p.mkp < 0.05);
      return "<tr><td><b>" + r[1] + '</b><div class="muted" style="font-size:11.5px">' + VARS[id].tag + '</div></td><td><span class="status ' + (vd === "both" ? "" : vd) + '"><i></i>' + VERDICT_LABEL[vd] + '</span></td><td class="n">' + P[id].m.toFixed(0) + ' mm</td><td class="n">' + fnum(p.slope, 1, true) + ' mm</td><td class="n">' + fnum(p.lo, 1) + " to " + fnum(p.hi, 1) + '</td><td class="n">' + fp(p.p) + '</td><td class="n">' + fp(q) + '</td><td class="n">' + fnum(p.sen, 1, true) + ' mm</td><td class="n">' + fnum(p.tau, 2, true) + " (" + fp(p.mkp) + ")</td></tr>";
    }).join("");
    $("rain-note").innerHTML = "<b>Why Alexandria's verdict changes here.</b> Its HAC p is " + fp(P.rain.p.p) + " on its own. Testing three points at once raises the bar, giving q = " + fp(fam.rain) + ", so its rain trend is no longer significant after adjustment. Athens and Barcelona show decreases that are well within chance.";

    /* profile table */
    $("prof-body").innerHTML = RS.map(function (r) {
      var id = r[0], rows = VARS[id].rows(), y = S[id].y, x = S[id].x, mx = 0, mn = 0, pk = 0;
      y.forEach(function (v, i) { if (v > y[mx]) mx = i; if (v < y[mn]) mn = i; });
      rows.forEach(function (d, i) { if (d.max_rate > rows[pk].max_rate) pk = i; });
      var m = Stats.mean(y), sd = Math.sqrt(y.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (y.length - 1));
      var se = SEAS(id), wm = 0, dm = 0; se.forEach(function (d, i) { if (d.mean_depth > se[wm].mean_depth) wm = i; if (d.mean_depth < se[dm].mean_depth) dm = i; });
      return "<tr><td><b>" + r[1] + '</b></td><td class="n">' + RGRID[id] + '</td><td class="n">' + x[mx] + " · " + y[mx].toFixed(0) + ' mm</td><td class="n">' + x[mn] + " · " + y[mn].toFixed(0) + ' mm</td><td class="n">±' + (sd / m * 100).toFixed(0) + '% of average</td><td class="n">' + rows[pk].max_rate.toFixed(1) + " mm/h · " + rows[pk].year + "</td><td>" + MFULL[se[wm].month - 1] + ' <span class="muted num">' + se[wm].mean_depth.toFixed(0) + " mm</span></td><td>" + MFULL[se[dm].month - 1] + ' <span class="muted num">' + se[dm].mean_depth.toFixed(1) + " mm</span></td></tr>";
    }).join("");
  }

  /* ---------- theme changes ---------- */
  function rerender() { if (current) renderTab(current); }
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { setTimeout(rerender, 30); }); } catch (e) {}
  new MutationObserver(function () { setTimeout(rerender, 30); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- boot ---------- */
  initTheme();
  buildTabs();
  buildKpis();
  buildCases();
  buildControls();
  buildGuide();
  buildStats();
  window.addEventListener("hashchange", function () { activate(location.hash.slice(1)); });
  activate(location.hash.slice(1) || "overview");
})();
