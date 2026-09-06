# Ling Coffee — glass redesign static demo

This is a presentation-layer prototype based on the current repository's public information architecture and core user-facing flows:

- Home: opening hours, today’s schedule, Menu / Schedule shortcuts, IN OUR MIND
- Menu: categories, availability, suggested donation amount, cart, pickup reservation
- Schedule: date-based shifts with the Cafe row as the reference timeline, plus barista roster / summon action
- More: profile / preferences / reservation history, settings, feedback, barista/admin access preview
- Persistent Light / Dark theme
- Responsive desktop and portrait/mobile layouts

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Notes

- Static prototype only: reservation, feedback and staff login are local front-end interactions.
- The café and menu photography is loaded from Unsplash URLs, so an internet connection is needed for those images.
- The visual direction intentionally moves from the repository's restrained editorial presentation toward a full-background warm glassmorphism system, while keeping the same core information architecture and Tiffany accent for brand continuity.
