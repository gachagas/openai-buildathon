# DESIGN.md: FlowerStore.ph mobile reference

## Source

- URL: https://flowerstore.ph/
- Capture date: 2026-07-18
- Evidence: Firecrawl branding and images scrape, full-page storefront screenshot, and homepage structure.

## Reference Screenshot

![Full-page FlowerStore.ph storefront](./flowerstore-home.png)

Use the screenshot as the visual source of truth for FlowerStore-inspired hierarchy, density, product photography, and retail tone.

## Design Summary

Build a phone-first gift-finder that feels like a FlowerStore shopping surface rather than a standalone game. It should lead with the familiar coral retail identity, real product imagery, compact commerce controls, delivery context, and a decisive purchase path. The swipe action is the only new interaction and should sit naturally inside the mobile shopping flow.

## Design Tokens

### Colors

- `--fs-coral`: `#F79F8E`, observed primary CTA and active-state color.
- `--fs-blush`: `#FFEFF0`, observed soft promotional and selected-state surface.
- `--fs-background`: `#FFFFFF`, observed main background.
- `--fs-ink`: `#374151`, observed primary text and link color.
- `--fs-border`: inferred soft neutral border, approximately `#E5E7EB`.
- `--fs-muted`: inferred secondary text, approximately `#6B7280`.
- Use tinted neutrals instead of pure black. Coral is reserved for actions, active navigation, progress, and selected choices.

### Typography

- Heading: `Prompt`, weight 600 to 700. Observed homepage heading token is 36px on desktop; use 22px to 30px in the app.
- Body: `Nunito`, weight 400 to 700. Observed compact commerce body text is 12px; use 13px to 16px for mobile legibility.
- Use simple, direct shopping copy. Avoid marketing paragraphs inside the recommendation flow.

### Spacing And Layout

- Base unit: 4px, observed.
- Mobile app width: 100%, designed first for 320px to 430px. On large screens, center a maximum 430px application surface.
- Header and bottom navigation remain visually persistent. Use a 56px app header and 64px bottom navigation with safe-area padding.
- Keep primary buttons close to 48px high. Use short 2px to 6px radii for retail controls, with pills only for filters and chips.

## Components

- **Header:** FlowerStore logo, compact menu and bag actions, followed by a delivery-location row.
- **Promo strip:** a compact blush or coral delivery message; no large hero treatment.
- **Choice controls:** two-column recipient tiles and compact occasion chips. Selected states use blush fill and coral border/text.
- **Gift card:** square-cornered white product surface, generous image area, small category label, product name, and price. No fabricated product ratings.
- **Swipe actions:** two equal 52px touch targets with clear labels and coral positive action. Keyboard arrows remain a desktop accessibility enhancement.
- **Result:** product-detail-style panel with a coral `Your match` label, evidence-based reasons, and one clear product-page CTA.
- **Bottom nav:** Home, Shop, Gift Finder, Orders, Account; Gift Finder is active.

## Page Patterns

- Setup: header, delivery context, small task heading, recipient tiles, occasion chips, full-width start CTA, bottom nav.
- Swipe: compact progress and context, one product card, explicit left/right actions, bottom nav.
- Result: product image, match label, product name and from-price, reasons, original FlowerStore product CTA, bottom nav.

## Content Style

- Direct, friendly, and shopping-oriented: “Find a gift they’ll love”, “Would they love this?”, “View product”.
- Use real products, original prices, and original URLs. Display lowest catalog price as “From ₱…”, because prices can vary by delivery hub.
- Keep delivery claims qualified unless the specific product and destination are verified.

## Agent Build Instructions

1. Treat this as a FlowerStore-inspired mobile prototype, not an unrelated dating interface.
2. Load Nunito and Prompt with system fallbacks; retain high contrast and reduced-motion support.
3. Keep the app frame mobile-first and thumb-friendly, including fixed bottom navigation and safe-area spacing.
4. Use real FlowerStore feed images and product links only; do not copy unrelated site text or invent product ratings.
5. Preserve the ten-card, unseen-product recommendation model and its existing tests.

## Rerun Inputs

workflow: firecrawl-website-design-clone
source_url: https://flowerstore.ph/
target_stack: Vite + React + TypeScript
output: DESIGN.md
