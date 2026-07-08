export type HalftonePoint = { nx: number; ny: number; coverage: number };
export type HalftoneShape = {
  points: HalftonePoint[];
  vbWidth: number;
  vbHeight: number;
};

const RASTER_MAX_DIM = 640;
const CELL_SIZE = 8;
const MIN_COVERAGE = 0.05;

const cache = new Map<string, Promise<HalftoneShape>>();

function parseViewBox(svgText: string): { width: number; height: number } {
  const match = svgText.match(/viewBox=["']\s*[\d.+-]+\s+[\d.+-]+\s+([\d.]+)\s+([\d.]+)/i);
  if (match) {
    return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
  }
  const w = svgText.match(/width=["']([\d.]+)/i);
  const h = svgText.match(/height=["']([\d.]+)/i);
  return { width: w ? parseFloat(w[1]) : 1000, height: h ? parseFloat(h[1]) : 1000 };
}

/**
 * Rasterizes the SVG onto an offscreen canvas and downsamples it into a
 * deterministic halftone grid: each cell's dot "coverage" (0..1) is the
 * average ink density in that cell, exactly like a print halftone. This
 * faithfully reproduces filled shapes (not just outlines), with larger dots
 * where the artwork is denser and smaller/no dots where it's empty.
 */
async function rasterizeHalftone(url: string): Promise<HalftoneShape> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const text = await res.text();
  const vb = parseViewBox(text);
  const aspect = vb.width / vb.height;

  const rasterW = aspect >= 1 ? RASTER_MAX_DIM : Math.round(RASTER_MAX_DIM * aspect);
  const rasterH = aspect >= 1 ? Math.round(RASTER_MAX_DIM / aspect) : RASTER_MAX_DIM;

  const blob = new Blob([text], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to rasterize ${url}`));
      img.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = rasterW;
    canvas.height = rasterH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { points: [], vbWidth: vb.width, vbHeight: vb.height };
    ctx.drawImage(img, 0, 0, rasterW, rasterH);

    const { data } = ctx.getImageData(0, 0, rasterW, rasterH);
    const points: HalftonePoint[] = [];

    const cols = Math.ceil(rasterW / CELL_SIZE);
    const rows = Math.ceil(rasterH / CELL_SIZE);

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const x0 = cx * CELL_SIZE;
        const y0 = cy * CELL_SIZE;
        const x1 = Math.min(x0 + CELL_SIZE, rasterW);
        const y1 = Math.min(y0 + CELL_SIZE, rasterH);
        let sum = 0;
        let count = 0;
        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            const idx = (py * rasterW + px) * 4;
            sum += data[idx + 3]; // alpha channel = ink coverage
            count++;
          }
        }
        const coverage = count > 0 ? sum / count / 255 : 0;
        if (coverage > MIN_COVERAGE) {
          points.push({
            nx: (x0 + (x1 - x0) / 2) / rasterW,
            ny: (y0 + (y1 - y0) / 2) / rasterH,
            coverage,
          });
        }
      }
    }

    return { points, vbWidth: vb.width, vbHeight: vb.height };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function loadSvgHalftone(url: string): Promise<HalftoneShape> {
  let promise = cache.get(url);
  if (!promise) {
    promise = rasterizeHalftone(url).catch((err) => {
      cache.delete(url);
      throw err;
    });
    cache.set(url, promise);
  }
  return promise;
}
