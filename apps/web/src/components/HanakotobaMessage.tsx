import type { FlowerSelection } from "../types";
import { flowers } from "../data/flowers";
import { hanakotobaMessage } from "../lib/hanakotoba";
import { listPhrase } from "../lib/formatting";

export function HanakotobaMessage({ selections }: { selections: FlowerSelection[] }) {
  const result = hanakotobaMessage(flowers, selections);
  if (!result.flowerNames.length) return null;
  return (
    <aside className="hanakotoba-card" aria-labelledby="hanakotoba-title">
      <span className="card-label">花言葉 · Hanakotoba</span>
      <h2 id="hanakotoba-title">A small message from your flowers</h2>
      <blockquote>“{result.message}”</blockquote>
      <p>Inspired by meanings commonly associated with {listPhrase(result.flowerNames)}.</p>
      <small>Symbolic flower meanings can vary by color, culture, and source.</small>
    </aside>
  );
}
