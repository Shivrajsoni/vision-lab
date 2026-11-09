import type { ModelSpec, ProviderId } from "@visionlab/registry";

/** What actually executed the model. Shown next to every result. */
export type Device = "webgpu" | "wasm" | "zerogpu" | "remote";

export type UnavailableReason =
  | "NOT_IMPLEMENTED"
  | "NOT_CONFIGURED"
  | "UNSUPPORTED_DEVICE"
  | "QUOTA_EXHAUSTED"
  | "RATE_LIMITED"
  | "PROVIDER_DOWN";

/**
 * Whether a provider can run a model right now.
 * `degraded` means it will work, but noticeably worse (for example CPU instead of GPU).
 */
export type Availability =
  | { state: "ready" }
  | { state: "degraded"; reason: string }
  | { state: "unavailable"; reason: UnavailableReason; detail: string; retryAfterSec?: number };

export interface DeviceProfile {
  webgpu: boolean;
  /** GPU vendor/architecture as reported by the browser, when it shares them. */
  gpu?: string;
  /** Logical CPU cores available to WASM threads. */
  threads: number;
  /** Approximate device memory in GB. Only some browsers report it. */
  memoryGB?: number;
  /** Multi-threaded WASM needs a cross-origin isolated page. */
  crossOriginIsolated: boolean;
  /** The user asked the browser to save data; large downloads should be opt-in. */
  saveData: boolean;
}

export interface Timings {
  loadMs?: number;
  preprocessMs: number;
  inferenceMs: number;
  postprocessMs: number;
}

export interface Provenance {
  modelId: string;
  /** Exact weights repository and revision, so a result can be reproduced. */
  weights: string;
  provider: ProviderId;
}

export interface InferenceResult<TOutput> {
  output: TOutput;
  timings: Timings;
  device: Device;
  provenance: Provenance;
}

export interface LoadProgress {
  file: string;
  loadedBytes: number;
  totalBytes?: number;
}

export interface ClassificationOutput {
  labels: { label: string; score: number }[];
}

/**
 * The one interface the UI talks to. Each hosting tier (browser, shared GPU, proxied API)
 * implements it, so moving a model between tiers never touches a component.
 */
export interface InferenceProvider<TInput = unknown, TOutput = unknown> {
  id: ProviderId;
  availability(model: ModelSpec): Promise<Availability>;
  load?(model: ModelSpec, onProgress: (p: LoadProgress) => void, signal: AbortSignal): Promise<void>;
  run(model: ModelSpec, input: TInput, signal: AbortSignal): Promise<InferenceResult<TOutput>>;
}

/** Shape of every error the proxy returns and every failure a provider throws. */
export class InferenceError extends Error {
  constructor(
    public readonly code: UnavailableReason | "INVALID_INPUT" | "TOO_LARGE" | "ABORTED",
    message: string,
    public readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = "InferenceError";
  }
}
