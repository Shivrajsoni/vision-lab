/** Ten evenly spaced samples of matplotlib's viridis colour map, low to high. */
const STOPS = ["#440154", "#482878", "#3e4a89", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6dcd59", "#b4de2c", "#fde725"];

const hex = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16);

/** 256-entry lookup table: VIRIDIS[v * 3 + channel] for v in 0..255. */
export const VIRIDIS: Uint8ClampedArray = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  const last = STOPS.length - 1;
  for (let v = 0; v < 256; v++) {
    const t = (v / 255) * last;
    const i = Math.min(Math.floor(t), last - 1);
    const f = t - i;
    const a = STOPS[i]!;
    const b = STOPS[i + 1]!;
    for (let c = 0; c < 3; c++) {
      lut[v * 3 + c] = hex(a, 1 + c * 2) * (1 - f) + hex(b, 1 + c * 2) * f;
    }
  }
  return lut;
})();
