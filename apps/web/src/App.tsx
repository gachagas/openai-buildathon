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
import { products, type Occasion, type Recipient } from "./lib/catalog";
import {
  SWIPE_COUNT,
  createSwipeDeck,
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
  onRestart,
}: {
  stage: Stage;
  completedSwipes: number;
  onRestart: () => void;
}) {
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
        <div className="finder-progress" aria-label={`${completedSwipes} of ${SWIPE_COUNT} choices complete`}>
          <div className="finder-progress-copy">
            <span>Gift Finder</span>
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
        <p>10 quick choices, then your best match.</p>
      </div>
    </main>
  );
}

function Result({
  recommendation,
  likedCount,
  recipient,
  occasion,
  onRestart,
}: {
  recommendation: Recommendation;
  likedCount: number;
  recipient: Recipient;
  occasion: Occasion;
  onRestart: () => void;
}) {
  const { product, reasons } = recommendation;

  return (
    <main className="mobile-main result-screen" id="main-content">
      <button className="back-link" type="button" onClick={onRestart}>
        <ArrowLeft aria-hidden="true" /> Start over
      </button>

      <div className="result-image">
        <img src={product.image} alt={product.title} />
        <span className="match-seal"><Heart aria-hidden="true" /> Your gift match</span>
      </div>

      <section className="result-copy" aria-labelledby="result-title">
        <p className="result-category">FlowerStore Gift Finder</p>
        <h1 id="result-title">{product.title}</h1>
        <p className="result-price">From ₱{product.price.toLocaleString("en-PH")}</p>
        <p className="result-description">{product.description}</p>

        <div className="why-match">
          <h2>Why this is your match</h2>
          <ul>
            {reasons.slice(0, 3).map((reason) => (
              <li key={reason}><Check aria-hidden="true" />{reason}</li>
            ))}
          </ul>
        </div>

        <p className="result-basis">
          Based on {likedCount} saved gift{likedCount === 1 ? "" : "s"} for your {formatChoice(recipient)} and {formatChoice(occasion)}.
        </p>

        <a className="primary-button product-link" href={product.link} target="_blank" rel="noreferrer">
          View product <ExternalLink aria-hidden="true" />
        </a>
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

  const recommendation = useMemo(
    () => rankRecommendations(products, swipes, recipient, occasion)[0],
    [swipes, recipient, occasion],
  );

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
      if (!product || currentSwipes.length >= SWIPE_COUNT) return currentSwipes;

      const nextSwipes = [...currentSwipes, { productId: product.id, direction }];
      if (nextSwipes.length === SWIPE_COUNT) {
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

  return (
    <div className={`app-shell stage-${stage}`} id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <MobileHeader stage={stage} completedSwipes={swipes.length} onRestart={restart} />

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
        </main>
      )}

      {stage === "result" && recommendation && (
        <Result
          recommendation={recommendation}
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
