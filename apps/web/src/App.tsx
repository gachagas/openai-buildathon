import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import "./App.css";
import { flowers, flowerById } from "./data/products";
import type { AppStep, CustomerContext, Flower, FlowerDecision, FlowerSelection, Recommendation } from "./types";
import { aggregatePreferences, lessPreferredTraits } from "./lib/preferences";
import { matchingArrangement, recommendFlowers } from "./lib/recommendations";
import { formatPrice, listPhrase } from "./lib/formatting";
import { ArrowRightIcon, BookmarkIcon, CloseIcon, HeartIcon, UndoIcon } from "./components/Icons";
import { FlowerCard } from "./components/FlowerCard";
import { FlowerDetails } from "./components/FlowerDetails";
import { FlowerImage } from "./components/FlowerImage";
import { PreferenceSummary } from "./components/PreferenceSummary";
import { HanakotobaMessage } from "./components/HanakotobaMessage";
import { RecommendationCard } from "./components/RecommendationCard";
import { FloristHandoff } from "./components/FloristHandoff";
import { shouldIgnoreShortcut } from "./lib/keyboard";

const discoveryOrder = flowers.map((flower) => flower.id);

const contextOptions = {
  recipient: ["For myself", "Partner", "Friend", "Family", "Colleague", "Someone else", "Not sure yet"],
  occasion: ["Birthday", "Anniversary", "Thank you", "Congratulations", "Apology", "Sympathy", "Home decoration", "No specific occasion"],
  budget: ["Under ₱500", "₱500–₱1,000", "₱1,000–₱1,500", "₱1,500–₱2,500", "₱2,500+", "Not sure yet"],
  purchaseFormat: ["Individual flowers", "Small bunch", "Bouquet", "Arrangement", "Let the florist decide"],
};

function ChoiceGroup({ label, field, options, context, onChange }: {
  label: string;
  field: keyof CustomerContext;
  options: string[];
  context: CustomerContext;
  onChange: (field: keyof CustomerContext, value: string) => void;
}) {
  return <fieldset className="choice-group"><legend>{label}</legend><div>{options.map((option) => <button
    className={context[field] === option ? "choice-chip choice-chip--selected" : "choice-chip"}
    type="button" key={option} aria-pressed={context[field] === option}
    onClick={() => onChange(field, option)}>{option}</button>)}</div></fieldset>;
}

function Shell({ step, savedCount, onHome, onFavorites, onRestart, children }: {
  step: AppStep;
  savedCount: number;
  onHome: () => void;
  onFavorites: () => void;
  onRestart: () => void;
  children: ReactNode;
}) {
  const stepLabels: Partial<Record<AppStep, string>> = {
    context: "Step 1 · A little context", discover: "Step 2 · Discover", results: "Step 3 · Your style", handoff: "Step 4 · Florist card", favorites: "Saved flowers",
  };
  return <div className="app-shell">
    {step !== "welcome" && <header className="site-header"><div className="site-header__inner">
      <button className="brand" type="button" onClick={onHome}><span className="brand__mark">蕾</span><span><strong>Tsubomi</strong><small>FLOWER FINDER</small></span></button>
      <span className="site-header__step">{stepLabels[step]}</span>
      <button className="saved-button" type="button" onClick={onFavorites}><BookmarkIcon size={15} filled={savedCount > 0}/><span>Saved</span><strong>{savedCount}</strong></button>
      <button className="restart-button" type="button" onClick={onRestart}>Restart</button>
    </div></header>}
    {children}
    <footer className="site-footer"><span>Sample inventory and prices for demonstration.</span><span>Florist guidance always comes first.</span></footer>
  </div>;
}

