import { useState } from "react";
import { Button, CircleButton, Input, icons } from "../../rapui";
import type { BlockLook } from "../../rapui";
import { CTA } from "../../rapui/components/CTA";
import { Pricing, type PricingBilling, type PricingPlan } from "../../rapui/components/Pricing";
import { SiteFooter, type SiteFooterColumn } from "../../rapui/components/SiteFooter";
import { SiteHeader, type SiteHeaderLink } from "../../rapui/components/SiteHeader";
import { BlockFrame } from "../blockFrame";
import { attrs } from "../codegen";
import type { Control, DocEntry, Props } from "../types";

/* ── shared ── */

const LOOKS = ["preset", "fun", "civic", "signal", "product", "minimal"] as const;
const lookControl: Control = { type: "select", prop: "look", options: LOOKS, default: "preset", codeDefault: "preset" };
const lookOf = (p: Props) => (p.look === "preset" ? undefined : (p.look as BlockLook));

/* ── Fernway: a fictional planning board for small studios ── */

function FernwayLogo({ className }: { className?: string }) {
  return (
    <a href="#top" aria-label="Fernway, home" className={["inline-flex items-center gap-[0.4em] text-ink no-underline", className].filter(Boolean).join(" ")}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-[1.15em] text-accent">
        <path d="M12 2c5 4 7 8.5 7 12.5A7 7 0 0 1 5 14.5C5 10.5 7 6 12 2Z" fill="currentColor" />
        <path d="M12 7v14M12 12l3.5-2.5M12 16l-3.5-2.5" stroke="var(--rap-paper)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-display font-semibold tracking-[-0.04em] text-[1.25em] leading-none">fernway</span>
    </a>
  );
}

const PLANS: PricingPlan[] = [
  {
    name: "Seedling",
    price: { monthly: 0, yearly: 0 },
    description: "For one person planning their own work.",
    features: ["3 boards", "Unlimited cards", "Calendar and timeline views", "Community support"],
    cta: { label: "Start for free" },
  },
  {
    name: "Studio",
    price: { monthly: 14, yearly: 11 },
    period: "/seat/mo",
    description: "For small teams who ship together every week.",
    features: ["Unlimited boards", "Client guest seats", "Time tracking and estimates", "Recurring work and templates", "Priority email support"],
    cta: { label: "Try Studio free" },
    featured: true,
    badge: "Most popular",
  },
  {
    name: "Agency",
    price: { monthly: 29, yearly: 23 },
    period: "/seat/mo",
    description: "For studios juggling many clients at once.",
    features: ["Everything in Studio", "Client portals with your brand", "Capacity planning", "SSO and audit log"],
    cta: { label: "Start a trial" },
  },
  {
    name: "Enterprise",
    price: { monthly: "Let's talk" },
    description: "Procurement, data residency and a named contact.",
    features: ["Everything in Agency", "EU or US data residency", "99.95% uptime SLA", "Onboarding for your whole team"],
    cta: { label: "Contact sales", href: "#contact" },
  },
];

const LINKS: SiteHeaderLink[] = [
  { label: "Product", href: "#product" },
  { label: "Templates", href: "#templates" },
  { label: "Customers", href: "#customers" },
  { label: "Pricing", href: "#pricing", current: true },
  { label: "Changelog", href: "#changelog" },
];

const COLUMNS: SiteFooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Boards", href: "#boards" },
      { label: "Timeline", href: "#timeline" },
      { label: "Time tracking", href: "#time" },
      { label: "Client portals", href: "#portals" },
    ],
  },
  {
    title: "Studios",
    links: [
      { label: "Design studios", href: "#design" },
      { label: "Dev shops", href: "#dev" },
      { label: "Architects", href: "#architects" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides", href: "#guides" },
      { label: "Templates", href: "#templates" },
      { label: "Changelog", href: "#changelog" },
      { label: "Status", href: "#status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Press kit", href: "#press" },
    ],
  },
];

/* ── Pricing ── */

const pricingControls: Control[] = [
  lookControl,
  { type: "text", prop: "title", default: "Pricing that grows with the studio", codeDefault: null },
  { type: "number", prop: "plans", label: "plans", min: 2, max: 4, default: 3, codeDefault: null },
  { type: "boolean", prop: "yearly", label: "yearly prices", default: true, codeDefault: null },
  { type: "select", prop: "defaultBilling", options: ["monthly", "yearly"], default: "monthly" },
  { type: "text", prop: "billingNote", default: "Save 20%", codeDefault: null },
];

