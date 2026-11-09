"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { KERNEL_PRESETS, convolve3x3, measuresChange, patchAt, toGray } from "@/lib/convolution";
import { ImageLoadError, drawCover, loadImageFile } from "@/lib/image";
import { sampleScene } from "@/lib/sampleScene";
import { VIRIDIS } from "@/lib/viridis";

const W = 240;
const H = 180;
const START = { x: 144, y: 54 }; // straddles the left edge of the sun, where the arithmetic is interesting

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(Math.abs(v) < 10 ? 2 : 0));

function Grid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="m-0">
      <div className="grid w-max grid-cols-3 gap-px bg-line p-px">{children}</div>
      <figcaption className="mt-1.5 text-sm text-muted">{label}</figcaption>
    </figure>
  );
}

const cell = "tnum flex h-10 w-[3.4rem] items-center justify-center font-mono text-[0.8rem]";

/**
 * The lab's first live exhibit: a real 3×3 convolution computed on every pixel, with the
 * arithmetic for one chosen pixel written out underneath.
 */
export function ConvolutionBench() {
  const [rgba, setRgba] = useState(() => sampleScene(W, H));
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [presetId, setPresetId] = useState(KERNEL_PRESETS[0]!.id);
  const [kernel, setKernel] = useState<number[]>(() => [...KERNEL_PRESETS[0]!.kernel]);
  const [pos, setPos] = useState(START);
  const [error, setError] = useState<string | null>(null);

  const srcRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const fileId = useId();

  const gray = useMemo(() => toGray(rgba), [rgba]);
  const response = useMemo(() => convolve3x3(gray, W, H, kernel), [gray, kernel]);
  const asHeatmap = measuresChange(kernel);

  useEffect(() => {
    srcRef.current?.getContext("2d")?.putImageData(new ImageData(rgba, W, H), 0, 0);
  }, [rgba]);

  useEffect(() => {
    const ctx = outRef.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    let peak = 0;
    if (asHeatmap) for (const v of response) peak = Math.max(peak, Math.abs(v));
    for (let p = 0; p < response.length; p++) {
      const i = p * 4;
      if (asHeatmap) {
        const v = peak === 0 ? 0 : Math.round((Math.abs(response[p]!) / peak) * 255);
        img.data[i] = VIRIDIS[v * 3]!;
        img.data[i + 1] = VIRIDIS[v * 3 + 1]!;
        img.data[i + 2] = VIRIDIS[v * 3 + 2]!;
      } else {
        img.data[i] = img.data[i + 1] = img.data[i + 2] = response[p]!; // clamped to 0–255 by the array
      }
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [response, asHeatmap]);

  const patch = patchAt(gray, W, H, pos.x, pos.y);
  const sum = response[pos.y * W + pos.x]!;
  const preset = KERNEL_PRESETS.find((p) => p.id === presetId);

  function pick(id: string) {
    const next = KERNEL_PRESETS.find((p) => p.id === id);
    if (!next) return;
    setPresetId(id);
    setKernel([...next.kernel]);
  }

  function editKernel(index: number, raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setKernel((k) => k.map((v, i) => (i === index ? value : v)));
    setPresetId("custom");
  }

  function movePointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(W - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * W)));
    const y = Math.min(H - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * H)));
    setPos({ x, y });
  }

  function moveKeys(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 1;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    setPos((p) => ({
      x: Math.min(W - 1, Math.max(0, p.x + d[0])),
      y: Math.min(H - 1, Math.max(0, p.y + d[1])),
    }));
  }

  async function chooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { bitmap, name } = await loadImageFile(file);
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new ImageLoadError("This browser could not draw the image.");
      drawCover(ctx, bitmap, W, H);
      bitmap.close();
      setRgba(new Uint8ClampedArray(ctx.getImageData(0, 0, W, H).data));
      setSourceName(name);
      setError(null);
    } catch (err) {
      setError(err instanceof ImageLoadError ? err.message : "That image could not be loaded.");
    }
  }

  return (
    <section aria-labelledby="bench-title" className="border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-3">
        <h2 id="bench-title" className="text-lg font-semibold">
          A filter is arithmetic on pixels
        </h2>
        <p className="text-sm text-muted">Computed live in this tab, on {sourceName ?? "a sample scene"}.</p>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-2">
        <figure className="m-0 bg-surface p-3">
          <div
            tabIndex={0}
            role="group"
            aria-label="Source image. Move the pointer or use the arrow keys to choose a pixel."
            onPointerMove={movePointer}
            onPointerDown={movePointer}
            onKeyDown={moveKeys}
            className="relative cursor-crosshair touch-none"
          >
            <canvas ref={srcRef} width={W} height={H} className="pixelated block aspect-[4/3] w-full" />
            <span
              aria-hidden
              className="pointer-events-none absolute border-2 border-[#fde725] shadow-[0_0_0_1.5px_#17122b]"
              style={{
                left: `${((pos.x - 1) / W) * 100}%`,
                top: `${((pos.y - 1) / H) * 100}%`,
                width: `${(3 / W) * 100}%`,
                height: `${(3 / H) * 100}%`,
                boxSizing: "content-box",
                transform: "translate(-2px, -2px)",
              }}
            />
          </div>
          <figcaption className="mt-2 text-sm text-muted">Input. The yellow square is the 3×3 patch below.</figcaption>
        </figure>

        <figure className="m-0 bg-surface p-3">
          <canvas
            ref={outRef}
            width={W}
            height={H}
            role="img"
            aria-label={`Output of the ${preset?.name ?? "custom"} filter`}
            className="pixelated block aspect-[4/3] w-full"
          />
          <figcaption className="mt-2 text-sm text-muted">
            {asHeatmap
              ? "Output. Yellow marks a strong response, violet none."
              : "Output, shown as a grey image clamped to 0–255."}
          </figcaption>
        </figure>
      </div>

      <div className="border-t border-line px-4 py-4">
        <div role="radiogroup" aria-label="Filter" className="flex flex-wrap gap-2">
          {KERNEL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={presetId === p.id}
              onClick={() => pick(p.id)}
              className={`rounded-sm border px-3 py-1.5 text-sm ${
                presetId === p.id
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line text-muted hover:border-muted hover:text-text"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-[68ch] text-[0.95rem]">
          {preset?.explain ?? "Your own filter. Change any weight and both pictures update."}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-x-4 gap-y-5 border-t border-line px-4 py-4">
        <Grid label={`Brightness at (${pos.x}, ${pos.y})`}>
          {patch.map((v, i) => (
            <span
              key={i}
              className={cell}
              style={{ background: `rgb(${v} ${v} ${v})`, color: v > 140 ? "#17122b" : "#edeaf6" }}
            >
              {Math.round(v)}
            </span>
          ))}
        </Grid>
        <span aria-hidden className="pt-11 font-mono text-lg text-muted">
          ×
        </span>
        <Grid label="Filter weights (editable)">
          {kernel.map((v, i) => (
            <input
              key={i}
              type="number"
              step="0.5"
              inputMode="decimal"
              aria-label={`Filter weight, row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`}
              value={Number(v.toFixed(3))}
              onChange={(e) => editKernel(i, e.target.value)}
              className={`${cell} bg-sunken text-center text-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
            />
          ))}
        </Grid>
        <span aria-hidden className="pt-11 font-mono text-lg text-muted">
          =
        </span>
        <Grid label="Products">
          {patch.map((v, i) => (
            <span key={i} className={`${cell} bg-surface text-muted`}>
              {fmt(Math.round(v * kernel[i]! * 100) / 100)}
            </span>
          ))}
        </Grid>
        <p className="pt-9" aria-live="polite">
          <span className="text-sm text-muted">Their sum is the output pixel</span>
          <br />
          <span className="tnum font-mono text-2xl font-semibold text-accent">{fmt(Math.round(sum * 100) / 100)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-sm">
        <label
          htmlFor={fileId}
          className="cursor-pointer rounded-sm border border-line px-3 py-1.5 hover:border-muted focus-within:outline focus-within:outline-2 focus-within:outline-signal"
        >
          Use your own image
          <input id={fileId} type="file" accept="image/*" onChange={chooseFile} className="sr-only" />
        </label>
        {sourceName && (
          <button
            type="button"
            onClick={() => {
              setRgba(sampleScene(W, H));
              setSourceName(null);
            }}
            className="text-muted underline underline-offset-4 hover:text-text"
          >
            Back to the sample scene
          </button>
        )}
        <span className="text-muted">Your image is read in this tab and goes nowhere.</span>
        {error && (
          <p role="alert" className="basis-full text-signal">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
