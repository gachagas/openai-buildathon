import type { Flower, FlowerSelection, PreferenceProfile } from "../types";
import { preferenceSentence } from "../lib/preferences";
import { listPhrase } from "../lib/formatting";
import { CheckIcon } from "./Icons";
import { FlowerImage } from "./FlowerImage";

type Props = {
  profile: PreferenceProfile;
  selectedFlowers: Flower[];
  selections: FlowerSelection[];
  lessPreferred: string[];
};

export function PreferenceSummary({ profile, selectedFlowers, selections, lessPreferred }: Props) {
  const favorites = new Set(selections.filter((selection) => selection.decision === "favorite").map((selection) => selection.flowerId));
  const summaryTags = [...new Set([...profile.colors, ...profile.styles, ...profile.tags])].slice(0, 7);
  return (
    <section className="results-section" aria-labelledby="style-title">
      <div className="eyebrow">Your flower style · あなたの好み</div>
      <h1 id="style-title">You seem drawn to…</h1>
      <p className="section-lede">An interpretation from the flowers you chose—not a verdict. Keep discovering and it shifts with you.</p>
      <div className="summary-layout">
        <article className="summary-card summary-card--reading">
          <span className="card-label">Reading</span>
          <ul className="preference-points">
            <li><CheckIcon size={14}/><span><strong>Preferred colors</strong>{listPhrase(profile.colors)}</span></li>
            <li><CheckIcon size={14}/><span><strong>Preferred shapes</strong>{listPhrase(profile.shapes)}</span></li>
            <li><CheckIcon size={14}/><span><strong>Preferred styles</strong>{listPhrase(profile.styles)}</span></li>
            <li><CheckIcon size={14}/><span><strong>Recurring details</strong>{listPhrase(profile.tags)}</span></li>
          </ul>
          <hr />
          <span className="card-label">In a sentence</span>
          <p className="summary-sentence">{preferenceSentence(profile)}</p>
          <div className="tag-list">{summaryTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          {lessPreferred.length > 0 && <p className="less-preferred"><strong>You may prefer less of:</strong> {listPhrase(lessPreferred)}</p>}
        </article>
        <aside className="selection-card">
          <span className="card-label">The flowers behind this</span>
          <div className="selection-grid">
            {selectedFlowers.slice(0, 8).map((flower) => <figure key={flower.id}>
              <FlowerImage flower={flower} />
              <figcaption>{favorites.has(flower.id) ? "★ " : ""}{flower.name}</figcaption>
            </figure>)}
          </div>
          <p>Favorites carry extra weight in your style summary.</p>
        </aside>
      </div>
    </section>
  );
}
