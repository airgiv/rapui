import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Accent,
  BalanceChart,
  BarsChart,
  BigLink,
  Button,
  ButtonGroup,
  Checklist,
  CircleButton,
  ConfirmButton,
  Counter,
  Cursor,
  Display,
  DonutChart,
  ElasticSlider,
  GaugeChart,
  Highlight,
  HoldButton,
  Input,
  Lead,
  Marquee,
  RaceBars,
  RollText,
  SlideButton,
  Sparkline,
  SplitReveal,
  Sticker,
  Switch,
  Tabs,
  TiltCard,
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
} from "../rapui";
import { ArrowLeft, ArrowRight, Volume1, Volume2 } from "../rapui/icons";
import { cn } from "../rapui/utils";
import { Code } from "./Code";
import { SoundControls } from "./SoundControls";
import { Wordmark } from "./Wordmark";
import { Floaty, HeroScene } from "./HeroScene";
import { isCalm } from "../rapui/hooks/useGlide";
import { FormDemo } from "./demos/FormDemo";
import { ToolbarDemo } from "./demos/ToolbarDemo";
import { DialsDemo } from "./demos/DialsDemo";
import { StickersDemo } from "./demos/StickersDemo";
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
/* a white stage with a grey dot grid, the canvas feel of an editor */
const DOTS = "bg-paper-2 [background-image:radial-gradient(circle,var(--rap-line)_1.3px,transparent_1.6px)] [background-size:22px_22px] [background-position:center]";
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
      <a href="#top" className="text-[2.1rem] max-[480px]:text-[1.6rem]" data-rap-cursor="Home" aria-label="rapui, back to top">
        <Wordmark />
      </a>
      <nav className="flex gap-9 text-[1.05rem] font-medium max-[860px]:hidden">
        <a href="#docs"><RollText>Docs</RollText></a>
        <a href="#wall"><RollText>Components</RollText></a>
        <a href="#tech"><RollText>Under the hood</RollText></a>
        <a href="#install"><RollText>Install</RollText></a>
      </nav>
      {/* on a phone everything packs a little tighter so the header pill fits */}
      <div className="flex items-center gap-3 max-[480px]:gap-2">
        <SoundControls value={sound} onChange={setSound} tight />
        <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        <Button size="md" icon className="max-[480px]:hidden" onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
          Get it
        </Button>
      </div>
    </header>
  );
}

/* one line of the headline: huge, and a single loose object */
const LINE = "flex flex-wrap items-center gap-x-[0.2em] font-display font-medium tracking-[-0.055em] text-[clamp(3.2rem,10.5vw,11rem)] leading-[0.82] whitespace-nowrap max-[700px]:whitespace-normal";

/* Three lines, three objects. The last round had every word and four little
   cards loose on the table, which read as confetti rather than a headline. Now
   each LINE is one piece: a degree or two of tilt, a little drift with the
   pointer, and you can pick a whole line up and it springs back. The tag and the
   burst belong to their lines and move with them. No shadows: the page is flat. */
