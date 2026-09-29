# rap/ui — component conventions

Read this before adding a component. The reference implementations are
`Input`, `Select`, `Checkbox`, `Slider`, `ToggleGroup`, `Label`
(in `src/rapui/components/`) and their doc entries in `src/docs/entries/forms.tsx`.

## Stack (same base as shadcn/ui)

- **Behaviour/accessibility:** Radix primitives from the unified `radix-ui` package
  (`import { Dialog as DialogPrimitive } from "radix-ui"`). Never re-implement focus traps,
  menus, popovers or keyboard handling by hand.
- **Specialised pieces:** `react-day-picker` (calendar), `cmdk` (command / combobox),
  `sonner` (toasts), `vaul` (drawer), `input-otp`, `embla-carousel-react`,
  `react-resizable-panels`, `@tanstack/react-table`, `recharts`, `date-fns`, `lucide-react` icons.
  Several are new majors — read the `.d.ts` in `node_modules` before using an API from memory.
- **Styling:** plain CSS, one `.css` per component, imported at the top of the `.tsx`.
  No Tailwind, no CSS-in-JS. Every colour, radius, height and duration comes from a token in
  `src/rapui/styles/tokens.css`.

## API shape

- shadcn-style composable parts: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`…
  Thin wrappers around the primitive, `forwardRef`, `className` merged with `cx()`, rest props spread.
- Sizes are `size?: "sm" | "md" | "lg"` (default `md`), variants are `variant?: …`.
- Export from the group barrel in `src/rapui/groups/<group>.ts` (not from `index.ts`).

## Look (Readymag-inspired)

- One typeface: `var(--rap-font-sans)` (Onest). No italics, no serif, no uppercase labels.
  Labels/captions: 0.8125–0.9375rem, weight 500, `letter-spacing: -0.01em`, `color: var(--rap-mute)` for secondary.
- Round: single-line controls are pills (`--rap-radius-pill`), heights
  `--rap-control-h-sm/-h/-h-lg` (36/44/52). Floating surfaces 20px radius; cards and dialogs `--rap-radius` (28px).
  Menu rows 14px radius. Nothing square.
- Filled, not outlined: controls sit on `--rap-fill` (hover `--rap-fill-hover`), focus is
  `box-shadow: inset 0 0 0 2px var(--rap-ring)`. Use `--rap-line` hairlines sparingly.
- Selection/“on” = `--rap-select` (blue) with `--rap-select-ink` text. Active nav/segments = ink on paper.
  Destructive = `--rap-danger`. Success/warning = `--rap-success` / `--rap-warning`.
- Tight: related controls sit `var(--rap-gap-tight)` (2px) apart, tiles `var(--rap-gap-tile)` (4px).
- Flat: no shadows except floating surfaces (`--rap-shadow-pop`).
- Motion: `--rap-ease-rm` for state changes, `--rap-ease-out` for entrances, `--rap-ease-spring` for small pops.
  Durations `--rap-dur-fast` (220ms) / `--rap-dur` (550ms). Respect reduced motion (tokens drop to 0).
- Dark theme: `[data-rap-theme="dark"]` swaps the tokens. Do not hard-code light-only colours.

## Shared classes (`src/rapui/styles/surfaces.css`)

- `.rap-pop` — any floating panel (popover, menu, select list, hover card, tooltip body): surface, radius, shadow, enter/exit animation keyed off Radix `data-state`.
- `.rap-menu-item`, `.rap-menu-label`, `.rap-menu-separator`, `.rap-menu-shortcut` — rows in any menu/list. Highlight uses Radix `data-highlighted`.
- `.rap-scrim` — the dim layer behind dialogs and sheets.

## Docs entries

Each component gets a `DocEntry` (`src/docs/types.ts`) in `src/docs/entries/<group>.tsx`:
`slug`, `name`, `group` (sidebar section), `description` (1–2 plain sentences), optional `basedOn`,
`controls` (the settings panel), `Demo` (receives `p`, may use hooks), `code(p)` (snippet for the current
settings; use `attrs()` from `../codegen`), optional `examples`.
Use realistic content (studio/design-tool flavoured), never lorem ipsum.
Demo layout helpers: `.doc-row`, `.doc-stack`, `.doc-between`, `.doc-muted`, `.doc-kbd`.
