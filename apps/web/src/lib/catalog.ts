import productData from "../data/products.json";

export type Recipient = "partner" | "family" | "friend" | "colleague";
export type Occasion = "birthday" | "anniversary" | "thank-you" | "congratulations" | "just-because" | "sympathy";
export type GiftCategory =
  | "sympathy"
  | "flowers"
  | "food-drink"
  | "personalized"
  | "jewelry-fashion"
  | "home-keepsake"
  | "beauty-wellness"
  | "plants"
  | "toys-kids-pets"
  | "other";

export interface Product {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  price: number;
  maxPrice: number;
  categories: GiftCategory[];
  occasions: Occasion[];
  recipients: Recipient[];
  vibes: string[];
  hubs: string[];
}

export const products = productData as Product[];
