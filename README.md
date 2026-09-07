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

## Cloudflare Worker

`wrangler.toml` configures the Worker and static assets binding. The Worker serves the existing static site and handles `/api/*` routes first.

Before production use, replace the demo session secret and preferably configure admin credentials through Cloudflare secrets / environment variables rather than relying on demo defaults.

## Local static preview

Opening `index.html` directly still previews the UI, but backend admin login requires running through Cloudflare Worker / Wrangler.
