import { describe, expect, it } from "vitest";
import { CATEGORIES, MODELS, ROADMAP, getModel, groupedModels } from "./index";

describe("model registry", () => {
  it("has unique, URL-safe ids", () => {
    const ids = MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every model at least one provider and a known category", () => {
    const categories = new Set(CATEGORIES.map((c) => c.id));
    for (const m of MODELS) {
      expect(m.providers.length, m.id).toBeGreaterThan(0);
      expect(new Set(m.providers).size, m.id).toBe(m.providers.length);
      expect(categories.has(m.category), m.id).toBe(true);
    }
  });

  it("links every model to an arXiv paper", () => {
    for (const m of MODELS) {
      expect(m.paper.url, m.id).toMatch(/^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}$/);
      expect(m.paper.year, m.id).toBeGreaterThanOrEqual(2012);
    }
  });

  it("requires a verified licence before a model is marked live", () => {
    for (const m of MODELS.filter((m) => m.status === "live")) {
      expect(m.license, `${m.id} is live without a licence`).toBeTruthy();
    }
  });

  it("explains every model that is not hosted", () => {
    for (const m of MODELS.filter((m) => m.status === "learn-only")) {
      expect(m.note, m.id).toBeTruthy();
    }
  });

  it("covers every category and looks models up by id", () => {
    for (const group of groupedModels()) expect(group.models.length, group.category.id).toBeGreaterThan(0);
    expect(getModel("resnet-50")?.name).toBe("ResNet-50");
    expect(getModel("nope")).toBeUndefined();
  });
});

describe("roadmap", () => {
  it("numbers levels 1..n in order", () => {
    expect(ROADMAP.map((l) => l.level)).toEqual(ROADMAP.map((_, i) => i + 1));
  });
});
