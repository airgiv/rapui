import { useState, type ReactNode } from "react";
import {
  Accent,
  Accordion,
  CanvasToolbar,
  Checklist,
  BigLink,
  Button,
  ButtonGroup,
  CircleButton,
  Counter,
  Cursor,
  Display,
  Eyebrow,
  FeatureCard,
  Field,
  Highlight,
  Lead,
  Magnetic,
  Marquee,
  RollText,
  RotatingBadge,
  SplitReveal,
  Sticker,
  Switch,
  Tabs,
  TiltCard,
} from "../rapui";
import { Code } from "./Code";
import { SoundControls } from "./SoundControls";
import type { SoundSettings } from "../rapui";

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
    <header className="site-header">
      <a href="#top" className="site-logo" data-rap-cursor="Home">
        rap<Accent>/</Accent>ui
        <Sticker color="acid" rotate={-10} size="0.55rem" className="site-logo__tag">
          v0.1
        </Sticker>
      </a>
      <nav className="site-nav">
        <a href="#docs"><RollText>Docs</RollText></a>
        <a href="#components"><RollText>Showcase</RollText></a>
        <a href="#tokens"><RollText>Tokens</RollText></a>
        <a href="#install"><RollText>Install</RollText></a>
      </nav>
      <div className="site-header__right">
        <SoundControls value={sound} onChange={setSound} />
        <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        <Button size="sm" icon onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
          Get it
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__top">
        <Eyebrow>Designer-grade React components</Eyebrow>
        <span className="hero__meta">Nº 001 — 2026 edition</span>
      </div>

      <Display as="h1" size="mega" className="hero__title">
        <span className="hero__line">
          <SplitReveal by="char" stagger={35}>Loud</SplitReveal>
          <Sticker shape="burst" color="flame" size="clamp(0.7rem, 1.2vw, 1.1rem)" rotate={12} className="hero__burst">
            new
            <br />
            drop!
          </Sticker>
        </span>
        <span className="hero__line hero__line--indent">
          <Accent>
            <SplitReveal delay={250}>interfaces,</SplitReveal>
          </Accent>
        </span>
        <span className="hero__line">
          <SplitReveal by="char" stagger={35} delay={400}>zero</SplitReveal>{" "}
          <Sticker color="blue" rotate={-8} size="clamp(0.9rem, 2vw, 1.8rem)" className="hero__pill">
            boring
          </Sticker>{" "}
          <SplitReveal by="char" stagger={35} delay={600}>bits</SplitReveal>
        </span>
      </Display>

      <div className="hero__bottom">
        <Lead>
          rap/ui is a <Highlight>fancy, airy, editorial</Highlight> component kit — huge type, unusual buttons and motion
          that makes people scroll back up.
        </Lead>
        <ButtonGroup className="hero__actions">
          <Button size="lg" variant="blue" icon onClick={() => (window.location.hash = "docs")}>
            Browse components
          </Button>
          <Button size="lg" variant="soft" onClick={() => document.getElementById("install")?.scrollIntoView({ behavior: "smooth" })}>
            npm i rapui
          </Button>
        </ButtonGroup>
        <RotatingBadge className="hero__badge" text="scroll ✳ to ✳ explore ✳ rap/ui ✳ " size={150} center={<span className="hero__down">↓</span>} />
      </div>
    </section>
  );
}

const NAMES = ["Buttons", "Marquee", "Stickers", "Reveal", "Big links", "Feature cards", "Tilt cards", "Fields", "Switch", "Tabs", "Accordion", "Counter", "Cursor"];

