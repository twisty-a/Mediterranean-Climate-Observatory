<p align="center">
  <img src="assets/solari-x-logo.jpg" alt="Team Solari-X Logo" width="220">
</p>

# Mediterranean Sea Climate Observatory

**Live Demo:** [https://twisty-a.github.io/Mediterranean-Climate-Observatory/](https://twisty-a.github.io/Mediterranean-Climate-Observatory/)  
**Presentation Deck:** [https://twisty-a.github.io/Mediterranean-Climate-Observatory/presentation.html](https://twisty-a.github.io/Mediterranean-Climate-Observatory/presentation.html)  
**Challenge:** NASA Space Apps — *Be An Earth System Trend Detective*  
**Team Solari-X:** Ahmed Madeh, Amr Reffat, Maya Ahmed, and Ahmed Aladdin

---

## Why we built this

Looking at a climate chart and drawing a straight line through it is easy to get wrong. A short time window can make a warming sea look completely flat. Year-to-year ocean memory (autocorrelation) can trick a standard Student's $t$-test into reporting high confidence when the signal is weak. And one unusually heavy storm year can tilt a least-squares rainfall slope even when most years stayed dry.

We built the **Mediterranean Sea Climate Observatory** so students, coastal planners, and curious readers can investigate nine long-term Mediterranean records themselves—changing the start and end years on the fly and seeing how four different statistical tests react before jumping to conclusions.

---

## What is inside the platform

The app runs completely in the browser with no backend server or build step. It is organized into eight workspaces (`index.html`), paired with our 6-slide presentation (`presentation.html` and original team deck `presentation.pdf`):

1. **Overview** — Converts four headline series (Sea Surface Temperature, Sea Level Anomaly, Chlorophyll-a, and Alexandria Rain) into dimensionless z-scores so users can compare trend shapes across different physical units on one timeline.
2. **Data Detective** — A 6-step guided workbench with dual year-range sliders, case-file presets, live OLS confidence bands, Theil–Sen overlays, two-slope hinge fits, CSV copy/export, and the **"Watch the trend appear"** animation that grows a time window year by year.
3. **Rain Compare** — Side-by-side comparison of NASA GPM IMERG annual rainfall (2001–2024) at three distinct coastal regimes: Alexandria (`31.25°N, 29.95°E`), Athens (`38.05°N, 23.65°E`), and Barcelona (`41.45°N, 2.15°E`), complete with forest plots, station correlations, and Benjamini–Hochberg $q$-values.
4. **Variables** — Plain-language reference cards covering units, instruments, products, and why each variable matters.
5. **Seasonality** — Contrasts the Mediterranean's winter phytoplankton bloom (February peak at `0.122 mg m⁻³`) and summer stratification desert (August low at `0.043 mg m⁻³`) against monthly rain depth and peak half-hourly rain rates (`mm/h`).
6. **Region Map** — Interactive SVG map comparing the KNMI bounding box (`30.19–45.98°N, 6.00°W–36.29°E`) against the Copernicus Mediterranean sea mask and the three NASA `0.1°` land rain cells.
7. **Statistics** — Full-period published trend summary table alongside a plain-language glossary of every test.
8. **Guardrails** — Explicit scientific limits explaining why a single `0.1°` land cell cannot explain basin-wide chlorophyll changes, why bounding boxes differ from sea masks, and why ocean color is an optical proxy rather than a fish count.

---

## The nine Earth system records

| Record | Source & Product | Period (n) | Slope per Decade (HAC) | 95% HAC CI | HAC p | MK $\tau$ (p) | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sea Surface Temperature** | NOAA OI v2 via KNMI | 1982–2025 (44) | `+0.376 °C` | `+0.313` to `+0.440` | `< 10⁻¹⁵` | `+0.77` (`1.8 × 10⁻¹³`) | Tests agree |
| **Long-Term SST** | HadISST1 via KNMI | 1870–2025 (156) | `+0.064 °C` | `+0.043` to `+0.085` | `2.2 × 10⁻⁹` | `+0.48` (`< 10⁻¹⁵`) | Tests agree |
| **Sea Level Anomaly** | Copernicus Altimetry via KNMI | 1993–2021 (29) | `+25.18 mm` | `+19.61` to `+30.74` | `< 10⁻¹⁵` | `+0.74` (`1.6 × 10⁻¹⁰`) | Tests agree |
| **Ocean Heat Content (0–400 m)** | UKMO EN4 via KNMI | 1950–2025 (76) | `+0.234 × 10⁹ J/m²` | `+0.123` to `+0.346` | `0.000039` | `+0.39` (`5.0 × 10⁻⁷`) | Tests agree |
| **Surface Salinity** | UKMO EN4 via KNMI | 1900–2025 (126) | `+0.0080` | `-0.0016` to `+0.0175` | `0.102` | `+0.16` (`0.0069`) | Mixed evidence |
| **Chlorophyll-a (SDG 14)** | Copernicus MED Ocean Colour | 1998–2024 (27) | `-0.0039 mg m⁻³` | `-0.0061` to `-0.0017` | `0.00054` | `-0.41` (`0.0031`) | Tests agree |
| **Alexandria Rain** | NASA GPM IMERG v07 | 2001–2024 (24) | `+44.7 mm` | `+2.7` to `+86.7` | `0.037` | `+0.24` (`0.107`) | Mixed evidence |
| **Athens Rain** | NASA GPM IMERG v07 | 2001–2024 (24) | `-38.3 mm` | `-106.0` to `+29.4` | `0.267` | `-0.17` (`0.264`) | Not significant |
| **Barcelona Rain** | NASA GPM IMERG v07 | 2001–2024 (24) | `-41.5 mm` | `-148.1` to `+65.1` | `0.445` | `-0.15` (`0.309`) | Not significant |

> Note on Alexandria rain: on its own, Alexandria passes the Newey–West HAC $t$-test (`p = 0.037`) largely due to heavy storm years in 2015 (`309 mm`) and 2020 (`406 mm`). However, it fails the outlier-resistant Mann–Kendall test (`p = 0.107`) and fails Benjamini–Hochberg false-discovery control when tested alongside Athens and Barcelona (`q = 0.111`).

---

## Statistical engine (`js/stats.js`)

Every time you move a slider in **Data Detective**, the browser runs two self-contained JavaScript modules (`Stats` and `Adv`):

- **OLS Student's $t$-test** (`Stats.ols`) — Fits the linear slope with exact two-sided $p$-values from the regularized incomplete beta function (`ibeta`) and lag-1 residual autocorrelation $r_1$.
- **Newey–West HAC Regression** (`Adv.hac`) — Computes Bartlett-kernel heteroskedasticity- and autocorrelation-consistent standard errors (1–3 lags depending on sample length).
- **Mann–Kendall & Theil–Sen** (`Stats.mannKendall`, `Stats.theilSen`) — Tie-corrected rank test and median of all pairwise slopes so single extreme years cannot dominate the estimate.
- **Hamed–Rao Variance Correction** (`Adv.mkHR`) — Adjusts Mann–Kendall variance when detrended residuals carry serial autocorrelation.
- **Structural & Curvature Checks** — Pettitt rank change-point (`Adv.pettitt`), continuous two-slope hinge fit with $F$-test (`Adv.hinge`), orthogonalized quadratic acceleration test (`Adv.accel`), and 10/15/20-year sliding-window slopes (`Adv.rolling`).

---

## Repository structure

```text
.
├── index.html               # Main 8-workspace observatory application
├── presentation.html        # Interactive 6-slide presentation synced with presentation.pdf + PDF viewer
├── presentation.pdf         # Original 6-slide team PDF presentation (as-is)
├── LICENSE                  # MIT License
├── README.md                # Project documentation
├── .gitignore               # Excludes local notebooks & temp files
├── assets/
│   ├── solari-x-icon.svg    # Vector emblem and favicon
│   └── solari-x-logo.jpg    # Team Solari-X brand logo
├── css/
│   └── styles.css           # Solari-X dark/light design system
├── data/
│   └── climate-series.json  # Formatted reference dataset
└── js/
    ├── data.js              # Curated time series & Mediterranean SVG map geometry
    ├── stats.js             # Client-side Stats & Adv statistical engine
    └── app.js               # Interactive UI, Plotly charts, and CSV export
```

---

## Running locally & deploying

Because the dataset is bundled in `js/data.js` and all statistical routines execute client-side, there is **no build step**:

- **Quick open:** Double-click `index.html` (or `presentation.html`) in any modern browser.
- **Local static server:**
  ```bash
  # Using Python
  python -m http.server 8000
  # or using VS Code Live Server / any static host
  ```
- **Deployment:** Live on GitHub Pages from the `main` branch root (`/`) at `https://twisty-a.github.io/Mediterranean-Climate-Observatory/`.

---

## Team Solari-X

- **Ahmed Madeh**
- **Amr Reffat**
- **Maya Ahmed**
- **Ahmed Aladdin**
