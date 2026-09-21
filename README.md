# Ling Coffee — glass redesign prototype

Designed and developed by **Trent (PWL31)**. Copyright © 2026 Trent.
Original repository: https://github.com/PWL31/CUHKSZ-Ling-Cafe-Glass
See [COPYRIGHT.md](COPYRIGHT.md) for attribution information.

This repository contains the current glass / liquid-glass prototype for Ling Cafe.

## Kangle + PHP + MySQL deployment

For conventional PHP hosting, use the additional target in
[deploy/php](deploy/php/README.md). It includes the backend, a full-data export
tool, a package builder and [deployment instructions](deploy/php/DEPLOYMENT.md).
The root frontend and Worker remain the Cloudflare target. A GitHub source ZIP
does not include the live menu, uploaded images or schedule database; export and
import those separately using the PHP deployment workflow.

## Current user-facing flows

- Home: opening state, today’s barista schedule, View menu shortcut, Popular drinks, and the bilingual Love & Support section.
- Menu: category-aware menu cards and Personal Preference. Pickup reservation is intentionally hidden for now.
- Personal Preference: drink preferences and a downloadable preference card.
- Schedule: date-based shifts and barista roster. Admin editing logic for Schedule will be defined separately.
- More: Settings, Feedback and Admin Tools. The old Profile section is intentionally removed.
- Persistent Light / Dark theme and language preference.
- Responsive desktop and portrait/mobile layouts.

## Admin Tools

Admin Tools are intended for Ling Cafe baristas; normal users can ignore this section.

Authentication is handled by `worker.js` through:

- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`

The current demo admin username is configured as `Trent`. The password is compared on the Worker using a SHA-256 hash rather than being stored in the browser bundle.

After login, the header shows a `User / Admin` preview switch.

### Menu backend

Menu data is now server-side and persistent. It is stored in a Cloudflare Durable Object (`MenuStore`) rather than browser `localStorage`, so edits are shared across devices and public visitors.

Public API:

- `GET /api/menu`

Authenticated admin API:

- `POST /api/admin/menu` — add an item
- `PUT /api/admin/menu/:id` — update editable metadata
- `DELETE /api/admin/menu/:id` — delete an item

The Admin Menu editor supports:

- add item
- delete item
- category
- item name
- short note / description
- cost price
- availability today
- inclusion in Home → Popular drinks

Popular drinks are capped at **four** in both the UI and backend validation.

Images are intentionally **not editable from Admin Tools**. Existing image data remains attached to each menu record, while a newly created item receives `menu-placeholder.svg` until its final product image is installed through the GPT-managed image workflow below.

## Product image workflow

Product images are handled separately from normal barista editing so the visual language stays consistent.

1. Add or update the menu metadata in Admin Tools first: category, name, short note, cost price, availability and Popular status.
2. Ask ChatGPT to generate the missing image using the canonical Ling Cafe image style below.
3. Install the generated image for that item separately. Do not expose free-form image editing in the barista Admin UI.

### Canonical Ling Cafe product-image prompt

```text
Create a realistic premium café product photo for the menu of Ling Cafe.

Subject: [PRODUCT_NAME]
Category: [CATEGORY]
Optional details: [OPTIONAL_DETAIL]

Style requirements:
- warm, soft, natural café lighting
- clean, refined, cozy atmosphere
- elegant editorial food photography
- realistic product photo, not illustration
- soft shadows and slightly diffused light
- shallow depth of field
- warm neutral tones that match Ling Cafe's glass / liquid-glass website
- minimal composition with one clear hero item
- no people
- no hands
- no text
- no logo
- no watermark
- no collage
- no busy background

Composition requirements:
- focus on the product as the main subject
- suitable for a menu card or featured drink card
- centered or slightly off-center balanced composition
- square-friendly composition
- visually clean background
- product should be large and clearly visible

Category-specific guidance:
- Coffee / Milk / Non-coffee: show the drink in an attractive cup or glass appropriate for the beverage
- Food: show the food on a clean plate, tray, or café table setting

Output:
- photorealistic
- high quality
- aesthetically consistent with a warm modern café brand
- suitable for direct use on the Ling Cafe website menu
```

### New-product handoff convention

For future menu additions, the preferred handoff is:

```text
Name: ...
Category: ...
Short note: ...
Cost price: ...
Available: yes / no
Popular: yes / no
Optional image detail: ...
```

The metadata can be created first through Admin Tools. ChatGPT then handles the image separately using the established Ling Cafe style.

## Cloudflare Worker

`wrangler.toml` configures:

- the Worker entrypoint
- static assets
- the `MENU_STORE` Durable Object binding
- the initial `MenuStore` migration

This keeps the menu backend self-contained in the Worker deployment; there is no separate D1 database ID to configure.

Before production use, replace the demo session secret and preferably configure admin credentials through Cloudflare secrets / environment variables rather than relying on demo defaults.

## Local static preview

Opening `index.html` directly still previews the fallback static UI, but persistent menu data and admin login require running through the Cloudflare Worker / Wrangler deployment.

## Repository menu photos

Menu photos for items 03–19 are included as individual 4:3 WebP assets in
`menu-images/`. They are deployed with this repository. `worker.js` supplies
these photos for matching catalog items that still have an empty image, the
placeholder, or legacy sprite artwork. Existing admin-uploaded images take
precedence; saved names, prices, availability, Popular status and deleted items
are preserved. The menu catalog version is unchanged.

To replace a repository photo, update its file at the path listed in
`REPOSITORY_MENU_IMAGES` (use a new filename when changing the content to avoid
stale browser caches), then deploy. Admin uploads continue to override these
defaults. The two Specials images are illustrative serving concepts; confirm
the final recipes before treating them as exact product representations.

## English / 中文 interface

The Language capsules in More → Settings switch the full interface and persist
`ling-glass-language` on the current device. `i18n.js` owns the reviewed Chinese
copy, including the 19 catalog drinks, navigation, preferences, schedule,
admin labels and errors. English remains the default. Existing custom menu
names/descriptions and staff names retain their original content unless a
translation is explicitly added to the dictionary.

Translations update text nodes and accessible labels without replacing form
controls or changing API records, filter values, admin input values, or drafts.
An observer handles asynchronously rendered UI and restores the original
English on language changes. Add `translate="no"` to any literal content that
must never be translated. Support paragraphs use their existing bilingual
panes; dates are formatted with the selected locale. Preference card exports
use the selected language as well.

Chinese typography uses system CJK fonts, roomier line heights, compact
headings and wrapping controls. The shared footer keeps Trent's copyright,
author credit and source link on a small transparent glass surface.

Translation regression checks (Node.js plus jsdom installed outside this repo):

```sh
npm install --prefix ../ling-test-deps --no-audit --no-fund jsdom@26
NODE_PATH=../ling-test-deps/node_modules node --test tests/i18n.test.cjs
```
