import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Accent,
  BalanceChart,
  BarsChart,
  BigLink,
  Button,
  ButtonGroup,
  CanvasToolbar,
  Checklist,
  CircleButton,
  ConfirmButton,
  Counter,
  Cursor,
  Display,
  DonutChart,
  ElasticSlider,
  FormStack,
  GaugeChart,
  Highlight,
  HoldButton,
  Input,
  Knob,
  Lead,
  Marquee,
  RaceBars,
  RangeDial,
  RollText,
  SlideButton,
  Sparkline,
  SplitReveal,
  Sticker,
  Switch,
  Tabs,
  TiltCard,
  TimeScrubber,
  AudioPlayer,
  CardStack,
  FanGallery,
  Lightbox,
  ShapeGallery,
  useLightbox,
  VideoPlayer,
  WarpStrip,
  VoiceNote,
  useSound,
  type SoundSettings,
  type StackState,
} from "../rapui";
import { ArrowLeft, ArrowRight, Volume1, Volume2 } from "../rapui/icons";
import { cn } from "../rapui/utils";
import { Code } from "./Code";
import { SoundControls } from "./SoundControls";
import { Wordmark } from "./Wordmark";
import { Floaty, HeroScene } from "./HeroScene";
import gridLines from "./media/grid-lines.wav";
import voiceNote from "./media/voice-note.wav";
import reel from "./media/reel.webm";
import { ART } from "../docs/entries/galleries";

/* How many components the docs list. Kept by hand so the landing does not pull
   the docs registry (and every demo in it) into the first bundle. */
const COUNT = 110;

/* ───────────────────────── shared class strings ───────────────────────── */

/* a centred, wrapping row of demo pieces with room to breathe */
const ROW = "flex flex-wrap items-center justify-center gap-10";
/* the lit backdrop the glass toolbar refracts: three accent dots on grey paper */
const GLASS_GROUND =
  "[background:radial-gradient(circle_at_28%_60%,var(--rap-flame)_0_14%,transparent_15%),radial-gradient(circle_at_70%_42%,var(--rap-blue)_0_18%,transparent_19%),radial-gradient(circle_at_52%_78%,var(--rap-acid)_0_10%,transparent_11%),var(--rap-paper-3)]";
/* body copy under a section title */
const COPY = "m-0 text-ink-2 text-[1.15rem] leading-[1.5] max-w-[46ch] [&_code]:bg-paper-2 [&_code]:py-[0.1em] [&_code]:px-[0.35em] [&_code]:rounded-[6px] [&_code]:text-[0.9em]";

/* ───────────────────────── layout pieces ───────────────────────── */

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
  return (
    // a frosted pill floating over the page, inset by the page gutter
    <header
      className={cn(
        "fixed top-3 inset-x-(--gutter) z-100 flex items-center justify-between gap-4 py-2 pr-2 pl-[1.4rem] max-[480px]:gap-2 max-[480px]:pl-4",
        "rounded-pill border border-line bg-[color-mix(in_srgb,var(--rap-paper)_72%,transparent)] backdrop-blur-[16px] backdrop-saturate-[1.4]",
      )}
    >
      <a href="#top" className="text-[1.5rem]" data-rap-cursor="Home" aria-label="rapui, back to top">
        <Wordmark />
      </a>
      <nav className="flex gap-8 font-medium max-[860px]:hidden">
        <a href="#docs"><RollText>Docs</RollText></a>
        <a href="#wall"><RollText>Components</RollText></a>
        <a href="#tech"><RollText>Under the hood</RollText></a>
        <a href="#install"><RollText>Install</RollText></a>
      </nav>
      {/* on a phone everything packs a little tighter so the header pill fits */}
      <div className="flex items-center gap-3 max-[480px]:gap-2">
        <SoundControls value={sound} onChange={setSound} tight />
        <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        <Button size="sm" icon onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
          Get it
        </Button>
      </div>
    </header>
  );
}

/* the headline words: huge, each one a loose object */
const LINE = "flex flex-wrap items-center gap-x-[0.2em] font-display font-medium tracking-[-0.055em] leading-[0.8] text-[clamp(3.2rem,10vw,10.5rem)]";
/* the small live things scattered around the headline */
const PROP = "rounded-card bg-surface shadow-[0_18px_50px_-18px_rgb(0_0_0/0.22)] dark:shadow-[0_18px_50px_-18px_rgb(0_0_0/0.7)]";

