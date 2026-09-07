# Ling Coffee — glass redesign prototype

This repository contains the current glass / liquid-glass prototype for Ling Cafe.

## Current user-facing flows

- Home: opening state, today’s barista schedule, Order shortcut, Popular drinks, IN OUR MIND.
- Menu: categories, menu cards and Personal Preference. Pickup reservation is intentionally hidden for now.
- Personal Preference: drink preferences, downloadable preference card.
- Schedule: date-based shifts and barista roster. Admin editing logic for Schedule will be defined separately.
- More: Settings, Feedback and Admin Tools. The old Profile section is intentionally removed.
- Persistent Light / Dark theme.
- Responsive desktop and portrait/mobile layouts.

## Admin Tools

Admin Tools are intended for Ling Cafe baristas; normal users can ignore this section.

Authentication is handled by `worker.js` through:

- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`

The current demo admin username is configured as `Trent`. The password is compared on the Worker using a SHA-256 hash rather than being stored in the browser bundle.

After login, the header shows a `User / Admin` preview switch. The Menu editor currently supports:

- item name
- short note / description
- suggested donation amount
- photo URL
- inclusion in Home → Popular drinks (maximum four)

For this prototype, menu content edits are persisted in the current browser with `localStorage` so the barista can immediately preview the user-facing result. Server-side menu persistence can be connected later (for example with Cloudflare KV or D1) once the content model is finalized.

## Product image workflow

Product-image prompting should **not** be exposed in the Admin UI. The intended workflow is:

1. Add the new menu item metadata first: name, category, short note, suggested donation, and Popular-drink status.
2. Ask ChatGPT to generate the missing product image using the canonical Ling Cafe image style below.
3. Save the generated image locally and add it to the project / menu item.

When requesting a new product image, providing the product name plus any important visual detail is enough. ChatGPT should preserve the visual language below unless explicitly asked otherwise.

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

For future menu additions, the preferred handoff is simply:

```text
Name: ...
Category: ...
Short note: ...
Suggested donation: ...
Popular: yes / no
Optional image detail: ...
```

The image can then be generated separately by ChatGPT in the established Ling Cafe style, so the menu-data workflow does not need to include an image URL or custom prompt each time.

## Cloudflare Worker

`wrangler.toml` configures the Worker and static assets binding. The Worker serves the existing static site and handles `/api/*` routes first.

Before production use, replace the demo session secret and preferably configure admin credentials through Cloudflare secrets / environment variables rather than relying on demo defaults.

## Local static preview

Opening `index.html` directly still previews the UI, but backend admin login requires running through Cloudflare Worker / Wrangler.
