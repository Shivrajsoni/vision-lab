"use client";

import { useEffect, useState } from "react";
import type { StatusResponse } from "@/app/api/status/route";
import { useDevice } from "@/lib/useDevice";
import { DevicePanel } from "./DevicePanel";

type Loaded = { ok: true; data: StatusResponse } | { ok: false } | null;

export function StatusBoard() {
  const device = useDevice();
  const [status, setStatus] = useState<Loaded>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: StatusResponse) => setStatus({ ok: true, data }))
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) setStatus({ ok: false });
      });
    return () => controller.abort();
  }, []);

  const rows =
    status?.ok === true
      ? [
          {
            name: "Your device",
            state: "Working",
            good: true,
            detail: "Runs models in this tab. No limit, and images stay with you.",
          },
          {
            name: "Shared GPU",
            state: status.data.providers.space.configured ? "Connected" : "Not set up yet",
            good: status.data.providers.space.configured,
            detail: "For models too large for a browser. A few GPU minutes per visitor per day.",
          },
          {
            name: "Hosted model",
            state: status.data.providers.proxy.configured ? "Connected" : "Not set up yet",
            good: status.data.providers.proxy.configured,
            detail: "Fallback with a daily allowance shared by all visitors.",
          },
        ]
      : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <section aria-labelledby="providers-title">
        <h2 id="providers-title" className="text-lg font-semibold">
          Where models can run
        </h2>
        {status === null && <p className="mt-3 text-muted">Checking…</p>}
        {status?.ok === false && (
          <p role="alert" className="mt-3 text-signal">
            The status check did not respond. Reload the page to try again.
          </p>
        )}
        {status?.ok === true && (
          <>
            <ul className="mt-3 border-t border-line">
              {rows.map((row) => (
                <li key={row.name} className="grid gap-x-6 gap-y-1 border-b border-line py-3 sm:grid-cols-[10rem_9rem_minmax(0,1fr)]">
                  <span className="font-semibold">{row.name}</span>
                  <span className={row.good ? "font-semibold text-accent" : "text-muted"}>{row.state}</span>
                  <span className="text-[0.95rem] text-muted">{row.detail}</span>
                </li>
              ))}
            </ul>
            <p className="tnum mt-4 text-sm text-muted">
              {status.data.modelsLive} of {status.data.modelsTotal} models are live. Checked at{" "}
              {new Date(status.data.checkedAt).toLocaleTimeString()}.
            </p>
          </>
        )}
      </section>
      <DevicePanel device={device} />
    </div>
  );
}
