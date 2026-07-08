/* Showroom 人流地圖儀表板 主程式 */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const STORAGE_KEY = "ft-dashboard-gmaps-key";

  /* ---------- 全域狀態 ---------- */
  const state = {
    apiKey: localStorage.getItem(STORAGE_KEY) || "",
    activeId: LOCATIONS[0].id,
    hour: 18,
    nowMode: true,
    dayType: "weekday",
    mapsLoaded: false,
    mapsFailed: false,
    // 每個地點：{ points, source, center, map, marker, circle, overlay }
    loc: Object.fromEntries(LOCATIONS.map((l) => [l.id, {
      points: [], source: "demo", center: { ...l.fallbackCenter },
      map: null, marker: null, circle: null, overlay: null,
    }])),
    series: {},       // 每地點 { raw:[24], index:[24], persons:[24] }
    nowTimer: null,
  };

  /* ---------- 工具 ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    const u = Math.max(1e-9, rng()), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function offsetToLatLng(center, dxMeters, dyMeters) {
    const lat = center.lat + dyMeters / 111320;
    const lng = center.lng + dxMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
    return { lat, lng };
  }
  const fmtHour = (h) => String(h).padStart(2, "0") + ":00";
  const fmtInt = (n) => n.toLocaleString("zh-Hant");
  function currentHourIn(tz) {
    return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date())) % 24;
  }
  function todayIsWeekend(tz) {
    const d = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz }).format(new Date());
    return d === "Sat" || d === "Sun";
  }
  const activeLoc = () => LOCATIONS.find((l) => l.id === state.activeId);

  /* ---------- 時段曲線（正規化 max=1） ---------- */
  const CURVES = {};
  for (const day of Object.keys(HOUR_CURVES)) {
    CURVES[day] = {};
    for (const g of Object.keys(HOUR_CURVES[day])) {
      const arr = HOUR_CURVES[day][g];
      const m = Math.max(...arr);
      CURVES[day][g] = arr.map((v) => v / m);
    }
  }
  const groupOf = (types) => {
    for (const t of types || []) if (TYPE_TO_GROUP[t]) return TYPE_TO_GROUP[t];
    return "other";
  };

  /* ---------- Demo 資料（確定性種子亂數） ---------- */
  function buildDemoPoints(loc) {
    const rng = mulberry32(loc.seed);
    const pts = [];
    for (const c of loc.demoClusters) {
      for (let i = 0; i < c.count; i++) {
        const dx = c.dx + gauss(rng) * c.spread;
        const dy = c.dy + gauss(rng) * c.spread;
        if (Math.hypot(dx, dy) > CONFIG.radiusMeters) continue;
        const w = c.base * (0.55 + rng() * 0.9);
        pts.push({ ...offsetToLatLng(loc.fallbackCenter, dx, dy), mx: dx, my: dy, group: c.group, w });
      }
    }
    return pts;
  }

  /* ---------- 人流模型 ---------- */
  function rawSeries(points, dayType) {
    const out = new Array(24).fill(0);
    for (const p of points) {
      const f = GROUP_FACTOR[p.group] || GROUP_FACTOR.other;
      const curve = CURVES[dayType][p.group] || CURVES[dayType].other;
      for (let h = 0; h < 24; h++) out[h] += (p.w / 1000) * f * curve[h];
    }
    return out;
  }
  function recomputeSeries() {
    const rawAll = {};
    let globalMax = 1e-9;
    for (const l of LOCATIONS) {
      rawAll[l.id] = rawSeries(state.loc[l.id].points, state.dayType);
      globalMax = Math.max(globalMax, ...rawAll[l.id]);
    }
    for (const l of LOCATIONS) {
      const raw = rawAll[l.id];
      state.series[l.id] = {
        raw,
        index: raw.map((v) => Math.round((v / globalMax) * 1000) / 10),
        persons: raw.map((v) => Math.round((v * CONFIG.personsPerIndexPoint) / 50) * 50),
      };
    }
  }
  function heatPointsAt(locId, hour) {
    const pts = state.loc[locId].points;
    let denom = 1e-9;
    const contrib = (p, h) =>
      p.w * (GROUP_FACTOR[p.group] || GROUP_FACTOR.other) *
      (CURVES[state.dayType][p.group] || CURVES[state.dayType].other)[h];
    for (const p of pts) for (let h = 0; h < 24; h++) denom = Math.max(denom, contrib(p, h));
    return pts.map((p) => ({ lat: p.lat, lng: p.lng, mx: p.mx, my: p.my, w: contrib(p, hour) / denom }));
  }

  /* ---------- Google Maps 載入與即時資料 ---------- */
  function loadGoogleMaps(key) {
    return new Promise((resolve, reject) => {
      if (window.google?.maps?.importLibrary) return resolve();
      window.__gmapsReady = () => resolve();
      window.gm_authFailure = () => { state.mapsFailed = true; reject(new Error("API 金鑰驗證失敗")); };
      const s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) +
        "&v=weekly&loading=async&language=zh-TW&callback=__gmapsReady";
      s.onerror = () => reject(new Error("Maps JavaScript API 載入失敗"));
      document.head.appendChild(s);
    });
  }

  async function geocodeLocation(loc) {
    try {
      const { Geocoder } = await google.maps.importLibrary("geocoding");
      const res = await new Geocoder().geocode({ address: loc.geocodeQuery });
      const g = res.results?.[0]?.geometry?.location;
      if (g) return { lat: g.lat(), lng: g.lng() };
    } catch (e) { console.warn("Geocoding 失敗，改用預設座標", loc.id, e); }
    return { ...loc.fallbackCenter };
  }

  async function fetchLivePoints(loc, center) {
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
    const seen = new Map();
    for (const includedTypes of PLACE_TYPE_QUERIES) {
      try {
        const { places } = await Place.searchNearby({
          fields: ["id", "location", "displayName", "types", "userRatingCount"],
          locationRestriction: { center, radius: CONFIG.radiusMeters },
          includedTypes,
          maxResultCount: 20,
          rankPreference: SearchNearbyRankPreference.POPULARITY,
          language: "zh-TW",
        });
        for (const pl of places || []) {
          if (seen.has(pl.id)) continue;
          const rc = pl.userRatingCount || 0;
          const lg = Math.log10(2 + rc);
          seen.set(pl.id, {
            lat: pl.location.lat(), lng: pl.location.lng(),
            group: groupOf(pl.types),
            w: 150 + 200 * lg * lg,
            name: pl.displayName,
          });
        }
      } catch (e) { console.warn("Places searchNearby 失敗", includedTypes, e); }
    }
    return [...seen.values()];
  }

  async function initLocationMap(loc) {
    const L = state.loc[loc.id];
    if (L.map) return;
    const { Map: GMap, Circle } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");

    L.center = await geocodeLocation(loc);
    L.map = new GMap($("#map"), {
      center: L.center, zoom: 16,
      disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
      styles: isDark() ? DARK_MAP_STYLE : [],
    });
    L.marker = new Marker({ position: L.center, map: L.map, title: loc.name });
    L.circle = new Circle({
      map: L.map, center: L.center, radius: CONFIG.radiusMeters,
      strokeColor: "#2a78d6", strokeOpacity: 0.6, strokeWeight: 1, fillOpacity: 0,
    });
    L.overlay = createHeatOverlay(L.map);

    const live = await fetchLivePoints(loc, L.center);
    if (live.length >= 5) {
      L.points = live;
      L.source = "live";
    } else {
      // 即時資料不足時回退到模擬資料（但地圖仍為實景）
      L.points = buildDemoPoints(loc).map((p) => ({ ...p, ...offsetToLatLng(L.center, p.mx, p.my) }));
      L.source = "demo";
    }
    recomputeSeries();
  }

  /* 每個地點共用同一個 #map 容器：切換分頁時重建目前地點的地圖 */
  async function showMapFor(loc) {
    const L = state.loc[loc.id];
    // 換地點時捨棄前一張地圖實例（單一容器）
    for (const other of LOCATIONS) {
      if (other.id !== loc.id) {
        const O = state.loc[other.id];
        if (O.overlay) O.overlay.setMap(null);
        O.map = null; O.marker = null; O.circle = null; O.overlay = null;
      }
    }
    $("#map").innerHTML = "";
    L.map = null;
    await initLocationMap(loc);
    updateHeat();
  }

  /* ---------- Demo 示意地圖（無金鑰時） ---------- */
  function drawDemoMap() {
    const canvas = $("#demoCanvas");
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue("--page").trim();
    ctx.fillRect(0, 0, w, h);
    // 街廓格線
    ctx.strokeStyle = css.getPropertyValue("--grid").trim();
    ctx.lineWidth = 1;
    for (let x = (w / 2) % 64; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = (h / 2) % 64; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const scale = Math.min(w, h) / (CONFIG.radiusMeters * 2.4); // px per meter
    const toPx = (mx, my) => ({ x: w / 2 + mx * scale, y: h / 2 - my * scale });

    // 熱力層（獨立 canvas 疊上來）
    const heat = document.createElement("canvas");
    heat.width = w; heat.height = h;
    const pts = heatPointsAt(state.activeId, state.hour)
      .filter((p) => p.mx !== undefined)
      .map((p) => ({ ...toPx(p.mx, p.my), w: p.w }));
    renderHeat(heat, pts, Math.max(18, 40 * scale / 0.35), isDark() ? HEAT_LUTS.dark : HEAT_LUTS.light);
    ctx.drawImage(heat, 0, 0, w, h);

    // 分析半徑與 showroom 標記
    ctx.strokeStyle = css.getPropertyValue("--series-1").trim();
    ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, CONFIG.radiusMeters * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = css.getPropertyValue("--series-1").trim();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css.getPropertyValue("--surface-1").trim();
    ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = css.getPropertyValue("--text-primary").trim();
    ctx.font = "600 12.5px system-ui, sans-serif";
    ctx.fillText("Showroom", w / 2 + 12, h / 2 + 4);
  }

  /* ---------- 熱力圖更新 ---------- */
  function updateHeat() {
    if (state.mapsLoaded && state.loc[state.activeId].overlay) {
      $("#map").style.display = "";
      $("#demoCanvas").style.display = "none";
      $("#mapNotice").hidden = true;
      const ov = state.loc[state.activeId].overlay;
      ov.setDarkTheme(isDark());
      ov.setPoints(heatPointsAt(state.activeId, state.hour));
    } else {
      $("#map").style.display = "none";
      $("#demoCanvas").style.display = "block";
      $("#mapNotice").hidden = false;
      drawDemoMap();
    }
  }

  /* ---------- KPI ---------- */
  function updateKPIs() {
    const s = state.series[state.activeId];
    const h = state.hour;
    const idx = s.index[h];
    const avg = s.index.reduce((a, b) => a + b, 0) / 24;
    const deltaPct = Math.round(((idx - avg) / Math.max(1e-9, avg)) * 100);
    const peakH = s.index.indexOf(Math.max(...s.index));

    $("#kIndex").textContent = idx.toFixed(0);
    const dEl = $("#kDelta");
    dEl.className = "delta " + (deltaPct >= 0 ? "up" : "down");
    dEl.textContent = (deltaPct >= 0 ? "↑ +" : "↓ ") + deltaPct + "% vs 全日平均";
    $("#kPersons").textContent = "≈ " + fmtInt(s.persons[h]);
    $("#kPeak").textContent = fmtHour(peakH) + "–" + fmtHour((peakH + 1) % 24);
    $("#kPeakNote").textContent = "尖峰指數 " + s.index[peakH].toFixed(0) + "・約 " + fmtInt(s.persons[peakH]) + " 人次/時";
    $("#kPois").innerHTML = state.loc[state.activeId].points.length + "<small> 處</small>";
  }

  /* ---------- 圖表：共用 tooltip ---------- */
  const tooltip = $("#tooltip");
  function showTooltip(html, x, y) {
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    const r = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.min(x + 14, window.innerWidth - r.width - 8) + "px";
    tooltip.style.top = Math.max(8, y - r.height - 12) + "px";
  }
  const hideTooltip = () => { tooltip.hidden = true; };

  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function roundedTopBar(x, yTop, bw, bh, r) {
    r = Math.min(r, bw / 2, bh);
    const yb = yTop + bh;
    return `M${x},${yb} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + bw - r},${yTop} Q${x + bw},${yTop} ${x + bw},${yTop + r} L${x + bw},${yb} Z`;
  }

  /* ---------- 各時段長條圖 ---------- */
  function drawHourlyChart() {
    const box = $("#hourlyChart");
    const s = state.series[state.activeId];
    const W = Math.max(320, box.clientWidth), H = 240;
    const m = { l: 36, r: 8, t: 18, b: 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const yMax = 100;
    const y = (v) => m.t + ih - (v / yMax) * ih;
    const slot = iw / 24;
    const bw = Math.min(24, slot - 2);

    const svg = svgEl("svg", { width: W, height: H, role: "img", "aria-label": "各時段人流指數長條圖" });

    for (const tv of [0, 25, 50, 75, 100]) {
      svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: y(tv), y2: y(tv), stroke: "var(--grid)", "stroke-width": 1 }));
      const t = svgEl("text", { x: m.l - 6, y: y(tv) + 4, "text-anchor": "end", fill: "var(--text-muted)", "font-size": 11 });
      t.textContent = tv; svg.appendChild(t);
    }
    svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: "var(--baseline)", "stroke-width": 1 }));

    const peakH = s.index.indexOf(Math.max(...s.index));
    for (let h = 0; h < 24; h++) {
      const v = s.index[h];
      const x = m.l + h * slot + (slot - bw) / 2;
      const barH = Math.max(1, ((v / yMax) * ih));
      const sel = h === state.hour;
      svg.appendChild(svgEl("path", {
        d: roundedTopBar(x, y(v), bw, barH, 4),
        fill: sel ? "var(--series-1)" : "var(--series-1-dim)",
      }));
      // 選擇性直接標籤：選取時段與尖峰時段
      if (sel || h === peakH) {
        const t = svgEl("text", {
          x: x + bw / 2, y: y(v) - 5, "text-anchor": "middle",
          fill: "var(--text-secondary)", "font-size": 11, "font-weight": sel ? 650 : 500,
        });
        t.textContent = v.toFixed(0);
        svg.appendChild(t);
      }
      if (h % 3 === 0) {
        const t = svgEl("text", { x: m.l + h * slot + slot / 2, y: H - 7, "text-anchor": "middle", fill: "var(--text-muted)", "font-size": 11 });
        t.textContent = String(h).padStart(2, "0");
        svg.appendChild(t);
      }
      // hover / 點選 熱區（比長條本身大）
      const hit = svgEl("rect", { x: m.l + h * slot, y: m.t, width: slot, height: ih, fill: "transparent", style: "cursor:pointer" });
      hit.addEventListener("mousemove", (e) => showTooltip(
        `<div class="tt-title">${fmtHour(h)}–${fmtHour((h + 1) % 24)}</div>` +
        `人流指數 <strong>${v.toFixed(0)}</strong><br>估計約 ${fmtInt(s.persons[h])} 人次/時`,
        e.clientX, e.clientY));
      hit.addEventListener("mouseleave", hideTooltip);
      hit.addEventListener("click", () => setHour(h, false));
      svg.appendChild(hit);
    }
    box.replaceChildren(svg);
  }

  /* ---------- 兩地比較折線圖 ---------- */
  function drawCompareChart() {
    const box = $("#compareChart");
    const W = Math.max(320, box.clientWidth), H = 240;
    const m = { l: 36, r: 86, t: 14, b: 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const yMax = 100;
    const x = (h) => m.l + (h / 23) * iw;
    const y = (v) => m.t + ih - (v / yMax) * ih;
    const colors = { [LOCATIONS[0].id]: "var(--series-1)", [LOCATIONS[1].id]: "var(--series-2)" };

    const svg = svgEl("svg", { width: W, height: H, role: "img", "aria-label": "兩地各時段人流指數比較折線圖" });
    for (const tv of [0, 25, 50, 75, 100]) {
      svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: y(tv), y2: y(tv), stroke: "var(--grid)", "stroke-width": 1 }));
      const t = svgEl("text", { x: m.l - 6, y: y(tv) + 4, "text-anchor": "end", fill: "var(--text-muted)", "font-size": 11 });
      t.textContent = tv; svg.appendChild(t);
    }
    svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: "var(--baseline)", "stroke-width": 1 }));
    for (let h = 0; h < 24; h += 3) {
      const t = svgEl("text", { x: x(h), y: H - 7, "text-anchor": "middle", fill: "var(--text-muted)", "font-size": 11 });
      t.textContent = String(h).padStart(2, "0");
      svg.appendChild(t);
    }

    // 端點直接標籤：若兩線終點太近，垂直錯開
    const ends = LOCATIONS.map((l) => ({ l, v: state.series[l.id].index[23] }));
    let ly = ends.map((e) => y(e.v));
    if (Math.abs(ly[0] - ly[1]) < 16) {
      const mid = (ly[0] + ly[1]) / 2;
      ly = ly[0] < ly[1] ? [mid - 8, mid + 8] : [mid + 8, mid - 8];
    }

    LOCATIONS.forEach((l, i) => {
      const idx = state.series[l.id].index;
      const d = idx.map((v, h) => (h === 0 ? "M" : "L") + x(h).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
      svg.appendChild(svgEl("path", { d, fill: "none", stroke: colors[l.id], "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      svg.appendChild(svgEl("circle", { cx: x(23), cy: y(idx[23]), r: 4.5, fill: colors[l.id], stroke: "var(--surface-1)", "stroke-width": 2 }));
      if (Math.abs(ly[i] - y(idx[23])) > 6) {
        svg.appendChild(svgEl("line", { x1: x(23) + 5, y1: y(idx[23]), x2: x(23) + 12, y2: ly[i], stroke: "var(--baseline)", "stroke-width": 1 }));
      }
      const t = svgEl("text", { x: x(23) + 14, y: ly[i] + 4, fill: "var(--text-secondary)", "font-size": 11.5, "font-weight": 600 });
      t.textContent = l.short;
      svg.appendChild(t);
    });

    // crosshair + tooltip
    const cross = svgEl("line", { y1: m.t, y2: m.t + ih, stroke: "var(--baseline)", "stroke-width": 1, visibility: "hidden" });
    svg.appendChild(cross);
    const dots = LOCATIONS.map((l) => {
      const c = svgEl("circle", { r: 4, fill: colors[l.id], stroke: "var(--surface-1)", "stroke-width": 2, visibility: "hidden" });
      svg.appendChild(c); return c;
    });
    const hit = svgEl("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent" });
    hit.addEventListener("mousemove", (e) => {
      const r = svg.getBoundingClientRect();
      const h = Math.max(0, Math.min(23, Math.round(((e.clientX - r.left - m.l) / iw) * 23)));
      cross.setAttribute("x1", x(h)); cross.setAttribute("x2", x(h));
      cross.setAttribute("visibility", "visible");
      let html = `<div class="tt-title">${fmtHour(h)}</div>`;
      LOCATIONS.forEach((l, i) => {
        const v = state.series[l.id].index[h];
        dots[i].setAttribute("cx", x(h)); dots[i].setAttribute("cy", y(v));
        dots[i].setAttribute("visibility", "visible");
        const cssColor = l.id === LOCATIONS[0].id ? "var(--series-1)" : "var(--series-2)";
        html += `<span class="sw" style="background:${cssColor}"></span>${l.short}　指數 <strong>${v.toFixed(0)}</strong><br>`;
      });
      showTooltip(html, e.clientX, e.clientY);
    });
    hit.addEventListener("mouseleave", () => {
      cross.setAttribute("visibility", "hidden");
      dots.forEach((d) => d.setAttribute("visibility", "hidden"));
      hideTooltip();
    });
    svg.appendChild(hit);
    box.replaceChildren(svg);

    $("#cmpLegend").innerHTML = LOCATIONS.map((l, i) =>
      `<span class="key"><span class="swatch" style="background:${i === 0 ? "var(--series-1)" : "var(--series-2)"}"></span>${l.name}</span>`
    ).join("");
  }

  /* ---------- 表格檢視（無障礙補充） ---------- */
  function renderTables() {
    const s = state.series[state.activeId];
    $("#hourlyTable").innerHTML = "<table><thead><tr><th>時段</th><th>人流指數</th><th>估計人次/時</th></tr></thead><tbody>" +
      s.index.map((v, h) => `<tr><td>${fmtHour(h)}</td><td>${v.toFixed(0)}</td><td>${fmtInt(s.persons[h])}</td></tr>`).join("") +
      "</tbody></table>";
    $("#compareTable").innerHTML = `<table><thead><tr><th>時段</th><th>${LOCATIONS[0].short}</th><th>${LOCATIONS[1].short}</th></tr></thead><tbody>` +
      Array.from({ length: 24 }, (_, h) =>
        `<tr><td>${fmtHour(h)}</td><td>${state.series[LOCATIONS[0].id].index[h].toFixed(0)}</td><td>${state.series[LOCATIONS[1].id].index[h].toFixed(0)}</td></tr>`
      ).join("") + "</tbody></table>";
  }

  /* ---------- 全面重繪 ---------- */
  function refresh() {
    recomputeSeries();
    const loc = activeLoc();
    $("#locName").textContent = loc.name;
    $("#locAddr").textContent = loc.address;
    $("#hourlyLocLabel").textContent = loc.short;
    const L = state.loc[loc.id];
    const badge = $("#srcBadge");
    if (L.source === "live") {
      badge.textContent = "Google Places 即時資料 · " + L.points.length + " 個地點";
      badge.classList.add("live");
    } else {
      badge.textContent = "模擬資料（Demo）";
      badge.classList.remove("live");
    }
    $("#hourOut").textContent = fmtHour(state.hour);
    $("#hourSlider").value = state.hour;
    updateHeat();
    updateKPIs();
    drawHourlyChart();
    drawCompareChart();
    renderTables();
  }

  /* ---------- 互動 ---------- */
  function setHour(h, fromNow) {
    state.hour = h;
    if (!fromNow) {
      state.nowMode = false;
      $("#nowBtn").setAttribute("aria-pressed", "false");
    }
    refresh();
  }
  function applyNow() {
    state.nowMode = true;
    $("#nowBtn").setAttribute("aria-pressed", "true");
    state.hour = currentHourIn(activeLoc().timezone);
    refresh();
  }

  function bindUI() {
    // 地點分頁
    const tabs = $("#locTabs");
    for (const l of LOCATIONS) {
      const b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", l.id === state.activeId ? "true" : "false");
      b.textContent = l.short;
      b.addEventListener("click", async () => {
        if (state.activeId === l.id) return;
        state.activeId = l.id;
        tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
        if (state.nowMode) state.hour = currentHourIn(l.timezone);
        refresh();
        if (state.mapsLoaded) { await showMapFor(l); refresh(); }
      });
      tabs.appendChild(b);
    }
    // 平日 / 週末
    $("#daySeg").querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        state.dayType = b.dataset.day;
        $("#daySeg").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        refresh();
      });
    });
    // 時段
    $("#hourSlider").addEventListener("input", (e) => setHour(Number(e.target.value), false));
    $("#nowBtn").addEventListener("click", applyNow);
    state.nowTimer = setInterval(() => { if (state.nowMode) applyNow(); }, 60000);

    // 表格切換
    for (const [btnId, tblId] of [["#hourlyTblBtn", "#hourlyTable"], ["#compareTblBtn", "#compareTable"]]) {
      $(btnId).addEventListener("click", () => {
        const t = $(tblId);
        t.hidden = !t.hidden;
        $(btnId).setAttribute("aria-pressed", t.hidden ? "false" : "true");
      });
    }
    // 主題
    $("#themeBtn").addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      for (const l of LOCATIONS) state.loc[l.id].map?.setOptions({ styles: next === "dark" ? DARK_MAP_STYLE : [] });
      refresh();
    });
    // API 金鑰對話框
    const dlg = $("#keyDialog");
    const openDlg = () => { $("#keyInput").value = state.apiKey; dlg.showModal(); };
    $("#keyBtn").addEventListener("click", openDlg);
    $("#noticeKeyBtn").addEventListener("click", openDlg);
    $("#keyCancelBtn").addEventListener("click", () => dlg.close());
    $("#keyClearBtn").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      dlg.close();
      location.reload();
    });
    $("#keySaveBtn").addEventListener("click", () => {
      const v = $("#keyInput").value.trim();
      if (v) localStorage.setItem(STORAGE_KEY, v);
      dlg.close();
      location.reload();
    });

    let resizeT;
    window.addEventListener("resize", () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(refresh, 150);
    });
  }

  /* ---------- 啟動 ---------- */
  async function boot() {
    state.dayType = todayIsWeekend(LOCATIONS[0].timezone) ? "weekend" : "weekday";
    $("#daySeg").querySelectorAll("button").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.day === state.dayType ? "true" : "false"));
    state.hour = currentHourIn(activeLoc().timezone);

    for (const l of LOCATIONS) state.loc[l.id].points = buildDemoPoints(l);
    bindUI();
    refresh();

    if (state.apiKey) {
      try {
        await loadGoogleMaps(state.apiKey);
        state.mapsLoaded = true;
        await showMapFor(activeLoc());
        refresh();
      } catch (e) {
        console.error(e);
        state.mapsLoaded = false;
        const n = $("#mapNotice");
        n.hidden = false;
        n.firstElementChild.textContent = "Google Maps 載入失敗（" + e.message + "），目前顯示模擬資料。請確認金鑰與已啟用的 API。";
      }
    }
  }

  /* 深色地圖樣式（精簡版） */
  const isDark = () => (document.documentElement.dataset.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  const DARK_MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#262626" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#383838" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f2f2f" }] },
  ];

  boot();
})();
