import type { ModelSpec, ProviderId } from "@visionlab/registry";

/** Names visitors see for each place a model can run. */
export const PROVIDER_LABEL: Record<ProviderId, string> = {
  browser: "Your device",
  space: "Shared GPU",
  proxy: "Hosted model",
};

export function statusLabel(model: ModelSpec): string {
  if (model.status === "live") return "Live";
  if (model.status === "learn-only") return "Explained, not hosted";
  return `Planned, phase ${model.phase}`;
}
