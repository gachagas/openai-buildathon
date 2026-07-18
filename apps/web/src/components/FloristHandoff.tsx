import { useState } from "react";
import type { CustomerContext, Flower, PreferenceProfile, Recommendation } from "../types";
import { listPhrase } from "../lib/formatting";
import { CopyIcon, PrintIcon } from "./Icons";

type Props = {
  context: CustomerContext;
  profile: PreferenceProfile;
  favorites: Flower[];
  lessPreferred: string[];
  recommendations: Recommendation[];
  onBack: () => void;
  onRestart: () => void;
};

export function FloristHandoff({ context, profile, favorites, lessPreferred, recommendations, onBack, onRestart }: Props) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const rows = [
    ["For", context.recipient ?? "Open to suggestions"],
    ["Occasion", context.occasion ?? "No specific occasion"],
    ["Budget", context.budget ?? "Open to suggestions"],
    ["Format", context.purchaseFormat ?? "Let the florist decide"],
    ["Preferred colors", listPhrase(profile.colors)],
    ["Preferred shapes", listPhrase(profile.shapes)],
    ["Preferred style", listPhrase(profile.styles)],
    ["Favorite flowers", listPhrase(favorites.map((flower) => flower.name))],
    ["Best avoided", listPhrase(lessPreferred)],
    ["Recommendations", listPhrase(recommendations.slice(0, 3).map((item) => item.name))],
  ];
  const summary = [...rows.map(([label, value]) => `${label}: ${value}`), note ? `Note: ${note}` : ""].filter(Boolean).join("\n");
  const copy = async () => {
    await navigator.clipboard?.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="handoff-page">
      <div className="eyebrow">Step 4 · For your florist</div>
      <h1>Show this at the counter</h1>
      <p className="section-lede">A practical starting point your florist can refine using today’s inventory and their professional advice.</p>
      <article className="handoff-ticket">
        <header><div><strong>My flower preferences</strong><span>蕾 TSUBOMI · FLOWER FINDER</span></div><code>LOCAL SAMPLE</code></header>
        <div className="handoff-ticket__rows">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</div>
        <label className="note-field">Optional note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Anything your florist should know?" /></label>
        <div className="handoff-ticket__actions">
          <button className="primary-button" type="button" onClick={copy}><CopyIcon size={17}/>{copied ? "Copied" : "Copy summary"}</button>
          <button className="secondary-button" type="button" onClick={() => window.print()}><PrintIcon size={17}/> Print</button>
        </div>
      </article>
      <div className="page-actions"><button className="text-button" type="button" onClick={onBack}>← Back to your style</button><button className="text-button" type="button" onClick={onRestart}>Start again</button></div>
    </main>
  );
}
