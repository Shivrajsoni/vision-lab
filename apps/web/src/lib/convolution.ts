/** A 3×3 filter in row order: top-left to bottom-right. */
export type Kernel = readonly number[];

export interface KernelPreset {
  id: string;
  name: string;
  kernel: Kernel;
  explain: string;
}

export const KERNEL_PRESETS: KernelPreset[] = [
  {
    id: "sobel-x",
    name: "Vertical edges",
    kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
    explain: "Subtracts the left column from the right. Flat areas cancel to zero; a left-to-right change survives.",
  },
  {
    id: "sobel-y",
    name: "Horizontal edges",
    kernel: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
    explain: "Subtracts the row above from the row below, so it responds to top-to-bottom changes.",
  },
  {
    id: "laplacian",
    name: "All edges",
    kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    explain: "Compares each pixel with its four neighbours. Any sudden change lights up, whatever its direction.",
  },
  {
    id: "blur",
    name: "Blur",
    kernel: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
    explain: "Replaces each pixel with the average of its neighbourhood.",
  },
  {
    id: "sharpen",
    name: "Sharpen",
    kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
    explain: "Boosts the centre and subtracts the neighbours, exaggerating local differences.",
  },
  {
    id: "identity",
    name: "Identity",
    kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
    explain: "Keeps only the centre pixel, so the output equals the input.",
  },
];

/** RGBA bytes → one brightness value per pixel (Rec. 601 luma, 0–255). */
export function toGray(rgba: Uint8ClampedArray): Float32Array {
  const gray = new Float32Array(rgba.length / 4);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    gray[p] = 0.299 * rgba[i]! + 0.587 * rgba[i + 1]! + 0.114 * rgba[i + 2]!;
  }
  return gray;
}

const clampIndex = (v: number, max: number) => (v < 0 ? 0 : v > max ? max : v);

/** The 3×3 neighbourhood around (x, y), in the same row order as a kernel. Edges repeat the border pixel. */
export function patchAt(src: Float32Array, width: number, height: number, x: number, y: number): number[] {
  const patch: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    const row = clampIndex(y + dy, height - 1) * width;
    for (let dx = -1; dx <= 1; dx++) {
      patch.push(src[row + clampIndex(x + dx, width - 1)]!);
    }
  }
  return patch;
}

/**
 * Slide a 3×3 kernel over the image: each output pixel is the sum of patch × kernel.
 *
 * This is cross-correlation (the kernel is not flipped), which is what every deep-learning
 * library calls "convolution". The output keeps the input size by repeating border pixels.
 */
export function convolve3x3(src: Float32Array, width: number, height: number, kernel: Kernel): Float32Array {
  if (kernel.length !== 9) throw new Error("Kernel must have 9 values.");
  if (src.length !== width * height) throw new Error("Image size does not match its dimensions.");
  const out = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = clampIndex(y + dy, height - 1) * width;
        for (let dx = -1; dx <= 1; dx++) {
          sum += src[row + clampIndex(x + dx, width - 1)]! * kernel[k++]!;
        }
      }
      out[y * width + x] = sum;
    }
  }
  return out;
}

/**
 * A kernel whose weights sum to zero measures change, not brightness: its output is signed
 * and centred on zero, so it is shown as a magnitude heat-map instead of a grey image.
 */
export function measuresChange(kernel: Kernel): boolean {
  return Math.abs(kernel.reduce((a, b) => a + b, 0)) < 1e-6;
}