function Hero() {
  return (
    <section className="relative min-h-svh pt-36 px-(--gutter) pb-14 flex flex-col justify-between gap-14 max-[900px]:min-h-0 max-[900px]:pt-28" id="top">
      <HeroScene>
        <h1 className="m-0 flex flex-col items-start" aria-label="All the components, none of the boring bits">
          <Floaty depth={8} rotate={-1.5} className={LINE}>
            <span aria-hidden>All the</span>
          </Floaty>
          <Floaty depth={16} rotate={1.2} className={cn(LINE, "text-flame ml-[8vw] max-[900px]:ml-0")}>
            <span aria-hidden>components,</span>
            <Sticker
              shape="burst"
              color="acid"
              spin={false}
              size="clamp(0.8rem,1.2vw,1.1rem)"
              rotate={12}
              className="absolute -top-[0.35em] left-full -ml-[0.05em] w-[clamp(5.5rem,9vw,8.5rem)] tracking-normal max-[1100px]:hidden"
            >
              {COUNT}+
              <br />
              inside
            </Sticker>
          </Floaty>
          <Floaty depth={11} rotate={-0.8} className={LINE}>
            <span aria-hidden>none of the</span>
            <Sticker color="blue" rotate={-7} size="clamp(1.1rem, 3vw, 2.8rem)" className="px-[0.9em] py-[0.35em] tracking-normal">
              boring
            </Sticker>
            <span aria-hidden>bits.</span>
          </Floaty>
        </h1>
      </HeroScene>

      <div className="grid grid-cols-[1.3fr_1fr] items-end gap-10 max-[900px]:grid-cols-1">
        <Lead className="max-w-[46ch]">
          Everything you would reach for in shadcn/ui — dialogs, forms, tables, calendars — on the same Radix + Tailwind base.{" "}
          <Highlight>Plus the things it never shipped</Highlight>: hold-to-delete buttons, liquid forms, charts you scrub, galleries
          you throw. Bring a boring screen; we will rapui it.
        </Lead>
        <ButtonGroup className="justify-self-end max-[900px]:justify-self-start">
          <Button size="lg" variant="blue" icon onClick={() => (window.location.hash = "docs")}>
            Browse {COUNT}+ components
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
          <ElasticSlider aria-label="Volume" value={vol} onValueChange={setVol} icons={[<Volume1 key="a" />, <Volume2 key="b" />]} />
        </div>
      ),
    },
  ];
  return (
    <section className="px-(--gutter) pt-10 pb-32 flex flex-col gap-12" id="same-api">
      <div className="grid grid-cols-[1fr_minmax(0,30rem)] gap-10 items-end max-[900px]:grid-cols-1">
        <Display size="xxl">
          Same API. <Accent>Just rapui it.</Accent>
        </Display>
        <div className="flex flex-col gap-6">
          <p className={COPY}>
            If you know shadcn/ui you already know rapui: Radix underneath, <code>cn()</code>, <code>cva</code> variants, a{" "}
            <code>data-slot</code> on every part. Same props — flip the switch and the screen gets rapui’d.
          </p>
          <Switch size="lg" checked={fun} onCheckedChange={setFun} label={fun ? "rapui’d" : "rapui it"} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-tile max-w-[60rem] w-full mx-auto max-[700px]:grid-cols-1">
        {tiles.map((t, i) => (
          <div
            key={`${i}-${fun}`}
            className={cn(
              "grid place-items-center min-h-52 p-8 rounded-lg transition-colors duration-300",
              fun ? "bg-paper-2 fun:animate-toss-in" : "bg-white shadow-[inset_0_0_0_1px_#e4e4e7]",
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {fun ? t.rap : t.plain}
          </div>
        ))}
      </div>
      <div className="max-w-[60rem] w-full mx-auto">
        <Code>{`<Button icon>Publish</Button>
<Switch checked={on} onCheckedChange={setOn} label="Autosave" />
<Input placeholder="Project name" />
<Slider value={[vol]} onValueChange={([v]) => setVol(v)} />`}</Code>
      </div>
    </section>
  );
}

/* The numbers, huge, each one proven by a live thing under it rather than a
   slogan: the count, a grey 4px rectangle that rapuis itself when you touch it,
   and the one attribute that calms the whole page — a real switch that does it. */
const STAT = "flex flex-col justify-between gap-10 min-h-[30rem] p-[clamp(1.5rem,3vw,2.5rem)] rounded-lg bg-paper-2 overflow-hidden";
const BIG = "font-display font-medium tracking-[-0.07em] leading-[0.8] tabular-nums text-[clamp(5rem,9.5vw,10rem)]";
const STAT_TEXT = "m-0 max-w-[26ch] text-[1.15rem] leading-[1.4] text-ink-2";

function Stats() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (calm) root.setAttribute("data-rap-motion", "calm");
    else root.removeAttribute("data-rap-motion");
    return () => root.removeAttribute("data-rap-motion");
  }, [calm]);
  return (
    <section className="grid grid-cols-3 gap-tile px-(--gutter) pb-32 max-[1000px]:grid-cols-1">
      <div className={STAT}>
        <span className={BIG}>
          <Counter to={COUNT} />
          <span className="text-flame">+</span>
        </span>
        <p className={STAT_TEXT}>components — from Dialog and DataTable to a button you have to hold.</p>
      </div>
      <div className={STAT}>
        <span className={BIG}>
          <Counter to={0} from={99} />
        </span>
        <div className="flex flex-col gap-6">
          {/* the thing we don't ship: touch it and it gets rapui'd */}
          <button
            type="button"
            className={cn(
              "self-start h-11 px-5 rounded-[4px] bg-[#e4e4e7] text-[#52525b] text-[14px] font-medium cursor-pointer",
              "transition-[border-radius,background-color,color,height,padding,font-size] duration-500 ease-spring",
              "hover:rounded-[999px] hover:bg-flame hover:text-white hover:h-14 hover:px-8 hover:text-[1.1rem]",
            )}
          >
            Grey rectangle
          </button>
          <p className={STAT_TEXT}>grey rectangles with 4px corners. Hover the one above.</p>
        </div>
      </div>
      <div className={STAT}>
        <span className={BIG}>
          <Counter to={1} from={9} />
        </span>
        <div className="flex flex-col gap-6">
          <Switch size="lg" checked={calm} onCheckedChange={setCalm} label={calm ? "Calm — the page stands still" : "Calm mode"} />
          <p className={STAT_TEXT}>attribute turns every joke off, for the serious screens. That switch really does it.</p>
        </div>
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
   Big chat bubbles with the media dropped in between them, the way people
   actually send video and voice, on a loud pink ground so the grey video frame
   and the white bubbles stand off it. Each bubble pops in as it scrolls into
   view: up from below, tilted toward its own side, over-shooting on the back
   curve and settling straight — a conversation arriving, not a page loading. */
const BUBBLE = "max-w-[min(100%,34rem)] px-6 py-4 text-[clamp(1.1rem,1.8vw,1.5rem)] leading-[1.3] tracking-[-0.015em] font-medium";
const THEM = "rounded-[28px] rounded-bl-[8px] bg-paper-2 text-ink";
const ME = "rounded-[28px] rounded-br-[8px] bg-ink text-paper";

function ChatPop({ side, className, children }: { side: "them" | "me"; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isCalm(el)) return setShown(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const tilt = side === "me" ? 6 : -6;
  return (
    <div
      ref={ref}
      className={cn(side === "me" ? "self-end origin-bottom-right" : "self-start origin-bottom-left", className)}
      style={{
        opacity: shown ? 1 : 0,
        translate: shown ? "0 0" : "0 48px",
        rotate: shown ? "0deg" : `${tilt}deg`,
        scale: shown ? "1" : "0.82",
        transition: "opacity 260ms linear, translate 700ms var(--rap-ease-back), rotate 700ms var(--rap-ease-back), scale 700ms var(--rap-ease-back)",
      }}
    >
      {children}
    </div>
  );
}

function MediaChat() {
  const chapters = [
    { at: 0, title: "Intro" },
    { at: 3, title: "Shapes" },
    { at: 6, title: "Type" },
    { at: 9, title: "Outro" },
  ];
  return (
    <div className="flex flex-col gap-3 w-[min(100%,54rem)] mx-auto">
      <ChatPop side="them" className={cn(BUBBLE, THEM)}>Cut the reel for Friday. Tell me what you think 👀</ChatPop>
      <ChatPop side="them" className="w-[min(100%,40rem)]">
        <VideoPlayer src={reel} title="Studio reel" chapters={chapters} />
      </ChatPop>
      <ChatPop side="me" className={cn(BUBBLE, ME)}>wait — the whole frame leans when I scrub?? 😂</ChatPop>
      <ChatPop side="me">
        <VoiceNote src={voiceNote} from="me" sent="14:02" />
      </ChatPop>
      <ChatPop side="them" className={cn(BUBBLE, THEM)}>It does. And here’s the track for it:</ChatPop>
      <ChatPop side="them" className="w-[min(100%,30rem)]">
        <AudioPlayer src={gridLines} title="Grid Lines" artist="The Baseline Club" />
      </ChatPop>
      <ChatPop side="them" className={cn(THEM, "flex gap-1.5 px-5 py-5")}>
        {[0, 1, 2].map((d) => (
          <span key={d} className="size-2.5 rounded-full bg-ink/35 fun:animate-dot" style={{ animationDelay: `${d * 160}ms` }} />
        ))}
      </ChatPop>
    </div>
  );
}

function Wall() {
  return (
    <div id="wall" className="px-(--gutter)">
      <Showcase
        id="commit"
        title="Buttons"
        sub="that make you mean it"
        desc="For the actions you should not do by accident. Hold until the liquid reaches the top, slide the thumb to the rim, or click twice before the ring runs out. Each one with its own springs and sounds."
        code={`import { HoldButton, SlideButton, ConfirmButton } from "rapui";

<HoldButton variant="danger" onConfirm={deleteProject}>Hold to delete</HoldButton>
<SlideButton label="Slide to publish" doneLabel="Published" onConfirm={publish} />
<ConfirmButton label="Delete workspace" confirmLabel="Sure?" onConfirm={remove} />`}
        stageClass={cn(DOTS, "min-h-[44rem]")}
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
        title="Forms"
        sub="that melt"
        desc="A booking you fill in like a sentence. The pills melt into one bar, the one you are typing in swells, booking sucks the whole sentence into the button — and Monday, a party of forty or a 3 am snack get spat back out, the guilty pill shaking its head."
        code={`import { FormStack, Input, Button } from "rapui";

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
        {/* A mosaic, not a grid of equal boxes: each chart keeps its own size and
            they pack into centred columns with one small gap between neighbours —
            no empty tile around a small chart. */}
        <div className="columns-[20rem] gap-tile max-w-[66rem] mx-auto w-full [&>*]:mb-tile [&>*]:break-inside-avoid [&>*]:mx-auto">
          {/* each chart in its own wrapper: BalanceChart cancels its pull-stretch with a
              negative margin, which a margin set on it directly would undo */}
          {[
            <BalanceChart key="b" />,
            <DonutChart key="d" />,
            <SparkTable key="s" />,
            <GaugeChart key="g" defaultValue={72} />,
            <BarsChart key="bars" />,
            <RaceBars key="r" />,
          ].map((c) => (
            <div key={c.key} className="flex justify-center">
              {c}
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase
        id="dials"
        title="Dials"
        sub="& scrubbers"
        desc="Plan a night with nothing but rulers and rings: fling a strip of days, turn a tempo wheel that flashes on the beat, pick a lamp colour off a ring of hues, set the room under a magnifying lens, split rain against brown noise. The last card reads the whole desk back to you."
        code={`import { DateScrubber, TempoDial, HueRing, LensRuler, SplitSlider, RangeDial } from "rapui";

<DateScrubber value={night} onValueChange={setNight} />
<TempoDial bpm={68} onBeat={pulse} />
<HueRing value={hue} onValueChange={setHue} />
<LensRuler min={16} max={24} step={0.5} value={temp} onValueChange={setTemp} />
<SplitSlider value={60} labels={["Rain", "Brown noise"]} />`}
        stageClass="bg-paper p-[clamp(0.75rem,2vw,1.5rem)] place-items-stretch"
      >
        <DialsDemo />
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
        stageClass="bg-bubble"
      >
        <MediaChat />
      </Showcase>

      <Showcase
        id="tools"
        title="Tools"
        sub="that feel like toys"
        desc="A big editor bar in the Readymag spirit: chunky round slots, one pad that glides to the tool you pick, and sixteen hand-drawn icons that each do a little something — the cursor clicks, the ball bounces, the sticker peels. Press 1–9 to pick, + for widgets."
        code={`import { EditorToolbar } from "rapui";

<EditorToolbar size="hero" tone="blue" onValueChange={setTool} />`}
        stageClass="p-0 place-items-stretch"
      >
        <ToolbarDemo />
      </Showcase>

      <Showcase
        id="lists"
        title="Checklist"
        sub="that falls apart"
        stageClass="bg-paper"
        desc="From Bencho (MIT). Fill, tick, strike-through and fading ink all run on one spring per row — tick the last task and the whole list collapses into a heap."
        code={`import { Checklist } from "rapui";

<Checklist />`}
      >
        <div className={ROW}>
          <Checklist />
          <Checklist bounce={85} box={20} corner={28} />
        </div>
      </Showcase>

      <Showcase
        id="loud"
        title="The loud bits"
        sub="for landing pages"
        desc="Headline links, a board of stickers in sixteen shapes — price tags on strings, seals with running text, tickets, stamps, labels that peel — cards that lean toward the cursor. Drag the stickers about, tap the paper to slap on another."
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
          <StickersDemo />
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
              "snap-start shrink-0 w-[min(70vw,60rem)] max-[760px]:w-[86vw] flex flex-col gap-10 p-[clamp(1.5rem,3.5vw,3rem)] rounded-lg min-h-[38rem]",
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
