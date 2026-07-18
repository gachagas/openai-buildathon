import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import "./App.css";
import { flowers, flowerById } from "./data/products";
import type { AppStep, CustomerContext, Flower, FlowerDecision, FlowerSelection } from "./types";
import { aggregatePreferences, lessPreferredTraits } from "./lib/preferences";
import { BUDGETS, GIFT_TYPES, OCCASIONS, similarTo, topMatches } from "./lib/match";
import { formatPrice } from "./lib/formatting";
import { ArrowRightIcon, CartIcon, CloseIcon, HeartIcon, PlusIcon, TrashIcon, UndoIcon } from "./components/Icons";
import { FlowerCard } from "./components/FlowerCard";
import { FlowerDetails } from "./components/FlowerDetails";
import { FlowerImage } from "./components/FlowerImage";
import { PreferenceSummary } from "./components/PreferenceSummary";
import { ProductTile } from "./components/ProductTile";
import { shouldIgnoreShortcut } from "./lib/keyboard";

const filterOptions = {
  occasion: [...OCCASIONS, "Just browsing"],
  giftType: [...Object.keys(GIFT_TYPES), "Surprise me"],
  budget: [...Object.keys(BUDGETS), "Any budget"],
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

function Shell({ step, cartCount, onHome, onCart, onRestart, children }: {
  step: AppStep;
  cartCount: number;
  onHome: () => void;
  onCart: () => void;
  onRestart: () => void;
  children: ReactNode;
}) {
  const stepLabels: Partial<Record<AppStep, string>> = {
    filters: "Step 1 · What are we looking for?", discover: "Step 2 · Pick what you like", results: "Step 3 · Your gifts", cart: "Your cart",
  };
  return <div className="app-shell">
    {step !== "welcome" && <header className="site-header"><div className="site-header__inner">
      <button className="brand" type="button" onClick={onHome}><span className="brand__mark">✦</span><span><strong>Giftly</strong><small>GIFT FINDER</small></span></button>
      <span className="site-header__step">{stepLabels[step]}</span>
      <button className="saved-button" type="button" onClick={onCart}><CartIcon size={16}/><span>Cart</span><strong>{cartCount}</strong></button>
      <button className="restart-button" type="button" onClick={onRestart}>Restart</button>
    </div></header>}
    {children}
    <footer className="site-footer"><span>Live FlowerStore catalogue · prices in PHP.</span><span>A gift-discovery demo.</span></footer>
  </div>;
}

function App() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [previousStep, setPreviousStep] = useState<AppStep>("results");
  const [filters, setFilters] = useState<CustomerContext>({});
  const [selections, setSelections] = useState<FlowerSelection[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [deckIds, setDeckIds] = useState<string[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [detailFlower, setDetailFlower] = useState<Flower | null>(null);
  const [toast, setToast] = useState("");

  const activeFlower = flowerById.get(deckIds[cursor]);
  const deck = deckIds.slice(cursor, cursor + 3).map((id) => flowerById.get(id)).filter((flower): flower is Flower => Boolean(flower));
  const likedSelections = selections.filter((selection) => selection.decision !== "skipped");
  const likedFlowers = likedSelections.map((selection) => flowerById.get(selection.flowerId)).filter((flower): flower is Flower => Boolean(flower));
  const profile = useMemo(() => aggregatePreferences(flowers, selections), [selections]);
  const lessPreferred = useMemo(() => lessPreferredTraits(flowers, selections), [selections]);

  const similar = useMemo(() => {
    const likedIds = selections.filter((selection) => selection.decision !== "skipped").map((selection) => selection.flowerId);
    const exclude = new Set([...seenIds, ...cart]);
    return similarTo(likedIds.length ? likedIds : cart, exclude, 6);
  }, [selections, cart, seenIds]);

  const cartFlowers = cart.map((id) => flowerById.get(id)).filter((flower): flower is Flower => Boolean(flower));
  const cartTotal = cartFlowers.reduce((sum, flower) => sum + flower.pricing.amount, 0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const addToCart = useCallback((id: string) => {
    setCart((current) => [...current, id]);
    showToast("Added to cart");
  }, [showToast]);

  const removeFromCart = (id: string) => {
    setCart((current) => { const index = current.indexOf(id); if (index === -1) return current; const next = [...current]; next.splice(index, 1); return next; });
  };

  const startRound = useCallback(() => {
    setSeenIds((seen) => {
      const next = topMatches(filters, seen).map((flower) => flower.id);
      setDeckIds(next);
      setCursor(0);
      setStep(next.length ? "discover" : "results");
      return new Set([...seen, ...next]);
    });
  }, [filters]);

  const decide = useCallback((decision: FlowerDecision) => {
    const flowerId = deckIds[cursor];
    if (!flowerId) return;
    setSelections((current) => [...current.filter((item) => item.flowerId !== flowerId), { flowerId, decision }]);
    const next = cursor + 1;
    setCursor(next);
    if (next >= deckIds.length) setStep("results");
  }, [cursor, deckIds]);

  const cartFromDeck = useCallback(() => {
    const id = deckIds[cursor];
    if (!id) return;
    addToCart(id);
    decide("liked");
  }, [cursor, deckIds, addToCart, decide]);

  const undo = useCallback(() => {
    if (!selections.length || cursor === 0) return;
    setSelections((current) => current.slice(0, -1));
    setCursor((current) => Math.max(0, current - 1));
  }, [cursor, selections.length]);

  const decideFromDetails = (decision: FlowerDecision) => {
    if (!detailFlower) return;
    if (step === "discover" && activeFlower?.id === detailFlower.id) {
      setDetailFlower(null);
      decide(decision);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (step !== "discover" || detailFlower || !activeFlower || shouldIgnoreShortcut(event.target)) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); decide("skipped"); }
      else if (event.key === "ArrowRight") { event.preventDefault(); decide("liked"); }
      else if (event.key.toLowerCase() === "c") { event.preventDefault(); cartFromDeck(); }
      else if (event.key.toLowerCase() === "u" || event.key === "Backspace") { event.preventDefault(); undo(); }
      else if (event.key === "Enter") { event.preventDefault(); setDetailFlower(activeFlower); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeFlower, decide, cartFromDeck, detailFlower, step, undo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  const restart = () => {
    setStep("welcome"); setFilters({}); setSelections([]); setCart([]); setDeckIds([]); setSeenIds(new Set()); setCursor(0); setDetailFlower(null);
  };
  const openCart = () => { setPreviousStep(step === "cart" ? previousStep : step); setStep("cart"); };
  const goHome = () => setStep(deckIds.length ? "discover" : "welcome");
  const changeFilter = (field: keyof CustomerContext, value: string) =>
    setFilters((current) => ({ ...current, [field]: current[field] === value ? undefined : value }));

  return <Shell step={step} cartCount={cart.length} onHome={goHome} onCart={openCart} onRestart={restart}>
    {step === "welcome" && <main className="welcome-page">
      <div className="welcome-copy">
        <div className="eyebrow">✦ Giftly · Gift Finder</div>
        <h1>Find the perfect gift in under a minute.</h1>
        <p>Not sure what to get? Tell us the occasion, then just react to what you like. We learn your taste and line up gifts they’ll love — flowers, treats, keepsakes and more.</p>
        <div className="welcome-actions"><button className="primary-button primary-button--large" type="button" onClick={() => setStep("filters")}>Find a gift <ArrowRightIcon size={18}/></button><button className="secondary-button secondary-button--large" type="button" onClick={() => { setFilters({}); startRound(); }}>Skip, just browse</button></div>
        <ol className="welcome-steps"><li><strong>01</strong><span>Set the scene<small>Occasion, type & budget — all optional.</small></span></li><li><strong>02</strong><span>Pick what you like<small>Swipe through your top 10 matches.</small></span></li><li><strong>03</strong><span>Add to cart<small>Your picks plus similar gifts you’ll love.</small></span></li></ol>
      </div>
      <figure className="welcome-atlas"><img src="/flowers/atlas-ranunculus-tulip-hydrangea-sunflower.png" width="960" height="960" alt="A selection of gift ideas"/><figcaption>Live FlowerStore catalogue</figcaption></figure>
    </main>}

    {step === "filters" && <main className="context-page">
      <div className="eyebrow">Step 1 · What are we looking for?</div><h1>A few quick questions</h1><p className="section-lede">All optional — the gifts you like tell us most of it. Tap whatever fits.</p>
      <section className="context-card">
        <ChoiceGroup label="What’s the occasion?" field="occasion" options={filterOptions.occasion} context={filters} onChange={changeFilter}/>
        <ChoiceGroup label="What kind of gift?" field="giftType" options={filterOptions.giftType} context={filters} onChange={changeFilter}/>
        <ChoiceGroup label="Rough budget?" field="budget" options={filterOptions.budget} context={filters} onChange={changeFilter}/>
      </section>
      <div className="page-actions"><button className="primary-button primary-button--large" type="button" onClick={startRound}>Show my top 10 <ArrowRightIcon size={17}/></button><button className="text-button" type="button" onClick={() => { setFilters({}); startRound(); }}>Skip this step</button></div>
    </main>}

    {step === "discover" && <main className="discover-page">
      <section className="deck-column" aria-label="Gift discovery">
        <div className="deck-meta"><span><strong>{likedSelections.length} liked</strong> · {Math.min(cursor + 1, deckIds.length)} of {deckIds.length}</span><span className="keyboard-hint">← skip · → like · C cart · U undo</span></div>
        {activeFlower ? <>
          <div className="flower-deck">{[...deck].reverse().map((flower, reverseIndex) => {
            const layer = deck.length - 1 - reverseIndex;
            return <FlowerCard key={flower.id} flower={flower} isActive={layer === 0} layer={layer} onDecision={(decision) => decide(decision)} onDetails={() => setDetailFlower(flower)}/>;
          })}</div>
          <div className="deck-actions">
            <button className="round-action round-action--skip" type="button" aria-label="Skip" onClick={() => decide("skipped")}><CloseIcon size={25}/><span>Skip</span></button>
            <button className="round-action round-action--undo" type="button" aria-label="Undo last choice" disabled={cursor === 0} onClick={undo}><UndoIcon size={20}/><span>Undo</span></button>
            <button className="round-action round-action--cart" type="button" aria-label="Add to cart" onClick={cartFromDeck}><PlusIcon size={22}/><span>Cart</span></button>
            <button className="round-action round-action--like" type="button" aria-label="Like" onClick={() => decide("liked")}><HeartIcon size={26}/><span>Like</span></button>
          </div>
        </> : <div className="deck-complete"><span>✦</span><h2>That’s your top 10</h2><p>Here come your picks and a few similar gifts.</p><button className="primary-button" type="button" onClick={() => setStep("results")}>See my gifts</button></div>}
      </section>
      <aside className="discover-sidebar">
        <section className="progress-card"><div><span className="card-label">Liked so far</span><strong>{likedSelections.length}</strong></div><div className="progress-track"><span style={{ width: `${(Math.min(cursor, deckIds.length) / Math.max(1, deckIds.length)) * 100}%` }}/></div><p>Swipe through all 10 — or add straight to cart.</p><div className="liked-thumbnails">{likedFlowers.slice(-8).map((flower) => <FlowerImage flower={flower} key={flower.id}/>)}</div></section>
        <section className="emerging-card"><span className="card-label">What we’re noticing</span>{profile.tags.length ? <div className="tag-list">{[...new Set([...profile.tags, ...profile.colors])].slice(0, 5).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div> : <p>Like a few gifts and your taste starts to take shape here.</p>}</section>
        <button className="style-button" type="button" onClick={() => setStep("results")}><span>See my gifts</span><ArrowRightIcon size={18}/></button>
      </aside>
    </main>}

    {step === "cart" && <main className="favorites-page"><button className="text-button" type="button" onClick={() => setStep(previousStep)}>← Back</button><h1>Your cart</h1>{cartFlowers.length ? <>
      <div className="cart-list">{[...new Set(cart)].map((id) => { const flower = flowerById.get(id); if (!flower) return null; const qty = cart.filter((c) => c === id).length; return <div className="cart-row" key={id}>
        <div className="cart-row__media"><FlowerImage flower={flower}/></div>
        <div className="cart-row__info"><a href={flower.link} target="_blank" rel="noreferrer"><strong>{flower.name}</strong></a><span>{flower.tags[0]}{qty > 1 ? ` · ×${qty}` : ""}</span></div>
        <div className="cart-row__price">{formatPrice(flower.pricing.amount * qty)}</div>
        <button className="icon-button" type="button" aria-label={`Remove ${flower.name}`} onClick={() => removeFromCart(id)}><TrashIcon size={17}/></button>
      </div>; })}</div>
      <div className="cart-summary"><div className="cart-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div><button className="primary-button primary-button--large" type="button" onClick={() => showToast("Checkout — coming soon")}>Go to checkout <ArrowRightIcon size={17}/></button><button className="text-button" type="button" onClick={() => setStep(previousStep)}>Keep browsing</button></div>
    </> : <div className="empty-state"><CartIcon size={28}/><h2>Your cart is empty</h2><p>Add gifts as you swipe or from your results.</p><button className="primary-button" type="button" onClick={() => setStep(deckIds.length ? "discover" : "welcome")}>Start finding gifts</button></div>}</main>}

    {step === "results" && <main className="results-page">
      <PreferenceSummary profile={profile} selectedFlowers={likedFlowers} selections={selections} lessPreferred={lessPreferred}/>
      {likedFlowers.length > 0 && <section className="recommendations-section" aria-labelledby="picks-title"><div className="recommendations-heading"><span>✦</span><div><h2 id="picks-title">Your picks</h2><p>The gifts you liked — add them to your cart</p></div></div><div className="product-grid">{likedFlowers.map((flower) => <ProductTile key={flower.id} flower={flower} onAddToCart={() => addToCart(flower.id)} onView={() => setDetailFlower(flower)}/>)}</div></section>}
      {similar.length > 0 && <section className="recommendations-section" aria-labelledby="similar-title"><div className="recommendations-heading"><span>✦</span><div><h2 id="similar-title">You might also like</h2><p>Similar gifts picked to match your taste</p></div></div><div className="product-grid">{similar.map((flower) => <ProductTile key={flower.id} flower={flower} onAddToCart={() => addToCart(flower.id)} onView={() => setDetailFlower(flower)}/>)}</div></section>}
      {likedFlowers.length === 0 && cart.length === 0 && <p className="section-lede">Nothing caught your eye yet — try ten more.</p>}
      <div className="results-actions"><button className="primary-button primary-button--large" type="button" onClick={openCart}>View cart ({cart.length}) <ArrowRightIcon size={17}/></button><button className="secondary-button secondary-button--large" type="button" onClick={startRound}>Show me 10 more</button></div>
    </main>}

    {detailFlower && <FlowerDetails
      flower={detailFlower}
      onClose={() => setDetailFlower(null)}
      onAddToCart={() => { addToCart(detailFlower.id); setDetailFlower(null); }}
      onLike={step === "discover" && activeFlower?.id === detailFlower.id ? () => decideFromDetails("liked") : undefined}
      onSkip={step === "discover" && activeFlower?.id === detailFlower.id ? () => decideFromDetails("skipped") : undefined}
    />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </Shell>;
}

export default App;
