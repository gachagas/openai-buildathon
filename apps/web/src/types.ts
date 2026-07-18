export type AppStep =
  | "welcome"
  | "context"
  | "discover"
  | "results"
  | "handoff"
  | "favorites";

export type FlowerDecision = "liked" | "skipped" | "favorite";

export type MeaningCategory =
  | "affection"
  | "gratitude"
  | "joy"
  | "admiration"
  | "elegance"
  | "hope"
  | "remembrance"
  | "sincerity";

export type AtlasPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "full";

export type Flower = {
  id: string;
  name: string;
  japaneseName?: string;
  scientificName?: string;
  image: {
    src: string;
    position: AtlasPosition;
    alt: string;
  };
  images?: string[];
  link?: string;
  pricing: {
    amount: number;
    currency: "PHP";
    unit: "per_stem" | "per_bunch" | "per_item";
    displayLabel: string;
  };
  originalPrice?: number;
  colors: string[];
  tags: string[];
  shapes: string[];
  styles: string[];
  summary: string;
  description: string;
  fragrance?: "none" | "light" | "medium" | "strong";
  vaseLifeDays?: { min: number; max: number };
  occasions: string[];
  meaning?: {
    label: string;
    category: MeaningCategory;
    message: string;
  };
  availability: "available_today" | "limited" | "seasonal" | "preorder";
  season?: string[];
  careNotes?: string[];
  isMockData: boolean;
};

export type CustomerContext = {
  recipient?: string;
  occasion?: string;
  budget?: string;
  purchaseFormat?: string;
};

export type FlowerSelection = {
  flowerId: string;
  decision: FlowerDecision;
};

export type PreferenceProfile = {
  colors: string[];
  tags: string[];
  shapes: string[];
  styles: string[];
};

export type Recommendation = {
  id: string;
  kind: "Arrangement" | "Single flower";
  name: string;
  japaneseName?: string;
  priceLabel: string;
  why: string;
  occasions: string[];
  availability: Flower["availability"];
  flower?: Flower;
};
