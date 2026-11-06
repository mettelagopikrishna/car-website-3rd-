# NOCTIS — Scrollytelling Website

> "A city in total blackout at night where the car's light is the only light in the world."

NOCTIS is a fictional electric vehicle brand scrollytelling experience built with pure vanilla HTML, CSS, and JavaScript.

## Highlights
- **Scroll-Scrubbed Canvas Sequences**: Hero grand tourer sequence (448 frames) and dismantle structural sequence (150 frames) rendered at 60fps on `<canvas>`.
- **Pure Vanilla Stack**: Zero frameworks, zero build tools, zero external JavaScript libraries.
- **Strict Aesthetic**: Flat solid colors (`#07080A` asphalt, `#EDEAE4` bone, `#CFE3FF` xenon, `#E1251B` taillight), 1px hairlines, and precision typography (`Archivo`, `Inter`, `JetBrains Mono`). Zero gradients, zero blur, zero drop shadows.
- **Custom Headlight Cursor**: Precision xenon dot and ring following pointer with lerp 0.18, morphing into a 44x2px horizontal light bar with contextual labels (`VIEW`, `RESERVE`, `MENU`, `OPEN`, `CONFIGURE`).
- **Interactive Lineup Accordion**: Horizontal flex accordion featuring 5 vehicles (GT-E, S, X, R, ONE) with smooth transitions, 12px color swatches, and keyboard navigation.
- **Responsive & Accessible**: Dual desktop (1600px) and mobile (960px) frame sets, automatic cover-fit (landscape) and contain-fit (portrait), and full `prefers-reduced-motion` fallbacks.

## Quick Start
Run from any static server or simple Node script:
```bash
node server.js
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

