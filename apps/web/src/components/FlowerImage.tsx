import type { Flower } from "../types";

type Props = {
  flower: Flower;
  priority?: boolean;
  className?: string;
};

export function FlowerImage({ flower, priority = false, className = "" }: Props) {
  return (
    <div className={`flower-image flower-image--${flower.image.position} ${className}`.trim()}>
      <img
        src={flower.image.src}
        alt={flower.image.alt}
        width="960"
        height="960"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </div>
  );
}
