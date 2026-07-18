import type { Flower, FlowerSelection, MeaningCategory } from "../types";

export const meaningMessages: Record<MeaningCategory, string> = {
  affection: "A gentle affection that grows quietly and sincerely.",
  gratitude: "A small expression of gratitude, warmth, and appreciation.",
  joy: "A bright wish for happiness and cheerful days ahead.",
  admiration: "A message of admiration for someone deeply appreciated.",
  elegance: "Quiet beauty expressed with grace and restraint.",
  hope: "A hopeful message for new beginnings and brighter days.",
  remembrance: "A thoughtful message of remembrance and lasting care.",
  sincerity: "A sincere feeling expressed simply and honestly.",
};

export function hanakotobaMessage(flowers: Flower[], selections: FlowerSelection[]) {
  const byId = new Map(flowers.map((flower) => [flower.id, flower]));
  const scores = new Map<MeaningCategory, number>();
  const contributors = new Map<MeaningCategory, string[]>();

  selections.forEach((selection) => {
    if (selection.decision === "skipped") return;
    const flower = byId.get(selection.flowerId);
    if (!flower?.meaning) return;
    const category = flower.meaning.category;
    scores.set(category, (scores.get(category) ?? 0) + (selection.decision === "favorite" ? 3 : 1));
    contributors.set(category, [...(contributors.get(category) ?? []), flower.name]);
  });

  const category = [...scores.entries()].sort(
    ([a, aScore], [b, bScore]) => bScore - aScore || a.localeCompare(b),
  )[0]?.[0] ?? "sincerity";

  return {
    category,
    message: meaningMessages[category],
    flowerNames: [...new Set(contributors.get(category) ?? [])].slice(0, 3),
  };
}
