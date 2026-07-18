import { describe, expect, it } from "vitest";
import { flowers } from "../data/flowers";
import { aggregatePreferences, lessPreferredTraits } from "./preferences";

describe("aggregatePreferences", () => {
  it("returns an empty profile when no flowers have been chosen", () => {
    expect(aggregatePreferences(flowers, [])).toEqual({ colors: [], tags: [], shapes: [], styles: [] });
  });

  it("uses favorite choices as a stronger taste signal", () => {
    const profile = aggregatePreferences(flowers, [
      { flowerId: "pink-ranunculus", decision: "liked" },
      { flowerId: "blush-peony", decision: "liked" },
      { flowerId: "sunflower", decision: "favorite" },
    ]);

    expect(profile.colors[0]).toBe("Golden yellow");
    expect(profile.styles[0]).toBe("Cheerful");
    expect(profile.tags[0]).toBe("Bold");
  });

  it("breaks equal scores alphabetically so results stay deterministic", () => {
    const profile = aggregatePreferences(flowers, [
      { flowerId: "pink-ranunculus", decision: "liked" },
    ]);

    expect(profile.colors).toEqual(["Blush pink", "Cream"]);
    expect(profile.styles).toEqual(["Garden-inspired", "Romantic"]);
  });
});

describe("lessPreferredTraits", () => {
  it("does not infer dislikes from fewer than three skips", () => {
    expect(lessPreferredTraits(flowers, [
      { flowerId: "sunflower", decision: "skipped" },
      { flowerId: "coral-gerbera", decision: "skipped" },
    ])).toEqual([]);
  });

  it("summarizes repeated traits after three skips", () => {
    const traits = lessPreferredTraits(flowers, [
      { flowerId: "sunflower", decision: "skipped" },
      { flowerId: "coral-gerbera", decision: "skipped" },
      { flowerId: "cream-tulip", decision: "skipped" },
    ]);

    expect(traits).toContain("Cheerful");
  });
});
