# rap/ui

A fancy, airy, editorial React component kit. It looks like Readymag: cool grey paper, white cards, soft ink, and an orange + blue signal pair. The type is set huge, the air generous, the buttons unusual, and a lot of it moves.

## Run the preview site

```bash
npm install
npm run dev        # http://localhost:5173
```

## Use it

```tsx
import "rapui/styles.css";
import "rapui/fonts"; // Bricolage Grotesque, Instrument Serif, Inter Tight, JetBrains Mono

import { Button, Display, Serif, Cursor } from "rapui";

<div className="rap-root">
  <Cursor />
  <Display size="mega">Loud <Serif>interfaces</Serif></Display>
  <Button size="xl" variant="blue" icon magnetic>Start a project</Button>
</div>
```

`npm run build:lib` writes `dist/index.js`, `dist/fonts.js`, `dist/rapui.css` and the type declarations.

## What's inside

| Group | Components |
| --- | --- |
| Type | `Display` (md → mega), `Serif`, `Eyebrow`, `Lead`, `Highlight`, `RollText`, `SplitReveal` |
| Actions | `Button` (solid / accent / blue / acid / outline / ghost), `CircleButton`, `BigLink`, `Magnetic` |
| Surfaces | `FeatureCard`, `TiltCard`, `Sticker`, `RotatingBadge`, `Marquee` |
| Inputs | `Field`, `Switch`, `Tabs`, `Accordion`, `Checklist`, `CanvasToolbar` |
| Ambient | `Counter`, `Cursor`, `Grain` |

Tokens live in `src/rapui/styles/tokens.css`. That file holds the colours (`--rap-paper`, `--rap-ink`, `--rap-flame #EC520B`, `--rap-blue #0582FF`, `--rap-plum`, `--rap-acid`…), fluid type sizes, radii and Readymag's `cubic-bezier(.4,.24,.4,1)` easing. For dark mode, set `data-rap-theme="dark"` on `<html>`.

## Layout

```
src/rapui/            the library (one .tsx + .css per component)
src/rapui/styles/     tokens + opt-in base
src/site/             the preview site
```

## Credits

- `Checklist` and `CanvasToolbar` are adapted from [Bencho](https://bencho.dev), MIT licence (bencho.dev/licence). Their stylesheets map Bencho's design tokens onto rap/ui's; see the header of each `.css` file.
- Fonts via Fontsource (OFL).
