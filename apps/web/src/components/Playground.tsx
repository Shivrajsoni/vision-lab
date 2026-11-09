"use client";

import { selectProvider } from "@visionlab/inference";
import { MODELS, getModel, groupedModels } from "@visionlab/registry";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { candidatesFor } from "@/lib/availability";
import { ImageLoadError, fitWithin, loadImageFile } from "@/lib/image";
import type { LoadedImage } from "@/lib/image";
import { PROVIDER_LABEL, statusLabel } from "@/lib/labels";
import { useDevice } from "@/lib/useDevice";
import { DevicePanel } from "./DevicePanel";

/** Models see at most this many pixels on the longer side; larger photos are shrunk first. */
const MAX_SIDE = 1024;

export function Playground() {
  const device = useDevice();
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [modelId, setModelId] = useState(MODELS[0]!.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileId = useId();
  const modelSelectId = useId();

  const accept = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    try {
      const loaded = await loadImageFile(file);
      setImage((previous) => {
        previous?.bitmap.close();
        return loaded;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof ImageLoadError ? err.message : "That image could not be loaded.");
    }
  }, []);

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) void accept(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [accept]);

  const size = image ? fitWithin(image.originalWidth, image.originalHeight, MAX_SIDE) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !size) return;
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext("2d")?.drawImage(image.bitmap, 0, 0, size.width, size.height);
  }, [image, size?.width, size?.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const model = getModel(modelId)!;
  const candidates = device ? candidatesFor(model, device) : [];
  const selection = device ? selectProvider(candidates, { saveData: device.saveData }) : null;
  const blocker = candidates[0]?.availability;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <section aria-labelledby="image-title">
        <h2 id="image-title" className="text-lg font-semibold">
          Image
        </h2>
        <label
          htmlFor={fileId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void accept(e.dataTransfer.files[0]);
          }}
          className={`mt-3 flex min-h-[20rem] cursor-pointer flex-col items-center justify-center border border-dashed p-4 text-center focus-within:outline focus-within:outline-2 focus-within:outline-signal ${
            dragging ? "border-accent bg-sunken" : "border-line bg-surface"
          }`}
        >
          <input
            id={fileId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {image ? (
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`Your image, ${image.name}`}
              className="max-h-[32rem] max-w-full"
            />
          ) : (
            <>
              <span className="font-display text-2xl font-semibold [font-stretch:88%]">Drop an image here</span>
              <span className="mt-2 text-muted">or click to choose one, or paste from the clipboard</span>
            </>
          )}
        </label>

        {error && (
          <p role="alert" className="mt-3 text-signal">
            {error}
          </p>
        )}
        {image && size && (
          <p className="tnum mt-3 text-sm text-muted">
            {image.name}, {image.originalWidth}×{image.originalHeight}
            {size.width !== image.originalWidth ? `, shrunk to ${size.width}×${size.height} for models` : ""}. It
            stays on this device. Click the image to replace it.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-6">
        <section aria-labelledby="model-title" className="border border-line bg-surface p-4">
          <h2 id="model-title" className="text-lg font-semibold">
            <label htmlFor={modelSelectId}>Model</label>
          </h2>
          <select
            id={modelSelectId}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="mt-3 w-full rounded-sm border border-line bg-bg px-3 py-2"
          >
            {groupedModels().map(({ category, models }) => (
              <optgroup key={category.id} label={category.name}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({statusLabel(m)})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <p className="mt-3 text-[0.95rem]">{model.summary}</p>
          <p className="mt-2 text-sm text-muted">
            Runs on: {model.providers.map((p) => PROVIDER_LABEL[p]).join(", then ")}.{model.note ? ` ${model.note}` : ""}
          </p>

          <button
            type="button"
            disabled={!image || !selection}
            className="mt-4 w-full rounded-sm bg-accent px-4 py-2.5 font-medium text-on-accent disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted"
          >
            Run {model.name}
          </button>
          <p className="mt-2 text-sm text-muted" aria-live="polite">
            {!device
              ? "Checking your device…"
              : selection
                ? image
                  ? `Ready on ${PROVIDER_LABEL[selection.provider].toLowerCase()}.`
                  : "Load an image to run this model."
                : blocker?.state === "unavailable"
                  ? `${model.name} cannot run yet. ${blocker.detail}`
                  : "This model cannot run here."}
          </p>
        </section>

        <DevicePanel device={device} />
      </div>
    </div>
  );
}
