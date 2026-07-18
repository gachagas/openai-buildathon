import { useEffect, useRef } from "react";
import type { Flower } from "../types";
import { availabilityLabel, formatPrice, listPhrase } from "../lib/formatting";
import { CloseIcon, HeartIcon, PlusIcon } from "./Icons";
import { FlowerImage } from "./FlowerImage";

type Props = {
  flower: Flower;
  onClose: () => void;
  onAddToCart: () => void;
  onLike?: () => void;
  onSkip?: () => void;
};

export function FlowerDetails({ flower, onClose, onAddToCart, onLike, onSkip }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1} ref={dialogRef}>
        <div className="detail-modal__media">
          <FlowerImage flower={flower} priority />
          <span className={`availability availability--${flower.availability}`}>{availabilityLabel[flower.availability]}</span>
          <button className="icon-button detail-modal__save" type="button" aria-label="Add to cart" onClick={onAddToCart}><PlusIcon /></button>
          <button className="icon-button detail-modal__close" type="button" aria-label="Close details" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="detail-modal__body">
          <div className="detail-modal__heading">
            <div><h2 id="detail-title">{flower.name}</h2>{flower.japaneseName && <p className="jp-name" lang="ja">{flower.japaneseName}</p>}{flower.scientificName && <p className="scientific-name"><i>{flower.scientificName}</i></p>}</div>
            <div className="price"><strong>{formatPrice(flower.pricing.amount)}</strong>{flower.pricing.displayLabel && <span>{flower.pricing.displayLabel}</span>}</div>
          </div>
          <div className="tag-list">{flower.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          <p className="detail-modal__description">{flower.description}</p>
          <dl className="spec-grid">
            {flower.colors.length > 0 && <div><dt>Colors</dt><dd>{listPhrase(flower.colors)}</dd></div>}
            {flower.fragrance && <div><dt>Fragrance</dt><dd>{flower.fragrance}</dd></div>}
            {flower.vaseLifeDays && <div><dt>Typical vase life</dt><dd>{flower.vaseLifeDays.min}–{flower.vaseLifeDays.max} days</dd></div>}
            {flower.occasions.length > 0 && <div><dt>Best for</dt><dd>{listPhrase(flower.occasions)}</dd></div>}
            {flower.season && <div><dt>Season</dt><dd>{listPhrase(flower.season)}</dd></div>}
            {flower.careNotes?.[0] && <div><dt>Care</dt><dd>{flower.careNotes[0]}</dd></div>}
          </dl>
          {flower.meaning && <aside className="meaning-box"><span>花言葉 · Traditional association</span><strong>{flower.meaning.message}</strong><small>Meanings can vary by flower color, culture, source, and period.</small></aside>}
          <div className="detail-modal__actions">
            {onSkip && <button className="secondary-button" type="button" onClick={onSkip}><CloseIcon size={17}/> Skip</button>}
            {onLike && <button className="secondary-button" type="button" onClick={onLike}><HeartIcon size={17}/> Like</button>}
            <button className="primary-button" type="button" onClick={onAddToCart}><PlusIcon size={17}/> Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
