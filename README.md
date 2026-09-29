# rap/ui

A fancy but clean React component kit in the spirit of Readymag: cool grey paper, white cards, soft ink, an orange + blue signal pair, one typeface set big, round shapes, and controls packed edge to edge.

## Run the preview site

```bash
npm install
npm run dev        # http://localhost:5173
```

## Use it

```tsx
import "rapui/styles.css";
import "rapui/fonts"; // Onest (+ Geist Mono for code)

import { Button, ButtonGroup, Display, Accent, Cursor } from "rapui";

<div className="rap-root">
  <Cursor />
  <Display size="mega">Loud <Accent>interfaces</Accent></Display>
  <ButtonGroup>
    <Button size="lg" variant="blue" icon>Start a project</Button>
    <Button size="lg" variant="soft">Pricing</Button>
  </ButtonGroup>
</div>
```

`npm run build:lib` writes `dist/index.js`, `dist/fonts.js`, `dist/rapui.css` and the type declarations.

## What's inside

| Group | Components |
| --- | --- |
| Type | `Display` (md → mega), `Accent`, `Eyebrow`, `Lead`, `Highlight`, `RollText`, `SplitReveal` |
| Actions | `Button` (solid / accent / blue / soft / acid / outline / ghost), `ButtonGroup`, `CircleButton`, `BigLink`, `Magnetic` |
| Surfaces | `FeatureCard`, `TiltCard`, `Sticker`, `RotatingBadge`, `Marquee` |
| Inputs | `Field`, `Switch`, `Tabs`, `Accordion`, `Checklist`, `CanvasToolbar` |
| Ambient | `Counter`, `Cursor`, `Grain` |

Tokens live in `src/rapui/styles/tokens.css`. That file holds the colours (`--rap-paper`, `--rap-ink`, `--rap-flame #EC520B`, `--rap-blue #0582FF`, `--rap-plum`, `--rap-acid`…), fluid type sizes, radii, the 2px / 4px gaps between controls and tiles, and Readymag's `cubic-bezier(.4,.24,.4,1)` easing. For dark mode, set `data-rap-theme="dark"` on `<html>`.

## Layout

```
src/rapui/            the library (one .tsx + .css per component)
src/rapui/styles/     tokens + opt-in base
src/site/             the preview site
```

## Credits

- `Checklist` and `CanvasToolbar` are adapted from [Bencho](https://bencho.dev), MIT licence (bencho.dev/licence). Their stylesheets map Bencho's design tokens onto rap/ui's; see the header of each `.css` file.
- Fonts via Fontsource (OFL).
