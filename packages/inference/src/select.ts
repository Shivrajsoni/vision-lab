import type { ProviderId } from "@visionlab/registry";
import type { Availability } from "./types";

export interface Candidate {
  provider: ProviderId;
  availability: Availability;
}

export interface SelectionContext {
  /** Download size if the model runs in the browser. Unknown until a model is wired up. */
  downloadMB?: number;
  /** The visitor asked their browser to save data. */
  saveData: boolean;
}

export interface Selection {
  provider: ProviderId;
  availability: Exclude<Availability, { state: "unavailable" }>;
  /** Shown to the visitor when the choice is not the model's first-listed provider. */
  because?: string;
}

/**
 * Decide where a model runs for this visitor.
 *
 * `candidates` arrive in the model author's preferred order (registry `providers`).
 * Must never return a provider whose availability is `unavailable`; returns null when none can run.
 */
export function selectProvider(candidates: Candidate[], ctx: SelectionContext): Selection | null {
  const usable = candidates.filter(isUsable);
  if (usable.length === 0) return null;

  // With data saver on, a large one-time download is worse than uploading one small image.
  const heavyDownload = ctx.saveData && (ctx.downloadMB ?? 0) > SAVE_DATA_LIMIT_MB;

  // Lower is better. A ready provider always beats a degraded one; the download penalty only
  // breaks ties within the same state, so it never trades a working GPU run for a CPU one.
  const rank = (c: UsableCandidate) =>
    (c.availability.state === "ready" ? 0 : 2) + (heavyDownload && c.provider === "browser" ? 1 : 0);

  // Array.prototype.sort is stable, so equal ranks keep the model author's order.
  const pick = [...usable].sort((a, b) => rank(a) - rank(b))[0]!;
  const first = candidates[0]!;

  return {
    provider: pick.provider,
    availability: pick.availability,
    because: pick.provider === first.provider ? undefined : whyNot(first, ctx),
  };
}

/** Above this size, a visitor who asked to save data is steered away from an in-browser download. */
const SAVE_DATA_LIMIT_MB = 25;

type UsableCandidate = Candidate & { availability: Selection["availability"] };

function isUsable(c: Candidate): c is UsableCandidate {
  return c.availability.state !== "unavailable";
}

/** One sentence on why the model's first-listed provider was passed over. */
function whyNot(first: Candidate, ctx: SelectionContext): string {
  switch (first.availability.state) {
    case "unavailable":
      return first.availability.detail;
    case "degraded":
      return first.availability.reason;
    case "ready":
      return `Data saver is on, so this skips a ${Math.round(ctx.downloadMB ?? 0)} MB download.`;
  }
}
