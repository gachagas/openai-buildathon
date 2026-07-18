import { useRef, useState, type PointerEvent } from "react";
import { Heart, X } from "lucide-react";
import type { Product } from "../lib/catalog";
import type { SwipeDecision } from "../lib/recommendation";

interface SwipeCardProps {
  product: Product;
  nextProduct?: Product;
  onDecision: (direction: SwipeDecision["direction"]) => void;
}

const SWIPE_THRESHOLD = 86;

function productLabel(product: Product) {
  return product.categories[0]?.replaceAll("-", " ") ?? "gift";
}

export function SwipeCard({ product, nextProduct, onDecision }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<SwipeDecision["direction"] | null>(null);
  const pointerStart = useRef(0);
  const decisionLocked = useRef(false);

  const commit = (direction: SwipeDecision["direction"]) => {
    if (decisionLocked.current) return;
    decisionLocked.current = true;
    setExiting(direction);
    setDragX(direction === "like" ? 460 : -460);
    window.setTimeout(() => onDecision(direction), 190);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (decisionLocked.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStart.current = event.clientX - dragX;
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging || decisionLocked.current) return;
    setDragX(Math.max(-170, Math.min(170, event.clientX - pointerStart.current)));
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!dragging || decisionLocked.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);

    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      commit(dragX > 0 ? "like" : "pass");
    } else {
      setDragX(0);
    }
  };

  const rotation = Math.max(-5, Math.min(5, dragX / 28));
  const likeOpacity = Math.max(0, Math.min(1, dragX / SWIPE_THRESHOLD));
  const passOpacity = Math.max(0, Math.min(1, -dragX / SWIPE_THRESHOLD));

  return (
    <div className="deck" aria-live="polite">
      {nextProduct && (
        <article className="gift-card gift-card-next" aria-hidden="true">
          <img src={nextProduct.image} alt="" />
        </article>
      )}

      <article
        className={`gift-card gift-card-active${dragging ? " is-dragging" : ""}${exiting ? " is-exiting" : ""}`}
        style={{ transform: `translateX(${dragX}px) rotate(${rotation}deg)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="decision-stamp decision-stamp-pass" style={{ opacity: passOpacity }}>Not for them</div>
        <div className="decision-stamp decision-stamp-keep" style={{ opacity: likeOpacity }}>Love this</div>

        <div className="gift-image-wrap">
          <img src={product.image} alt={product.title} draggable="false" />
        </div>
        <div className="gift-card-copy">
          <p className="product-category">{productLabel(product)}</p>
          <h2>{product.title}</h2>
          <div className="product-price-row">
            <span>From ₱{product.price.toLocaleString("en-PH")}</span>
            <small>FlowerStore.ph</small>
          </div>
        </div>
      </article>

      <div className="swipe-actions" aria-label="Choose this gift">
        <button className="decision-button decision-button-pass" type="button" onClick={() => commit("pass")}>
          <X aria-hidden="true" />
          <span>Not for them</span>
          <kbd>←</kbd>
        </button>
        <button className="decision-button decision-button-keep" type="button" onClick={() => commit("like")}>
          <Heart aria-hidden="true" />
          <span>Love this</span>
          <kbd>→</kbd>
        </button>
      </div>
    </div>
  );
}