function Hero() {
  const [fun, setFun] = useState(true);
  return (
    <section className="relative min-h-svh pt-36 px-(--gutter) pb-14 flex flex-col justify-between gap-14 max-[900px]:min-h-0 max-[900px]:pt-28" id="top">
      <HeroScene className="relative">
        {/* The pitch as a table of loose words — tilted, drifting with the pointer,
            draggable. The "boring" tag sits in the MIDDLE of the last line, where it
            reads as the word the kit refuses rather than a label hung off the end. */}
        <h1 className="m-0 flex flex-col items-start gap-0 max-w-[min(100%,74rem)]" aria-label="All the components, none of the boring parts">
          <span className={LINE} aria-hidden>
            <Floaty depth={10} rotate={-2}>All</Floaty>
            <Floaty depth={16} rotate={1.5}>the</Floaty>
          </span>
          <span className={cn(LINE, "pl-[8vw] max-[900px]:pl-0")} aria-hidden>
            <Floaty depth={22} rotate={-1.2} className="text-flame">components,</Floaty>
          </span>
          <span className={LINE} aria-hidden>
            <Floaty depth={12} rotate={1}>none of</Floaty>
            <Floaty depth={34} rotate={-9}>
              <Sticker color="blue" rotate={0} size="clamp(1.1rem, 3vw, 2.8rem)" className="px-[0.9em] py-[0.35em]">
                boring
              </Sticker>
            </Floaty>
            <Floaty depth={18} rotate={-1.5}>parts.</Floaty>
          </span>
        </h1>

        {/* live props: real components, loose on the table. On a phone they
            drop into a row under the headline instead of floating over it. */}
        <div className="pointer-events-none absolute inset-0 max-[1100px]:static max-[1100px]:mt-12 max-[1100px]:flex max-[1100px]:flex-wrap max-[1100px]:gap-6 max-[1100px]:items-center">
          <Floaty depth={40} rotate={12} className="pointer-events-auto absolute right-[4%] top-[-2%] max-[1100px]:static">
            <Sticker shape="burst" color="acid" size="clamp(0.9rem,1.3vw,1.15rem)" rotate={0} className="w-[clamp(6.5rem,10vw,9.5rem)]">
              {COUNT}+
              <br />
              inside
            </Sticker>
          </Floaty>
          <Floaty depth={26} rotate={-5} className="pointer-events-auto absolute right-[2%] top-[34%] max-[1100px]:static">
            <div className={cn(PROP, "flex items-center gap-5 py-4 px-5")}>
              <span className="text-[1.05rem] font-medium">Fun mode</span>
              <Switch checked={fun} onCheckedChange={setFun} />
            </div>
          </Floaty>
          <Floaty depth={32} rotate={4} className="pointer-events-auto absolute right-[20%] top-[58%] max-[1100px]:static">
            <div className={cn(PROP, "py-4 px-5 flex flex-col gap-2")}>
              <span className="text-[1.6rem] font-medium tracking-[-0.03em] tabular-nums leading-none">
                $58,834<span className="text-[1.1rem] opacity-35">.75</span>
              </span>
              <span className="flex items-center gap-2 text-[0.8rem] font-medium text-success">
                +2.1% <Sparkline data={[12, 14, 13, 17, 16, 19, 18, 22, 25]} width={84} height={20} />
              </span>
            </div>
          </Floaty>
          <Floaty depth={20} rotate={-3} className="pointer-events-auto absolute right-[3%] top-[80%] max-[1100px]:static">
            <HoldButton size="md" variant="ink" doneLabel="Shipped">
              Hold to ship
            </HoldButton>
          </Floaty>
        </div>
      </HeroScene>

      <div className="grid grid-cols-[1.3fr_1fr] items-end gap-10 max-[900px]:grid-cols-1">
        <Lead className="max-w-[46ch]">
          Everything you would reach for in shadcn/ui — dialogs, forms, tables, calendars — on the same Radix + Tailwind base.
          <Highlight>Plus the things it never shipped</Highlight>: hold-to-delete buttons, liquid forms, charts you scrub, galleries
          you throw, players that dance. {COUNT}+ components, every one with a small joke in it.
        </Lead>
        <ButtonGroup className="justify-self-end max-[900px]:justify-self-start">
          <Button size="lg" variant="blue" icon onClick={() => (window.location.hash = "docs")}>
            Browse components
          </Button>
          <Button size="lg" variant="soft" onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
            npm i rapui
          </Button>
        </ButtonGroup>
      </div>
    </section>
  );
}

