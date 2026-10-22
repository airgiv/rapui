import { useRef, useState, type ReactNode } from "react";
import {
  Accent,
  BalanceChart,
  BarsChart,
  Button,
  CircleButton,
  ConfirmButton,
  Cursor,
  Display,
  DonutChart,
  HoldButton,
  Input,
  RollText,
  SlideButton,
  Slider,
  Sparkline,
  SplitReveal,
  Sticker,
  Switch,
  Sheet,
  SheetContent,
  SheetTitle,
  Tabs,
  TiltCard,
  CardStack,
  Lightbox,
  useLightbox,
  useSound,
  Counter,
  Rating,
  type SoundSettings,
} from "../rapui";
import { ArrowLeft, ArrowRight, Menu } from "../rapui/icons";
import { cn } from "../rapui/utils";
import { Code } from "./Code";
import { SoundControls } from "./SoundControls";
import { Wordmark } from "./Wordmark";
import { PresetPicker, PresetScope, PresetsSection } from "./PresetsShowcase";
import { LandingCards } from "./LandingCards";
import { usePauseOffscreen } from "./usePauseOffscreen";
import "./fonts";
import type { RapPreset } from "../rapui";
import { FormDemo } from "./demos/FormDemo";
import { ART } from "../docs/entries/galleries";

/* How many components the docs list. Kept by hand so the landing does not pull
   the docs registry (and every demo in it) into the first bundle. */
const COUNT = 162;

/* ───────────────────────── shared class strings ───────────────────────── */

/* a white stage with a grey dot grid, the canvas feel of an editor */
const DOTS = "bg-paper-2 [background-image:radial-gradient(circle,var(--rap-line)_1.3px,transparent_1.6px)] [background-size:22px_22px] [background-position:center]";
/* body copy under a section title */
const COPY = "m-0 text-ink-2 text-[1.15rem] leading-[1.5] max-w-[46ch] [&_code]:bg-paper-2 [&_code]:py-[0.1em] [&_code]:px-[0.35em] [&_code]:rounded-[6px] [&_code]:text-[0.9em]";

/* ───────────────────────── layout pieces ───────────────────────── */

const NAV = [
  ["#docs", "Docs"],
  ["#wall", "Components"],
  ["#start", "Start here"],
  ["#tech", "Under the hood"],
  ["#install", "Install"],
] as const;

