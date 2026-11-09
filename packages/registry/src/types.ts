/** Where a model can run. Order in `ModelSpec.providers` is the author's preference. */
export type ProviderId = "browser" | "space" | "proxy";

export type Category =
  | "classification"
  | "detection"
  | "segmentation"
  | "generative"
  | "vision-language"
  | "advanced";

export type Task =
  | "image-classification"
  | "object-detection"
  | "image-segmentation"
  | "image-generation"
  | "image-text"
  | "depth-estimation"
  | "super-resolution"
  | "pose-estimation"
  | "optical-flow";

/**
 * - `live`: runs end to end on the deployed site.
 * - `planned`: scheduled for the given phase; not runnable yet.
 * - `learn-only`: explained in Learn mode but not hosted (too large or licence-restricted).
 */
export type ModelStatus = "live" | "planned" | "learn-only";

export interface Paper {
  title: string;
  year: number;
  url: string;
}

export interface ModelSpec {
  /** Stable slug used in URLs. */
  id: string;
  name: string;
  category: Category;
  task: Task;
  /** One sentence a newcomer can follow. */
  summary: string;
  paper: Paper;
  /** Approximate parameter count of the variant we plan to run, as published. */
  params?: string;
  providers: ProviderId[];
  status: ModelStatus;
  /** Implementation phase in docs/PLAN.md that brings this model online. */
  phase: number;
  /** Licence of the exact weights. Filled in when a model goes live, after checking the repo. */
  license?: string;
  /** True when the model is impractical without WebGPU (no CPU fallback offered). */
  requiresWebGPU?: boolean;
  /** Known limitation or caveat shown next to the model. */
  note?: string;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  question: string;
}

export interface RoadmapLevel {
  level: number;
  title: string;
  goal: string;
  topics: string[];
}
