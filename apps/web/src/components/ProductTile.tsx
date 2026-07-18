import type { Flower } from "../types";
import { formatPrice } from "../lib/formatting";
import { PlusIcon } from "./Icons";
import { FlowerImage } from "./FlowerImage";

type Props = {
  flower: Flower;
  onAddToCart: () => void;
  onView: () => void;
};

export function ProductTile({ flower, onAddToCart, onView }: Props) {
  return (
    <article className="product-tile">
      <button className="product-tile__media" type="button" onClick={onView} aria-label={`View ${flower.name}`}>
        <FlowerImage flower={flower} />
      </button>
      <div className="product-tile__body">
        <span className="product-tile__cat">{flower.tags[0]}</span>
        <h3>{flower.name}</h3>
        <div className="product-tile__foot">
          <div className="price">
            <strong>{formatPrice(flower.pricing.amount)}</strong>
            {flower.originalPrice && <span className="price__was">{formatPrice(flower.originalPrice)}</span>}
          </div>
          <button className="add-button" type="button" onClick={onAddToCart}><PlusIcon size={15} />Add</button>
        </div>
      </div>
    </article>
  );
}