function Header({
  dark,
  setDark,
  sound,
  setSound,
}: {
  dark: boolean;
  setDark: (v: boolean) => void;
  sound: SoundSettings;
  setSound: (v: SoundSettings) => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    // An inverted bar: the header carries the OPPOSITE theme, so its own paper is
    // the page's ink (black on the light page, near-white on the dark one) and every
    // control inside — switches, the sound toggle, the button — redraws itself for
    // that ground with no special cases. Taller and wider than the old pill.
    <header
      data-rap-theme={dark ? "light" : "dark"}
      className={cn(
        "fixed top-2.5 inset-x-[max(0.625rem,calc(var(--gutter)/2))] z-100 flex items-center justify-between gap-6 h-20 pr-3 pl-7 max-[480px]:gap-2 max-[480px]:pl-5 max-[480px]:h-16",
        "rounded-pill bg-paper text-ink",
      )}
    >
      {/* Optically centred on the x-height, not on the box: the p's tail makes the
          mark's box 35% taller than its letters, so box-centring floats the word high.
          The letters' middle is at 18.4 of 50 units, so it drops by 0.13em. */}
      <a href="#top" className="flex items-center text-[2.1rem] max-[480px]:text-[1.6rem]" data-rap-cursor="Home" aria-label="rapui, back to top">
        <Wordmark className="translate-y-[0.13em] align-baseline" />
      </a>
      {/* a soft pill behind the link on hover — the same shape as everything else in
          the bar — instead of rolling letters; the words sit a pixel high to meet the
          optical middle of the lowercase logo */}
      <nav className="flex gap-1 text-[1.05rem] font-medium max-[1180px]:hidden">
        {NAV.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="px-4 h-11 flex items-center whitespace-nowrap leading-none -translate-y-px rounded-pill transition-colors duration-200 hover:bg-ink/12 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {label}
          </a>
        ))}
      </nav>
      {/* on a phone everything packs a little tighter so the header pill fits; the
          sound switch (no room for its word) moves into the menu, where it is labelled */}
      <div className="flex items-center gap-3 max-[480px]:gap-2">
        <span className="contents max-[1180px]:hidden">
          <SoundControls value={sound} onChange={setSound} />
        </span>
        <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        <Button size="md" icon className="max-[1180px]:hidden" onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
          Get it
        </Button>
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Menu"
          className="hidden max-[1180px]:grid place-items-center size-11 rounded-full bg-ink text-paper transition-transform active:scale-90 [&_svg]:size-5"
        >
          <Menu />
        </button>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="right" className="gap-6 [--sheet-size:360px]" data-rap-theme={dark ? "dark" : "light"}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <nav className="flex flex-col pt-10">
            {NAV.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenu(false)}
                className="py-2 text-[2.2rem] font-medium tracking-[-0.04em] leading-[1.05] transition-colors hover:text-flame"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-5">
            <label className="flex items-center justify-between text-[1.05rem] font-medium">
              <span>Sound effects</span>
              <Switch checked={sound.enabled} onCheckedChange={(enabled) => setSound({ ...sound, enabled })} />
            </label>
            <Button
              size="lg"
              icon
              className="w-full justify-between"
              onClick={() => {
                setMenu(false);
                document.getElementById("install")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get it
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

/* ── the hero ─────────────────────────────────────────────────
   A poster, not a slogan with props around it: the claim in two
   huge lines across the full width, and under it a bento of colour
   blocks that fills the rest of the screen — the pitch on ink, and
   four live components on flame, acid, sky and white, each one ready
   to be pressed, flipped, held or scrubbed. The blocks are dealt in
   on load; nothing drifts, nothing cycles. */
const HEAD = "font-display font-medium tracking-[-0.055em] text-[clamp(2.8rem,7.6vw,8.4rem)] leading-[0.9]";
const TILE = "relative grid place-items-center min-h-[15rem] p-6 rounded-lg overflow-hidden";

/* Fun mode, as a mouth. The switch sits dead centre with its label under it, and
   the mouth is drawn around it: fun on, a wide white smile UNDER the switch; fun off,
   the smile is erased — rubbed out from its left end — and a frown of the same width
   is drawn ABOVE the switch, from the right, bowing up. Switch on and it runs in
   reverse. One trick for both: pathLength=1 and a dash sliding along the line.
   Serious mode also drains the tile — sky blue fades to a flat grey — so the
   switch renders its own tile. */
function HeroSwitch() {
  const [on, setOn] = useState(true);
  const line = (visible: boolean, hidden: number) => ({
    strokeDasharray: "1 1.2", // the gap is longer than the line, and the hidden offsets overshoot it: no stray round-cap dot
    strokeDashoffset: visible ? 0 : hidden,
    transition: `stroke-dashoffset ${visible ? 520 : 380}ms var(--rap-ease-${visible ? "out" : "in-out"}) ${visible ? 300 : 0}ms`,
  });
  const ARC = "w-[min(100%,15rem)] overflow-visible";
  return (
    <div
      className={cn(TILE, "[--i:3] text-[#282828] transition-colors duration-500 ease-out", on ? "bg-sky" : "bg-[#d4d4d0]")}
      data-rap-theme="light"
    >
      <div className="flex w-full flex-col items-center gap-3">
        {/* frown, above: drawn from the right */}
        <svg viewBox="0 0 300 70" className={ARC} aria-hidden>
          <path d="M286 62 Q150 -22 14 62" pathLength={1} fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" style={line(!on, 1.05)} />
        </svg>
        <Switch size="lg" checked={on} onCheckedChange={setOn} label={on ? "Fun mode" : "Serious mode"} />
        {/* smile, below: drawn left to right, erased from the left */}
        <svg viewBox="0 0 300 70" className={ARC} aria-hidden>
          <path d="M14 8 Q150 92 286 8" pathLength={1} fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" style={line(on, -1.05)} />
        </svg>
      </div>
    </div>
  );
}

/* The white tile: the Rating, big — a row of five flame stars as wide and heavy in
   its tile as the hold button, the sticker and the switch are in theirs. Raise the
   score and the new stars stamp in one by one; the clicked one throws sparks. */
function HeroRating() {
  return <Rating defaultValue={4} size="clamp(2.25rem, 3.8vw, 3.5rem)" className="text-flame" aria-label="Rate rapui" />;
}

function Hero() {
  return (
    <section className="relative min-h-svh pt-32 px-(--gutter) pb-14 flex flex-col gap-10 max-[900px]:pt-28" id="top">
      <h1 className={cn("m-0", HEAD)}>
        <span className="block">
          All the <span className="text-flame">UI components,</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-[0.22em]">
          none of the
          <Sticker color="blue" rotate={-7} size="clamp(1rem, 2.4vw, 2.3rem)" className="px-[0.9em] py-[0.35em] tracking-normal">
            boring
          </Sticker>
          bits.
        </span>
      </h1>

      <div className="deal grid flex-1 grid-cols-4 auto-rows-[minmax(15rem,1fr)] gap-tile max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
        {/* the buttons' hover fill is the tile's own paper (resolved here, in the page's theme,
            before the buttons switch to light), so it never sinks into the ink tile */}
        <div className={cn(TILE, "[--i:0] col-span-2 row-span-2 bg-ink text-paper place-items-stretch p-[clamp(1.5rem,3vw,3rem)] max-[560px]:col-span-1 [--tile-fill:var(--rap-paper)] [--tile-fill-fg:var(--rap-ink)]")}>
          <div className="flex flex-col justify-between gap-10">
            <p className="m-0 text-[clamp(1.25rem,1.9vw,1.9rem)] leading-[1.3] tracking-[-0.02em] font-medium max-w-[30ch]">
              Everything you would reach for in shadcn/ui, on the same Radix + Tailwind base — plus the things it never shipped:
              hold-to-delete buttons, liquid forms, charts you scrub, galleries you throw. Bring a boring screen; we will rapui it.
            </p>
            <div className="flex flex-wrap items-center gap-tight [&_[data-slot=button]]:[--btn-blob:var(--tile-fill)] [&_[data-slot=button]]:[--btn-blob-fg:var(--tile-fill-fg)]" data-rap-theme="light">
              <Button size="lg" variant="accent" icon onClick={() => (window.location.hash = "docs")}>
                Browse all {COUNT}
              </Button>
              <Button size="lg" variant="soft" onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
                npm i @rapui/react
              </Button>
            </div>
          </div>
        </div>
        <div className={cn(TILE, "[--i:1] bg-flame")}>
          {/* the liquid is acid, not the button's default flame: flame on a flame tile
              left a seam where the pill met the ground */}
          <HoldButton size="lg" variant="ink" doneLabel="Shipped" className="[--hb-fill:var(--rap-acid)] [--hb-fill-fg:#282828]">
            Hold to ship
          </HoldButton>
        </div>
        <div className={cn(TILE, "[--i:2] bg-acid")}>
          <Sticker shape="burst" color="bubble" spin={false} rotate={10} size="1.25rem" className="w-40 text-[#282828]">
            hot
            <br />
            drop
          </Sticker>
        </div>
        <HeroSwitch />
        <div className={cn(TILE, "[--i:4] bg-paper-2")}>
          <HeroRating />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── boring vs rapui ─────────────────────────
   The whole argument as one switch. The left column of each pair is
   what a sensible default kit gives you; flip it and the same props
   land on rapui. Same API is the point, so the code under it does not
   change when you flip. */

/* the "sensible default" skin: small, grey, 4px — drawn by hand so it is nobody's in particular */
const PLAIN_BTN = "h-9 px-4 rounded-[4px] bg-[#18181b] text-white text-[14px] font-medium font-[system-ui,sans-serif]";
const PLAIN_INPUT = "h-9 w-full px-3 rounded-[4px] border border-[#e4e4e7] bg-white text-[14px] text-[#18181b] placeholder:text-[#a1a1aa] font-[system-ui,sans-serif]";
const PLAIN_LABEL = "flex items-center gap-2 text-[14px] font-medium text-[#18181b] font-[system-ui,sans-serif]";

/* "rapui" as a verb: one switch turns a sensible default screen into rapui. Four
   equal tiles, one control each, so the two skins compare like for like — a
   button, a toggle, a field, a slider held to a short, fixed length. Flipping
   the switch tosses the tiles over one after another; the code under them never
   changes, which is the whole argument. */
function SameApi() {
  const [fun, setFun] = useState(true);
  const [on, setOn] = useState(true);
  const [vol, setVol] = useState(60);
  const tiles: { plain: ReactNode; rap: ReactNode }[] = [
    {
      plain: <button className={PLAIN_BTN}>Publish</button>,
      rap: (
        <Button size="lg" icon>
          Publish
        </Button>
      ),
    },
    {
      plain: (
        <label className={PLAIN_LABEL}>
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> Autosave
        </label>
      ),
      rap: <Switch size="lg" checked={on} onCheckedChange={setOn} label="Autosave" />,
    },
    {
      plain: <input className={cn(PLAIN_INPUT, "w-56")} placeholder="Project name" aria-label="Project name" />,
      rap: <Input size="lg" placeholder="Project name" aria-label="Project name" className="w-64" />,
    },
    {
      plain: <input type="range" className="w-44" aria-label="Volume" value={vol} onChange={(e) => setVol(Number(e.target.value))} />,
      rap: (
        <div className="w-60">
          <Slider aria-label="Volume" value={[vol]} min={0} max={100} onValueChange={([v]) => setVol(v)} />
        </div>
      ),
    },
  ];
  return (
    <section className="px-(--gutter) pt-10 pb-24 flex flex-col gap-12" id="same-api">
      <div className="grid grid-cols-[1fr_minmax(0,30rem)] gap-10 items-end max-[900px]:grid-cols-1">
        {/* the switch IS the third line of the headline: as big as the words, so it
            cannot be missed, and pressing it is the sentence's verb */}
        <h2 className="m-0 flex flex-col items-start font-display font-medium tracking-[-0.055em] text-[clamp(2.8rem,7vw,7rem)] leading-[0.92]">
          <span>Same API.</span>
          <span className="text-flame">Just rapui it.</span>
          <GiantToggle on={fun} onChange={setFun} />
        </h2>
        <p className={COPY}>
          If you know shadcn/ui you already know rapui: Radix underneath, <code>cn()</code>, <code>cva</code> variants, a{" "}
          <code>data-slot</code> on every part. Same props on both sides of the switch — only the nerve changes.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-tile w-full max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {/* The tiles stay put — same ground, same size — and only what is inside
            changes: the outgoing control shrinks and blurs away while the incoming one
            grows out of it on the back curve, a little later per tile. The eye follows
            the component turning into the other one, not the cards flickering. */}
        {tiles.map((t, i) => (
          <div key={i} className="grid place-items-center min-h-[16rem] p-8 rounded-lg bg-paper-2 overflow-hidden">
            {([
              [false, t.plain],
              [true, t.rap],
            ] as const).map(([isRap, node]) => {
              const shown = isRap === fun;
              return (
                <div
                  key={String(isRap)}
                  aria-hidden={!shown}
                  className={cn("col-start-1 row-start-1 grid place-items-center", !shown && "pointer-events-none")}
                  style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? "scale(1)" : `scale(${isRap ? 0.6 : 1.3})`,
                    filter: shown ? "blur(0px)" : "blur(8px)",
                    transition: `opacity 320ms ease ${shown ? 120 + i * 60 : i * 40}ms, transform 560ms var(--rap-ease-back) ${shown ? 120 + i * 60 : i * 40}ms, filter 360ms ease ${shown ? 120 + i * 60 : i * 40}ms`,
                  }}
                >
                  {node}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

/* A switch the size of a word. Its track is an em-sized pill so it scales with
   the headline; the knob springs across on the back curve and says what it is. */
function GiantToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const sound = useSound();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="rapui it"
      onClick={() => {
        onChange(!on);
        sound.play(on ? "toggleOff" : "toggleOn");
      }}
      className={cn(
        "relative mt-[0.12em] h-[0.95em] w-[1.9em] rounded-pill cursor-pointer transition-colors duration-300",
        "focus-visible:outline-4 focus-visible:outline-ring focus-visible:outline-offset-4",
        on ? "bg-flame" : "bg-ink/15",
      )}
    >
      <span
        className="absolute top-[0.09em] left-[0.09em] size-[0.77em] rounded-full bg-white grid place-items-center transition-transform duration-500 ease-back"
        style={{ transform: on ? "translateX(0.95em)" : "translateX(0)" }}
      >
        <span className="text-[0.19em] font-sans font-medium tracking-normal leading-none text-[#282828]">{on ? "rapui" : "plain"}</span>
      </span>
    </button>
  );
}

/* The numbers, huge, as plain cards: the figure at the top, the sentence at the
   bottom, nothing else. The figure is the library's Counter — it recounts IN PLACE
   when the card scrolls into view, on an expo ease, so nothing flies in and nothing
   gets clipped: the count counts up, 0 counts down from a hundred, 1 from ten. */
const STAT = "flex flex-col gap-5 min-h-[20rem] justify-between p-[clamp(1.5rem,3vw,2.5rem)] rounded-lg overflow-hidden";
const BIG = "font-display font-medium tracking-[-0.06em] text-[clamp(6rem,11vw,11rem)] leading-[0.92]";
const STAT_TEXT = "m-0 max-w-[24ch] text-[1.2rem] leading-[1.35] opacity-80";

function Stats() {
  const cards = [
    { n: COUNT, from: 0, text: "UI components, from Dialog and DataTable to a button you have to hold.", tone: "bg-flame text-white" },
    { n: 0, from: 100, text: "grey rectangles with 4px corners.", tone: "bg-paper-2" },
    { n: 1, from: 10, text: "attribute to turn every joke off, for the serious screens.", tone: "bg-ink text-paper" },
  ];
  return (
    <section className="grid grid-cols-3 gap-tile px-(--gutter) pb-24 max-[1000px]:grid-cols-1">
      {cards.map((c) => (
        <div key={c.text} className={cn(STAT, c.tone)}>
          {/* proportional digits: tabular ones leave a gap after a 1 */}
          <Counter to={c.n} from={c.from} duration={2000} className={BIG} style={{ fontVariantNumeric: "normal" }} />
          <p className={STAT_TEXT}>{c.text}</p>
        </div>
      ))}
    </section>
  );
}

/* ───────────────────────── the wall ───────────────────────── */

function Showcase({
  id,
  title,
  sub,
  desc,
  code,
  children,
  stageClass,
  presets,
}: {
  id: string;
  title: string;
  sub?: string;
  desc: ReactNode;
  code: string;
  children: ReactNode;
  stageClass?: string;
  /** Offer the style presets: the stage (and only the stage) restyles in place. */
  presets?: boolean;
}) {
  const [preset, setPreset] = useState<RapPreset>("fun");
  const stage = (
    <div className={cn("relative grid place-items-center min-h-[22rem] p-[clamp(1.25rem,4vw,3.5rem)] rounded-lg bg-paper-2 overflow-hidden transition-colors duration-500", stageClass)}>
      {children}
    </div>
  );
  return (
    <section className="pt-16 pb-16 border-t-[1.5px] border-line" id={id}>
      <div className="grid grid-cols-[1fr_minmax(0,28rem)] gap-x-10 gap-y-6 items-end mb-10 max-[900px]:grid-cols-1">
        <Display size="xl">
          <SplitReveal>{title}</SplitReveal> {sub && <Accent tone="mute">{sub}</Accent>}
        </Display>
        <div className="flex flex-col gap-5">
          <p className={COPY}>{desc}</p>
          {presets && <PresetPicker size="sm" value={preset} onChange={setPreset} />}
        </div>
      </div>
      <Tabs
        className="[&_[data-slot=animated-tabs-panel]]:pt-5"
        items={[
          {
            value: "preview",
            label: "Preview",
            content: presets ? <PresetScope preset={preset}>{stage}</PresetScope> : stage,
          },
          { value: "code", label: "Code", content: <Code>{code}</Code> },
        ]}
      />
    </section>
  );
}

function GalleriesDemo() {
  const lb = useLightbox();
  return (
    <>
      <CardStack items={ART} aria-label="Poster pile" onOpen={lb.open} />
      <Lightbox items={ART} {...lb.props} />
    </>
  );
}

function Wall() {
  return (
    <div id="wall" data-pause-split className="px-(--gutter)">
      <Showcase
        id="commit"
        presets
        title="Buttons"
        sub="that make you mean it"
        desc="For the actions you should not do by accident. Hold until the liquid reaches the top, slide the thumb to the rim, or click twice before the ring runs out. Each one with its own springs and sounds."
        code={`import { HoldButton, SlideButton, ConfirmButton } from "@rapui/react";

<HoldButton variant="danger" onConfirm={deleteProject}>Hold to delete</HoldButton>
<SlideButton label="Slide to publish" doneLabel="Published" onConfirm={publish} />
<ConfirmButton label="Delete workspace" confirmLabel="Sure?" onConfirm={remove} />`}
        stageClass={cn(DOTS, "min-h-[34rem]")}
      >
        <div className="flex flex-col items-center gap-10 w-[min(100%,36rem)]">
          <HoldButton variant="danger" size="hero">
            Hold to delete project
          </HoldButton>
          <SlideButton size="hero" variant="ink" label="Slide to publish" doneLabel="Published" />
          <ConfirmButton size="hero" label="Delete workspace" confirmLabel="Sure?" doneLabel="Deleted" />
        </div>
      </Showcase>

      <Showcase
        id="forms"
        presets
        title="Forms"
        sub="that melt"
        desc="A booking you fill in like a sentence. The pills melt into one bar, the one you are typing in swells, booking sucks the whole sentence into the button — and Monday, a party of forty or a 3 am snack get spat back out, the guilty pill shaking its head."
        code={`import { FormStack, Input, Button } from "@rapui/react";

<FormStack direction="row" state={state} errorIndex={error?.index} onSubmit={book}>
  <Input size="hero" prefix="Table for" value={guests} />
  <Input size="hero" prefix="on" value={day} />
  <Input size="hero" prefix="at" value={time} />
  <Button size="hero" variant="accent" type="submit" icon>Book it</Button>
</FormStack>`}
      >
        <FormDemo />
      </Showcase>

      <Showcase
        id="charts"
        presets
        title="Charts"
        sub="you want to touch"
        desc={
          <>
            Minimal cards — one big number, one thin line — that read back under your finger. Scrub the balance, pull it down to
            refresh, spin the donut. Or drop a <Sparkline data={[12, 18, 15, 22, 19, 27, 31]} width={70} height={18} />{" "}
            straight into a sentence.
          </>
        }
        code={`import { BalanceChart, DonutChart, BarsChart, Sparkline } from "@rapui/react";

<BalanceChart />
<DonutChart data={sources} />
<BarsChart />
<Sparkline data={[12, 18, 15, 22, 19, 27, 31]} />`}
        stageClass="bg-paper place-items-stretch"
      >
        {/* one row of three cards, spread edge to edge; two columns, then one, on narrower screens */}
        <div className="grid grid-cols-[repeat(3,auto)] justify-between items-start gap-x-8 gap-y-10 w-full py-6 max-[1180px]:grid-cols-[repeat(2,auto)] max-[1180px]:justify-around max-[760px]:grid-cols-1 max-[760px]:justify-center">
          {/* each chart in its own wrapper: BalanceChart cancels its pull-stretch with a
              negative margin, which a margin set on it directly would undo */}
          <div className="flex justify-center max-w-full">
            <BalanceChart />
          </div>
          <div className="flex justify-center max-w-full">
            <DonutChart />
          </div>
          <div className="flex justify-center max-w-full">
            <BarsChart />
          </div>
        </div>
      </Showcase>

      <Showcase
        id="galleries"
        title="Galleries"
        sub="you throw"
        desc="A messy pile of pictures: fling the top card off and it lands at the bottom, or use the arrows. Click a picture and it flies out full screen — swipe to go on, pull down to put it back."
        code={`import { CardStack, Lightbox, useLightbox } from "@rapui/react";

const lb = useLightbox();

<CardStack items={posters} onOpen={lb.open} />
<Lightbox items={posters} {...lb.props} />`}
      >
        <GalleriesDemo />
      </Showcase>


    </div>
  );
}

/* ───────────────────────── under the hood ─────────────────────────
   The serious half of the pitch: what a team gets that it would
   otherwise build. Each card is a claim and the snippet that proves it. */

const TECH: { title: string; body: ReactNode; code: string; tone?: string }[] = [
  {
    title: "Tailwind v4, tokens first",
    body: "Every colour, radius, height and curve is a CSS variable exposed to Tailwind. Use the precompiled CSS, or import the theme into your own build and get bg-surface, rounded-pill and fun: in your code too.",
    code: `@import "tailwindcss";
@import "@rapui/react/theme.css";

<div className="bg-surface rounded-pill h-control" />`,
  },
  {
    title: "Radix under everything",
    body: "Dialogs, menus, popovers, selects, tabs and sliders sit on Radix primitives: focus traps, roving focus, typeahead, ARIA and Escape all come with them, not from us.",
    code: `import { Dialog, DialogTrigger, DialogContent } from "@rapui/react";
// Radix Dialog, rapui skin`,
  },
  {
    title: "shadcn-shaped API",
    body: "cn() merges your classes, cva holds the variants, every part has a data-slot to style from outside. Moving over is mostly a find-and-replace.",
    code: `<Button variant="soft" className="w-full" />
[data-slot="select-trigger"] { … }`,
  },
  {
    title: "Sound, opt-in",
    body: "A tiny Web Audio synth, no files. One provider switches it on, one number turns it from muted wood to toy. Off by default, silent without the provider.",
    code: `<SoundProvider enabled fun={60}>
  <App />
</SoundProvider>`,
  },
  {
    title: "Calm mode",
    body: "Every playful effect sits behind one variant. Reduced motion is respected automatically; data-rap-motion=\"calm\" turns the jokes off for a whole subtree.",
    code: `<section data-rap-motion="calm">
  {/* same components, no wobble */}
</section>`,
  },
  {
    title: "Dark, typed, tree-shaken",
    body: "A full dark theme from one attribute, TypeScript types for every prop, ESM with side-effect-free modules so you ship only what you import.",
    code: `<html data-rap-theme="dark">
import { Button } from "@rapui/react"; // just Button`,
  },
];

/* A horizontal run of big cards, ~70% of the viewport each, so every claim gets a
   whole slide: the words on the left, the proof on the right, the code wrapped so
   nothing scrolls inside a card. The strip itself scrolls — snap, drag with the
   mouse, arrows, or a trackpad — and the scrollbar is hidden; a row of dots and a
   counter say where you are. */
function Tech() {
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const sound = useSound();
  const go = (i: number) => {
    const el = strip.current;
    const card = el?.children[Math.max(0, Math.min(TECH.length - 1, i))] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
  };
  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    const w = (el.children[0] as HTMLElement)?.offsetWidth || 1;
    const i = Math.round(el.scrollLeft / (w + 12));
    if (i !== at) {
      setAt(i);
      sound.detent(0.5, { pitch: 0.9 + i * 0.08 });
    }
  };
  return (
    <section className="pt-24 pb-20 border-t-[1.5px] border-line" id="tech">
      <div className="flex flex-wrap items-end justify-between gap-8 pb-14 px-(--gutter)">
        <div className="flex flex-col gap-8">
          <Display size="xxl">
            Fun on top, <Accent tone="mute">serious underneath</Accent>
          </Display>
          <p className={COPY}>The jokes are a layer. The foundation is the same reliable stack you would pick anyway.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[1.05rem] font-medium tabular-nums text-ink-2">
            {at + 1} / {TECH.length}
          </span>
          <div className="flex gap-tight">
            {([["Previous", -1, ArrowLeft], ["Next", 1, ArrowRight]] as const).map(([label, d, Icon]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => go(at + d)}
                className="grid place-items-center size-14 rounded-full bg-fill hover:bg-ink hover:text-paper transition-colors duration-200 cursor-pointer [&_svg]:size-6 active:scale-94"
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        ref={strip}
        onScroll={onScroll}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || (e.target as Element).closest("button")) return;
          drag.current = { x: e.clientX, left: strip.current!.scrollLeft };
          strip.current!.style.scrollSnapType = "none";
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          strip.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          drag.current = null;
          strip.current!.style.scrollSnapType = "";
          go(at);
        }}
        onPointerLeave={() => {
          if (!drag.current) return;
          drag.current = null;
          strip.current!.style.scrollSnapType = "";
        }}
        className={cn(
          "flex gap-tile overflow-x-auto snap-x snap-mandatory px-(--gutter) scroll-px-(--gutter) pb-2 cursor-grab active:cursor-grabbing select-none",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {TECH.map((t, i) => (
          <article
            key={t.title}
            className={cn(
              "snap-start shrink-0 w-[min(70vw,60rem)] max-[760px]:w-[86vw] flex flex-col gap-10 p-[clamp(1.5rem,3.5vw,3rem)] rounded-lg min-h-[28rem]",
              i % 3 === 0 ? "bg-paper-2" : i % 3 === 1 ? "bg-ink text-paper dark:bg-paper-2 dark:text-ink" : "bg-acid text-[#282828]",
            )}
          >
            <div className="flex flex-col gap-4">
              <Display size="lg">{t.title}</Display>
              <p className="m-0 text-[1.15rem] leading-[1.5] opacity-80 max-w-[52ch]">{t.body}</p>
            </div>
            <Code wrap className="mt-auto text-[1.05rem] [&_pre]:text-[1.05rem] [&_pre]:py-10 [&_pre]:px-10">{t.code}</Code>
          </article>
        ))}
      </div>
      <div className="flex justify-center gap-2 pt-8" role="tablist" aria-label="Slides">
        {TECH.map((t, i) => (
          <button
            key={t.title}
            role="tab"
            aria-selected={i === at}
            aria-label={t.title}
            onClick={() => go(i)}
            className={cn("h-2.5 rounded-pill transition-all duration-300 ease-spring cursor-pointer", i === at ? "w-8 bg-ink" : "w-2.5 bg-ink/20 hover:bg-ink/40")}
          />
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── tokens ───────────────────────── */

const SWATCHES = [
  { name: "Paper", v: "--rap-paper", hex: "#F5F5F5", tone: "paper" },
  { name: "Ink", v: "--rap-ink", hex: "#282828", tone: "ink" },
  { name: "Flame", v: "--rap-flame", hex: "#FF5B1A", tone: "flame" },
  { name: "Blue", v: "--rap-blue", hex: "#0582FF", tone: "blue" },
  { name: "Plum", v: "--rap-plum", hex: "#8E0D99", tone: "plum" },
  { name: "Acid", v: "--rap-acid", hex: "#D7FF3C", tone: "acid" },
  { name: "Bubble", v: "--rap-bubble", hex: "#FF9BE0", tone: "bubble" },
  { name: "Sky", v: "--rap-sky", hex: "#8FD3FF", tone: "sky" },
] as const;

function Tokens() {
  return (
    <section className="py-24 px-(--gutter) flex flex-col gap-8" id="tokens">
      <Display size="xxl">
        Grey paper, soft ink <Accent tone="mute">& six loud friends</Accent>
      </Display>
      <p className={COPY}>
        One typeface, Onest, set big and tight. A cool grey page, white cards, and an orange-and-blue signal pair — all of it CSS
        variables you can override.
      </p>
      <div className="grid grid-cols-4 gap-tile mt-6 max-[760px]:grid-cols-2">
        {SWATCHES.map((s) => (
          <TiltCard key={s.name} tone={s.tone} max={8}>
            <div className="flex flex-col justify-between min-h-40">
              <Display size="md">{s.name}</Display>
              <span className="text-[0.9rem] font-medium opacity-75 tabular-nums">
                {s.hex}
                <br />
                var({s.v})
              </span>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function Install() {
  return (
    <section className="pt-24 px-(--gutter) pb-28 bg-paper-2 rounded-t-lg" id="install">
      <div className="grid grid-cols-[1fr_1.1fr] gap-12 items-start max-[900px]:grid-cols-1">
        {/* the heading stays in view while the snippets scroll past */}
        <div className="flex flex-col gap-6 sticky top-28 max-[900px]:static">
          <Display size="xxl">
            Two lines <Accent tone="mute">and you’re in</Accent>
          </Display>
          <p className={COPY}>
            Precompiled CSS for any React app, or the Tailwind theme for apps that already use Tailwind v4. The fonts are optional.
          </p>
          <a href="#start" className="self-start inline-flex items-center gap-2 h-12 px-6 rounded-pill bg-ink text-paper font-medium transition-colors hover:bg-flame">
            Never used a terminal? Start here →
          </a>
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <Code>{`npm install @rapui/react`}</Code>
          <Code>{`// main.tsx
import "@rapui/react/styles.css";
import "@rapui/react/fonts"; // optional: Onest + Geist Mono

import { Button, SoundProvider } from "@rapui/react";

export function App() {
  return (
    <SoundProvider fun={40}>
      <Button size="xl" icon>Make it loud</Button>
    </SoundProvider>
  );
}`}</Code>
          <Code>{`/* already on Tailwind v4? */
@import "tailwindcss";
@import "@rapui/react/theme.css";
@source "../node_modules/@rapui/react/dist";`}</Code>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    // an ink sheet that slides up over the install section's rounded bottom
    <footer className="relative -mt-10 pt-24 px-(--gutter) pb-8 rounded-t-lg bg-ink text-paper overflow-hidden dark:bg-paper-2 dark:text-ink">
      <div className="flex justify-between items-center flex-wrap gap-8">
        <Display size="xxl">
          Bored yet?
        </Display>
        <CircleButton size={180} variant="accent" className="[--c-fill:var(--rap-acid)] [--c-fill-fg:#282828]" onClick={() => (window.location.hash = "docs")}>
          Open
          <br />
          docs
        </CircleButton>
      </div>
      <div className="mt-20 mb-8 -ml-[0.04em] text-[clamp(6rem,30vw,34rem)] whitespace-nowrap" aria-hidden>
        <Wordmark className="w-full h-auto" />
      </div>
      <div className="flex flex-wrap justify-between gap-4 pt-6 border-t border-white/15 dark:border-line text-[0.95rem] font-medium">
        <span>© 2026 rapui — MIT</span>
        <a href="#top">
          <RollText>Back to top ↑</RollText>
        </a>
      </div>
    </footer>
  );
}

/* ───────────────────────── app ───────────────────────── */

export function App({
  dark,
  setDark,
  sound,
  setSound,
}: {
  dark: boolean;
  setDark: (v: boolean) => void;
  sound: SoundSettings;
  setSound: (v: SoundSettings) => void;
}) {
  // the looping CSS animations of a block out of view hold still (usePauseOffscreen)
  const page = useRef<HTMLDivElement>(null);
  usePauseOffscreen(page);
  return (
    <div ref={page} className="rap-root min-h-screen overflow-x-clip [--gutter:clamp(1rem,4vw,3.5rem)]">
      <Cursor />
      <Header dark={dark} setDark={setDark} sound={sound} setSound={setSound} />
      <main>
        <Hero />
        <PresetsSection copyClass={COPY} />
        <LandingCards copyClass={COPY} />
        <SameApi />
        <Stats />
        <Wall />
        <Tech />
        <Tokens />
        <Install />
      </main>
      <Footer />
    </div>
  );
}
