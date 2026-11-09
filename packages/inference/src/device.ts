import type { ModelSpec } from "@visionlab/registry";
import type { Availability, DeviceProfile } from "./types";

interface GpuAdapterLike {
  info?: { vendor?: string; architecture?: string };
}
interface NavigatorLike {
  gpu?: { requestAdapter(): Promise<GpuAdapterLike | null> };
  hardwareConcurrency?: number;
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/** Ask the browser what it can do. Safe to call anywhere; returns a CPU-only profile off the main browser. */
export async function probeDevice(): Promise<DeviceProfile> {
  const nav: NavigatorLike = typeof navigator === "undefined" ? {} : (navigator as unknown as NavigatorLike);

  let webgpu = false;
  let gpu: string | undefined;
  try {
    // An adapter can be null even when the API exists (blocklisted driver, no GPU).
    const adapter = (await nav.gpu?.requestAdapter()) ?? null;
    if (adapter) {
      webgpu = true;
      gpu = [adapter.info?.vendor, adapter.info?.architecture].filter(Boolean).join(" ") || undefined;
    }
  } catch {
    webgpu = false;
  }

  return {
    webgpu,
    gpu,
    threads: nav.hardwareConcurrency ?? 1,
    memoryGB: nav.deviceMemory,
    crossOriginIsolated: typeof crossOriginIsolated !== "undefined" && crossOriginIsolated,
    saveData: nav.connection?.saveData ?? false,
  };
}

/** Can this device run this model in the browser? Pure, so it is easy to test. */
export function browserAvailability(model: ModelSpec, device: DeviceProfile): Availability {
  if (model.status !== "live") {
    return {
      state: "unavailable",
      reason: "NOT_IMPLEMENTED",
      detail: model.status === "planned" ? `Arrives in phase ${model.phase}.` : "Explained in Learn mode; not hosted.",
    };
  }
  if (device.webgpu) return { state: "ready" };
  if (model.requiresWebGPU) {
    return {
      state: "unavailable",
      reason: "UNSUPPORTED_DEVICE",
      detail: "This model needs WebGPU, which this browser does not provide.",
    };
  }
  return { state: "degraded", reason: "No WebGPU here, so this runs on the CPU and will be slower." };
}
