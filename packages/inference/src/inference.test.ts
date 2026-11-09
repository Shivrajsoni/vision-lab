import type { ModelSpec } from "@visionlab/registry";
import { describe, expect, it } from "vitest";
import { browserAvailability, selectProvider } from "./index";
import type { Availability, DeviceProfile } from "./index";

const model = (over: Partial<ModelSpec> = {}): ModelSpec => ({
  id: "test",
  name: "Test",
  category: "classification",
  task: "image-classification",
  summary: "",
  paper: { title: "", year: 2020, url: "https://arxiv.org/abs/0000.00000" },
  providers: ["browser"],
  status: "live",
  phase: 2,
  ...over,
});

const device = (over: Partial<DeviceProfile> = {}): DeviceProfile => ({
  webgpu: true,
  threads: 8,
  crossOriginIsolated: false,
  saveData: false,
  ...over,
});

const ready: Availability = { state: "ready" };
const slow: Availability = { state: "degraded", reason: "cpu" };
const down: Availability = { state: "unavailable", reason: "QUOTA_EXHAUSTED", detail: "daily limit reached" };

describe("browserAvailability", () => {
  it("is ready with WebGPU", () => {
    expect(browserAvailability(model(), device())).toEqual(ready);
  });

  it("degrades to CPU without WebGPU", () => {
    expect(browserAvailability(model(), device({ webgpu: false })).state).toBe("degraded");
  });

  it("refuses WebGPU-only models on CPU-only devices", () => {
    const a = browserAvailability(model({ requiresWebGPU: true }), device({ webgpu: false }));
    expect(a).toMatchObject({ state: "unavailable", reason: "UNSUPPORTED_DEVICE" });
  });

  it("never offers a model that is not live", () => {
    const a = browserAvailability(model({ status: "planned", phase: 3 }), device());
    expect(a).toMatchObject({ state: "unavailable", reason: "NOT_IMPLEMENTED" });
  });
});

// These are the invariants any ranking policy must keep, whatever it prefers.
describe("selectProvider invariants", () => {
  const ctx = { saveData: false };

  it("returns null when nothing can run", () => {
    expect(selectProvider([], ctx)).toBeNull();
    expect(selectProvider([{ provider: "browser", availability: down }], ctx)).toBeNull();
  });

  it("never picks an unavailable provider", () => {
    const pick = selectProvider(
      [
        { provider: "space", availability: down },
        { provider: "proxy", availability: ready },
      ],
      ctx,
    );
    expect(pick?.provider).toBe("proxy");
  });

  it("picks the only usable provider even when it is degraded", () => {
    const pick = selectProvider([{ provider: "browser", availability: slow }], ctx);
    expect(pick?.provider).toBe("browser");
    expect(pick?.availability.state).toBe("degraded");
  });
});

describe("selectProvider ranking", () => {
  const ctx = { saveData: false };

  it("keeps the author's first choice when it is ready, and gives no reason", () => {
    const pick = selectProvider(
      [
        { provider: "browser", availability: ready },
        { provider: "space", availability: ready },
      ],
      ctx,
    );
    expect(pick).toEqual({ provider: "browser", availability: ready, because: undefined });
  });

  it("prefers a ready provider over a degraded first choice, and says why", () => {
    const pick = selectProvider(
      [
        { provider: "browser", availability: slow },
        { provider: "space", availability: ready },
      ],
      ctx,
    );
    expect(pick?.provider).toBe("space");
    expect(pick?.because).toBe("cpu");
  });

  it("explains a fallback with the first choice's failure", () => {
    const pick = selectProvider(
      [
        { provider: "space", availability: down },
        { provider: "proxy", availability: ready },
      ],
      ctx,
    );
    expect(pick?.because).toBe("daily limit reached");
  });

  it("keeps the author's order among degraded providers", () => {
    const pick = selectProvider(
      [
        { provider: "browser", availability: slow },
        { provider: "proxy", availability: slow },
      ],
      ctx,
    );
    expect(pick?.provider).toBe("browser");
  });

  it("skips a large download when data saver is on and another provider is ready", () => {
    const candidates = [
      { provider: "browser" as const, availability: ready },
      { provider: "space" as const, availability: ready },
    ];
    const pick = selectProvider(candidates, { saveData: true, downloadMB: 98.4 });
    expect(pick?.provider).toBe("space");
    expect(pick?.because).toBe("Data saver is on, so this skips a 98 MB download.");

    // Small downloads, or no data saver, leave the browser in place.
    expect(selectProvider(candidates, { saveData: true, downloadMB: 12 })?.provider).toBe("browser");
    expect(selectProvider(candidates, { saveData: false, downloadMB: 98.4 })?.provider).toBe("browser");
  });

  it("never gives up a ready browser for a degraded remote to save data", () => {
    const pick = selectProvider(
      [
        { provider: "browser", availability: ready },
        { provider: "proxy", availability: slow },
      ],
      { saveData: true, downloadMB: 300 },
    );
    expect(pick?.provider).toBe("browser");
  });
});
