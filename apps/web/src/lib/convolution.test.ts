import { describe, expect, it } from "vitest";
import { KERNEL_PRESETS, convolve3x3, measuresChange, patchAt, toGray } from "./convolution";

const preset = (id: string) => KERNEL_PRESETS.find((p) => p.id === id)!.kernel;

/** 4×3 image: left half 0, right half 100 — one vertical edge. */
const W = 4;
const H = 3;
const step = Float32Array.from([0, 0, 100, 100, 0, 0, 100, 100, 0, 0, 100, 100]);

describe("convolve3x3", () => {
  it("returns the input for the identity kernel", () => {
    expect(Array.from(convolve3x3(step, W, H, preset("identity")))).toEqual(Array.from(step));
  });

  it("leaves a flat image unchanged when blurring", () => {
    const flat = new Float32Array(W * H).fill(40);
    for (const v of convolve3x3(flat, W, H, preset("blur"))) expect(v).toBeCloseTo(40, 4);
  });

  it("responds to a vertical edge with the vertical-edge kernel only", () => {
    const gx = convolve3x3(step, W, H, preset("sobel-x"));
    const gy = convolve3x3(step, W, H, preset("sobel-y"));
    // Middle row: flat at x=0 and x=3, edge at x=1 and x=2. (1+2+1) × 100 = 400.
    expect(Array.from(gx.slice(W, 2 * W))).toEqual([0, 400, 400, 0]);
    expect(Array.from(gy).every((v) => v === 0)).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(() => convolve3x3(step, W, H, [1, 2, 3])).toThrow();
    expect(() => convolve3x3(step, 5, 5, preset("identity"))).toThrow();
  });
});

describe("helpers", () => {
  it("reads a patch in kernel order and repeats border pixels", () => {
    expect(patchAt(step, W, H, 1, 1)).toEqual([0, 0, 100, 0, 0, 100, 0, 0, 100]);
    expect(patchAt(step, W, H, 0, 0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(patchAt(step, W, H, 3, 2)).toEqual([100, 100, 100, 100, 100, 100, 100, 100, 100]);
  });

  it("knows which kernels measure change", () => {
    expect(measuresChange(preset("sobel-x"))).toBe(true);
    expect(measuresChange(preset("laplacian"))).toBe(true);
    expect(measuresChange(preset("blur"))).toBe(false);
    expect(measuresChange(preset("sharpen"))).toBe(false);
  });

  it("converts RGBA to luma", () => {
    const gray = toGray(Uint8ClampedArray.from([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255]));
    expect(gray[0]).toBeCloseTo(255, 3);
    expect(gray[1]).toBe(0);
    expect(gray[2]).toBeCloseTo(76.245, 3);
  });
});