const plansFor = (p: Props) =>
  PLANS.slice(0, Number(p.plans)).map((plan) => (p.yearly ? plan : { ...plan, price: { monthly: plan.price.monthly } }));

function ControlledPricing() {
  const [billing, setBilling] = useState<PricingBilling>("yearly");
  return (
    <BlockFrame>
      <Pricing
        eyebrow="Plans"
        title={`Billed ${billing}`}
        lead="The switch is controlled here: the page owns the billing period and could carry it into checkout."
        plans={PLANS.slice(0, 3)}
        billing={billing}
        onBillingChange={setBilling}
        billingNote="2 months free"
      />
    </BlockFrame>
  );
}

/* ── CTA ── */

const ctaControls: Control[] = [
  lookControl,
  { type: "text", prop: "eyebrow", default: "Free for 14 days", codeDefault: null },
  { type: "text", prop: "title", default: "Plan next week before this one ends", codeDefault: null },
  { type: "text", prop: "lead", default: "Bring your boards over from a spreadsheet in a minute. No card, no sales call.", codeDefault: null },
  { type: "boolean", prop: "form", label: "email form", default: false, codeDefault: null },
];

function EmailForm() {
  return (
    <form className="flex flex-wrap gap-tight" onSubmit={(e) => e.preventDefault()}>
      <Input type="email" required placeholder="you@studio.com" aria-label="Work email" className="flex-1 min-w-[12rem]" />
      <Button type="submit">Get started</Button>
    </form>
  );
}

/* ── SiteHeader ── */

const headerControls: Control[] = [
  lookControl,
  { type: "number", prop: "links", label: "links", min: 0, max: 5, default: 4, codeDefault: null },
  { type: "boolean", prop: "actions", default: true, codeDefault: null },
  { type: "boolean", prop: "sticky", default: false },
  { type: "boolean", prop: "notice", default: false, codeDefault: null },
];

const NOTICE = "Fernway is in public beta. Boards made now are yours to keep.";

/* a stand-in page under the header, so its ground and rule read in context */
function PageBelow() {
  return (
    <div id="content" className="px-[clamp(16px,3vw,40px)] py-16 flex flex-col gap-3 text-ink">
      <span className="text-[0.875rem] text-mute">Fernway for studios</span>
      <span className="font-display text-display-lg tracking-[-0.04em] max-w-[16ch] leading-none">Every client, every week, on one board.</span>
    </div>
  );
}

/* ── SiteFooter ── */

const footerControls: Control[] = [
  lookControl,
  { type: "text", prop: "tagline", default: "The planning board for small studios. Made in Leeds and Lisbon.", codeDefault: null },
  { type: "text", prop: "wordmark", label: "wordmark (fun)", default: "fernway", codeDefault: "" },
  { type: "boolean", prop: "social", default: true, codeDefault: null },
];

function Social() {
  const items: [string, string, typeof icons.Mail][] = [
    ["Newsletter", "#newsletter", icons.Mail],
    ["Community", "#community", icons.Users],
    ["RSS", "#rss", icons.Newspaper],
  ];
  return (
    <>
      {items.map(([label, href, Icon]) => (
        <a key={label} href={href} aria-label={label} className="grid place-items-center size-10 rounded-pill bg-fill text-ink hover:bg-fill-hover transition-colors [&_svg]:size-[18px]">
          <Icon />
        </a>
      ))}
    </>
  );
}

/* civic's seal slot: a fern in a ring */
const Seal = () => (
  <svg viewBox="0 0 48 48" aria-hidden className="size-11 text-ink">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 2.5" />
    <path d="M24 10c6 5 8.5 10 8.5 15a8.5 8.5 0 0 1-17 0C15.5 20 18 15 24 10Z" fill="currentColor" />
  </svg>
);

const Fine = () => (
  <>
    <span>© 2026 Fernway Ltd. · Company no. 14820973</span>
    <span className="flex gap-4">
      <a href="#privacy" className="hover:text-ink">Privacy</a>
      <a href="#terms" className="hover:text-ink">Terms</a>
      <a href="#security" className="hover:text-ink">Security</a>
    </span>
  </>
);

