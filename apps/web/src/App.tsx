import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Gift,
  Grid2X2,
  Heart,
  Home,
  MapPin,
  Menu,
  Package,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { products, type Occasion, type Product, type Recipient } from "./lib/catalog";
import {
  BUDGETS,
  MIN_LIKES_FOR_RECOMMENDATION,
  RESULTS_PER_GROUP,
  SWIPE_COUNT,
  adaptDeckTail,
  createSwipeDeck,
  emergingTaste,
  hasEnoughSignals,
  likedProductsForResults,
  rankRecommendations,
  type Budget,
  type Recommendation,
  type SwipeDecision,
} from "./lib/recommendation";

const ADAPT_AFTER = 5;
import { SwipeCard } from "./components/SwipeCard";

type Stage = "setup" | "swiping" | "result" | "bag";

const FLOWERSTORE_LOGO = "https://assets.flowerstore.ph/public/tenantPH/app/assets/images/hub/350_nimRHwJxyyUwOICIxi7rikysv.webp";

const productById = new Map<string, Product>(products.map((product) => [product.id, product]));
const peso = (amount: number) => `₱${amount.toLocaleString("en-PH")}`;

const recipients: Array<{ value: Recipient; label: string; detail: string }> = [
  { value: "partner", label: "Partner", detail: "Romantic or personal" },
  { value: "family", label: "Family", detail: "Warm and meaningful" },
  { value: "friend", label: "Friend", detail: "Fun and thoughtful" },
  { value: "colleague", label: "Colleague", detail: "Polished and easy" },
];

const occasions: Array<{ value: Occasion; label: string }> = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "thank-you", label: "Thank you" },
  { value: "congratulations", label: "Congratulations" },
  { value: "just-because", label: "Just because" },
  { value: "sympathy", label: "Sympathy" },
];

const budgets = Object.keys(BUDGETS) as Budget[];

function formatChoice(value: string) {
  return value.replaceAll("-", " ");
}

function MobileHeader({
  stage,
  completedSwipes,
  likedCount,
  bagCount,
  onBag,
  onRestart,
}: {
  stage: Stage;
  completedSwipes: number;
  likedCount: number;
  bagCount: number;
  onBag: () => void;
  onRestart: () => void;
}) {
  const isCalibrating = completedSwipes >= SWIPE_COUNT && likedCount < MIN_LIKES_FOR_RECOMMENDATION;
  const remainingLikes = MIN_LIKES_FOR_RECOMMENDATION - likedCount;

  return (
    <header className="mobile-header">
      <div className="top-bar">
        <button className="header-icon-button" type="button" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </button>
        <a className="flowerstore-brand" href="#top" aria-label="FlowerStore Gift Finder home">
          <img src={FLOWERSTORE_LOGO} alt="FlowerStore.ph" />
        </a>
        <div className="header-actions">
          <button className="header-icon-button" type="button" aria-label="Search FlowerStore">
            <Search aria-hidden="true" />
          </button>
          <button className="header-icon-button bag-button" type="button" aria-label={`Shopping bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} onClick={onBag}>
            <ShoppingBag aria-hidden="true" />
            <span aria-hidden="true">{bagCount}</span>
          </button>
        </div>
      </div>

      <button className="delivery-row" type="button" aria-label="Delivery location: Metro Manila">
        <MapPin aria-hidden="true" />
        <span>Deliver to <strong>Metro Manila</strong></span>
        <ChevronDown aria-hidden="true" />
      </button>

      {stage === "swiping" && (
        <div className="finder-progress" aria-label={isCalibrating
          ? `${completedSwipes} choices complete; ${remainingLikes} more saved gift${remainingLikes === 1 ? "" : "s"} needed`
          : `${completedSwipes} of ${SWIPE_COUNT} choices complete`}>
          <div className="finder-progress-copy">
            <span>{isCalibrating ? `Save ${remainingLikes} more gift${remainingLikes === 1 ? "" : "s"}` : "Gift Finder"}</span>
            <button type="button" onClick={onRestart}>Restart</button>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${(completedSwipes / SWIPE_COUNT) * 100}%` }} />
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      <span><Home aria-hidden="true" />Home</span>
      <span><Grid2X2 aria-hidden="true" />Shop</span>
      <span className="is-active" aria-current="page"><Gift aria-hidden="true" />Gift Finder</span>
      <span><Package aria-hidden="true" />Orders</span>
      <span><UserRound aria-hidden="true" />Account</span>
    </nav>
  );
}

