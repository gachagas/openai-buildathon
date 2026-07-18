# Gift Finder — Deck & Demo Brief

Everything you need to present this and record the demo video. Written to sell it as a real AI product — every claim here is true and defensible on stage.

---

## One-liner

**An AI shopping layer that turns any product catalog into a swipe-to-discover gift finder — it learns your taste in ten swipes and recommends gifts it can explain.**

## The problem (real, not invented)

Online gift shopping is broken for the person who needs it most: the buyer who knows *who* the gift is for but not *what* to get. Traditional ecommerce filters ("category", "price low-to-high") assume you already know what you want. Gift buyers don't — they recognize the right gift when they see it. So they bounce, or they default to the same safe bouquet.

We turn that "I'll know it when I see it" instinct into the actual interface: **react to products, and the system reads your taste for you.**

## Built on real data

This is not a mockup with placeholder products. It runs on **475 real products from FlowerStore.ph** — real photos, real prices, real product links — pulled from the store's live public product feed. Every recommendation links back to a real page you could buy from today.

---

## How it works (the intelligence)

Four AI/ML stages. Stages 1–3 run once, offline, at build time; stage 4 runs live, in the browser.

### 1. Catalog ingestion — works on any store
We read a standard **Google Merchant product feed** (the same feed every ecommerce already generates for Google Shopping). From it we automatically derive the store's **price ranges** (to build budget filters) and its **category structure** (to build the initial filters). No manual setup per store.

### 2. Multimodal LLM tagging — we look at every product
A **vision model analyzes every product image** (not just the text) and assigns each product a structured taste profile from a controlled vocabulary:
- **recipients** — who it suits (partner, family, friend, colleague)
- **occasions** — birthday, anniversary, thank-you, congratulations, just-because
- **vibes** — romantic, elegant, playful, luxurious, heartfelt, cozy, festive… (the emotional read)
- **colors** — the dominant palette, read from the photo
- **category** — the product type

This is the layer competitors don't have. Most catalogs have a title and a price; we give every product a machine-readable sense of *feel*, grounded in what the product actually looks like. Closed vocabularies keep the tags consistent across the whole catalog, so matching stays reliable.

### 3. Vector similarity engine — the "Pinterest for gifts" core
Every product is turned into a **vector** (a numeric fingerprint of its tags + description). Finding "similar gifts" is then **nearest-neighbor search by cosine similarity** — the exact retrieval technique behind Pinterest's *related pins* and Amazon's *customers also bought*. It runs **entirely in the browser**: no server round-trip, no latency, and it can never fail live on stage.
> Under the hood: TF-IDF vectors with cosine similarity, precomputed at build time. The architecture is drop-in swappable for neural embeddings (OpenAI `text-embedding-3`) with zero app changes — a one-line upgrade when we want deeper semantic matching.

### 4. Live personalization — your input visibly changes the output
As you swipe, the system builds a **taste model** in real time and does three things you can *see*:
- **Learns weights** from every like and pass (categories + vibes you gravitate to, and away from).
- **Adapts the deck mid-session** — after five swipes, the rest of your cards are re-picked to match what you just liked. Like chocolate, and the deck fills with treats; like flowers, and it turns floral.
- **Ranks recommendations** by blending three signals: how well a product fits your stated context, your learned taste weights, and **vector similarity to the average of everything you saved**.
- **Explains every pick** — each recommendation states *why* ("Matches the gourmet treats you kept", "Close in style to the gifts you saved", "Shares the pink palette of your picks"). No black box.

**Proof it works (real output on real data):** starting from the same deck, a shopper who likes food gets *Biscoff Cookies, KitKat Box, Chocolate Drip Cake*; a shopper who likes flowers gets *Quietude, Blush Everlasting Bloom, Florinelle* — each with a matching reason line. Same engine, different input, visibly different result.

---

## Why this is a product, not a flower app

The whole pipeline is **store-agnostic**. It reads a standard feed, analyzes price ranges and categories, builds the LLM taste tags from *that store's* products, and ships a taste-based discovery layer. Point it at a bookstore, a chocolatier, a fashion brand — same engine, new catalog.

**That's the pitch: a discovery + recommendation layer any ecommerce can drop on top of its existing catalog.** We demo it on FlowerStore; it generalizes to anyone with a product feed.

## Architecture at a glance

- **Frontend:** React + TypeScript, mobile-first, in FlowerStore's brand system. Deployed on Railway.
- **Intelligence:** baked into the app as data (tagged catalog + vectors). **No runtime AI cost, no API keys in the client, no server dependency** — the recommendations are instant and the live demo is un-failable.
- **Privacy:** everything runs on-device; a shopper's swipes never leave their phone.

## Demo video script (~90 seconds)

1. **Hook (10s):** "You need a gift for your partner's anniversary. You don't know what to get. Every store makes you filter by category — but you don't know the category. You know *them*." 
2. **Setup (10s):** open the app → pick *Partner · Anniversary · ₱1,000–2,500*. "Three taps, all optional."
3. **Swipe + the magic moment (35s):** swipe through gifts. Like a few romantic, elegant ones. Point at the **"Noticing: romantic · elegant · flowers"** chips filling in. At card six, the **"✨ Deck tuned to your taste"** moment — "watch — it just re-picked the rest of the deck from what I liked." This is the beat that proves the AI is real.
4. **Result (20s):** show *Your picks* + *New matches for you*, each with a **why** line. Add one to the bag. "Every recommendation explains itself, and links to a real product page."
5. **The close (15s):** "This isn't a flower app. It reads any store's catalog, uses a vision model to tag every product, and builds this in minutes. It's a discovery layer for any ecommerce." (If time: paste a second store's feed to prove it.)

## Talking points / Q&A prep

- **"Is this just keyword search?"** No — products are tagged by a vision model on the images, then matched by vector similarity (nearest-neighbor), the same class of tech as Pinterest/Amazon recommendations.
- **"Does my input actually change anything?"** Yes, visibly: the deck re-tunes mid-session and the taste chips update per swipe. Same start, different swipes, different results.
- **"Real data?"** 475 real FlowerStore products, real images and prices, live product links.
- **"How fast to onboard a new store?"** Read their feed → auto-analyze prices/categories → run the vision tagger → done. Minutes, no manual per-product work.
- **Be precise, don't overclaim:** we use *vector similarity search* (not a hosted vector database); the *SDK* is the productization vision (the reusable engine already exists as our pipeline); tag quality depends on product images.

## Roadmap (where this goes)

- **Business-aware ranking:** blend in bestsellers and actively-promoted products, so recommendations respect the shopper's taste *and* the merchant's margins — the feature that makes it sellable to a store.
- **Neural embeddings:** swap TF-IDF for `text-embedding-3` for deeper semantic similarity (architecture already supports it).
- **Packaged SDK:** wrap the pipeline (feed reader → price/category analysis → vision tagger → vector engine) as an installable drop-in layer for any ecommerce.
- **Shareable taste links:** send the recipient the swipe experience; they build the profile, you buy the gift.
