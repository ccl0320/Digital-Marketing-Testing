/* 輕量熱力圖渲染：灰階筆刷疊加 → 依序列色階 LUT 上色。
   不依賴已棄用的 google.maps.visualization.HeatmapLayer。 */

/* [位置0..1, r, g, b, alpha] 單一色相（藍）序列色階。
   淺色底：淺→深（越深＝越多）；深色底：深→亮（越亮＝越多）。 */
const HEAT_GRADIENTS = {
  light: [
    [0.00, 205, 226, 251, 0],
    [0.15, 205, 226, 251, 0.30],
    [0.35, 134, 182, 239, 0.52],
    [0.60,  57, 135, 229, 0.70],
    [0.80,  28,  92, 171, 0.82],
    [1.00,  13,  54, 107, 0.90],
  ],
  dark: [
    [0.00,  13,  54, 107, 0],
    [0.15,  16,  66, 129, 0.35],
    [0.35,  28,  92, 171, 0.58],
    [0.60,  57, 135, 229, 0.74],
    [0.80, 109, 167, 236, 0.84],
    [1.00, 205, 226, 251, 0.92],
  ],
};

function buildHeatLUT(stops) {
  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s]; b = stops[s + 1]; break;
      }
    }
    const f = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
    lut[i * 4]     = a[1] + (b[1] - a[1]) * f;
    lut[i * 4 + 1] = a[2] + (b[2] - a[2]) * f;
    lut[i * 4 + 2] = a[3] + (b[3] - a[3]) * f;
    lut[i * 4 + 3] = Math.round(255 * (a[4] + (b[4] - a[4]) * f));
  }
  return lut;
}
const HEAT_LUTS = {
  light: buildHeatLUT(HEAT_GRADIENTS.light),
  dark: buildHeatLUT(HEAT_GRADIENTS.dark),
};

function makeBrush(radius) {
  const c = document.createElement("canvas");
  c.width = c.height = radius * 2;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, radius * 2, radius * 2);
  return c;
}

/* points: [{x, y, w}]，w 為 0..1 的相對強度；radius 單位 px */
function renderHeat(canvas, points, radius, lut) {
  lut = lut || HEAT_LUTS.light;
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  if (!points.length || w === 0 || h === 0) return;

  const shade = document.createElement("canvas");
  shade.width = w; shade.height = h;
  const sctx = shade.getContext("2d");
  const brush = makeBrush(radius);

  for (const p of points) {
    if (p.x < -radius * 2 || p.y < -radius * 2 || p.x > w + radius * 2 || p.y > h + radius * 2) continue;
    sctx.globalAlpha = Math.max(0.03, Math.min(1, p.w));
    sctx.drawImage(brush, p.x - radius, p.y - radius);
  }

  const img = sctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    d[i]     = lut[a * 4];
    d[i + 1] = lut[a * 4 + 1];
    d[i + 2] = lut[a * 4 + 2];
    d[i + 3] = lut[a * 4 + 3];
  }
  ctx.putImageData(img, 0, 0);
}

/* Google Maps 自訂 OverlayView：把熱力 canvas 貼齊目前視窗 */
function createHeatOverlay(map) {
  const overlay = new google.maps.OverlayView();
  overlay._points = [];   // [{lat, lng, w}]
  overlay._lut = HEAT_LUTS.light;
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";

  overlay.onAdd = function () {
    this.getPanes().overlayLayer.appendChild(canvas);
  };
  overlay.onRemove = function () {
    canvas.remove();
  };
  overlay.setPoints = function (pts) {
    this._points = pts;
    if (this.getProjection()) this.draw();
  };
  overlay.setDarkTheme = function (dark) {
    this._lut = dark ? HEAT_LUTS.dark : HEAT_LUTS.light;
    if (this.getProjection()) this.draw();
  };
  overlay.draw = function () {
    const proj = this.getProjection();
    const bounds = map.getBounds();
    if (!proj || !bounds) return;
    const sw = proj.fromLatLngToDivPixel(bounds.getSouthWest());
    const ne = proj.fromLatLngToDivPixel(bounds.getNorthEast());
    const width = Math.round(ne.x - sw.x);
    const height = Math.round(sw.y - ne.y);
    if (width <= 0 || height <= 0) return;
    canvas.width = width; canvas.height = height;
    canvas.style.left = sw.x + "px";
    canvas.style.top = ne.y + "px";

    const zoom = map.getZoom();
    const radius = Math.max(14, Math.min(90, 26 * Math.pow(2, zoom - 16)));
    const pts = this._points.map((p) => {
      const px = proj.fromLatLngToDivPixel(new google.maps.LatLng(p.lat, p.lng));
      return { x: px.x - sw.x, y: px.y - ne.y, w: p.w };
    });
    renderHeat(canvas, pts, radius, this._lut);
  };
  overlay.setMap(map);
  return overlay;
}
