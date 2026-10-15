/* What each example landing says. One page per preset, and every page is about
   itself: the landing describes the preset it's dressed in, with a straight face
   in civic, a shout in fun, a transmission log in signal, a launch post in product
   and as few words as possible in minimal. Same blocks, five voices. */
import type { ReactNode } from "react";
import { Accent, type FAQItem, type FeatureItem, type PricingPlan, type RapPreset, type StatItem, type TestimonialItem } from "../../rapui";

export interface LandingContent {
  brand: string;
  tagline: string;
  links: string[];
  hero: { eyebrow: string; title: ReactNode; lead: string; primary: string; secondary: string; meta: { label: string; value: string }[] };
  logosTitle: string;
  logos: string[];
  /** The Statement: words around four live parts — a switch, a button, a slider, stars. */
  statement: { eyebrow: string; before: string; afterSwitch: string; button: string; afterButton: string; afterSlider: string; end: ReactNode };
  features: { eyebrow: string; title: ReactNode; lead: string; items: FeatureItem[] };
  split: { eyebrow: string; title: ReactNode; lead: string; points: string[]; caption: string; board: { title: string; unit: string; rows: [string, number, string][] } };
  stats: { eyebrow: string; title: ReactNode; items: StatItem[] };
  quotes: { eyebrow: string; title: ReactNode; items: TestimonialItem[] };
  pricing: { eyebrow: string; title: ReactNode; lead: string; plans: PricingPlan[] };
  faq: { eyebrow: string; title: ReactNode; items: FAQItem[] };
  cta: { eyebrow: string; title: ReactNode; lead: string; primary: string; secondary: string };
  footer: { columns: { title: string; links: string[] }[]; fine: string };
}

const plan = (p: Omit<PricingPlan, "cta"> & { cta: string }): PricingPlan => ({ ...p, cta: { label: p.cta } });

