import { useState, type FormEvent, type ReactNode } from "react";
import {
  Accent,
  BalanceChart,
  BarsChart,
  BigLink,
  Button,
  ButtonGroup,
  CanvasToolbar,
  Checkbox,
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
  type SoundSettings,
  type StackState,
} from "../rapui";
import { Volume1, Volume2 } from "../rapui/icons";
import { cn } from "../rapui/utils";
import { Code } from "./Code";
import { SoundControls } from "./SoundControls";
import { Wordmark } from "./Wordmark";
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

/* one line of the hero headline */
const HERO_LINE = "relative block whitespace-nowrap max-[900px]:whitespace-normal";

function Hero() {
  return (
    <section className="relative min-h-svh pt-36 px-(--gutter) pb-14 flex flex-col justify-between gap-14 max-[900px]:min-h-0 max-[900px]:pt-28" id="top">
      {/* The pitch in one sentence, and the one part of the old headline worth keeping:
          the "boring" tag. It is the joke — a sticker on the very word the kit refuses. */}
      <Display as="h1" size="mega" className="flex flex-col">
        <span className={HERO_LINE}>
          <SplitReveal by="char" stagger={30}>All the</SplitReveal>
        </span>
        <span className={cn(HERO_LINE, "pl-[10vw] max-[900px]:pl-0")}>
          <Accent>
            <SplitReveal delay={200}>components,</SplitReveal>
          </Accent>
          <Sticker
            shape="burst"
            color="acid"
            size="clamp(0.7rem, 1.2vw, 1.1rem)"
            rotate={12}
            className="absolute -top-[0.35em] right-[4vw] w-[clamp(5rem,10vw,9rem)] max-[900px]:hidden"
          >
            {COUNT}+
            <br />
            inside
          </Sticker>
        </span>
        <span className={HERO_LINE}>
          <SplitReveal by="char" stagger={30} delay={380}>none of the</SplitReveal>{" "}
          <Sticker color="blue" rotate={-8} size="clamp(0.9rem, 2vw, 1.8rem)" className="align-middle origin-center -top-[0.35em]">
            boring
          </Sticker>
        </span>
      </Display>

      <div className="grid grid-cols-[1.3fr_1fr] items-end gap-10 max-[900px]:grid-cols-1">
        <Lead className="max-w-[44ch]">
          Tired of grey rectangles with 4px corners? rapui is a React kit with <Highlight>the same breadth as shadcn/ui</Highlight>{" "}
          — forms, overlays, tables, charts — built on the same Radix + Tailwind base, but big, round and springy, with a small
          joke hidden in every component.
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

const PLAIN_BTN = "h-9 px-4 rounded-[4px] bg-[#18181b] text-white text-[14px] font-medium";
const PLAIN_INPUT = "h-9 w-full px-3 rounded-[4px] border border-[#e4e4e7] bg-white text-[14px] text-[#18181b] placeholder:text-[#a1a1aa]";

function SameApi() {
  const [fun, setFun] = useState(true);
  const [on, setOn] = useState(true);
  const [vol, setVol] = useState(60);
  return (
    <section className="px-(--gutter) pt-10 pb-32 grid grid-cols-[1fr_1.2fr] gap-16 items-center max-[1000px]:grid-cols-1" id="same-api">
      <div className="flex flex-col gap-8">
        <Display size="xxl">
          Same API. <Accent tone="mute">Different nerve.</Accent>
        </Display>
        <p className={COPY}>
          If you know shadcn/ui you already know rapui: Radix underneath, <code>className</code> merged with <code>cn()</code>,
          variants through <code>cva</code>, a <code>data-slot</code> on every part. What changes is everything you can see and
          hear.
        </p>
        <Switch size="lg" checked={fun} onCheckedChange={setFun} label={fun ? "rapui" : "a sensible default"} />
      </div>

      <div className={cn("grid gap-6 p-[clamp(1.5rem,4vw,3rem)] rounded-lg transition-colors duration-(--rap-dur)", fun ? "bg-paper-2" : "bg-white text-[#18181b]")}>
        {fun ? (
          <div key="fun" className="grid gap-6 fun:animate-toss-in">
            <ButtonGroup>
              <Button size="lg" icon>
                Publish
              </Button>
              <Button size="lg" variant="soft">
                Preview
              </Button>
            </ButtonGroup>
            <Input size="lg" placeholder="Project name" aria-label="Project name" />
            <div className="flex flex-wrap items-center gap-8">
              <Switch checked={on} onCheckedChange={setOn} label="Autosave" />
              <Checkbox defaultChecked aria-label="Public" />
            </div>
            <ElasticSlider aria-label="Volume" value={vol} onValueChange={setVol} icons={[<Volume1 key="a" />, <Volume2 key="b" />]} />
          </div>
        ) : (
          <div key="plain" className="grid gap-4 font-[system-ui,sans-serif]">
            <div className="flex gap-2">
              <button className={PLAIN_BTN}>Publish</button>
              <button className={cn(PLAIN_BTN, "bg-[#f4f4f5] text-[#18181b]")}>Preview</button>
            </div>
            <input className={PLAIN_INPUT} placeholder="Project name" aria-label="Project name" />
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" defaultChecked /> Autosave
            </label>
            <input type="range" aria-label="Volume" value={vol} onChange={(e) => setVol(Number(e.target.value))} />
          </div>
        )}
        <Code>{`<Button icon>Publish</Button>
<Input placeholder="Project name" />
<Switch checked={on} onCheckedChange={setOn} />`}</Code>
      </div>
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
        <div className="flex flex-wrap justify-center items-start gap-tile w-full">
          <BalanceChart />
          <DonutChart />
          <GaugeChart defaultValue={72} />
          <BarsChart />
          <RaceBars />
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
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-tile w-full items-start max-[1000px]:grid-cols-1">
          <VideoPlayer
            src={reel}
            title="Studio reel"
            chapters={[
              { at: 0, title: "Intro" },
              { at: 3, title: "Shapes" },
              { at: 6, title: "Type" },
              { at: 9, title: "Outro" },
            ]}
          />
          <div className="flex flex-col gap-tile min-w-0">
            <AudioPlayer src={gridLines} title="Grid Lines" artist="The Baseline Club" />
            <VoiceNote src={voiceNote} from="me" sent="14:02" className="self-end" />
          </div>
        </div>
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

function Tech() {
  return (
    <section className="pt-32 pb-24 px-(--gutter) border-t-[1.5px] border-line" id="tech">
      <div className="flex flex-col gap-8 pb-16">
        <Display size="xxl">
          Fun on top, <Accent tone="mute">serious underneath</Accent>
        </Display>
        <p className={COPY}>The jokes are a layer. The foundation is the same boring, reliable stack you would pick anyway.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-tile">
        {TECH.map((t) => (
          <div key={t.title} className="flex flex-col gap-5 p-8 rounded-lg bg-paper-2 min-w-0">
            <Display size="md">{t.title}</Display>
            <p className="m-0 text-ink-2 text-[1rem] leading-[1.5]">{t.body}</p>
            <Code className="mt-auto">{t.code}</Code>
          </div>
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
        <Wordmark className="font-[550] tracking-[-0.075em]" />
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