export const entries: DocEntry[] = [
  {
    slug: "pricing",
    name: "Pricing",
    group: "Blocks",
    description:
      "Plans side by side, with a monthly / yearly switch when any plan has a yearly price — controlled (`billing` + `onBillingChange`) or not (`defaultBilling`). Each look sets the plans its own way: packed coloured tiles with a rotating badge on the featured one (fun), soft white cards with serif prices and a navy featured card (civic), numbered square-cell blocks with light prices and the featured plan on a dark screen (signal), hairline cards with a \"Most popular\" badge (product), a plain comparison list (minimal). Delight (fun): switching the billing counts each price across to its new figure.",
    controls: pricingControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Pricing
          look={lookOf(p)}
          eyebrow="Pricing"
          title={String(p.title)}
          lead="Every plan has unlimited cards and a 14-day trial of Studio. Change or cancel whenever you like."
          plans={plansFor(p)}
          defaultBilling={p.defaultBilling as PricingBilling}
          billingNote={String(p.billingNote) || undefined}
        />
      </BlockFrame>
    ),
    code: (p) => `const plans = [
  { name: "Seedling", price: { monthly: 0, yearly: 0 }, description: "For one person planning their own work.",
    features: ["3 boards", "Unlimited cards", "Calendar and timeline views"], cta: { label: "Start for free" } },
  { name: "Studio", price: { monthly: 14, yearly: 11 }, period: "/seat/mo", featured: true, badge: "Most popular",
    features: ["Unlimited boards", "Client guest seats", "Time tracking"], cta: { label: "Try Studio free" } },
  { name: "Agency", price: { monthly: 29, yearly: 23 }, period: "/seat/mo",
    features: ["Everything in Studio", "Client portals", "SSO and audit log"], cta: { label: "Start a trial" } },
];

<Pricing
  eyebrow="Pricing"
  title="${p.title}"
  plans={plans}
  billingNote="${p.billingNote}"${attrs(p, pricingControls, ["title", "plans", "yearly", "billingNote"])}
/>`,
    examples: [
      {
        title: "Controlled billing",
        Demo: ControlledPricing,
        code: `const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

<Pricing title={\`Billed \${billing}\`} plans={plans} billing={billing} onBillingChange={setBilling} billingNote="2 months free" />`,
      },
    ],
  },
  {
    slug: "cta",
    name: "Call to action",
    group: "Blocks",
    description:
      "The closing ask of a landing page: a headline, a line of lead, the actions, and an optional `form` (an email field, an \"Ask anything\" pill) and `media`. A huge accent tile with a giant headline (fun), a navy dark island with a serif headline (civic), a black screen with the title in big white dots (signal), a centred quiet ask on a fading grid (product), one large line and a link (minimal).",
    controls: ctaControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <CTA
          look={lookOf(p)}
          eyebrow={String(p.eyebrow) || undefined}
          title={String(p.title)}
          lead={String(p.lead) || undefined}
          form={p.form ? <EmailForm /> : undefined}
          actions={
            p.form ? undefined : (
              <>
                <Button icon>Start free</Button>
                <Button variant="ghost">Book a walkthrough</Button>
              </>
            )
          }
        />
      </BlockFrame>
    ),
    code: (p) =>
      `<CTA
  eyebrow="${p.eyebrow}"
  title="${p.title}"
  lead="${p.lead}"${attrs(p, ctaControls, ["eyebrow", "title", "lead", "form"])}
  ${
    p.form
      ? `form={
    <form className="flex gap-tight">
      <Input type="email" placeholder="you@studio.com" aria-label="Work email" />
      <Button type="submit">Get started</Button>
    </form>
  }`
      : `actions={
    <>
      <Button icon>Start free</Button>
      <Button variant="ghost">Book a walkthrough</Button>
    </>
  }`
  }
/>`,
    examples: [
      {
        title: "Fun, with a round button",
        Demo: () => (
          <BlockFrame>
            <CTA
              look="fun"
              eyebrow="Fernway for studios"
              title="Your Monday, already planned."
              lead="Start a board in a minute. Bring the team when it's useful."
              actions={
                <CircleButton size={168} variant="ink" aria-label="Start free">
                  <icons.ArrowUpRight />
                </CircleButton>
              }
            />
          </BlockFrame>
        ),
        code: `<CTA
  look="fun"
  title="Your Monday, already planned."
  actions={<CircleButton size={168} variant="ink" aria-label="Start free"><icons.ArrowUpRight /></CircleButton>}
/>`,
      },
      {
        title: "Civic, with an Ask anything pill",
        Demo: () => (
          <BlockFrame>
            <CTA
              look="civic"
              eyebrow="Help centre"
              title="Questions about moving your studio over?"
              lead="Ask in plain words. A person on our team reads every question within a working day."
              form={
                <form className="flex gap-tight" onSubmit={(e) => e.preventDefault()}>
                  <Input size="lg" placeholder="Ask anything…" aria-label="Ask a question" prefix={<icons.Search />} className="flex-1" />
                  <Button size="md" type="submit" variant="accent">Ask</Button>
                </form>
              }
            />
          </BlockFrame>
        ),
        code: `<CTA
  look="civic"
  eyebrow="Help centre"
  title="Questions about moving your studio over?"
  form={
    <form className="flex gap-tight">
      <Input size="lg" placeholder="Ask anything…" aria-label="Ask a question" prefix={<icons.Search />} />
      <Button type="submit" variant="accent">Ask</Button>
    </form>
  }
/>`,
      },
    ],
  },
  {
    slug: "site-header",
    name: "Site header",
    group: "Blocks",
    description:
      "The top bar: logo, the main links in a `<nav aria-label>`, actions, and an optional skip link. It folds by its own width (a container query), not the viewport: below 48rem the links and actions move into a menu button that opens a Sheet. A floating inverted pill (fun), a white bar on a thin rule with a navy button (civic), grey mono links with a dial clock (signal), a blurred translucent bar with centred links (product), words only (minimal).",
    controls: headerControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <SiteHeader
          look={lookOf(p)}
          logo={<FernwayLogo />}
          links={LINKS.slice(0, Number(p.links))}
          sticky={Boolean(p.sticky)}
          notice={p.notice ? NOTICE : undefined}
          skipTo="#content"
          actions={
            p.actions ? (
              <>
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
                <Button size="sm">Start free</Button>
              </>
            ) : undefined
          }
        />
        <PageBelow />
      </BlockFrame>
    ),
    code: (p) => `<SiteHeader
  logo={<Logo />}
  links={[
${LINKS.slice(0, Number(p.links))
  .map((l) => `    { label: "${l.label}", href: "${l.href}"${l.current ? ", current: true" : ""} },`)
  .join("\n")}
  ]}
  skipTo="#content"${p.notice ? `\n  notice="${NOTICE}"` : ""}${p.actions ? `\n  actions={<><Button size="sm" variant="ghost">Sign in</Button><Button size="sm">Start free</Button></>}` : ""}${attrs(p, headerControls, ["links", "actions", "notice"])}
/>`,
    examples: [
      {
        title: "Folded: a narrow column",
        Demo: () => (
          <BlockFrame>
            <div className="max-w-[380px] mx-auto">
              <SiteHeader logo={<FernwayLogo />} links={LINKS} actions={<Button size="sm">Start free</Button>} />
            </div>
          </BlockFrame>
        ),
        code: `<div className="max-w-[380px]">
  <SiteHeader logo={<Logo />} links={links} actions={<Button size="sm">Start free</Button>} />
</div>`,
      },
    ],
  },
  {
    slug: "site-footer",
    name: "Site footer",
    group: "Blocks",
    description:
      "The foot of the page: brand, tagline, columns of links in a footer nav, social links and the fine print. A dark rounded tile with the brand's name across the bottom at wordmark size (fun), a navy island with a seal slot (civic), square cells with link columns, a clock and the wordmark in dots (signal), quiet grey columns under a hairline (product), a single row of links and the year (minimal).",
    controls: footerControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <SiteFooter
          look={lookOf(p)}
          logo={<FernwayLogo />}
          tagline={String(p.tagline) || undefined}
          columns={COLUMNS}
          wordmark={String(p.wordmark) || undefined}
          mark={<Seal />}
          social={p.social ? <Social /> : undefined}
          bottom={<Fine />}
        />
      </BlockFrame>
    ),
    code: (p) => `<SiteFooter
  logo={<Logo />}
  tagline="${p.tagline}"
  columns={[
    { title: "Product", links: [{ label: "Boards", href: "/boards" }, { label: "Timeline", href: "/timeline" }] },
    { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }] },
  ]}${p.social ? "\n  social={<SocialLinks />}" : ""}
  bottom={<>© 2026 Fernway Ltd.</>}${attrs(p, footerControls, ["tagline", "social"])}
/>`,
  },
];
