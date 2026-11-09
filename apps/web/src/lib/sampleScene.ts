/**
 * A small landscape drawn with arithmetic, so the convolution bench has something with
 * straight, diagonal and curved edges to work on before a visitor loads their own photo.
 * Pure and deterministic: the server and the browser produce identical pixels.
 */
export function sampleScene(w: number, h: number): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(w * h * 4);
  const tri = (x: number, peak: number, halfWidth: number) => Math.max(0, 1 - Math.abs(x - peak) / halfWidth);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = y / h;
      // Sky: violet at the top warming toward the horizon.
      let r = 60 + 150 * t;
      let g = 50 + 110 * t;
      let b = 120 + 60 * t;

      const sx = x - w * 0.7;
      const sy = y - h * 0.3;
      if (sx * sx + sy * sy < (h * 0.13) ** 2) [r, g, b] = [250, 225, 120];

      if (y > h * 0.68 - tri(x, w * 0.3, w * 0.34) * h * 0.36) [r, g, b] = [70, 60, 110];
      if (y > h * 0.72 - tri(x, w * 0.78, w * 0.3) * h * 0.26) [r, g, b] = [45, 40, 80];

      if (y > h * 0.72) {
        const furrow = Math.floor((y - h * 0.72) / 6) % 2 === 0;
        [r, g, b] = furrow ? [38, 110, 100] : [30, 90, 85];
      }

      // House: roof, wall, window, door.
      if (y >= h * 0.5 && y < h * 0.6 && Math.abs(x - w * 0.21) < ((y - h * 0.5) / (h * 0.1)) * w * 0.11) {
        [r, g, b] = [150, 60, 90];
      }
      if (x >= w * 0.12 && x < w * 0.3 && y >= h * 0.6 && y < h * 0.8) [r, g, b] = [225, 215, 235];
      if (x >= w * 0.15 && x < w * 0.19 && y >= h * 0.64 && y < h * 0.7) [r, g, b] = [40, 35, 70];
      if (x >= w * 0.23 && x < w * 0.27 && y >= h * 0.68 && y < h * 0.8) [r, g, b] = [90, 60, 70];

      const i = (y * w + x) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    }
  }
  return out;
}