const NAMES = ["Hold buttons", "Liquid forms", "Charts", "Dials", "Scrubbers", "Galleries", "Players", "Checklists", "Stickers", "Dialogs", "Data tables", "Calendars"];

const BAND_WORD = "inline-flex items-center gap-10 font-display font-medium text-[clamp(2rem,5vw,4.5rem)] tracking-[-0.05em] leading-none";

function Bands() {
  return (
    <div className="py-16 overflow-hidden">
      {/* the bands overhang the page by 2rem each side so their tilted ends never show */}
      <Marquee className="py-[1.1rem] -mx-8 relative z-1 bg-acid text-[#282828]" rotate={-2.5} duration={34} gap="2.5rem">
        {NAMES.map((n) => (
          <span className={BAND_WORD} key={n}>
            {n} <span className="inline-block text-flame fun:animate-[spin_6s_linear_infinite]">✳</span>
          </span>
        ))}
      </Marquee>
      <Marquee className="py-[1.1rem] -mx-8 -mt-[1.2rem] bg-ink text-paper" rotate={1.8} duration={40} reverse gap="2.5rem">
        {NAMES.map((n) => (
          <span className={BAND_WORD} key={n}>
            {n} <span className="size-[0.4em] rounded-full bg-flame" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/* ───────────────────────── boring vs rapui ─────────────────────────
   The whole argument as one switch. The left column of each pair is
   what a sensible default kit gives you; flip it and the same props
   land on rapui. Same API is the point, so the code under it does not
   change when you flip. */

/* the "sensible default" skin: small, grey, 4px — drawn by hand so it is nobody's in particular */
const PLAIN_BTN = "h-9 px-4 rounded-[4px] bg-[#18181b] text-white text-[14px] font-medium";
const PLAIN_INPUT = "h-9 w-full px-3 rounded-[4px] border border-[#e4e4e7] bg-white text-[14px] text-[#18181b] placeholder:text-[#a1a1aa]";
const PLAIN_LABEL = "text-[13px] font-medium text-[#18181b]";

/* One card, two skins, one divider you drag. The left of the line is what a
   sensible default kit renders from these props; the right is rapui from the
   SAME props. The code under it never changes — which is the argument. */
function SameApi() {
  const [at, setAt] = useState(46);
  const [on, setOn] = useState(true);
  const [vol, setVol] = useState(60);
  const box = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const sound = useSound();
  const place = (x: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const v = Math.min(96, Math.max(4, ((x - r.left) / r.width) * 100));
    if (Math.round(v / 10) !== Math.round(at / 10)) sound.detent(0.4, { pitch: 0.8 + v / 125 });
    setAt(v);
  };
  const plain = (
    <div className="grid gap-4 content-center h-full p-[clamp(1.5rem,4vw,3rem)] bg-white text-[#18181b] font-[system-ui,sans-serif]">
      <span className="text-[18px] font-semibold">Publish project</span>
      <input className={PLAIN_INPUT} defaultValue="Summer zine" aria-hidden tabIndex={-1} />
      <label className={cn(PLAIN_LABEL, "flex items-center gap-2")}>
        <input type="checkbox" checked={on} readOnly tabIndex={-1} /> Autosave
      </label>
      <input type="range" value={vol} readOnly tabIndex={-1} aria-hidden />
      <div className="flex gap-2">
        <button className={PLAIN_BTN} tabIndex={-1}>Publish</button>
        <button className={cn(PLAIN_BTN, "bg-[#f4f4f5] text-[#18181b]")} tabIndex={-1}>Preview</button>
      </div>
    </div>
  );
  const rap = (
    <div className="grid gap-5 content-center h-full p-[clamp(1.5rem,4vw,3rem)] bg-paper-2">
      <Display size="md">Publish project</Display>
      <Input size="lg" defaultValue="Summer zine" aria-label="Project name" />
      <Switch checked={on} onCheckedChange={setOn} label="Autosave" />
      <ElasticSlider aria-label="Volume" value={vol} onValueChange={setVol} icons={[<Volume1 key="a" />, <Volume2 key="b" />]} />
      <ButtonGroup>
        <Button size="lg" icon>Publish</Button>
        <Button size="lg" variant="soft">Preview</Button>
      </ButtonGroup>
    </div>
  );
  return (
    <section className="px-(--gutter) pt-10 pb-32 flex flex-col gap-12" id="same-api">
      <div className="grid grid-cols-[1fr_minmax(0,30rem)] gap-10 items-end max-[900px]:grid-cols-1">
        <Display size="xxl">
          Same API. <Accent tone="mute">Different nerve.</Accent>
        </Display>
        <p className={COPY}>
          If you know shadcn/ui you already know rapui: Radix underneath, <code>cn()</code>, <code>cva</code> variants, a{" "}
          <code>data-slot</code> on every part. Drag the line: same props on both sides.
        </p>
      </div>
      <div
        ref={box}
        className="relative grid min-h-[30rem] rounded-lg overflow-hidden shadow-[inset_0_0_0_1px_var(--rap-line)] select-none"
      >
        {/* the rapui skin underneath, full width and fully live */}
        <div className="col-start-1 row-start-1">{rap}</div>
        {/* the plain skin on top, cut at the line; inert, it is a picture of the other kit */}
        <div className="col-start-1 row-start-1 pointer-events-none" style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }} aria-hidden>
          {plain}
        </div>
        <div
          role="slider"
          aria-label="Compare a plain kit with rapui"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(at)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setAt((v) => Math.max(4, v - 5));
            if (e.key === "ArrowRight") setAt((v) => Math.min(96, v + 5));
          }}
          onPointerDown={(e) => {
            held.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => held.current && place(e.clientX)}
          onPointerUp={() => (held.current = false)}
          className="absolute inset-y-0 z-10 w-12 -ml-6 grid place-items-center cursor-ew-resize touch-none outline-none group/cmp"
          style={{ left: `${at}%` }}
        >
          <span className="absolute inset-y-0 left-1/2 w-[2px] -ml-px bg-ink" />
          <span className="relative grid place-items-center size-12 rounded-full bg-ink text-paper text-[1.1rem] font-medium shadow-[0_8px_24px_rgb(0_0_0/0.25)] transition-transform duration-200 ease-spring group-active/cmp:scale-110 group-focus-visible/cmp:outline-2 group-focus-visible/cmp:outline-ring group-focus-visible/cmp:outline-offset-2">
            ↔
          </span>
        </div>
        <Sticker color="paper" rotate={-4} size="0.95rem" className="absolute left-5 top-5 z-5 pointer-events-none">
          a sensible default
        </Sticker>
        <Sticker color="acid" rotate={5} size="0.95rem" className="absolute right-5 top-5 z-5 pointer-events-none">
          rapui
        </Sticker>
      </div>
      <Code>{`<Input defaultValue="Summer zine" />
<Switch checked={on} onCheckedChange={setOn} label="Autosave" />
<Button icon>Publish</Button>`}</Code>
    </section>
  );
}

const STAT = "flex flex-col gap-4 pt-6 border-t-[1.5px] border-ink [&>span]:max-w-[24ch] [&>span]:text-ink-2 [&>span]:text-[1.05rem]";

function Stats() {
  return (
    <section className="grid grid-cols-3 gap-8 pt-8 px-(--gutter) pb-32 max-[760px]:grid-cols-1">
      <div className={STAT}>
        <Display size="xxl"><Counter to={COUNT} suffix="+" /></Display>
        <span>components, from Dialog and DataTable to a hold-to-delete button</span>
      </div>
      <div className={STAT}>
        <Display size="xxl"><Counter to={0} from={99} /></Display>
        <span>grey rectangles with 4px corners</span>
      </div>
      <div className={STAT}>
        <Display size="xxl"><Counter to={1} from={9} /></Display>
        <span>attribute to turn every joke off — calm mode, for the serious screens</span>
      </div>
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
}: {
  id: string;
  title: string;
  sub?: string;
  desc: ReactNode;
  code: string;
  children: ReactNode;
  stageClass?: string;
}) {
  return (
    <section className="pt-20 pb-24 border-t-[1.5px] border-line" id={id}>
      <div className="grid grid-cols-[1fr_minmax(0,28rem)] gap-x-10 gap-y-6 items-end mb-10 max-[900px]:grid-cols-1">
        <Display size="xl">
          <SplitReveal>{title}</SplitReveal> {sub && <Accent tone="mute">{sub}</Accent>}
        </Display>
        <p className={COPY}>{desc}</p>
      </div>
      <Tabs
        className="[&_[data-slot=animated-tabs-panel]]:pt-5"
        items={[
          {
            value: "preview",
            label: "Preview",
            content: (
              <div className={cn("relative grid place-items-center min-h-[26rem] p-[clamp(1.25rem,5vw,5rem)] rounded-lg bg-paper-2 overflow-hidden", stageClass)}>
                {children}
              </div>
            ),
          },
          { value: "code", label: "Code", content: <Code>{code}</Code> },
        ]}
      />
    </section>
  );
}

function LoginDemo() {
  const [state, setState] = useState<StackState>("idle");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setState("loading");
    // "wrong" as the password shows the other ending
    window.setTimeout(() => {
      setState(pw === "wrong" ? "error" : "success");
      if (pw !== "wrong") window.setTimeout(() => setState("idle"), 2200);
    }, 1500);
  };
  return (
    <div className="flex flex-col gap-6 w-[min(100%,34rem)]">
      <Display size="xl">
        Log in <Accent className="text-[0.5em] tracking-[-0.02em] align-[0.35em]">or join</Accent>
      </Display>
      <FormStack state={state} errorIndex={1} onSubmit={submit}>
        <Input
          size="hero"
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          status={/.+@.+\..+/.test(email) ? "valid" : undefined}
        />
        <Input
          size="hero"
          type="password"
          placeholder="Password (try “wrong”)"
          aria-label="Password"
          value={pw}
          invalid={state === "error"}
          onChange={(e) => {
            setPw(e.target.value);
            if (state === "error") setState("idle");
          }}
        />
        <Button size="hero" variant="accent" align="start" block type="submit" successLabel="Welcome back" errorLabel="Wrong password">
          Continue
        </Button>
      </FormStack>
    </div>
  );
}

function GalleriesDemo() {
  const lb = useLightbox();
  return (
    <div className="grid gap-16 w-full min-w-0">
      <WarpStrip items={ART} onOpen={lb.open} aria-label="Posters" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-12 px-[clamp(1.25rem,5vw,5rem)] items-center justify-items-center">
        <CardStack items={ART} aria-label="Poster pile" onOpen={lb.open} />
        <FanGallery items={ART.slice(0, 9)} onOpen={lb.open} />
      </div>
      <div className="px-[clamp(1.25rem,5vw,5rem)]">
        <ShapeGallery items={ART.slice(0, 7)} onOpen={lb.open} />
      </div>
      <Lightbox items={ART} {...lb.props} />
    </div>
  );
}

/* a sparkline's natural habitat: a table row */
const PAGES = [
  { name: "Summer zine", views: "12.4k", data: [3, 5, 4, 8, 7, 11, 14] },
  { name: "Portfolio", views: "8.1k", data: [9, 8, 9, 7, 8, 6, 7] },
  { name: "Night swim", views: "5.6k", data: [2, 3, 5, 4, 6, 9, 8] },
  { name: "Pricing", views: "3.9k", data: [6, 6, 5, 7, 6, 8, 9] },
];

function SparkTable() {
  return (
    <div className="w-80 max-w-full bg-surface rounded-[26px] pt-[22px] px-4 pb-3">
      <p className="m-0 text-[33px] leading-none font-medium tracking-[-0.03em] tabular-nums">
        30.0k<span className="text-[24px] opacity-35"> views</span>
      </p>
      <p className="mt-[9px] mb-3 text-[12.5px] font-medium text-success">
        +12.4% <span className="text-ink/42">top pages, 7 days</span>
      </p>
      {PAGES.map((pg) => (
        <div key={pg.name} className="flex items-center gap-3 py-2.5 border-t border-line text-[0.9rem] font-medium">
          <span className="flex-1 truncate">{pg.name}</span>
          <Sparkline data={pg.data} width={76} height={22} />
          <span className="w-12 text-right tabular-nums text-ink/55">{pg.views}</span>
        </div>
      ))}
    </div>
  );
}

/* ── the players, as a conversation ─────────────────────────
   Big chat bubbles with the media dropped in between them, the way
   people actually send video and voice. "them" sits left on white,
   "me" right on blue; each bubble tosses in as it scrolls into view
   (the deal utility, --i staggered). */
const BUBBLE = "max-w-[min(100%,34rem)] px-6 py-4 text-[clamp(1.1rem,1.8vw,1.5rem)] leading-[1.3] tracking-[-0.015em] font-medium";
const THEM = "self-start rounded-[28px] rounded-bl-[8px] bg-surface";
const ME = "self-end rounded-[28px] rounded-br-[8px] bg-blue text-white";

function MediaChat() {
  const chapters = [
    { at: 0, title: "Intro" },
    { at: 3, title: "Shapes" },
    { at: 6, title: "Type" },
    { at: 9, title: "Outro" },
  ];
  return (
    <div className="deal flex flex-col gap-3 w-[min(100%,54rem)] mx-auto">
      <div className={cn(BUBBLE, THEM, "[--i:0]")}>Cut the reel for Friday. Tell me what you think 👀</div>
      <div className="self-start w-[min(100%,40rem)] [--i:1]">
        <VideoPlayer src={reel} title="Studio reel" chapters={chapters} />
      </div>
      <div className={cn(BUBBLE, ME, "[--i:2]")}>wait — the whole frame leans when I scrub?? 😂</div>
      <VoiceNote src={voiceNote} from="me" sent="14:02" className="self-end [--i:3]" />
      <div className={cn(BUBBLE, THEM, "[--i:4]")}>It does. And here’s the track for it:</div>
      <div className="self-start w-[min(100%,30rem)] [--i:5]">
        <AudioPlayer src={gridLines} title="Grid Lines" artist="The Baseline Club" />
      </div>
      <div className={cn(THEM, "flex gap-1.5 px-5 py-5 [--i:6]")} aria-label="typing">
        {[0, 1, 2].map((d) => (
          <span key={d} className="size-2.5 rounded-full bg-ink/35 fun:animate-dot" style={{ animationDelay: `${d * 160}ms` }} />
        ))}
      </div>
    </div>
  );
}

function Wall() {
  const [knob, setKnob] = useState(42);
  return (
    <div id="wall" className="px-(--gutter)">
      <div className="flex flex-col gap-8 pb-20">
        <Display size="xxl">
          Every piece <Accent tone="mute">performs</Accent>
        </Display>
        <p className={COPY}>
          Everything below is live. Press it, drag it, throw it — and turn the sound on in the header: every component has its own
          click, tuned on a scale from muted to toy.
        </p>
      </div>

      <Showcase
        id="commit"
        title="Buttons"
        sub="that make you mean it"
        desc="For the actions you should not do by accident. Hold until the liquid reaches the top, slide the thumb to the rim, or click twice before the ring runs out. Each one with its own springs and sounds."
        code={`import { HoldButton, SlideButton, ConfirmButton } from "rapui";

<HoldButton variant="danger" onConfirm={deleteProject}>Hold to delete</HoldButton>
<SlideButton label="Slide to publish" doneLabel="Published" onConfirm={publish} />
<ConfirmButton label="Delete workspace" confirmLabel="Sure?" onConfirm={remove} />`}
      >
        <div className="flex flex-col items-center gap-8 w-[min(100%,30rem)]">
          <HoldButton variant="danger" size="lg">
            Hold to delete project
          </HoldButton>
          <SlideButton size="lg" variant="ink" label="Slide to publish" doneLabel="Published" />
          <ConfirmButton size="lg" label="Delete workspace" confirmLabel="Sure?" doneLabel="Deleted" />
        </div>
      </Showcase>

      <Showcase
        id="forms"
        title="Forms"
        sub="that melt"
        desc="Readymag's stacked login, made liquid: the pills fuse into one shape, the focused one swells, submitting sucks the fields into the button, and a wrong password spits them back out, shaking its head."
        code={`import { FormStack, Input, Button } from "rapui";

<FormStack state={state} errorIndex={1} onSubmit={logIn}>
  <Input size="hero" type="email" placeholder="Email" />
  <Input size="hero" type="password" placeholder="Password" />
  <Button size="hero" variant="accent" type="submit" block>Continue</Button>
</FormStack>`}
      >
        <LoginDemo />
      </Showcase>

      <Showcase
        id="charts"
        title="Charts"
        sub="you want to touch"
        desc={
          <>
            Minimal cards — one big number, one thin line — that read back under your finger. Scrub the balance, pull it down to
            refresh, spin the donut, drag the gauge. Or drop a <Sparkline data={[12, 18, 15, 22, 19, 27, 31]} width={70} height={18} />{" "}
            straight into a sentence.
          </>
        }
        code={`import { BalanceChart, DonutChart, GaugeChart, BarsChart, RaceBars, Sparkline } from "rapui";

<BalanceChart />
<DonutChart data={sources} />
<GaugeChart defaultValue={72} />
<Sparkline data={[12, 18, 15, 22, 19, 27, 31]} />`}
        stageClass="bg-paper place-items-stretch"
      >
        {/* An even bento: six equal white tiles, rows of one height (auto-rows-fr), each
            chart centred in its tile. The charts are different shapes by nature; the
            grid is what makes them read as one set. */}
        <div className="grid grid-cols-3 auto-rows-fr gap-tile w-full max-[1180px]:grid-cols-2 max-[760px]:grid-cols-1">
          {[
            <BalanceChart key="b" />,
            <DonutChart key="d" />,
            <GaugeChart key="g" defaultValue={72} />,
            <BarsChart key="bars" />,
            <RaceBars key="r" />,
            <SparkTable key="s" />,
          ].map((chart) => (
            <div key={chart.key} className="grid place-items-center min-w-0 p-3 rounded-lg bg-surface">
              {chart}
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase
        id="dials"
        title="Dials"
        sub="& scrubbers"
        desc="Controls for the things sliders are bad at: a range on a 24-hour clock whose handles fuse like drops, a ruler of time you can fling, a knob with magnetic detents, a slider that stretches like rubber at its ends."
        code={`import { RangeDial, TimeScrubber, Knob, ElasticSlider } from "rapui";

<RangeDial snap="15" />
<TimeScrubber step="15" />
<Knob label="Gain" value={gain} onValueChange={setGain} />`}
        stageClass="bg-paper"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-12 w-full justify-items-center items-center">
          <RangeDial />
          <div className="flex flex-col items-center gap-10">
            <TimeScrubber />
            <Knob size="lg" label="Gain" value={knob} onValueChange={setKnob} />
          </div>
        </div>
      </Showcase>

      <Showcase
        id="galleries"
        title="Galleries"
        sub="with a sense of humour"
        desc="A strip that skews and stretches with your speed, a messy pile you throw cards off, a hand of cards that fans apart, a collage of stickers that morph their shape on hover. Click any picture: it flies out full screen, swipe to go on, pull down to put it back."
        code={`import { WarpStrip, CardStack, FanGallery, Lightbox, useLightbox } from "rapui";

const lb = useLightbox();

<WarpStrip items={posters} onOpen={lb.open} />
<CardStack items={posters} onOpen={lb.open} />
<FanGallery items={posters} onOpen={lb.open} />
<Lightbox items={posters} {...lb.props} />`}
        stageClass="px-0 [&>*]:min-w-0"
      >
        <GalleriesDemo />
      </Showcase>

      <Showcase
        id="media"
        title="Players"
        sub="that dance a little"
        desc="Audio with a waveform you scrub like a chart, bars that breathe to the live level; video whose controls float in one pill, snap to chapters and skew the frame as you drag; a voice note for chat. Keyboard all the way."
        code={`import { AudioPlayer, VideoPlayer, VoiceNote } from "rapui";

<VideoPlayer src="/reel.webm" title="Studio reel" chapters={chapters} />
<AudioPlayer src="/grid-lines.wav" title="Grid Lines" artist="The Baseline Club" />
<VoiceNote src="/note.wav" from="me" sent="14:02" />`}
        stageClass="bg-paper"
      >
        <MediaChat />
      </Showcase>

      <Showcase
        id="lists"
        title="Lists & tools"
        sub="with a spring each"
        stageClass="bg-paper"
        desc="From Bencho (MIT). Tick the last task and the whole checklist collapses into a heap; the canvas rail remembers your last shape and goes glass on request."
        code={`import { Checklist, CanvasToolbar } from "rapui";

<Checklist />
<div data-surface="glass">
  <CanvasToolbar />
</div>`}
      >
        <div className={cn(ROW, "w-full")}>
          <Checklist />
          <div className={cn("grid place-items-center min-h-64 w-[min(100%,24rem)] rounded-card overflow-hidden", GLASS_GROUND)} data-surface="glass">
            <CanvasToolbar corner={20} />
          </div>
        </div>
      </Showcase>

      <Showcase
        id="loud"
        title="The loud bits"
        sub="for landing pages"
        desc="Headline links, stickers in ten soft shapes, tickers, cards that lean toward the cursor. The editorial half of the kit, for the pages people remember."
        code={`import { BigLink, Sticker, TiltCard, CircleButton } from "rapui";

<BigLink href="/work" meta="24 projects">Work</BigLink>
<Sticker color="flame" shape="burst">hot!</Sticker>
<TiltCard tone="acid">…</TiltCard>
<CircleButton size={160} />`}
      >
        <div className="grid gap-12 w-full">
          <div className="border-t border-line">
            <BigLink href="#loud" meta="24 projects">Work</BigLink>
            <BigLink href="#loud" meta="→ mail">Say hello</BigLink>
          </div>
          <div className={cn(ROW, "gap-x-12 gap-y-8")}>
            <Sticker color="acid" size="1.5rem">fresh</Sticker>
            <Sticker color="flame" shape="burst" className="w-32" size="1.05rem" rotate={10}>
              hot
              <br />
              drop!
            </Sticker>
            <Sticker color="bubble" shape="circle" className="w-28" size="1.15rem" rotate={9}>
              say
              <br />
              hi
            </Sticker>
            <Sticker color="plum" shape="flower" className="w-28" size="1.05rem" rotate={-8}>
              new
            </Sticker>
            <Sticker color="sky" shape="tag" size="1.3rem" rotate={4}>
              sale −30%
            </Sticker>
            <CircleButton size={150} />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-tile">
            {(
              [
                ["flame", "Brand for a bakery on Mars", "Identity"],
                ["ink", "Motion system", "Product"],
                ["acid", "Zine for night owls", "Editorial"],
              ] as const
            ).map(([tone, title, kind]) => (
              <TiltCard key={title} tone={tone} data-rap-cursor="Open">
                <div className="flex flex-col justify-between gap-12 min-h-64">
                  <Display size="lg">{title}</Display>
                  <span className="text-[0.95rem] font-medium opacity-75">{kind}</span>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
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
@import "rapui/theme.css";

<div className="bg-surface rounded-pill h-control" />`,
  },
  {
    title: "Radix under everything",
    body: "Dialogs, menus, popovers, selects, tabs and sliders sit on Radix primitives: focus traps, roving focus, typeahead, ARIA and Escape all come with them, not from us.",
    code: `import { Dialog, DialogTrigger, DialogContent } from "rapui";
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
import { Button } from "rapui"; // just Button`,
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
    <section className="pt-32 pb-24 border-t-[1.5px] border-line" id="tech">
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
              "snap-start shrink-0 w-[min(70vw,64rem)] max-[760px]:w-[86vw] grid grid-cols-[1fr_1.15fr] gap-10 p-[clamp(1.5rem,3.5vw,3.5rem)] rounded-lg min-h-[26rem] max-[900px]:grid-cols-1",
              i % 3 === 0 ? "bg-paper-2" : i % 3 === 1 ? "bg-ink text-paper dark:bg-paper-2 dark:text-ink" : "bg-acid text-[#282828]",
            )}
          >
            <div className="flex flex-col justify-between gap-8">
              <span className="text-[clamp(3rem,6vw,5.5rem)] font-display font-medium tracking-[-0.05em] leading-none opacity-25 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-4">
                <Display size="lg">{t.title}</Display>
                <p className="m-0 text-[1.1rem] leading-[1.5] opacity-80 max-w-[40ch]">{t.body}</p>
              </div>
            </div>
            <Code wrap className="self-end">{t.code}</Code>
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
    <section className="py-32 px-(--gutter) flex flex-col gap-8" id="tokens">
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
            <div className="flex flex-col justify-between min-h-56">
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
    <section className="pt-24 px-(--gutter) pb-32 bg-paper-2 rounded-t-lg" id="install">
      <div className="grid grid-cols-[1fr_1.1fr] gap-12 items-start max-[900px]:grid-cols-1">
        {/* the heading stays in view while the snippets scroll past */}
        <div className="flex flex-col gap-6 sticky top-28 max-[900px]:static">
          <Display size="xxl">
            Two lines <Accent tone="mute">and you’re in</Accent>
          </Display>
          <p className={COPY}>
            Precompiled CSS for any React app, or the Tailwind theme for apps that already use Tailwind v4. The fonts are optional.
          </p>
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <Code>{`npm install rapui`}</Code>
          <Code>{`// main.tsx
import "rapui/styles.css";
import "rapui/fonts"; // optional: Onest + Geist Mono

import { Button, SoundProvider } from "rapui";

export function App() {
  return (
    <SoundProvider fun={40}>
      <Button size="xl" icon>Make it loud</Button>
    </SoundProvider>
  );
}`}</Code>
          <Code>{`/* already on Tailwind v4? */
@import "tailwindcss";
@import "rapui/theme.css";
@source "../node_modules/rapui/dist";`}</Code>
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
          Bored yet<Accent>?</Accent>
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
  return (
    <div className="rap-root min-h-screen overflow-x-clip [--gutter:clamp(1rem,4vw,3.5rem)]">
      <Cursor />
      <Header dark={dark} setDark={setDark} sound={sound} setSound={setSound} />
      <main>
        <Hero />
        <Bands />
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
