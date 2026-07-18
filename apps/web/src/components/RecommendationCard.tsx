import type { Recommendation } from "../types";
import { availabilityLabel } from "../lib/formatting";
import { FlowerImage } from "./FlowerImage";

type Props = { recommendation: Recommendation; onAction: () => void };

export function RecommendationCard({ recommendation, onAction }: Props) {
  return (
    <article className="recommendation-card">
      {recommendation.flower ? <FlowerImage flower={recommendation.flower} /> : <div className="arrangement-art" aria-hidden="true"><span>✿</span><span>✿</span><span>✿</span></div>}
      <div className="recommendation-card__body">
        <span className="recommendation-kind">{recommendation.kind}</span>
        <div className="recommendation-card__heading"><div><h3>{recommendation.name}</h3>{recommendation.japaneseName && <p lang="ja">{recommendation.japaneseName}</p>}</div><strong>{recommendation.priceLabel}</strong></div>
        <p>{recommendation.why}</p>
        <dl><dt>Good for</dt><dd>{recommendation.occasions.slice(0, 3).join(", ")}</dd><dt>Availability</dt><dd>{availabilityLabel[recommendation.availability]}</dd></dl>
        <button className="outline-button" type="button" onClick={onAction}>{recommendation.flower ? "View flower" : "Ask the florist"}</button>
      </div>
    </article>
  );
}
