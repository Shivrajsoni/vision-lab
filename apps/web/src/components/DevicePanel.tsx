"use client";

import type { DeviceProfile } from "@visionlab/inference";

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line py-2 last:border-b-0">
      <dt className="text-muted">{term}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

/** What this browser can offer a model. Everything shown is read from the browser, nothing is assumed. */
export function DevicePanel({ device }: { device: DeviceProfile | null }) {
  return (
    <section aria-labelledby="device-title" className="border border-line bg-surface p-4">
      <h2 id="device-title" className="text-lg font-semibold">
        Your device
      </h2>
      {device === null ? (
        <p className="mt-3 text-muted">Checking what this browser supports…</p>
      ) : (
        <>
          <dl className="mt-2 text-[0.95rem]">
            <Row term="GPU access (WebGPU)">
              {device.webgpu ? (
                <span className="font-semibold text-accent">Available{device.gpu ? `, ${device.gpu}` : ""}</span>
              ) : (
                "Not available"
              )}
            </Row>
            <Row term="CPU threads">{device.threads}</Row>
            <Row term="Memory">{device.memoryGB ? `About ${device.memoryGB} GB` : "Not reported by this browser"}</Row>
            <Row term="Multi-threaded CPU inference">{device.crossOriginIsolated ? "On" : "Off"}</Row>
          </dl>
          <p className="mt-3 text-sm text-muted">
            {device.webgpu
              ? "Models that run on your device will use the GPU."
              : "Without WebGPU, models run on the CPU: slower, and the largest ones will not be offered. A current Chrome, Edge or Safari enables it."}
          </p>
        </>
      )}
    </section>
  );
}
