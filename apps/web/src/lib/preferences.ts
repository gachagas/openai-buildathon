import type { Flower, FlowerSelection, PreferenceProfile } from "../types";

type Counter = Map<string, number>;

function add(counter: Counter, values: string[], weight: number) {
  values.forEach((value) => counter.set(value, (counter.get(value) ?? 0) + weight));
}

function ranked(counter: Counter, limit: number) {
  return [...counter.entries()]
    .sort(([a, aScore], [b, bScore]) => bScore - aScore || a.localeCompare(b))
    .slice(0, limit)
    .map(([value]) => value);
}

export function aggregatePreferences(
  flowers: Flower[],
  selections: FlowerSelection[],
): PreferenceProfile {
  const byId = new Map(flowers.map((flower) => [flower.id, flower]));
  const counters = {
    colors: new Map<string, number>(),
    tags: new Map<string, number>(),
    shapes: new Map<string, number>(),
    styles: new Map<string, number>(),
  };

  selections.forEach((selection) => {
    if (selection.decision === "skipped") return;
    const flower = byId.get(selection.flowerId);
    if (!flower) return;
    const weight = selection.decision === "favorite" ? 3 : 1;
    add(counters.colors, flower.colors, weight);
    add(counters.tags, flower.tags, weight);
    add(counters.shapes, flower.shapes, weight);
    add(counters.styles, flower.styles, weight);
  });

  return {
    colors: ranked(counters.colors, 3),
    tags: ranked(counters.tags, 3),
    shapes: ranked(counters.shapes, 2),
    styles: ranked(counters.styles, 2),
  };
}

export function lessPreferredTraits(flowers: Flower[], selections: FlowerSelection[]) {
  const byId = new Map(flowers.map((flower) => [flower.id, flower]));
  const skipped = selections.filter((selection) => selection.decision === "skipped");
  if (skipped.length < 3) return [];

  const counter = new Map<string, number>();
  skipped.forEach(({ flowerId }) => {
    const flower = byId.get(flowerId);
    if (flower) add(counter, [...flower.tags, ...flower.styles], 1);
  });
  return ranked(counter, 2);
}

export function preferenceSentence(profile: PreferenceProfile) {
  const tags = profile.tags.map((tag) => tag.toLowerCase());
  const colors = profile.colors.join(", ");
  const styles = profile.styles.map((style) => style.toLowerCase()).join(" and ");
  if (!colors && !tags.length) return "Your gift taste will take shape as you pick what you like.";
  const lead = tags.length ? `${tags.join(", ")} gifts` : "gifts";
  const colorPart = colors ? ` in ${colors}` : "";
  const stylePart = styles ? `, with a ${styles} feel` : "";
  return `You seem drawn to ${lead}${colorPart}${stylePart}.`;
}
