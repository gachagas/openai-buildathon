import type { Flower } from "../types";

export const formatPrice = (amount: number) => `₱${amount.toLocaleString("en-PH")}`;

export const availabilityLabel: Record<Flower["availability"], string> = {
  available_today: "Available today",
  limited: "Limited availability",
  seasonal: "Seasonal",
  preorder: "Preorder",
};

export function listPhrase(values: string[]) {
  if (!values.length) return "Open to suggestions";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