function Setup({ onStart }: { onStart: (recipient: Recipient, occasion: Occasion, budget: Budget | null) => void }) {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);

  return (
    <main className="mobile-main setup-screen" id="main-content">
      <section className="finder-intro" aria-labelledby="setup-title">
        <p className="finder-kicker"><Sparkles aria-hidden="true" /> Gift Finder</p>
        <h1 id="setup-title">Find a gift<br />they will love.</h1>
        <p>Tell us who it is for and the moment, swipe through ten gifts, and get a match from FlowerStore.</p>
      </section>

      <section className="picker-section" aria-label="Gift details">
        <fieldset>
          <legend>Who are you shopping for?</legend>
          <div className="recipient-options">
            {recipients.map((option) => (
              <button
                key={option.value}
                className={`recipient-option${recipient === option.value ? " is-selected" : ""}`}
                type="button"
                aria-pressed={recipient === option.value}
                onClick={() => setRecipient(option.value)}
              >
                <span>{option.label}</span>
                <small>{option.detail}</small>
                {recipient === option.value && <Check aria-hidden="true" />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>What is the occasion?</legend>
          <div className="occasion-options">
            {occasions.map((option) => (
              <button
                key={option.value}
                className={`occasion-option${occasion === option.value ? " is-selected" : ""}`}
                type="button"
                aria-pressed={occasion === option.value}
                onClick={() => setOccasion(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>What is your budget? <span className="legend-optional">Optional</span></legend>
          <div className="occasion-options">
            {budgets.map((option) => (
              <button
                key={option}
                className={`occasion-option${budget === option ? " is-selected" : ""}`}
                type="button"
                aria-pressed={budget === option}
                onClick={() => setBudget(budget === option ? null : option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="setup-cta">
        <button
          className="primary-button start-button"
          type="button"
          disabled={!recipient || !occasion}
          onClick={() => recipient && occasion && onStart(recipient, occasion, budget)}
        >
          Start gift finder <ArrowRight aria-hidden="true" />
        </button>
        <p>Start with 10 choices, then save 3 gifts for a reliable match.</p>
      </div>
    </main>
  );
}

function ResultProductCard({
  product,
  label,
  reason,
  onAddToBag,
}: {
  product: Product;
  label: string;
  reason: string;
  onAddToBag: () => void;
}) {
  return (
    <article className="result-product-card">
      <div className="result-card-image"><img src={product.image} alt={product.title} /></div>
      <div className="result-card-copy">
        <p className="result-card-label">{label}</p>
        <h3>{product.title}</h3>
        <p className="result-card-price">From {peso(product.price)}</p>
        <p className="result-card-reason">{reason}</p>
        <div className="result-card-actions">
          <a className="result-card-link" href={product.link} target="_blank" rel="noreferrer">
            View product <ExternalLink aria-hidden="true" />
          </a>
          <button className="bag-add-button" type="button" onClick={onAddToBag}>
            <Plus aria-hidden="true" /> Add to bag
          </button>
        </div>
      </div>
    </article>
  );
}

function Result({
  likedProducts,
  recommendations,
  likedCount,
  recipient,
  occasion,
  onAddToBag,
  onRestart,
}: {
  likedProducts: Product[];
  recommendations: Recommendation[];
  likedCount: number;
  recipient: Recipient;
  occasion: Occasion;
  onAddToBag: (id: string) => void;
  onRestart: () => void;
}) {
  return (
    <main className="mobile-main result-screen" id="main-content">
      <button className="back-link" type="button" onClick={onRestart}>
        <ArrowLeft aria-hidden="true" /> Start over
      </button>

      <section className="result-copy" aria-labelledby="result-title">
        <p className="result-category">FlowerStore Gift Finder</p>
        <h1 id="result-title">Your picks and {recommendations.length} new matches.</h1>
        <p className="result-description">We kept the gifts you saved and found {recommendations.length} new FlowerStore gifts with the same feel.</p>

        <section className="results-group" aria-labelledby="saved-title">
          <div className="results-group-heading">
            <Heart aria-hidden="true" />
            <div><h2 id="saved-title">Your saved picks</h2><p>{likedProducts.length} gift{likedProducts.length === 1 ? "" : "s"} you said you like</p></div>
          </div>
          <div className="results-grid">
            {likedProducts.map((product) => (
              <ResultProductCard
                key={product.id}
                product={product}
                label="You saved this"
                reason="A signal we used to shape your new matches."
                onAddToBag={() => onAddToBag(product.id)}
              />
            ))}
          </div>
        </section>

        <section className="results-group" aria-labelledby="new-title">
          <div className="results-group-heading">
            <Sparkles aria-hidden="true" />
            <div><h2 id="new-title">New matches for you</h2><p>Ranked by similarity to the gifts you saved</p></div>
          </div>
          <div className="results-grid">
            {recommendations.map(({ product, reasons }) => (
              <ResultProductCard
                key={product.id}
                product={product}
                label="New for you"
                reason={reasons[0] ?? "A strong fit based on your saved gifts."}
                onAddToBag={() => onAddToBag(product.id)}
              />
            ))}
          </div>
        </section>

        <p className="result-basis">
          Built from {likedCount} saved gift{likedCount === 1 ? "" : "s"} for your {formatChoice(recipient)} and {formatChoice(occasion)}.
        </p>

        <button className="secondary-button" type="button" onClick={onRestart}>
          <RefreshCcw aria-hidden="true" /> Try a new match
        </button>
        <p className="source-note">Price and delivery availability are confirmed on FlowerStore.ph.</p>
      </section>
    </main>
  );
}

function Bag({
  items,
  total,
  onRemove,
  onCheckout,
  onClose,
}: {
  items: Array<{ product: Product; qty: number }>;
  total: number;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  return (
    <main className="mobile-main bag-screen" id="main-content">
      <button className="back-link" type="button" onClick={onClose}>
        <ArrowLeft aria-hidden="true" /> Keep browsing
      </button>
      <h1 className="bag-title">Your bag</h1>

      {items.length ? (
        <>
          <div className="bag-list">
            {items.map(({ product, qty }) => (
              <article className="bag-row" key={product.id}>
                <div className="bag-row-image"><img src={product.image} alt={product.title} /></div>
                <div className="bag-row-copy">
                  <a href={product.link} target="_blank" rel="noreferrer">{product.title}</a>
                  <p>From {peso(product.price)}{qty > 1 ? ` · ×${qty}` : ""}</p>
                </div>
                <button className="bag-remove" type="button" aria-label={`Remove ${product.title}`} onClick={() => onRemove(product.id)}>
                  <Trash2 aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
          <div className="bag-summary">
            <div className="bag-total"><span>Total</span><strong>{peso(total)}</strong></div>
            <button className="primary-button start-button" type="button" onClick={onCheckout}>
              Go to checkout <ArrowRight aria-hidden="true" />
            </button>
            <p className="source-note">Checkout opens on FlowerStore.ph. Prices confirmed there.</p>
          </div>
        </>
      ) : (
        <div className="bag-empty">
          <ShoppingBag aria-hidden="true" />
          <h2>Your bag is empty</h2>
          <p>Add gifts as you swipe or from your matches.</p>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>("setup");
  const [returnStage, setReturnStage] = useState<Stage>("setup");
  const [recipient, setRecipient] = useState<Recipient>("partner");
  const [occasion, setOccasion] = useState<Occasion>("birthday");
  const [budget, setBudget] = useState<Budget | null>(null);
  const [deck, setDeck] = useState(() => createSwipeDeck(products, "partner", "birthday"));
  const [swipes, setSwipes] = useState<SwipeDecision[]>([]);
  const [bag, setBag] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [adapted, setAdapted] = useState(false);
  const decisionLock = useRef(false);

  const recommendations = useMemo(
    () => rankRecommendations(products, swipes, recipient, occasion, budget).slice(0, RESULTS_PER_GROUP),
    [swipes, recipient, occasion, budget],
  );
  const likedProducts = useMemo(() => likedProductsForResults(products, swipes), [swipes]);
  const tasteChips = useMemo(() => emergingTaste(products, swipes), [swipes]);

  const bagItems = useMemo(() => {
    const order: string[] = [];
    const counts = new Map<string, number>();
    for (const id of bag) {
      if (!counts.has(id)) order.push(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return order.flatMap((id) => {
      const product = productById.get(id);
      return product ? [{ product, qty: counts.get(id) ?? 1 }] : [];
    });
  }, [bag]);
  const bagTotal = bagItems.reduce((sum, { product, qty }) => sum + product.price * qty, 0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1700);
  }, []);

  const addToBag = useCallback((id: string) => {
    setBag((current) => [...current, id]);
    showToast("Added to bag");
  }, [showToast]);

  const removeFromBag = (id: string) => {
    setBag((current) => {
      const index = current.indexOf(id);
      if (index === -1) return current;
      const next = [...current];
      next.splice(index, 1);
      return next;
    });
  };

  const start = (nextRecipient: Recipient, nextOccasion: Occasion, nextBudget: Budget | null) => {
    decisionLock.current = false;
    setRecipient(nextRecipient);
    setOccasion(nextOccasion);
    setBudget(nextBudget);
    setDeck(createSwipeDeck(products, nextRecipient, nextOccasion, nextBudget));
    setSwipes([]);
    setAdapted(false);
    setStage("swiping");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const decide = useCallback((direction: SwipeDecision["direction"]) => {
    if (decisionLock.current) return;
    const product = deck[swipes.length];
    if (!product) return;
    decisionLock.current = true;

    const nextSwipes = [...swipes, { productId: product.id, direction }];
    setSwipes(nextSwipes);

    if (hasEnoughSignals(nextSwipes)) {
      window.setTimeout(() => setStage("result"), 120);
    } else if (!adapted && nextSwipes.length === ADAPT_AFTER && nextSwipes.some((swipe) => swipe.direction === "like")) {
      // Mid-session personalization: re-tune the rest of the deck to what the
      // shopper just liked. The moment that proves input → output.
      setDeck((current) => adaptDeckTail(products, current, nextSwipes, recipient, occasion, budget));
      setAdapted(true);
      showToast("✨ Deck tuned to your taste");
    }

    window.setTimeout(() => {
      decisionLock.current = false;
    }, 230);
  }, [deck, swipes, adapted, recipient, occasion, budget, showToast]);

  const undo = useCallback(() => {
    decisionLock.current = false;
    setSwipes((currentSwipes) => currentSwipes.slice(0, -1));
  }, []);

  const bagCurrent = useCallback(() => {
    const product = deck[swipes.length];
    if (!product) return;
    addToBag(product.id);
    decide("like");
  }, [deck, swipes.length, addToBag, decide]);

  const restart = () => {
    decisionLock.current = false;
    setSwipes([]);
    setAdapted(false);
    setStage("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openBag = () => {
    setReturnStage(stage === "bag" ? returnStage : stage);
    setStage("bag");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    if (stage !== "swiping") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") decide("pass");
      if (event.key === "ArrowRight") decide("like");
      if (event.key.toLowerCase() === "u" || event.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decide, undo, stage]);

  const currentProduct = deck[swipes.length];
  const likedCount = swipes.filter((swipe) => swipe.direction === "like").length;
  const needsMoreSignals = swipes.length >= SWIPE_COUNT && !hasEnoughSignals(swipes);

  return (
    <div className={`app-shell stage-${stage}`} id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <MobileHeader stage={stage} completedSwipes={swipes.length} likedCount={likedCount} bagCount={bag.length} onBag={openBag} onRestart={restart} />

      {stage === "setup" && <Setup onStart={start} />}

      {stage === "swiping" && currentProduct && (
        <main className="mobile-main swipe-screen" id="main-content">
          <section className="swipe-heading" aria-labelledby="swipe-title">
            <p>Choice {swipes.length + 1} of {SWIPE_COUNT}</p>
            <h1 id="swipe-title">Would they love this?</h1>
            <div className="context-pills" aria-label="Gift context">
              <span>{formatChoice(recipient)}</span>
              <span>{formatChoice(occasion)}</span>
              {budget && <span>{budget}</span>}
            </div>
            {likedCount >= 2 && tasteChips.length > 0 && (
              <div className="taste-noticing" aria-live="polite">
                <Sparkles aria-hidden="true" />
                <span>Noticing</span>
                {tasteChips.map((chip) => <em key={chip}>{chip}</em>)}
              </div>
            )}
          </section>
          <SwipeCard
            key={currentProduct.id}
            product={currentProduct}
            nextProduct={deck[swipes.length + 1]}
            onDecision={decide}
          />
          <div className="swipe-extra">
            <button className="ghost-button" type="button" onClick={bagCurrent}>
              <Plus aria-hidden="true" /> Add to bag
            </button>
            <button className="ghost-button" type="button" onClick={undo} disabled={swipes.length === 0}>
              <RotateCcw aria-hidden="true" /> Undo
            </button>
          </div>
          <p className="swipe-helper">Swipe left to skip, right to save</p>
          {needsMoreSignals && (
            <p className="calibration-note">Keep saving gifts you like — we need {MIN_LIKES_FOR_RECOMMENDATION} saved picks before we reveal all your matches.</p>
          )}
        </main>
      )}

      {stage === "result" && likedProducts.length >= MIN_LIKES_FOR_RECOMMENDATION && recommendations.length > 0 && (
        <Result
          likedProducts={likedProducts}
          recommendations={recommendations}
          likedCount={likedCount}
          recipient={recipient}
          occasion={occasion}
          onAddToBag={addToBag}
          onRestart={restart}
        />
      )}

      {stage === "bag" && (
        <Bag
          items={bagItems}
          total={bagTotal}
          onRemove={removeFromBag}
          onCheckout={() => showToast("Checkout — coming soon")}
          onClose={() => setStage(returnStage)}
        />
      )}

      <MobileNav />
      {toast && <div className="app-toast" role="status">{toast}</div>}
    </div>
  );
}
