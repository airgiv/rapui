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

70 components, browsable with live settings at **`#docs`** on the preview site (sidebar on the left, component with its settings panel on the right, generated code below).

| Group | Components |
| --- | --- |
| Actions | Button (7 variants), ButtonGroup, CircleButton, BigLink |
| Forms | Input, Textarea, Select, Combobox, Checkbox, RadioGroup, Switch, Toggle, ToggleGroup, Slider, NumberField, InputOTP, Calendar, DatePicker, FormField, Label, Giant field |
| Overlays | Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu, Menubar, Command |
| Navigation | Tabs, Breadcrumb, Pagination, NavigationMenu, Sidebar, Stepper |
| Data display | Table, DataTable, Card, Badge, Avatar, Chart, Kbd, Separator, AspectRatio, EmptyState |
| Feedback | Alert, Toast, Progress, Skeleton, Spinner |
| Layout | Accordion, Collapsible, Resizable, ScrollArea, Carousel |
| Expressive | Typography, Sticker, Marquee, RotatingBadge, SplitReveal, RollText, TiltCard, FeatureCard, Counter, Magnetic, Animated tabs, Checklist, CanvasToolbar |

### Stack

The same technical base as shadcn/ui: **Radix UI** primitives for behaviour and accessibility, plus `react-day-picker`, `cmdk`, `sonner`, `vaul`, `input-otp`, `embla-carousel-react`, `react-resizable-panels`, `@tanstack/react-table`, `recharts` and `lucide-react`. Styling is plain CSS on design tokens (like Mantine), one stylesheet per component, no Tailwind. See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) before adding a component.

Tokens live in `src/rapui/styles/tokens.css`. That file holds the colours (`--rap-paper`, `--rap-ink`, `--rap-flame #EC520B`, `--rap-blue #0582FF`, `--rap-plum`, `--rap-acid`…), control heights and fills, fluid type sizes, radii, the 2px / 4px gaps between controls and tiles, and Readymag's `cubic-bezier(.4,.24,.4,1)` easing. For dark mode, set `data-rap-theme="dark"` on `<html>`.

## Layout

```
src/rapui/components/  the library (one .tsx + .css per component)
src/rapui/groups/      barrels per docs group
src/rapui/styles/      tokens, base, shared floating-surface classes
src/docs/              docs entries (one file per group), types, code generator
src/site/              the preview site: landing (#top) and the explorer (#docs)
```

## Credits

- `Checklist` and `CanvasToolbar` are adapted from [Bencho](https://bencho.dev), MIT licence (bencho.dev/licence). Their stylesheets map Bencho's design tokens onto rap/ui's; see the header of each `.css` file.
- Fonts via Fontsource (OFL).
