# rapui

All the components, none of the boring. A React component kit with the breadth of shadcn/ui on the same Radix + Tailwind v4 base: cool grey paper, white cards, soft ink, an orange + blue signal pair, one typeface set big, round shapes, controls packed edge to edge — and a lot of small delight.

**Site and live docs: [rapui.dev](https://rapui.dev)**

## Run the preview site

```bash
npm install
npm run dev        # http://localhost:5173
```

## Use it

```bash
npm i @rapui/react
```

React 18 or 19. Every runtime dependency (Radix, framer-motion, recharts…) installs with it; the package is split per component, so your bundle only carries what you import.

**Plain app (no Tailwind needed):**

```tsx
import "@rapui/react/styles.css"; // precompiled theme + utilities; resets only inside rapui parts, never your app
import "@rapui/react/fonts";      // Onest (+ Geist Mono for code)

import { Button, ButtonGroup, Display, Accent, SoundProvider } from "@rapui/react";

<SoundProvider enabled={false}>
  <Display size="mega">Loud <Accent>interfaces</Accent></Display>
  <ButtonGroup>
    <Button size="lg" variant="blue" icon>Start a project</Button>
    <Button size="lg" variant="soft">Pricing</Button>
  </ButtonGroup>
</SoundProvider>
```

Put `className="rap-root"` on `<body>` (or your app's root) for rapui's paper background, ink colour and font on the whole page. Dark theme: `data-rap-theme="dark"` on `<html>`. Calmer motion everywhere: `data-rap-motion="calm"`.

**App already on Tailwind v4** — use the rapui theme in your own build instead:

```css
@import "tailwindcss";
@import "@rapui/react/theme.css";          /* tokens → bg-surface, text-ink, rounded-pill, fun:, calm: … */
@source "../node_modules/@rapui/react/dist";
```

Then `bg-surface`, `text-ink`, `rounded-pill`, `h-control`, `ease-rm`, `animate-hop`, `fun:`/`calm:` are available in your own components too.

`npm run build:lib` writes `dist/index.js`, `dist/icons.js`, `dist/fonts.js`, `dist/rapui.css`, `dist/theme.css` and the type declarations.

## What's inside

110 components, browsable with live settings at **[rapui.dev/#docs](https://rapui.dev/#docs)** (sidebar on the left, component with its settings panel on the right, generated code below).

| Group | Components |
| --- | --- |
| Actions | Button (7 variants), ButtonGroup, CircleButton, BigLink, HoldButton, SlideButton, ConfirmButton, FormStack |
| Forms | Input, Textarea, Select, Combobox, Checkbox, RadioGroup, Switch, Toggle, ToggleGroup, Slider, NumberField, Rating, InputOTP, Calendar, DatePicker, FormField, Label, Giant field |
| Overlays | Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu, Menubar, Command |
| Navigation | Tabs (`Tabs` with `items`, or shadcn-style `TabsRoot` + `TabsList` / `TabsTrigger` / `TabsContent`), Breadcrumb, Pagination, NavigationMenu, Sidebar, Stepper |
| Scrubbers | TimeScrubber, DateScrubber, RangeDial, Knob, WheelPicker, ElasticSlider, ScrubNumber, TempoDial, HueRing, LensRuler, SplitSlider |
| Data display | Table, DataTable, Card, Badge, Avatar, Kbd, Separator, AspectRatio, EmptyState |
| Charts | Chart (Recharts), BalanceChart, Sparkline, BarsChart, DonutChart, GaugeChart, HeatGrid, RaceBars, ProgressTicks, ChartKit parts |
| Galleries | TiltGallery, CardStack, WarpStrip, ShapeGallery, FanGallery, Lightbox |
| Media | AudioPlayer, Playlist, VideoPlayer, VoiceNote |
| Feedback | Alert, Toast, Progress, Skeleton, Spinner |
| Layout | Pattern (dots, grid, lines, cross, checker, stripes, waves), Accordion, Collapsible, Resizable, ScrollArea, Carousel |
| Expressive | Typography, Sticker, Marquee, RotatingBadge, SplitReveal, RollText, TiltCard, FeatureCard, Counter, Magnetic, Animated tabs, Checklist, CanvasToolbar |

### Stack

The same technical base as shadcn/ui: **Radix UI** primitives, **Tailwind CSS v4** with `cn()` (clsx + tailwind-merge) and `cva` variants, `data-slot` on every part, plus `react-day-picker`, `cmdk`, `sonner`, `vaul`, `input-otp`, `embla-carousel-react`, `react-resizable-panels`, `@tanstack/react-table` and `recharts`. Icons: Hugeicons (Stroke Rounded, medium stroke) for interface glyphs, Solar Bold Duotone for illustrative spots. Motion runs on one shared spring; optional interface sound is synthesised with Web Audio. See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) before adding a component.

Tokens live in `src/rapui/styles/tokens.css`. That file holds the colours (`--rap-paper`, `--rap-ink`, `--rap-flame #FF5B1A`, `--rap-blue #0582FF`, `--rap-plum`, `--rap-acid`…), control heights and fills, fluid type sizes, radii, the 2px / 4px gaps between controls and tiles, and the house `cubic-bezier(.4,.24,.4,1)` easing. For dark mode, set `data-rap-theme="dark"` on `<html>`.

## Layout

```
src/rapui/components/  the library (one .tsx per component; a small layered .css only for keyframes/@property)
src/rapui/groups/      barrels per docs group
src/rapui/styles/      tokens.css (CSS variables), theme.css (Tailwind @theme, variants, shared utilities)
src/docs/              docs entries (one file per group), types, code generator
src/site/              the preview site: landing (#top) and the explorer (#docs)
```

## Credits

- `Checklist` and `CanvasToolbar` are adapted from [Bencho](https://bencho.dev), MIT licence (bencho.dev/licence). Their stylesheets map Bencho's design tokens onto rapui's; see the header of each `.css` file.
- Fonts via Fontsource (OFL).
