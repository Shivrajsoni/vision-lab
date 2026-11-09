import { CATEGORIES, MODELS } from "./models";
import type { Category, ModelSpec } from "./types";

export * from "./types";
export { CATEGORIES, MODELS } from "./models";
export { ROADMAP } from "./roadmap";

export function getModel(id: string): ModelSpec | undefined {
  return MODELS.find((m) => m.id === id);
}

export function modelsByCategory(category: Category): ModelSpec[] {
  return MODELS.filter((m) => m.category === category);
}

export function groupedModels(): { category: (typeof CATEGORIES)[number]; models: ModelSpec[] }[] {
  return CATEGORIES.map((category) => ({ category, models: modelsByCategory(category.id) }));
}