function App() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [previousStep, setPreviousStep] = useState<AppStep>("discover");
  const [context, setContext] = useState<CustomerContext>({});
  const [selections, setSelections] = useState<FlowerSelection[]>([]);
  const [cursor, setCursor] = useState(0);
  const [detailFlower, setDetailFlower] = useState<Flower | null>(null);
  const [toast, setToast] = useState("");

  const activeFlower = flowerById.get(discoveryOrder[cursor]);
  const deck = discoveryOrder.slice(cursor, cursor + 3).map((id) => flowerById.get(id)).filter((flower): flower is Flower => Boolean(flower));
  const likedSelections = selections.filter((selection) => selection.decision !== "skipped");
  const likedFlowers = likedSelections.map((selection) => flowerById.get(selection.flowerId)).filter((flower): flower is Flower => Boolean(flower));
  const favoriteFlowers = selections.filter((selection) => selection.decision === "favorite").map((selection) => flowerById.get(selection.flowerId)).filter((flower): flower is Flower => Boolean(flower));
  const profile = useMemo(() => aggregatePreferences(flowers, selections), [selections]);
  const lessPreferred = useMemo(() => lessPreferredTraits(flowers, selections), [selections]);
  const recommendedFlowers = useMemo(() => recommendFlowers(flowers, selections, profile, context, 4), [selections, profile, context]);

  const recommendations: Recommendation[] = useMemo(() => {
    const arrangement = matchingArrangement(profile);
    const primaryStyle = profile.styles[0]?.toLowerCase() ?? "soft";
    const primaryColor = profile.colors[0]?.toLowerCase() ?? "considered";
    const arrangementRecommendation: Recommendation = {
      id: "arrangement", kind: "Arrangement", name: arrangement.name, priceLabel: `From ${formatPrice(arrangement.price)}`,
      why: `A strong match for your ${primaryColor} palette and ${primaryStyle} arrangement style. Your florist can adapt it to today’s best stems.`,
      occasions: context.occasion ? [context.occasion, "Thank you", "Birthday"] : ["Anniversary", "Birthday", "Thank you"],
      availability: "preorder",
    };
    return [
      arrangementRecommendation,
      ...recommendedFlowers.slice(0, 4).map((flower) => ({
        id: flower.id, kind: "Single flower" as const, name: flower.name, japaneseName: flower.japaneseName,
        priceLabel: `${formatPrice(flower.pricing.amount)} ${flower.pricing.displayLabel}`,
        why: `Fits your interest in ${listPhrase(flower.colors.slice(0, 2)).toLowerCase()} and ${listPhrase(flower.styles).toLowerCase()} styling.`,
        occasions: flower.occasions, availability: flower.availability, flower,
      })),
    ].slice(0, 5);
  }, [profile, recommendedFlowers, context.occasion]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const decide = useCallback((decision: FlowerDecision) => {
    const flowerId = discoveryOrder[cursor];
    if (!flowerId) return;
    setSelections((current) => [...current.filter((item) => item.flowerId !== flowerId), { flowerId, decision }]);
    setCursor((current) => current + 1);
    if (decision === "favorite") showToast("Saved as a favorite");
  }, [cursor, showToast]);

  const undo = useCallback(() => {
    if (!selections.length || cursor === 0) return;
    const last = selections.at(-1);
    setSelections((current) => current.slice(0, -1));
    setCursor((current) => Math.max(0, current - 1));
    if (last) showToast(`Restored ${flowerById.get(last.flowerId)?.name ?? "last flower"}`);
  }, [cursor, selections, showToast]);

  const addFromResults = (flower: Flower, decision: "liked" | "favorite") => {
    setSelections((current) => [...current.filter((item) => item.flowerId !== flower.id), { flowerId: flower.id, decision }]);
    setDetailFlower(null);
    showToast(decision === "favorite" ? "Saved as a favorite" : "Added to your preferences");
  };

  const decideFromDetails = (decision: FlowerDecision) => {
    if (!detailFlower) return;
    if (step === "discover" && activeFlower?.id === detailFlower.id) {
      setDetailFlower(null);
      decide(decision);
      return;
    }
    if (decision !== "skipped") addFromResults(detailFlower, decision);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (step !== "discover" || detailFlower || !activeFlower || shouldIgnoreShortcut(event.target)) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); decide("skipped"); }
      else if (event.key === "ArrowRight") { event.preventDefault(); decide("liked"); }
      else if (event.key.toLowerCase() === "f") { event.preventDefault(); decide("favorite"); }
      else if (event.key.toLowerCase() === "u" || event.key === "Backspace") { event.preventDefault(); undo(); }
      else if (event.key === "Enter") { event.preventDefault(); setDetailFlower(activeFlower); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeFlower, decide, detailFlower, step, undo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  const restart = () => {
    setStep("welcome"); setContext({}); setSelections([]); setCursor(0); setDetailFlower(null);
  };
  const openFavorites = () => { setPreviousStep(step); setStep("favorites"); };
  const goHome = () => setStep(selections.length ? "discover" : "welcome");

  return <Shell step={step} savedCount={favoriteFlowers.length} onHome={goHome} onFavorites={openFavorites} onRestart={restart}>
    {step === "welcome" && <main className="welcome-page">
      <div className="welcome-copy">
        <div className="eyebrow">蕾 Tsubomi · Flower Finder</div>
        <h1>Find the flowers that feel like you.</h1>
        <p>Not sure what to ask for? React to the flowers you’re naturally drawn to. We turn those choices into useful language and a starting point for your florist.</p>
        <div className="welcome-actions"><button className="primary-button primary-button--large" type="button" onClick={() => setStep("context")}>Discover flowers <ArrowRightIcon size={18}/></button><button className="secondary-button secondary-button--large" type="button" onClick={() => setStep("discover")}>Skip setup</button></div>
        <ol className="welcome-steps"><li><strong>01</strong><span>Tell us a little<small>Optional context and budget.</small></span></li><li><strong>02</strong><span>Like what you love<small>Visible controls and keyboard shortcuts.</small></span></li><li><strong>03</strong><span>Show your florist<small>A concise, practical handoff.</small></span></li></ol>
      </div>
      <figure className="welcome-atlas"><img src="/flowers/atlas-ranunculus-tulip-hydrangea-sunflower.png" width="960" height="960" alt="Ranunculus, tulip, hydrangea, and sunflower studies"/><figcaption>Sample flower inventory · locally illustrated</figcaption></figure>
    </main>}

    {step === "context" && <main className="context-page">
      <div className="eyebrow">Step 1 · A little context</div><h1>A few quick questions</h1><p className="section-lede">All optional—the flowers you choose tell us most of it. Tap whatever fits.</p>
      <section className="context-card">
        <ChoiceGroup label="Who are the flowers for?" field="recipient" options={contextOptions.recipient} context={context} onChange={(field, value) => setContext((current) => ({ ...current, [field]: current[field] === value ? undefined : value }))}/>
        <ChoiceGroup label="What’s the occasion?" field="occasion" options={contextOptions.occasion} context={context} onChange={(field, value) => setContext((current) => ({ ...current, [field]: current[field] === value ? undefined : value }))}/>
        <ChoiceGroup label="Rough budget?" field="budget" options={contextOptions.budget} context={context} onChange={(field, value) => setContext((current) => ({ ...current, [field]: current[field] === value ? undefined : value }))}/>
        <ChoiceGroup label="What format are you considering?" field="purchaseFormat" options={contextOptions.purchaseFormat} context={context} onChange={(field, value) => setContext((current) => ({ ...current, [field]: current[field] === value ? undefined : value }))}/>
      </section>
      <div className="page-actions"><button className="primary-button primary-button--large" type="button" onClick={() => setStep("discover")}>Start discovering <ArrowRightIcon size={17}/></button><button className="text-button" type="button" onClick={() => setStep("discover")}>Skip this step</button></div>
    </main>}

    {step === "discover" && <main className="discover-page">
      <section className="deck-column" aria-label="Flower discovery">
        <div className="deck-meta"><span><strong>{likedSelections.length} liked</strong> · {cursor} of {discoveryOrder.length} seen</span><span className="keyboard-hint">← skip · → like · F favorite · U undo</span></div>
        {activeFlower ? <>
          <div className="flower-deck">{[...deck].reverse().map((flower, reverseIndex) => {
            const layer = deck.length - 1 - reverseIndex;
            return <FlowerCard key={flower.id} flower={flower} isActive={layer === 0} layer={layer} onDecision={(decision) => decide(decision)} onDetails={() => setDetailFlower(flower)}/>;
          })}</div>
          <div className="deck-actions">
            <button className="round-action round-action--skip" type="button" aria-label="Skip flower" onClick={() => decide("skipped")}><CloseIcon size={25}/><span>Skip</span></button>
            <button className="round-action round-action--undo" type="button" aria-label="Undo last choice" disabled={!selections.length} onClick={undo}><UndoIcon size={20}/><span>Undo</span></button>
            <button className="round-action round-action--favorite" type="button" aria-label="Favorite flower" onClick={() => decide("favorite")}><BookmarkIcon size={20}/><span>Favorite</span></button>
            <button className="round-action round-action--like" type="button" aria-label="Like flower" onClick={() => decide("liked")}><HeartIcon size={26}/><span>Like</span></button>
          </div>
        </> : <div className="deck-complete"><span>✿</span><h2>That’s the whole shelf</h2><p>You’ve seen every sample flower. Your style is ready whenever you are.</p><button className="primary-button" disabled={likedSelections.length < 4} type="button" onClick={() => setStep("results")}>See my flower style</button></div>}
      </section>
      <aside className="discover-sidebar">
        <section className="progress-card"><div><span className="card-label">Your selection</span><strong>{likedSelections.length}</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, (likedSelections.length / 4) * 100)}%` }}/></div><p>{likedSelections.length >= 4 ? "Enough to build your style—keep going if you like." : `${4 - likedSelections.length} more to unlock your flower style.`}</p><div className="liked-thumbnails">{likedFlowers.slice(-8).map((flower) => <FlowerImage flower={flower} key={flower.id}/>)}</div></section>
        <section className="emerging-card"><span className="card-label">What we’re noticing</span>{profile.tags.length ? <div className="tag-list">{[...new Set([...profile.tags, ...profile.colors])].slice(0, 5).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div> : <p>Choose a few flowers and your taste starts to take shape here.</p>}</section>
        <button className="style-button" type="button" disabled={likedSelections.length < 4} onClick={() => setStep("results")}><span>{likedSelections.length >= 4 ? "See my flower style" : `Like ${4 - likedSelections.length} more to continue`}</span><ArrowRightIcon size={18}/></button>
      </aside>
    </main>}

    {step === "favorites" && <main className="favorites-page"><button className="text-button" type="button" onClick={() => setStep(previousStep)}>← Back</button><h1>Saved flowers</h1><p className="section-lede">Favorites carry extra weight in your flower style.</p>{favoriteFlowers.length ? <div className="favorites-grid">{favoriteFlowers.map((flower) => <button type="button" key={flower.id} onClick={() => setDetailFlower(flower)}><FlowerImage flower={flower}/><span><strong>{flower.name}</strong><small>{flower.meaning?.label ?? flower.tags[0]}</small></span></button>)}</div> : <div className="empty-state"><BookmarkIcon size={28}/><h2>No saved flowers yet</h2><p>Choose Favorite on any discovery card to keep it here.</p></div>}</main>}

    {step === "results" && <main className="results-page">
      <PreferenceSummary profile={profile} selectedFlowers={likedFlowers} selections={selections} lessPreferred={lessPreferred}/>
      <HanakotobaMessage selections={selections}/>
      <section className="recommendations-section" aria-labelledby="recommendations-title"><div className="recommendations-heading"><span>✿</span><div><h2 id="recommendations-title">Recommended for you</h2><p>A few starting points that fit the taste above</p></div></div><div className="recommendations-grid">{recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} onAction={() => recommendation.flower ? setDetailFlower(recommendation.flower) : setStep("handoff")}/>)}</div></section>
      <div className="results-actions"><button className="primary-button primary-button--large" type="button" onClick={() => setStep("handoff")}>Prepare florist card <ArrowRightIcon size={17}/></button><button className="secondary-button secondary-button--large" type="button" onClick={() => setStep("discover")}>Keep discovering</button></div>
    </main>}

    {step === "handoff" && <FloristHandoff
      context={context}
      profile={profile}
      favorites={favoriteFlowers.length ? favoriteFlowers : likedFlowers.slice(0, 3)}
      lessPreferred={lessPreferred}
      recommendations={recommendations}
      onBack={() => setStep("results")}
      onRestart={restart}
    />}

    {detailFlower && <FlowerDetails
      flower={detailFlower}
      onClose={() => setDetailFlower(null)}
      onLike={() => decideFromDetails("liked")}
      onSkip={activeFlower?.id === detailFlower.id && step === "discover" ? () => decideFromDetails("skipped") : undefined}
      onFavorite={() => decideFromDetails("favorite")}
    />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </Shell>;
}

export default App;
