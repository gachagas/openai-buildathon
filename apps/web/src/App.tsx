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
  RefreshCcw,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { products, type Occasion, type Product, type Recipient } from "./lib/catalog";
import {
  MIN_LIKES_FOR_RECOMMENDATION,
  RESULTS_PER_GROUP,
  SWIPE_COUNT,
  createSwipeDeck,
  hasEnoughSignals,
  likedProductsForResults,
  rankRecommendations,
  type Recommendation,
  type SwipeDecision,
} from "./lib/recommendation";
import { SwipeCard } from "./components/SwipeCard";

type Stage = "setup" | "swiping" | "result";

const FLOWERSTORE_LOGO = "https://assets.flowerstore.ph/public/tenantPH/app/assets/images/hub/350_nimRHwJxyyUwOICIxi7rikysv.webp";

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

function formatChoice(value: string) {
  return value.replaceAll("-", " ");
}

function MobileHeader({
  stage,
  completedSwipes,
  likedCount,
  onRestart,
}: {
  stage: Stage;
  completedSwipes: number;
  likedCount: number;
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
          <button className="header-icon-button bag-button" type="button" aria-label="Shopping bag">
            <ShoppingBag aria-hidden="true" />
            <span aria-hidden="true">0</span>
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

function Setup({ onStart }: { onStart: (recipient: Recipient, occasion: Occasion) => void }) {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);

  return (
    <main className="mobile-main setup-screen" id="main-content">
      <section className="finder-intro" aria-labelledby="setup-title">
        <p className="finder-kicker"><Sparkles aria-hidden="true" /> Gift Finder</p>
        <h1 id="setup-title">Find a gift<br />they will love.</h1>
        <p>Choose the moment, swipe through ten curated gifts, and get a match from FlowerStore.</p>
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
      </section>

      <div className="setup-cta">
        <button
          className="primary-button start-button"
          type="button"
          disabled={!recipient || !occasion}
          onClick={() => recipient && occasion && onStart(recipient, occasion)}
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
}: {
  product: Product;
  label: string;
  reason: string;
}) {
  return (
    <article className="result-product-card">
      <div className="result-card-image"><img src={product.image} alt={product.title} /></div>
      <div className="result-card-copy">
        <p className="result-card-label">{label}</p>
        <h3>{product.title}</h3>
        <p className="result-card-price">From ₱{product.price.toLocaleString("en-PH")}</p>
        <p className="result-card-reason">{reason}</p>
        <a className="result-card-link" href={product.link} target="_blank" rel="noreferrer">
          View product <ExternalLink aria-hidden="true" />
        </a>
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
  onRestart,
}: {
  likedProducts: Product[];
  recommendations: Recommendation[];
  likedCount: number;
  recipient: Recipient;
  occasion: Occasion;
  onRestart: () => void;
}) {
  return (
    <main className="mobile-main result-screen" id="main-content">
      <button className="back-link" type="button" onClick={onRestart}>
        <ArrowLeft aria-hidden="true" /> Start over
      </button>

      <section className="result-copy" aria-labelledby="result-title">
        <p className="result-category">FlowerStore Gift Finder</p>
        <h1 id="result-title">Six gifts worth a closer look.</h1>
        <p className="result-description">We kept your three strongest signals and found three new FlowerStore gifts with the same feel.</p>

        <section className="results-group" aria-labelledby="saved-title">
          <div className="results-group-heading">
            <Heart aria-hidden="true" />
            <div><h2 id="saved-title">Your saved picks</h2><p>Three gifts you said you like</p></div>
          </div>
          <div className="results-grid">
            {likedProducts.map((product) => (
              <ResultProductCard
                key={product.id}
                product={product}
                label="You saved this"
                reason="A signal we used to shape your new matches."
              />
            ))}
          </div>
        </section>

        <section className="results-group" aria-labelledby="new-title">
          <div className="results-group-heading">
            <Sparkles aria-hidden="true" />
            <div><h2 id="new-title">Three brand-new matches</h2><p>Unseen gifts chosen from your saved signals</p></div>
          </div>
          <div className="results-grid">
            {recommendations.map(({ product, reasons }) => (
              <ResultProductCard
                key={product.id}
                product={product}
                label="New for you"
                reason={reasons[0] ?? "A strong fit based on your saved gifts."}
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

export default function App() {
  const [stage, setStage] = useState<Stage>("setup");
  const [recipient, setRecipient] = useState<Recipient>("partner");
  const [occasion, setOccasion] = useState<Occasion>("birthday");
  const [deck, setDeck] = useState(() => createSwipeDeck(products, "partner", "birthday"));
  const [swipes, setSwipes] = useState<SwipeDecision[]>([]);
  const decisionLock = useRef(false);

  const recommendations = useMemo(
    () => rankRecommendations(products, swipes, recipient, occasion).slice(0, RESULTS_PER_GROUP),
    [swipes, recipient, occasion],
  );
  const likedProducts = useMemo(() => likedProductsForResults(products, swipes), [swipes]);

  const start = (nextRecipient: Recipient, nextOccasion: Occasion) => {
    decisionLock.current = false;
    setRecipient(nextRecipient);
    setOccasion(nextOccasion);
    setDeck(createSwipeDeck(products, nextRecipient, nextOccasion));
    setSwipes([]);
    setStage("swiping");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const decide = useCallback((direction: SwipeDecision["direction"]) => {
    if (decisionLock.current) return;
    decisionLock.current = true;

    setSwipes((currentSwipes) => {
      const product = deck[currentSwipes.length];
      if (!product) return currentSwipes;

      const nextSwipes = [...currentSwipes, { productId: product.id, direction }];
      if (hasEnoughSignals(nextSwipes)) {
        window.setTimeout(() => setStage("result"), 120);
      }
      return nextSwipes;
    });

    window.setTimeout(() => {
      decisionLock.current = false;
    }, 230);
  }, [deck]);

  const restart = () => {
    decisionLock.current = false;
    setSwipes([]);
    setStage("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (stage !== "swiping") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") decide("pass");
      if (event.key === "ArrowRight") decide("like");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decide, stage]);

  const currentProduct = deck[swipes.length];
  const likedCount = swipes.filter((swipe) => swipe.direction === "like").length;
  const needsMoreSignals = swipes.length >= SWIPE_COUNT && !hasEnoughSignals(swipes);

  return (
    <div className={`app-shell stage-${stage}`} id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <MobileHeader stage={stage} completedSwipes={swipes.length} likedCount={likedCount} onRestart={restart} />

      {stage === "setup" && <Setup onStart={start} />}

      {stage === "swiping" && currentProduct && (
        <main className="mobile-main swipe-screen" id="main-content">
          <section className="swipe-heading" aria-labelledby="swipe-title">
            <p>Choice {swipes.length + 1} of {SWIPE_COUNT}</p>
            <h1 id="swipe-title">Would they love this?</h1>
            <div className="context-pills" aria-label="Gift context">
              <span>{formatChoice(recipient)}</span>
              <span>{formatChoice(occasion)}</span>
            </div>
          </section>
          <SwipeCard
            key={currentProduct.id}
            product={currentProduct}
            nextProduct={deck[swipes.length + 1]}
            onDecision={decide}
          />
          <p className="swipe-helper">Swipe left to skip, right to save</p>
          {needsMoreSignals && (
            <p className="calibration-note">Keep saving gifts you like — we need {MIN_LIKES_FOR_RECOMMENDATION} saved picks before we reveal all six recommendations.</p>
          )}
        </main>
      )}

      {stage === "result" && likedProducts.length === RESULTS_PER_GROUP && recommendations.length === RESULTS_PER_GROUP && (
        <Result
          likedProducts={likedProducts}
          recommendations={recommendations}
          likedCount={likedCount}
          recipient={recipient}
          occasion={occasion}
          onRestart={restart}
        />
      )}

      <MobileNav />
    </div>
  );
}
