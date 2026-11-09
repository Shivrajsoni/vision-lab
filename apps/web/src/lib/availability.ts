import { browserAvailability } from "@visionlab/inference";
import type { Availability, Candidate, DeviceProfile } from "@visionlab/inference";
import type { ModelSpec } from "@visionlab/registry";

/** One candidate per provider the model lists, in the model's preferred order. */
export function candidatesFor(model: ModelSpec, device: DeviceProfile): Candidate[] {
  return model.providers.map((provider) => {
    if (provider === "browser") return { provider, availability: browserAvailability(model, device) };

    // The shared GPU and hosted-model tiers are wired up in phases 4 and 5.
    const availability: Availability =
      model.status === "live"
        ? { state: "unavailable", reason: "NOT_CONFIGURED", detail: "This way of running models is not set up yet." }
        : {
            state: "unavailable",
            reason: "NOT_IMPLEMENTED",
            detail: model.status === "planned" ? `Arrives in phase ${model.phase}.` : "Explained in Learn mode; not hosted.",
          };
    return { provider, availability };
  });
}