function Bands() {
  return (
    <div className="bands">
      <Marquee className="band band--acid" rotate={-2.5} duration={30} gap="2.5rem">
        {NAMES.map((n) => (
          <span className="band__word" key={n}>
            {n} <span className="band__star">✳</span>
          </span>
        ))}
      </Marquee>
      <Marquee className="band band--ink" rotate={1.8} duration={36} reverse gap="2.5rem">
        {NAMES.map((n) => (
          <span className="band__word" key={n}>
            {n} <span className="band__dot" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

function Stats() {
  return (
    <section className="stats">
      <div className="stat">
        <Display size="xxl"><Counter to={22} /></Display>
        <span>components & primitives, more dropping weekly</span>
      </div>
      <div className="stat">
        <Display size="xxl"><Counter to={0} from={99} /></Display>
        <span>boring rectangles with 4px radius</span>
      </div>
      <div className="stat">
        <Display size="xxl"><Counter to={100} suffix="%" /></Display>
        <span>air between elements. Let it breathe.</span>
      </div>
    </section>
  );
}

function Showcase({
  n,
  id,
  title,
  sub,
  desc,
  code,
  children,
  stageClass,
}: {
  n: number;
  id: string;
  title: string;
  sub?: string;
  desc: ReactNode;
  code: string;
  children: ReactNode;
  stageClass?: string;
}) {
  return (
    <section className="show" id={id}>
      <div className="show__head">
        <span className="show__num">{String(n).padStart(2, "0")}</span>
        <Display size="xl" className="show__title">
          <SplitReveal>{title}</SplitReveal> {sub && <Accent tone="mute">{sub}</Accent>}
        </Display>
        <p className="show__desc">{desc}</p>
      </div>
      <Tabs
        className="show__tabs"
        items={[
          { value: "preview", label: "Preview", content: <div className={`show__stage ${stageClass ?? ""}`}>{children}</div> },
          { value: "code", label: "Code", content: <Code>{code}</Code> },
        ]}
      />
    </section>
  );
}

/* ───────────────────────── demos ───────────────────────── */

function FieldDemo() {
  const [email, setEmail] = useState("");
  const bad = email.length > 0 && !email.includes("@");
  return (
    <div className="demo-form">
      <Field label="Your name" size="xl" />
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={bad ? "That does not look like an email" : undefined} hint="We never spam. Pinky promise." />
      <Button variant="blue" size="lg" icon>
        Send it
      </Button>
    </div>
  );
}

function SwitchDemo() {
  const [a, setA] = useState(true);
  return (
    <div className="demo-col">
      <Switch size="lg" checked={a} onCheckedChange={setA} label={a ? "Motion is on — wheee" : "Motion is off"} />
      <Switch defaultChecked={false} label="Newsletter" />
      <Switch disabled label="Disabled" />
    </div>
  );
}

function Components() {
  return (
    <div id="components" className="components">
      <div className="components__intro">
        <Eyebrow>The kit</Eyebrow>
        <Display size="xxl">
          Every piece <Accent tone="mute">performs</Accent>
        </Display>
        <div className="index">
          {[
            ["buttons", "Buttons"],
            ["circle", "Circle CTA"],
            ["biglink", "Big links"],
            ["feature", "Feature cards"],
            ["type", "Typography"],
            ["marquee", "Marquee"],
            ["stickers", "Stickers"],
            ["badge", "Rotating badge"],
            ["reveal", "Split reveal"],
            ["tilt", "Tilt card"],
            ["field", "Field"],
            ["switch", "Switch"],
            ["tabs", "Tabs"],
            ["accordion", "Accordion"],
            ["counter", "Counter"],
            ["cursor", "Cursor & magnetic"],
            ["checklist", "Checklist"],
            ["toolbar", "Canvas toolbar"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="index__link">
              <RollText>{label}</RollText>
            </a>
          ))}
        </div>
      </div>

      <Showcase
        n={1}
        id="buttons"
        title="Buttons"
        sub="with nerve"
        desc="Pills with a colour blob that swells from below, letters that roll, an arrow bubble that spins. Seven variants, four sizes. Group them with ButtonGroup and they sit edge to edge, 2px apart, like on Readymag."
        code={`import { Button, ButtonGroup } from "rapui";

<Button size="xl" variant="solid" icon magnetic>Start a project</Button>
// buttons in a group sit edge to edge with a 2px seam
<ButtonGroup>
  <Button size="lg" variant="blue" icon>Blue</Button>
  <Button size="lg" variant="accent">Accent</Button>
  <Button size="lg" variant="soft">Soft</Button>
</ButtonGroup>
<Button variant="ghost" icon>Read the manifesto</Button>`}
      >
        <div className="demo-wrap">
          <Button size="xl" icon magnetic>
            Start a project
          </Button>
          <ButtonGroup>
            <Button size="lg" variant="blue" icon>
              Blue
            </Button>
            <Button size="lg" variant="accent">
              Accent
            </Button>
            <Button size="lg" variant="soft">
              Soft
            </Button>
            <Button size="lg" variant="acid">
              Acid
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button size="sm">Small</Button>
            <Button size="md" variant="soft">
              Medium
            </Button>
            <Button size="md" variant="outline">
              Outline
            </Button>
          </ButtonGroup>
          <Button variant="ghost" icon>
            Read the manifesto
          </Button>
        </div>
      </Showcase>

      <Showcase
        n={2}
        id="circle"
        title="Circle"
        sub="CTA"
        desc="A round, magnetic call-to-action. Ink floods in from the centre on hover. Put a word, an arrow or both."
        code={`import { CircleButton } from "rapui";

<CircleButton size={200} />
<CircleButton size={200} variant="ink">Let's talk</CircleButton>
<CircleButton size={160} variant="acid" />`}
      >
        <div className="demo-row demo-row--center">
          <CircleButton size={200} />
          <CircleButton size={200} variant="ink">
            Let’s
            <br />
            talk
          </CircleButton>
          <CircleButton size={160} variant="acid" />
          <CircleButton size={120} variant="outline" />
        </div>
      </Showcase>

      <Showcase
        n={3}
        id="biglink"
        title="Big"
        sub="links"
        desc="Headline-sized text links straight from the Readymag playbook: the word turns orange, an arrow slides in, the meta caption follows. Stack them into a menu or a project index."
        code={`import { BigLink } from "rapui";

<BigLink href="/work" meta="24 projects">Work</BigLink>
<BigLink href="/about" meta="since 2019">Studio</BigLink>
<BigLink href="/contact" size="xxl">Say hello</BigLink>`}
      >
        <div className="demo-biglinks">
          <BigLink href="#biglink" meta="24 projects">Work</BigLink>
          <BigLink href="#biglink" meta="since 2019">Studio</BigLink>
          <BigLink href="#biglink" meta="12 posts">Journal</BigLink>
          <BigLink href="#biglink" meta="→ mail">Say hello</BigLink>
        </div>
      </Showcase>

      <Showcase
        n={4}
        id="feature"
        title="Feature"
        sub="cards"
        desc="Airy tiles with a big media slot, a short bold title and a whisper-small caption. Media zooms on hover, the card lifts. Seven tones."
        code={`import { FeatureCard } from "rapui";

<FeatureCard title="Built-in animations" media={<img src="/anim.webp" alt="" />}>
  Craft engaging storytelling and interactive experiences
</FeatureCard>`}
      >
        <div className="demo-features">
          <FeatureCard title="Free layout" media={<span className="demo-emoji">✦</span>}>
            Complete creative freedom, so you can create unique designs
          </FeatureCard>
          <FeatureCard title="Built-in animations" tone="blue" media={<span className="demo-emoji">↻</span>}>
            Craft engaging storytelling and interactive experiences
          </FeatureCard>
          <FeatureCard title="Advanced typography" tone="grey" media={<span className="demo-emoji">Aa</span>}>
            Enhance design aesthetics and readability
          </FeatureCard>
          <FeatureCard title="Collaboration" tone="flame" media={<span className="demo-emoji">☺</span>}>
            Work on group projects, leave comments and assign tasks
          </FeatureCard>
        </div>
      </Showcase>

      <Showcase
        n={5}
        id="type"
        title="Typography"
        sub="that shouts"
        desc={
          <>
            One family, Onest, for everything: medium weight and tight tracking for headlines, plain for text. Accent words change colour, not font. Fluid
            <code> clamp()</code> sizes from <em>md</em> to <em>mega</em>.
          </>
        }
        code={`import { Display, Accent, Eyebrow, Lead, Highlight } from "rapui";

<Eyebrow>Chapter one</Eyebrow>
<Display size="xxl">Make it <Accent>unforgettable</Accent></Display>
<Lead>Big type, lots of air, and a <Highlight>highlighter</Highlight> swipe.</Lead>`}
      >
        <div className="demo-type">
          <Eyebrow>Chapter one</Eyebrow>
          <Display size="xxl">
            Make it <Accent>unforgettable</Accent>
          </Display>
          <Lead>
            Big type, lots of air, and a <Highlight>highlighter</Highlight> swipe — or a <Highlight color="bubble">pink</Highlight> one, or{" "}
            <Highlight color="blue">blue</Highlight>.
          </Lead>
          <div className="demo-scale">
            {(["lg", "md"] as const).map((s) => (
              <Display key={s} size={s}>
                {s === "lg" ? "Display / lg" : "Display / md — for smaller headings"}
              </Display>
            ))}
          </div>
        </div>
      </Showcase>

      <Showcase
        n={6}
        id="marquee"
        title="Marquee"
        sub="forever"
        desc="Seamless infinite ticker. Tilt it, reverse it, stack two in opposite directions. Pauses on hover."
        stageClass="show__stage--bleed"
        code={`import { Marquee, Accent } from "rapui";

<Marquee rotate={-3} duration={20}>
  <span>Available for work</span> <Accent tone="mute">✳</Accent>
</Marquee>`}
      >
        <div className="demo-marquees">
          <Marquee rotate={-3} duration={18} className="demo-mq demo-mq--flame">
            <span>Available for work</span>
            <span>✳</span>
          </Marquee>
          <Marquee rotate={2} duration={24} reverse className="demo-mq demo-mq--line">
            <Sticker color="acid" rotate={-6}>fresh</Sticker>
            <span>Motion</span>
            <Sticker color="bubble" shape="circle" rotate={8}>hi!</Sticker>
            <Accent tone="blue">editorial</Accent>
          </Marquee>
        </div>
      </Showcase>

      <Showcase
        n={7}
        id="stickers"
        title="Stickers"
        sub="& tags"
        desc="Rotated labels that wobble when you touch them. Ten soft shapes with no sharp corners (pill, circle, tag, star, burst, flower, clover, blob, heart, squircle) in every accent."
        code={`import { Sticker } from "rapui";

<Sticker color="acid">fresh</Sticker>
<Sticker color="flame" shape="burst" size="1.2rem">hot!</Sticker>
<Sticker color="blue" shape="star">★</Sticker>
<Sticker color="bubble" shape="circle">say hi</Sticker>
<Sticker color="sky" shape="tag" rotate={4}>sale</Sticker>
<Sticker color="plum" shape="flower">new</Sticker>
<Sticker color="acid" shape="heart">love it</Sticker>
// also: blob, clover, squircle`}
      >
        <div className="demo-row demo-row--center demo-stickers">
          <Sticker color="acid" size="1.6rem">fresh</Sticker>
          <Sticker color="flame" shape="burst" size="1.1rem" rotate={10}>
            hot
            <br />
            drop!
          </Sticker>
          <Sticker color="blue" shape="star" size="1.4rem" rotate={-12}>
            A+
          </Sticker>
          <Sticker color="bubble" shape="circle" size="1.2rem" rotate={9}>
            say
            <br />
            hi
          </Sticker>
          <Sticker color="sky" shape="tag" size="1.4rem" rotate={4}>
            sale −30%
          </Sticker>
          <Sticker color="plum" shape="flower" size="1.1rem" rotate={-8}>
            new
          </Sticker>
          <Sticker color="acid" shape="heart" size="1.1rem" rotate={6}>
            love it
          </Sticker>
          <Sticker color="sky" shape="blob" size="1.1rem" rotate={-4}>
            soft
          </Sticker>
          <Sticker color="flame" shape="clover" size="1.1rem" rotate={10}>
            lucky
          </Sticker>
          <Sticker color="ink" size="1.2rem" rotate={-3}>
            ink
          </Sticker>
          <Sticker color="paper" size="1.2rem" rotate={6}>
            paper
          </Sticker>
        </div>
      </Showcase>

      <Showcase
        n={8}
        id="badge"
        title="Rotating"
        sub="badge"
        desc="Running circular text around anything. Spins faster when hovered. Great as a scroll hint or a stamp on a card."
        code={`import { RotatingBadge } from "rapui";

<RotatingBadge text="open for projects ✳ open for projects ✳ " />
<RotatingBadge text="made with rap/ui • made with rap/ui • " color="acid" center="☺" />`}
      >
        <div className="demo-row demo-row--center">
          <RotatingBadge text="open for projects ✳ open for projects ✳ " size={180} />
          <RotatingBadge text="made with rap/ui • made with rap/ui • " color="acid" size={180} center="☺" />
          <RotatingBadge text="sound on ♪ sound on ♪ sound on ♪ " color="blue" size={180} center="▶" />
          <RotatingBadge text="hot ✳ hot ✳ hot ✳ hot ✳ hot ✳ " color="flame" size={120} />
        </div>
      </Showcase>

      <Showcase
        n={9}
        id="reveal"
        title="Split"
        sub="reveal"
        desc="Words (or letters) rise from behind a mask as the block scrolls into view. Pure CSS transitions, IntersectionObserver trigger."
        code={`import { SplitReveal, Display } from "rapui";

<Display size="xl">
  <SplitReveal>Every word earns its entrance</SplitReveal>
</Display>
<SplitReveal by="char" stagger={40}>letter by letter</SplitReveal>`}
      >
        <RevealDemo />
      </Showcase>

      <Showcase
        n={10}
        id="tilt"
        title="Tilt"
        sub="cards"
        desc="Cards that lean toward your cursor in 3D with a soft spotlight glow. Six tones."
        code={`import { TiltCard, Display } from "rapui";

<TiltCard tone="flame">
  <Display size="lg">Case study</Display>
</TiltCard>`}
      >
        <div className="demo-cards">
          <TiltCard tone="flame" data-rap-cursor="Open">
            <div className="demo-card">
              <span className="demo-card__k">Case 01</span>
              <Display size="lg">Brand for a bakery on Mars</Display>
              <span className="demo-card__f">Identity — 2026</span>
            </div>
          </TiltCard>
          <TiltCard tone="ink" data-rap-cursor="Play">
            <div className="demo-card">
              <span className="demo-card__k">Case 02</span>
              <Display size="lg">
                Motion system
              </Display>
              <span className="demo-card__f">Product — 2025</span>
            </div>
          </TiltCard>
          <TiltCard tone="acid" data-rap-cursor="Read">
            <div className="demo-card">
              <span className="demo-card__k">Case 03</span>
              <Display size="lg">Zine for night owls</Display>
              <span className="demo-card__f">Editorial — 2025</span>
            </div>
          </TiltCard>
        </div>
      </Showcase>

      <Showcase
        n={11}
        id="field"
        title="Field"
        sub="giant"
        desc="Oversized underline input. The italic label floats into a mono caption, the accent line draws itself on focus."
        code={`import { Field } from "rapui";

<Field label="Your name" size="xl" />
<Field label="Email" type="email" hint="We never spam." error={error} />`}
      >
        <FieldDemo />
      </Showcase>

      <Showcase
        n={12}
        id="switch"
        title="Switch"
        sub="chunky"
        desc="A fat toggle with a springy knob that stretches while you press it. Tiny on/off words inside."
        code={`import { Switch } from "rapui";

<Switch size="lg" checked={on} onCheckedChange={setOn} label="Motion" />
<Switch defaultChecked label="Newsletter" />`}
      >
        <SwitchDemo />
      </Showcase>

      <Showcase
        n={13}
        id="tabs"
        title="Tabs"
        sub="gooey"
        desc="Pill tabs with an indicator that springs between options. Arrow-key navigation, panels blur in. (These preview/code switches use it too.)"
        code={`import { Tabs } from "rapui";

<Tabs items={[
  { value: "all", label: "All", content: <Grid /> },
  { value: "brand", label: "Branding" },
  { value: "web", label: "Web" },
]} />`}
      >
        <Tabs
          items={[
            { value: "all", label: "All work", content: <Lead>Everything we made this year — 42 projects, 3 awards, 0 regrets.</Lead> },
            { value: "brand", label: "Branding", content: <Lead>Logos, systems, and a lot of very big type.</Lead> },
            { value: "web", label: "Web", content: <Lead>Sites that scroll like magazines and click like toys.</Lead> },
            { value: "motion", label: "Motion", content: <Lead>Things that move, on purpose.</Lead> },
          ]}
        />
      </Showcase>

      <Showcase
        n={14}
        id="accordion"
        title="Accordion"
        sub="editorial"
        desc="Big numbered rows. A colour swipe on hover, a plus that turns into a cross, smooth height via grid-rows."
        code={`import { Accordion } from "rapui";

<Accordion items={[
  { title: "Strategy", meta: "01 wk", content: "..." },
  { title: "Design", meta: "03 wk", content: "..." },
]} />`}
      >
        <Accordion
          defaultOpen={[0]}
          items={[
            { title: "Strategy", meta: "1 week", content: "We dig into the brief, poke at the market and write down what the thing should feel like before drawing a single pixel." },
            { title: "Design", meta: "3 weeks", content: "Type first, then layout, then motion. We show work early and often — messy is fine." },
            { title: "Build", meta: "4 weeks", content: "Everything is componentised with rap/ui, so the site ships with the same nerve as the mockups." },
            { title: "Launch", meta: "∞", content: "Confetti. Then analytics. Then iteration." },
          ]}
        />
      </Showcase>

      <Showcase
        n={15}
        id="counter"
        title="Counter"
        sub="count up"
        desc="Numbers that tick up with an exponential ease once visible. Prefix, suffix, decimals."
        code={`import { Counter, Display } from "rapui";

<Display size="mega"><Counter to={248} suffix="+" /></Display>`}
      >
        <div className="demo-counters">
          <div>
            <Display size="xxl"><Counter to={248} suffix="+" /></Display>
            <span>projects shipped</span>
          </div>
          <div>
            <Display size="xxl"><Counter to={4.9} decimals={1} /></Display>
            <span>average rating</span>
          </div>
          <div>
            <Display size="xxl"><Counter to={12} prefix="×" /></Display>
            <span>faster than a boring UI</span>
          </div>
        </div>
      </Showcase>

      <Showcase
        n={16}
        id="cursor"
        title="Cursor"
        sub="& magnetic"
        desc={
          <>
            A trailing blend-mode cursor that grows over interactive things and shows a label over anything with{" "}
            <code>data-rap-cursor</code>. Wrap anything in <code>&lt;Magnetic&gt;</code> to make it follow the pointer.
          </>
        }
        code={`import { Cursor, Magnetic, Sticker } from "rapui";

// once, at the app root
<Cursor />

<div data-rap-cursor="Drag me">hover here</div>
<Magnetic strength={0.5}>
  <Sticker shape="circle" size="2rem">pull</Sticker>
</Magnetic>`}
      >
        <div className="demo-row demo-row--center">
          <div className="demo-hover" data-rap-cursor="Hello ✳">
            Hover me
          </div>
          <div className="demo-hover demo-hover--blue" data-rap-cursor="View">
            and me
          </div>
          <Magnetic strength={0.6}>
            <Sticker shape="circle" color="acid" size="1.8rem" rotate={-8}>
              pull
              <br />
              me
            </Sticker>
          </Magnetic>
        </div>
      </Showcase>

      <Showcase
        n={17}
        id="checklist"
        stageClass="show__stage--ground"
        title="Checklist"
        sub="one spring"
        desc={
          <>
            From Bencho (MIT). Fill, tick, strike-through and fading ink are all read off one spring per row. Tick the last task and
            the list collapses into a heap, then resets after three seconds. You can add up to two tasks of your own.
          </>
        }
        code={`import { Checklist } from "rapui";

<Checklist />
<Checklist bounce={80} box={20} corner={24} />`}
      >
        <div className="demo-row demo-row--center">
          <Checklist />
          <Checklist bounce={85} box={20} corner={28} />
        </div>
      </Showcase>

      <Showcase
        n={18}
        id="toolbar"
        title="Canvas"
        sub="toolbar"
        desc={
          <>
            From Bencho (MIT). A floating tool rail that remembers your last shape. The selected tool gets a blue pad that scales in.
            Flat by default; put <code>data-surface="glass"</code> on an ancestor for the lit-rim glass version.
          </>
        }
        code={`import { CanvasToolbar } from "rapui";

<CanvasToolbar />

// glass: opt in on any ancestor
<div data-surface="glass">
  <CanvasToolbar corner={20} />
</div>`}
      >
        <div className="demo-toolbars">
          <div className="demo-toolbar demo-toolbar--flat">
            <CanvasToolbar />
          </div>
          <div className="demo-toolbar demo-toolbar--glass" data-surface="glass">
            <CanvasToolbar corner={20} />
          </div>
        </div>
      </Showcase>
    </div>
  );
}

function RevealDemo() {
  const [k, setK] = useState(0);
  return (
    <div className="demo-reveal" key={k}>
      <Display size="xl">
        <SplitReveal>Every word earns its entrance</SplitReveal>
      </Display>
      <Display size="lg">
        <Accent tone="mute">
          <SplitReveal by="char" stagger={30} delay={500}>letter by letter by letter</SplitReveal>
        </Accent>
      </Display>
      <Button size="sm" variant="soft" onClick={() => setK((x) => x + 1)}>
        Replay
      </Button>
    </div>
  );
}

const SWATCHES = [
  { name: "Paper", v: "--rap-paper", hex: "#F5F5F5", tone: "paper" },
  { name: "Ink", v: "--rap-ink", hex: "#282828", tone: "ink" },
  { name: "Flame", v: "--rap-flame", hex: "#EC520B", tone: "flame" },
  { name: "Blue", v: "--rap-blue", hex: "#0582FF", tone: "blue" },
  { name: "Plum", v: "--rap-plum", hex: "#8E0D99", tone: "plum" },
  { name: "Acid", v: "--rap-acid", hex: "#D7FF3C", tone: "acid" },
  { name: "Bubble", v: "--rap-bubble", hex: "#FF9BE0", tone: "bubble" },
  { name: "Sky", v: "--rap-sky", hex: "#8FD3FF", tone: "sky" },
] as const;

function Tokens() {
  return (
    <section className="tokens" id="tokens">
      <Eyebrow>Tokens</Eyebrow>
      <Display size="xxl">
        Grey paper, soft ink <Accent tone="mute">& six loud friends</Accent>
      </Display>
      <div className="swatches">
        {SWATCHES.map((s) => (
          <TiltCard key={s.name} tone={s.tone} max={8}>
            <div className="swatch">
              <Display size="md">{s.name}</Display>
              <span className="swatch__meta">
                {s.hex}
                <br />
                var({s.v})
              </span>
            </div>
          </TiltCard>
        ))}
      </div>

      <div className="specimens">
        <div className="specimen">
          <span className="specimen__k">Onest — headlines, 450, −4.5% tracking</span>
          <span className="specimen__big specimen__big--display">Aa Бб</span>
          <span className="specimen__abc">ABCDEFGHIJKLMNOPQRSTUVWXYZ АБВГДЕЖЗИЙКЛМН 0123456789</span>
        </div>
        <div className="specimen">
          <span className="specimen__k">Onest — interface, 400–600</span>
          <span className="specimen__big specimen__big--sans">Aa Бб</span>
          <span className="specimen__abc specimen__abc--sans">The quick brown fox · Съешь же ещё этих мягких булок</span>
        </div>
        <div className="specimen">
          <span className="specimen__k">Geist Mono — code only</span>
          <span className="specimen__big specimen__big--mono">{"{}"}</span>
          <span className="specimen__abc specimen__abc--mono">const nerve = true; // 0123</span>
        </div>
      </div>
    </section>
  );
}

function Install() {
  return (
    <section className="install" id="install">
      <div className="install__grid">
        <div>
          <Eyebrow>Install</Eyebrow>
          <Display size="xxl">
            Two lines <Accent tone="mute">and you’re loud</Accent>
          </Display>
        </div>
        <div className="install__steps">
          <Code>{`npm install rapui`}</Code>
          <Code>{`// main.tsx
import "rapui/styles.css";
import "rapui/fonts"; // optional: Onest + Geist Mono

import { Button, Cursor } from "rapui";

export function App() {
  return (
    <div className="rap-root">
      <Cursor />
      <Button size="xl" icon magnetic>Make it loud</Button>
    </div>
  );
}`}</Code>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__cta">
        <Display size="xxl">
          Got an idea<Accent>?</Accent>
        </Display>
        <CircleButton size={180} variant="accent">
          Say
          <br />
          hello
        </CircleButton>
      </div>
      <div className="footer__giant" aria-hidden>
        rap<Accent>/</Accent>ui
      </div>
      <div className="footer__bottom">
        <span>© 2026 rap/ui — MIT</span>
        <span>Made with too much coffee ✳ and big type</span>
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
    <div className="rap-root site">
      <Cursor />
      <Header dark={dark} setDark={setDark} sound={sound} setSound={setSound} />
      <main>
        <Hero />
        <Bands />
        <Stats />
        <Components />
        <Tokens />
        <Install />
      </main>
      <Footer />
    </div>
  );
}
