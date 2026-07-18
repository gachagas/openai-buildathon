import type { Flower } from "../types";
import productsData from "./products.json";

// Real FlowerStore catalogue (500 stratified products) built by
// scripts/ingest/build-products.mjs from the public Google Merchant feed.
export const flowers = productsData as unknown as Flower[];

export const flowerById = new Map(flowers.map((flower) => [flower.id, flower]));
