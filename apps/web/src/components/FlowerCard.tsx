import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Flower } from "../types";
import { availabilityLabel, formatPrice } from "../lib/formatting";
import { FlowerImage } from "./FlowerImage";

type Props = {
  flower: Flower;
  isActive: boolean;
  layer: number;
  onDecision?: (decision: "liked" | "skipped") => void;
  onDetails?: () => void;
};

export function FlowerCard({ flower, isActive, layer, onDecision, onDetails }: Props) {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!isActive || (event.target as HTMLElement).closest("button")) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragStart.current || !isActive) return;
    const x = event.clientX - dragStart.current.x;
    const y = event.clientY - dragStart.current.y;
    if (!isDragging && Math.abs(y) > Math.abs(x)) return;
    setIsDragging(true);
    setDrag({ x, y: y * 0.18 });
  };

  const finishDrag = () => {
    if (!dragStart.current) return;
    const decision = drag.x > 105 ? "liked" : drag.x < -105 ? "skipped" : null;
    dragStart.current = null;
    setIsDragging(false);
    setDrag({ x: 0, y: 0 });
    if (decision) onDecision?.(decision);
  };

  const style = isActive
    ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.035}deg)` }
    : { transform: `translateY(${layer * 14}px) scale(${1 - layer * 0.045})`, zIndex: 3 - layer };

  return (
    <article
      className={`flower-card ${isActive ? "flower-card--active" : "flower-card--behind"}`}
      style={style}
      aria-hidden={!isActive}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <div className="flower-card__media">
        <FlowerImage flower={flower} priority={layer < 2} />
        <span className={`availability availability--${flower.availability}`}>{availabilityLabel[flower.availability]}</span>
        {isActive && <>
          <span className="swipe-stamp swipe-stamp--like" style={{ opacity: Math.max(0, Math.min(1, drag.x / 100)) }}>LIKE</span>
          <span className="swipe-stamp swipe-stamp--skip" style={{ opacity: Math.max(0, Math.min(1, -drag.x / 100)) }}>SKIP</span>
        </>}
      </div>
      <div className="flower-card__body">
        <div className="tag-list" aria-label="Flower characteristics">
          {flower.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
        </div>
        <div className="flower-card__title-row">
          <div>
            <h2>{flower.name}</h2>
            {flower.japaneseName && <p className="jp-name" lang="ja">{flower.japaneseName}</p>}
          </div>
          <div className="price"><strong>{formatPrice(flower.pricing.amount)}</strong>{flower.pricing.displayLabel && <span>{flower.pricing.displayLabel}</span>}</div>
        </div>
        <p className="flower-card__summary">{flower.summary}</p>
        {isActive && <button className="text-button" type="button" onClick={onDetails}>More about this flower →</button>}
      </div>
    </article>
  );
}
