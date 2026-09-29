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
  `react-resizable-panels`, `@tanstack/react-table`, `recharts`, `date-fns`.
- **Icons:** interface glyphs come ONLY from `src/rapui/icons.tsx` (Phosphor Light underneath, lucide-style
  names: `import { Check, ChevronDown, X } from "../icons"`). Never import an icon package directly.
  Illustrative spots (empty states, feature tiles, milestones, toasts, marketing) use
  `<FancyIcon icon="rocket" tone="flame" />` (Solar Bold Duotone, `components/FancyIcon.tsx`).
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

## Delight — every component has one physical idea

rap/ui is not a neutral admin kit. The reference is the Checklist: tick the last task and the list
falls into a heap. Every component gets **one signature idea** in that spirit — a small piece of
physics or a real-world metaphor (paper, stickers, springs, gravity, jelly, a marble, a key) that
makes the everyday interaction feel alive. Rules:

1. **One idea per component, done properly**, not five flourishes. It must not slow the task down:
   the state change itself is immediate; the delight rides on top of it.
2. **Shared physics.** Use `useSpring` (hooks/useSpring.ts — Bencho's spring), `useGlide`
   (hooks/useGlide.ts — a highlight that travels between items like a caterpillar; see the
   ToggleGroup reference) and the keyframes in `styles/motion.css` (`rap-shake`, `rap-hop`,
   `rap-splat`, `rap-toss-in`, `rap-fall-out`, `rap-deal-in` with `--i`, `rap-float`, `rap-wiggle`)
   and `useReplay()` to re-trigger a keyframe. Prefer the CSS individual properties
   `translate`/`rotate`/`scale` for playful motion so they stack with existing `transform`s.
3. **Respect calm.** Everything playful switches off under `prefers-reduced-motion` and under an
   ancestor with `data-rap-motion="calm"` (add `[data-rap-motion="calm"] .your-class { animation: none; }`
   or skip the JS effect when `closest('[data-rap-motion="calm"]')`).
4. **Comment the why** at the top of the component (like Checklist): what the idea is and why the numbers are what they are.
5. **Document it:** each docs entry's `description` gets a second sentence starting "Delight:" that says
   what to try, and add a boolean control `playful` only if the effect can be toggled per instance.

### The ideas (implement these; improve if you find a better one in the same spirit)

| Component | Idea |
|---|---|
| Input | invalid → the field shakes "no" (`rap-shake`) each time `invalid` turns on; focus ring draws itself around the pill (conic/mask sweep) instead of snapping on |
| Textarea | height follows content on a spring (overshoots a hair); counter goes flame and hops when over the limit |
| Select | options are dealt in (stagger); the chosen value rolls into the trigger (old text slides up, new from below) |
| Combobox | as Select; matched characters get an acid marker swipe |
| Checkbox | press squashes the box; the tick is drawn (stroke-dashoffset) on a spring and the box swells past full like the Checklist |
| RadioGroup | ONE marble: a single dot leaves the old circle and hops in an arc into the new one (useSpring for x, arc via sin) |
| Toggle | a physical key: pressed sinks 2px with an inset shade and stays down while on |
| Slider | thumb squashes in the direction of travel by velocity; a value bubble pops above it while dragging and swings like a pendulum |
| NumberField | digits roll like an odometer; hitting min/max bonks (small shake) |
| InputOTP | each filled slot hops; on complete the slots do a wave; `invalid` shakes the row |
| Calendar | picking a day splats the circle and sends a ripple through neighbouring days (delay ∝ grid distance); month change slides the page with a slight turn |
| DatePicker | the popover lands like a sticky note (tilted, settles on a spring) |
| FormField | error appears with a shake of the field and slides the message down |
| Dialog / AlertDialog | tossed onto the table on open (`rap-toss-in`), falls away under gravity on close (`rap-fall-out`); the AlertDialog's danger action trembles slightly on hover |
| Sheet | slides in with spring overshoot; body children are dealt in |
| Drawer | the grab handle stretches while dragging |
| Popover / HoverCard | pop out of the trigger with a spring and a small tilt toward the side they open to; HoverCard tilts toward the pointer |
| Tooltip | pops with overshoot and the arrow wags once |
| DropdownMenu / ContextMenu / Menubar / Command | rows are dealt in; ONE highlight glides between rows (useGlide, axis y) instead of each row lighting up |
| Badge | when its content changes it hops; the `dot` breathes when live |
| Avatar | AvatarGroup fans out on hover (spreads on a spring), each face lifts under the pointer |
| Table / DataTable | one row highlight glides between rows; on sort, rows move to their new places (FLIP with the spring) |
| Chart | lines draw in, bars grow with a staggered bounce, the tooltip follows on a spring |
| Kbd | presses down when that key is actually pressed on the keyboard |
| Separator | the line draws from the centre out to both sides when it scrolls into view |
| EmptyState | its FancyIcon floats; the action wiggles once after a pause |
| Alert | dismiss makes it fall off like a Checklist slip (`rap-fall-out`) before it collapses |
| Toast | toasts land as a slightly rotated pile of stickers (alternate ±1.5°); swipe-dismiss flings with rotation |
| Progress | the bar's leading edge is a soft blob that squashes when it moves; reaching 100% makes it splat |
| Skeleton | shimmer is a soft diagonal light |
| Spinner | a squishy dot orbiting (stretches along its path) instead of a plain arc |
| Tabs (product) / Pagination / Sidebar / NavigationMenu | the active pill or underline travels with `useGlide` (caterpillar) |
| Stepper | completing a step fills the connector like liquid, then the next circle splats and the check draws |
| ScrollArea | the thumb squashes against the ends when you overscroll |
| Resizable | the grip stretches while dragging |
| Collapsible | children are dealt in as it opens |
| Carousel | slides lean with drag velocity; the active dot stretches into a pill (useGlide) |