export const CONTENT: Record<RapPreset, LandingContent> = {
  /* ── fun: a page that will not calm down ── */
  fun: {
    brand: "Hollr",
    tagline: "A landing page with the volume stuck on eleven.",
    links: ["Why so loud", "Receipts", "Pricing", "FAQ"],
    hero: {
      eyebrow: "Now 40% louder than last week",
      title: (
        <>
          This headline is huge <Accent>and frankly proud of it.</Accent>
        </>
      ),
      lead: "You're looking at the fun preset: tiles packed four pixels apart, colours turned all the way up, and everything springs back when you poke it. Go on, poke it.",
      primary: "Make it louder",
      secondary: "Turn it down a bit",
      meta: [],
    },
    logosTitle: "Overheard in the offices of",
    logos: ["Boom & Sons", "Megaphonics", "Very Big Co", "Shouty", "Exclamation Labs", "Ta-da!"],
    statement: { eyebrow: "A sentence that does things", before: "This sentence has a", afterSwitch: "switch in it, a", button: "Button", afterButton: "you can press, a", afterSlider: "slider and", end: <>stars — <Accent tone="mute">because a sentence can.</Accent></> },
    features: {
      eyebrow: "Why so loud",
      title: <>Six reasons this page <Accent tone="mute">won't use its indoor voice</Accent></>,
      lead: "Every tile below is a real component wearing the fun preset. None of them were asked to tone it down.",
      items: [
        { title: "Tiles that touch", text: "Four pixels between cards, no more. Personal space is for the minimal preset.", icon: "widget" },
        { title: "Springs everywhere", text: "Buttons squash, cards wobble, numbers roll. If it moves, it bounces on the way back.", icon: "bolt" },
        { title: "Stickers, unironically", text: "A burst here, a badge there. Exactly one per section — we have some standards.", icon: "star" },
        { title: "Colour on purpose", text: "Flame, acid, bubble, sky. Grey is allowed, but only when it's being quiet about something.", icon: "palette" },
        { title: "Type set huge", text: "Headlines at the size of a small apartment, tracked tight so they still fit through the door.", icon: "pen" },
        { title: "Sound, if you dare", text: "Clicks, pops and detents — off by default, because we are loud, not monsters.", icon: "bell" },
      ],
    },
    split: {
      eyebrow: "Receipts",
      title: <>What visitors did <Accent tone="mute">instead of reading</Accent></>,
      lead: "Nobody reads a landing page. They press things. Here's what got pressed most on this one today.",
      points: ["Every number is made up, but enthusiastically", "Every bar is a real component", "Nothing here was A/B tested, it was vibes-tested"],
      caption: "Today, since you arrived",
      board: { title: "Most poked, today", unit: "pokes · where", rows: [["The giant button", 412, "Hero"], ["The sticker", 280, "Quotes"], ["The price toggle", 166, "Pricing"], ["This very bar", 91, "Here"]] },
    },
    stats: {
      eyebrow: "By the numbers",
      title: <>Numbers that <Accent tone="mute">roll when you look</Accent></>,
      items: [
        { value: 4, suffix: "px", label: "between every tile", note: "and not a pixel more" },
        { value: 7, label: "colours on duty", note: "grey counts as half" },
        { value: 0, label: "grey rectangles", note: "with 4px corners" },
        { value: 1, label: "sticker per section", note: "it's a rule" },
      ],
    },
    quotes: {
      eyebrow: "Fan mail",
      title: <>People said <Accent tone="mute">things</Accent></>,
      items: [
        { quote: "I came for a button and left with a personality.", name: "Mo Rivera", role: "Designer, still recovering" },
        { quote: "My PM asked for 'more pop'. I sent this page. He has not asked again.", name: "Jess Albright", role: "Front-end developer" },
        { quote: "Looked at it on my phone in a library. Got asked to leave.", name: "Theo Park", role: "Early adopter" },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: <>Pick a volume, <Accent tone="mute">any volume</Accent></>,
      lead: "All plans include unlimited springs. Annual billing comes with a complimentary sticker.",
      plans: [
        plan({ name: "Whisper", price: { monthly: 0 }, currency: "$", period: "/mo", description: "For the shy", features: ["Every component", "Calm motion", "Polite colours"], cta: "Start quietly" }),
        plan({ name: "Shout", price: { monthly: 29, yearly: 23 }, currency: "$", period: "/mo", description: "For everyone else", features: ["Everything in Whisper", "Full springs", "All seven colours", "Stickers"], cta: "Turn it up", featured: true, badge: "Loudest" }),
        plan({ name: "Stadium", price: { monthly: "Custom" }, description: "For a crowd", features: ["Everything in Shout", "Your own colours", "Sound design", "A confetti budget"], cta: "Call us (loudly)" }),
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: <>Asked loudly, <Accent tone="mute">answered louder</Accent></>,
      items: [
        { q: "Is it too loud?", a: "Yes. That's the fun preset. Switch to minimal at the bottom of the screen and listen to the silence." },
        { q: "Can I turn the motion down?", a: "Set data-rap-motion to calm and everything still moves, just like an adult. Set it to still and nothing moves at all." },
        { q: "Are the components real?", a: "Every one. The buttons press, the stars rate, the slider slides. This FAQ opens, which you've noticed." },
        { q: "Why is the sticker tilted?", a: "It was like that when we found it." },
      ],
    },
    cta: { eyebrow: "Last chance to be heard", title: <>Make something <Accent tone="mute">nobody can scroll past</Accent></>, lead: "One import, one preset, and your page stops whispering.", primary: "Get rapui", secondary: "Show me the docs" },
    footer: { columns: [{ title: "Hollr", links: ["Why so loud", "Receipts", "Pricing"] }, { title: "Volume", links: ["Whisper", "Shout", "Stadium"] }, { title: "Ears", links: ["Accessibility", "Sound off", "Calm mode"] }], fine: "© 2026 Hollr — a pretend company, loudly made for the rapui docs." },
  },

  /* ── civic: a legal-startup straight face ── */
  civic: {
    brand: "Precedent",
    tagline: "A landing page, respectfully submitted.",
    links: ["The page", "Exhibits", "Fees", "Questions"],
    hero: {
      eyebrow: "Filed this morning",
      title: (
        <>
          A landing page, <Accent>respectfully submitted.</Accent>
        </>
      ),
      lead: "This is the civic preset: a tall condensed serif, navy ink and soft white cards, centred like a notice on a courthouse door. Every statement on this page is true, including this one.",
      primary: "Enter the record",
      secondary: "Read the fine print",
      meta: [],
    },
    logosTitle: "As cited in the margins of",
    logos: ["Hale & Partners", "Morrow Kline", "Alder & Finch", "Briar & Stone", "Lowell Chambers", "Vantage Legal"],
    statement: { eyebrow: "Let the record show", before: "Let the record show the", afterSwitch: "switch was on, the", button: "Motion", afterButton: "was carried, the", afterSlider: "was moved and", end: <>four stars were entered into evidence.</> },
    features: {
      eyebrow: "The page",
      title: <>Six findings <Accent tone="mute">on the design before you</Accent></>,
      lead: "The court has reviewed the preset and makes the following findings, each of them a real, working component.",
      items: [
        { title: "Centred, as is customary", text: "Headlines and section heads sit on the centre line, where a reader expects to find the important part.", icon: "document" },
        { title: "Serif, under oath", text: "Instrument Serif for headlines, set large and close, the way a front page sets its name. It swears to be legible.", icon: "book" },
        { title: "Soft cards, firm edges", text: "Big rounded white cards on cool grey paper. No borders, no shadows, nothing to object to.", icon: "folder" },
        { title: "One word in italic", text: "No second colour in a headline: the word that matters leans into the serif’s italic, and that is emphasis enough.", icon: "flag" },
        { title: "Readable at 200%", text: "Contrast checked against WCAG 2.2 AA, from the kicker to the footnote you are about to skip.", icon: "check-circle" },
        { title: "Calm motion only", text: "Things fade and settle. Nothing bounces in a place of record.", icon: "shield" },
      ],
    },
    split: {
      eyebrow: "Exhibits",
      title: <>Exhibit A: <Accent tone="mute">how this page was read</Accent></>,
      lead: "A summary of the record, prepared for the reader who will not, in fact, read the record.",
      points: ["Every exhibit is a live component", "No figure on this page is binding", "Objections may be raised at the bottom"],
      caption: "Exhibit A, as of this hearing",
      board: { title: "Time spent, by section", unit: "seconds · section", rows: [["The headline", 9, "Hero"], ["The fees", 7, "Pricing"], ["These findings", 4, "Features"], ["The fine print", 0, "Footer"]] },
    },
    stats: {
      eyebrow: "Findings of fact",
      title: <>The facts, <Accent tone="mute">stipulated</Accent></>,
      items: [
        { value: 1, label: "italic phrase per headline", note: "never two" },
        { value: 28, suffix: "px", label: "corner radius", note: "on the large cards" },
        { value: 4.5, suffix: ":1", label: "minimum contrast", note: "and usually more" },
        { value: 0, label: "exclamation marks", note: "in the entire record" },
      ],
    },
    quotes: {
      eyebrow: "Testimony",
      title: <>Sworn <Accent tone="mute">statements</Accent></>,
      items: [
        { quote: "I have read many landing pages. This is the first that seemed to be reading me back.", name: "Helena Marsh", role: "Partner, Employment" },
        { quote: "Calm, centred and entirely without confetti. I'd sign it.", name: "Tomás Reyes", role: "Senior associate" },
        { quote: "The serif alone reduced my billable anxiety by a third.", name: "Grace Okonkwo", role: "General counsel" },
      ],
    },
    pricing: {
      eyebrow: "Fees",
      title: <>A schedule <Accent tone="mute">of fees</Accent></>,
      lead: "Billed by the seat, not in six-minute increments. No retainer required to scroll.",
      plans: [
        plan({ name: "Pro bono", price: { monthly: 0 }, currency: "$", period: "/mo", description: "For the public good", features: ["Every component", "The civic preset", "Calm motion"], cta: "Accept the matter" }),
        plan({ name: "Associate", price: { monthly: 49, yearly: 39 }, currency: "$", period: "/mo", description: "For working practices", features: ["Everything in Pro bono", "All five presets", "Landing blocks", "Priority docket"], cta: "Retain us", featured: true, badge: "Most retained" }),
        plan({ name: "Partner", price: { monthly: "By arrangement" }, description: "For the firm", features: ["Everything in Associate", "Your own preset", "A named contact", "Wood panelling (virtual)"], cta: "Request a consultation" }),
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: <>Questions <Accent tone="mute">from the bench</Accent></>,
      items: [
        { q: "Is this legal advice?", a: "No. It is a landing page dressed as a law firm. Please consult an actual lawyer, ideally one with a nicer website than this." },
        { q: "Why is everything centred?", a: "The civic preset puts headlines, section heads and calls to action on the centre line, the way a public notice is set. The other presets disagree, and you may switch to them below." },
        { q: "Where did the colour go?", a: "Into the italic. The page is navy and grey, as befits the occasion; a headline makes its point by leaning, not by shouting in red." },
        { q: "May I object?", a: "You may. The objection is noted, and the page will continue regardless." },
      ],
    },
    cta: { eyebrow: "In conclusion", title: <>The page <Accent tone="mute">rests its case</Accent></>, lead: "Install the library, set the preset to civic, and enter your own record.", primary: "Get rapui", secondary: "Read the docs" },
    footer: { columns: [{ title: "The page", links: ["Findings", "Exhibits", "Fees"] }, { title: "Record", links: ["Docs", "Changelog", "Accessibility"] }, { title: "Chambers", links: ["About", "Careers", "Contact"] }], fine: "© 2026 Precedent — a fictional practice of law, admitted to no bar, made for the rapui docs." },
  },

  /* ── signal: a transmission that describes itself ── */
  signal: {
    brand: "Fieldkit",
    tagline: "Transmission 004: this page, describing itself.",
    links: ["Channels", "Log", "Rates", "Q/A"],
    hero: {
      eyebrow: "Transmission 004 · receiving",
      title: (
        <>
          A landing page, <Accent>received in fragments.</Accent>
        </>
      ),
      lead: "Signal preset: Plex type, dot matrices, scan lines and ruled cells — an instrument panel reading itself back to you. Signal strength: adequate. Interference: mostly decorative.",
      primary: "Tune in",
      secondary: "Open the log",
      meta: [
        { label: "Frequency", value: "104.2 MHz" },
        { label: "Signal", value: "92%" },
        { label: "Fix", value: "51.507°N 0.127°W" },
      ],
    },
    logosTitle: "Picked up by stations at",
    logos: ["Relay 7", "Northgate Array", "Kestrel Obs.", "Field Unit 12", "Low Band", "Station Echo"],
    statement: { eyebrow: "Channel open", before: "Channel", afterSwitch: "open. Press", button: "Send", afterButton: "to transmit, tune the", afterSlider: "gain, rate the", end: <>reception — <Accent tone="mute">over.</Accent></> },
    features: {
      eyebrow: "Channels",
      title: <>Six channels, <Accent tone="mute">all of them this page</Accent></>,
      lead: "Each cell below is one channel of the signal preset, broadcasting a real component.",
      items: [
        { title: "Dot matrices", text: "Status, loaders and type drawn on a grid of dots, like a departures board that learned to think.", icon: "widget" },
        { title: "Scan lines", text: "Pictures sit behind a fine raster with a slow rolling band, as if seen on an old field monitor.", icon: "camera" },
        { title: "Ruled cells", text: "Content in hairline-ruled cells with mono indices — a logbook, not a brochure.", icon: "notebook" },
        { title: "Mono labels", text: "Kickers and readings in IBM Plex Mono capitals, with [01]-style indices in phosphor green.", icon: "code" },
        { title: "Redactions", text: "Words [blacked out] until you hover. Some of them were never that important anyway.", icon: "lock" },
        { title: "Phosphor green", text: "One signal colour on sage paper. At night it turns into a green screen.", icon: "planet" },
      ],
    },
    split: {
      eyebrow: "Log",
      title: <>Reception log, <Accent tone="mute">last 24 hours</Accent></>,
      lead: "What came through clearly, what broke up, and what was almost certainly a pigeon.",
      points: ["Signal readings are real components", "Noise figures are fiction", "The pigeon is unconfirmed"],
      caption: "Station log · 24 h",
      board: { title: "Packets received", unit: "packets · band", rows: [["Hero headline", 1204, "VHF"], ["Channel cells", 880, "UHF"], ["Rate card", 412, "LF"], ["Interference", 96, "?"]] },
    },
    stats: {
      eyebrow: "Readings",
      title: <>Current <Accent tone="mute">readings</Accent></>,
      items: [
        { value: 92, suffix: "%", label: "signal", note: "steady" },
        { value: 8, suffix: "%", label: "noise", note: "decorative" },
        { value: 2, suffix: "px", label: "between cells", note: "ruled" },
        { value: 104.2, label: "MHz", note: "this page's frequency" },
      ],
    },
    quotes: {
      eyebrow: "Transcripts",
      title: <>Intercepted <Accent tone="mute">transmissions</Accent></>,
      items: [
        { quote: "Reading you loud and clear. The [redacted] bits are a nice touch.", name: "Operator 3", role: "Relay 7" },
        { quote: "First landing page I've had to {decode}. Worth it.", name: "A. Lindqvist", role: "Northgate Array" },
        { quote: "Signal holds even in dark mode. Especially in dark mode.", name: "Field Unit 12", role: "Night shift" },
      ],
    },
    pricing: {
      eyebrow: "Rates",
      title: <>Rate card, <Accent tone="mute">per channel</Accent></>,
      lead: "Bandwidth billed monthly. Static is complimentary.",
      plans: [
        plan({ name: "Low band", price: { monthly: 0 }, currency: "$", period: "/mo", description: "One receiver", features: ["All components", "Signal preset", "Daylight mode"], cta: "Tune in" }),
        plan({ name: "Broadband", price: { monthly: 32, yearly: 26 }, currency: "$", period: "/mo", description: "A small station", features: ["Everything in Low band", "Every preset", "Landing blocks", "Night screen"], cta: "Open channel", featured: true, badge: "Clearest" }),
        plan({ name: "Array", price: { monthly: "On request" }, description: "Many stations", features: ["Everything in Broadband", "Custom palette", "Dedicated frequency", "A spare antenna"], cta: "Request a slot" }),
      ],
    },
    faq: {
      eyebrow: "Q/A",
      title: <>Questions <Accent tone="mute">over the air</Accent></>,
      items: [
        { q: "Is anything actually redacted?", a: "Only for effect. Hover a black bar and the word comes back — the Redact component is theatre with an accessible name." },
        { q: "Why green?", a: "Phosphor screens were green, sage paper is calm, and the warm earth tones were starting to look like everyone else's AI product." },
        { q: "What's the rolling band on the pictures?", a: "A slow scan line in the MediaFrame component. In calm motion it holds still." },
        { q: "Who is the pigeon?", a: "Unknown. Transmission ends." },
      ],
    },
    cta: { eyebrow: "End of transmission", title: <>Your page, <Accent tone="mute">on this frequency</Accent></>, lead: "Install the library, set the preset to signal, and start broadcasting.", primary: "Get rapui", secondary: "Read the manual" },
    footer: { columns: [{ title: "Station", links: ["Channels", "Log", "Rates"] }, { title: "Manual", links: ["Docs", "Components", "Changelog"] }, { title: "Contact", links: ["Frequency", "Relay", "Morse"] }], fine: "© 2026 Fieldkit — a fictional instrument, transmitting only to the rapui docs." },
  },

  /* ── product: a launch post that knows it's a launch post ── */
  product: {
    brand: "Shiplog",
    tagline: "The landing page that ships itself.",
    links: ["Features", "Changelog", "Pricing", "FAQ"],
    hero: {
      eyebrow: "v2.0 — now with a landing page",
      title: (
        <>
          The landing page <Accent>that ships itself.</Accent>
        </>
      ),
      lead: "You're on the product preset: Geist, ink, one orange spark and an editor's canvas under everything. No screenshots — every card below is the real component, so go ahead and hover.",
      primary: "Start shipping",
      secondary: "Read the changelog",
      meta: [],
    },
    logosTitle: "Trusted by teams who also have a landing page",
    logos: ["Linearly", "Vercelish", "Notional", "Figmental", "Rayform", "Arcade"],
    statement: { eyebrow: "The whole product, in one line", before: "Flip the", afterSwitch: "flag, hit", button: "Deploy", afterButton: "and drag the", afterSlider: "rollout, then watch the", end: <>reviews — <Accent tone="mute">that's the product.</Accent></> },
    features: {
      eyebrow: "Features",
      title: <>Everything a landing page <Accent tone="mute">pretends to have</Accent></>,
      lead: "Except here it actually has it. Each card is a working rapui component wearing the product preset.",
      items: [
        { title: "Bento that behaves", text: "A grid of cards in two widths that never leaves one stranded at the end of a row.", icon: "widget" },
        { title: "Live parts, not screenshots", text: "The wide cards hold real components. Hover them; they hover back.", icon: "cursor" },
        { title: "One accent, used once", text: "Ink and grey do the work. Orange appears where you should look, and nowhere else.", icon: "target" },
        { title: "Hairlines at 1px", text: "Borders thin enough to organise a page without anyone noticing there are borders.", icon: "layers" },
        { title: "Moves like rapui", text: "The arrow turns, the fill floods, the prices roll — product calm on top, fun underneath.", icon: "bolt" },
        { title: "Dark mode, obviously", text: "Flip the theme and the canvas goes to ink. The orange stays exactly as loud.", icon: "sun" },
      ],
    },
    split: {
      eyebrow: "Changelog",
      title: <>Shipped this week, <Accent tone="mute">by this page</Accent></>,
      lead: "A landing page with a changelog is a landing page with a pulse. Here's this one's.",
      points: ["Every line item is a real component", "No feature flags were harmed", "Rolled out to 100% of you"],
      caption: "Shiplog · changelog",
      board: { title: "Shipped this week", unit: "commits · area", rows: [["Bento grid", 34, "Features"], ["Rolling prices", 21, "Pricing"], ["Selection frame", 13, "Hero"], ["This changelog", 8, "Meta"]] },
    },
    stats: {
      eyebrow: "Metrics",
      title: <>Vanity metrics, <Accent tone="mute">honestly labelled</Accent></>,
      items: [
        { value: 1, label: "orange", note: "used sparingly" },
        { value: 12, suffix: "px", label: "card radius", note: "not 16, not 8" },
        { value: 0, label: "stock photos", note: "ever" },
        { value: 100, suffix: "%", label: "real components", note: "go on, hover" },
      ],
    },
    quotes: {
      eyebrow: "Wall of love",
      title: <>A wall, <Accent tone="mute">of love</Accent></>,
      items: [
        { quote: "Finally, a landing page that doesn't say 'supercharge'. Five stars.", name: "Priya Shah", role: "Staff engineer" },
        { quote: "I hovered every card. Every card hovered back. I feel seen.", name: "Daniel Kim", role: "Product designer" },
        { quote: "We replaced our marketing site with this and nobody noticed. That's the highest compliment.", name: "Lena Fischer", role: "Founder" },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: <>Simple pricing, <Accent tone="mute">as is tradition</Accent></>,
      lead: "Every plan includes every component. The yearly toggle exists mainly so the numbers can roll.",
      plans: [
        plan({ name: "Hobby", price: { monthly: 0 }, currency: "$", period: "/mo", description: "For side projects", features: ["All components", "Product preset", "Community support"], cta: "Start free" }),
        plan({ name: "Pro", price: { monthly: 24, yearly: 19 }, currency: "$", period: "/mo", description: "For shipping things", features: ["Everything in Hobby", "All five presets", "Landing blocks", "Priority support"], cta: "Upgrade to Pro", featured: true, badge: "Popular" }),
        plan({ name: "Team", price: { monthly: 99, yearly: 79 }, currency: "$", period: "/mo", description: "For whole teams", features: ["Everything in Pro", "Custom presets", "Shared tokens", "An SSO you'll configure once"], cta: "Talk to sales" }),
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: <>Frequently <Accent tone="mute">anticipated questions</Accent></>,
      items: [
        { q: "Is this a real product?", a: "It's a real component library wearing a fake product. The landing is the demo, and the demo is the landing." },
        { q: "Why does it move if it's the calm one?", a: "Product looks quiet but moves like rapui: the fill floods, the arrow turns, prices roll. Switch motion to calm in the bar below if you'd rather it didn't." },
        { q: "Can I use these blocks for my own page?", a: "That's the idea. Hero, Features, Pricing, FAQ, CTA and the rest are all in @rapui/react." },
        { q: "Where's the 'Book a demo' button?", a: "You're in it." },
      ],
    },
    cta: { eyebrow: "Ready when you are", title: <>Ship the landing, <Accent tone="mute">skip the meeting</Accent></>, lead: "npm i @rapui/react, set the preset to product, and you're live before standup.", primary: "Get rapui", secondary: "Browse components" },
    footer: { columns: [{ title: "Product", links: ["Features", "Changelog", "Pricing"] }, { title: "Developers", links: ["Docs", "Components", "GitHub"] }, { title: "Company", links: ["About", "Blog", "Careers"] }], fine: "© 2026 Shiplog — not a real company, but a real landing page, made for the rapui docs." },
  },

  /* ── minimal: say less ── */
  minimal: {
    brand: "Less",
    tagline: "Say less.",
    links: ["Page", "Notes", "Price", "Q"],
    hero: {
      eyebrow: "Landing page",
      title: <>Landing page.</>,
      lead: "Black, white, hairlines. That's the whole preset — and, it turns out, the whole page.",
      primary: "Continue",
      secondary: "Or don't",
      meta: [],
    },
    logosTitle: "Used by",
    logos: ["Mono", "Plain", "Grid", "Line", "Space", "Type"],
    statement: { eyebrow: "In full", before: "Switch", afterSwitch: "on, press", button: "Here", afterButton: "once, slide", afterSlider: "a little, rate", end: <>— <Accent tone="mute">that's it.</Accent></> },
    features: {
      eyebrow: "Page",
      title: <>Six things, <Accent tone="mute">then nothing</Accent></>,
      lead: "Numbered, ruled, left-aligned.",
      items: [
        { title: "Type", text: "One family. Large when it matters, small otherwise." },
        { title: "Space", text: "Most of the page. It's doing the heavy lifting." },
        { title: "Lines", text: "One pixel. Between things, never around them." },
        { title: "Black", text: "For words." },
        { title: "White", text: "For everything else." },
        { title: "Nothing else", text: "This item intentionally left almost blank." },
      ],
    },
    split: {
      eyebrow: "Notes",
      title: <>What was removed, <Accent tone="mute">in order</Accent></>,
      lead: "A short list of things this page no longer has.",
      points: ["Colour", "Corners", "Motion"],
      caption: "Removed",
      board: { title: "Removed", unit: "count · kind", rows: [["Gradients", 12, "Colour"], ["Rounded corners", 9, "Shape"], ["Animations", 6, "Motion"], ["Emojis", 1, "Regret"]] },
    },
    stats: {
      eyebrow: "Numbers",
      title: <>Four <Accent tone="mute">numbers</Accent></>,
      items: [
        { value: 2, label: "colours" },
        { value: 0, suffix: "px", label: "radius" },
        { value: 1, label: "typeface" },
        { value: 1, suffix: "px", label: "lines" },
      ],
    },
    quotes: {
      eyebrow: "Said",
      title: <>Said <Accent tone="mute">briefly</Accent></>,
      items: [
        { quote: "Yes.", name: "A. Reader", role: "Reader" },
        { quote: "Finally, nothing.", name: "J. Mies", role: "Architect (paraphrased)" },
        { quote: "I scrolled to the end and felt rested.", name: "S. Sato", role: "Visitor" },
      ],
    },
    pricing: {
      eyebrow: "Price",
      title: <>Price, <Accent tone="mute">plainly</Accent></>,
      lead: "Three rows. No badges.",
      plans: [
        plan({ name: "Less", price: { monthly: 0 }, currency: "$", period: "/mo", description: "Enough", features: ["All components", "Minimal preset"], cta: "Take it" }),
        plan({ name: "Lesser", price: { monthly: 19, yearly: 15 }, currency: "$", period: "/mo", description: "More, with less", features: ["Everything in Less", "All presets", "Blocks"], cta: "Take it", featured: true, badge: "Chosen" }),
        plan({ name: "Least", price: { monthly: "Ask" }, description: "Nothing extra", features: ["Everything", "Nothing else"], cta: "Ask" }),
      ],
    },
    faq: {
      eyebrow: "Q",
      title: <>Questions, <Accent tone="mute">answered</Accent></>,
      items: [
        { q: "Where is everything?", a: "Removed." },
        { q: "Is it unfinished?", a: "Finished. Then reduced." },
        { q: "Does it move?", a: "No. The minimal preset is still." },
        { q: "Can I add colour?", a: "Pass a palette to RapStyle. Use one." },
      ],
    },
    cta: { eyebrow: "End", title: <>Say less.</>, lead: "npm i @rapui/react", primary: "Get rapui", secondary: "Docs" },
    footer: { columns: [{ title: "Less", links: ["Page", "Price", "Q"] }], fine: "© 2026 Less. Fictional. For the rapui docs." },
  },
};
