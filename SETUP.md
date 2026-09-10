# WasteWise – New Features Setup

## What's new
- `index.html` — your original site reconstructed (nav, hero, about, game,
  data, impact, challenges, calculator, footer) PLUS two new sections:
  **Sell Waste / Locate Collectors** (#marketplace) and
  **Free Big Items Exchange** (#free-items).
- `marketplace.js` — new file, handles both features. Doesn't touch your
  original `script.js` at all.
- `supabase-client.js` — where you paste your Supabase project credentials.
- `supabase-schema.sql` — run this once in Supabase to create the database
  table and permissions.

## ⚠️ Important — merge, don't just replace
Since your uploaded zip had an empty `index.html`, this one was rebuilt from
your live site + your real `script.js`/`styles.css`. Before deploying:
1. Compare this `index.html` against your actual repo's `index.html`
   (structure/wording should match, but diff it to be safe).
2. Copy the two new `<section>` blocks (`id="marketplace"` and
   `id="free-items"`) plus the two new nav links into YOUR real index.html.
3. Copy the new CSS block at the bottom of this `styles.css` into your
   real stylesheet.
4. Add `marketplace.js` and `supabase-client.js` to your project folder,
   and add these three `<script>` tags before `</body>`, after `script.js`:
   ```html
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="supabase-client.js"></script>
   <script src="marketplace.js"></script>
   ```
   Also add the Leaflet CSS in `<head>`:
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
   ```

## Backend setup (Supabase — free tier)
1. Go to https://supabase.com → New Project (free tier is enough).
2. Once created: **Project Settings → API** → copy the **Project URL**
   and **anon public key**.
3. Paste them into `supabase-client.js`:
   ```js
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
4. Open **SQL Editor** in Supabase → paste the contents of
   `supabase-schema.sql` → Run.
5. Go to **Storage** → New bucket → name it exactly `listings` →
   toggle **Public bucket: ON** → Create.
6. Deploy to Vercel as usual (`vercel --prod` or via git push) — no
   environment variables needed since the keys are safe to expose
   client-side (the anon key is designed for this, and Row Level
   Security in the SQL controls what it can actually do).

## How the two features work
**Sell Waste / Locate Collectors**
- Seller fills the form, taps "Share My Location" (browser asks
  permission), uploads a photo, submits.
- Listing is saved to Supabase with lat/lng + photo URL.
- The map (Leaflet + OpenStreetMap, free, no API key) shows all
  listings as pins; the list below shows cards with a
  "Contact on WhatsApp" button (pre-filled message, uses `wa.me` links
  — no WhatsApp Business API needed).
- Viewer's own browser location is used only to center the map —
  no account/login required for this MVP.

**Free Big Items**
- Poster uploads a photo (required), names the item, category, area,
  and phone number.
- Appears as a card in the public grid with an "I'm Interested"
  WhatsApp button.
- No "claimed" auto-detection yet — that's a good v2 addition (e.g. a
  button the poster clicks once it's picked up, updating `status` to
  `'claimed'` in the `listings` table).

## Known simplifications (v1 → v2 ideas)
- No user accounts — anyone can post/browse. Fine for a class project;
  add Supabase Auth if you want "my listings" management later.
- No image compression before upload — large phone photos will upload
  as-is. Consider compressing client-side (e.g. `browser-image-compression`
  npm package) if upload speed becomes an issue.
- "Claim" flow for free items isn't wired to a button yet — currently
  just a status field in the database you could update manually or via
  a follow-up feature.
