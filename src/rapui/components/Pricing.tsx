/* ══ Pricing ═════════════════════════════════════════════
   The plans block: a few plans side by side, a monthly / yearly
   switch over them when any plan has a yearly price.

     <Pricing title="Simple pricing" plans={[
       { name: "Free", price: { monthly: 0 }, features: […], cta: { label: "Start" } },
       { name: "Pro", price: { monthly: 24, yearly: 19 }, featured: true, … },
     ]} billingNote="Save 20%" />

   Billing is uncontrolled (`defaultBilling`) or controlled
   (`billing` + `onBillingChange`). Each look sets the plans its
   own way:

   fun      coloured tiles packed 4px apart; the featured one in
            the accent with a rotating badge pinned to its corner
   civic    soft white rounded cards, serif prices; the featured
            one on a navy ground (a dark island)
   signal   ruled, table-like columns: mono prices, [01] indices,
            a small square for each check mark
   product  hairline cards in a tidy row; the featured one with an
            ink border and a "Most popular" badge
   minimal  no cards: a comparison list on rules, big prices

   Delight (fun): switch the billing and every price counts across
   to its new figure; tiles tip a degree under the hand.
   Calm: the new price is simply there. */
import { useState, type ReactNode } from "react";
import { cn } from "../utils";
import { Check } from "../icons";
import { Badge } from "./Badge";
import { Button, buttonVariants, type ButtonVariant } from "./Button";
import { Counter } from "./Counter";
import { Grid, GridItem, Section, SectionHeader, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { RotatingBadge } from "./RotatingBadge";
import { Sticker } from "./Sticker";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

export type PricingBilling = "monthly" | "yearly";

export interface PricingAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PricingPlan {
  name: string;
  /** A number is formatted and prefixed with `currency`; a string ("Custom") is shown as it is. */
  price: { monthly: number | string; yearly?: number | string };
  /** Default "$". */
  currency?: string;
  /** After a numeric price. Default "/mo". */
  period?: string;
  description?: string;
  features: string[];
  cta: PricingAction;
  featured?: boolean;
  /** Label on the featured plan. Default "Most popular". */
  badge?: string;
}

export interface PricingProps extends Omit<SectionProps, "title" | "children"> {
  eyebrow?: ReactNode;
  /** "05": the section number, shown where the preset numbers its sections (signal, minimal). */
  index?: string;
  title?: ReactNode;
  lead?: ReactNode;
  plans: PricingPlan[];
  /** Controlled billing period. */
  billing?: PricingBilling;
  defaultBilling?: PricingBilling;
  onBillingChange?: (billing: PricingBilling) => void;
  /** Next to the switch, e.g. "Save 20%". */
  billingNote?: ReactNode;
  /** Under a yearly price. Default "billed yearly". */
  yearlyCaption?: ReactNode;
  look?: BlockLook;
}

/* ── shared parts ── */

const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

function priceFor(plan: PricingPlan, billing: PricingBilling) {
  return billing === "yearly" && plan.price.yearly != null ? plan.price.yearly : plan.price.monthly;
}

/* A number that counts from its last value to the new one (fun only): the
   previous figure is kept in state and swapped during render when the value
   changes, so Counter gets from → to in one pass. */
function RollingNumber({ value, roll }: { value: number; roll: boolean }) {
  const [s, setS] = useState({ value, from: value });
  if (s.value !== value) setS({ value, from: s.value });
  if (!roll) return <span className="tabular-nums">{fmt(value)}</span>;
  const decimals = value % 1 === 0 && s.from % 1 === 0 ? 0 : 2;
  return <Counter to={value} from={s.from} duration={650} decimals={decimals} />;
}

function Price({
  plan,
  billing,
  roll = false,
  caption,
  className,
  periodClassName,
}: {
  plan: PricingPlan;
  billing: PricingBilling;
  roll?: boolean;
  caption?: ReactNode;
  className?: string;
  periodClassName?: string;
}) {
  const v = priceFor(plan, billing);
  const yearly = billing === "yearly" && plan.price.yearly != null && typeof v === "number";
  return (
    <div data-slot="pricing-price">
      <p className={cn("m-0 flex flex-wrap items-baseline gap-x-[0.15em]", typeof v === "number" && "whitespace-nowrap", className)}>
        {typeof v === "number" ? (
          <>
            <span data-slot="pricing-amount">
              {plan.currency ?? "$"}
              <RollingNumber value={v} roll={roll} />
            </span>
            <span data-slot="pricing-period" className={cn("text-[max(0.875rem,0.22em)] font-sans font-normal tracking-normal opacity-70", periodClassName)}>
              {plan.period ?? "/mo"}
            </span>
          </>
        ) : (
          // words for a price ("By arrangement") sit smaller than a figure would, and wrap
          <span data-slot="pricing-amount" className="text-[0.6em] leading-[1.1] text-balance">
            {v}
          </span>
        )}
      </p>
      <p data-slot="pricing-caption" className={cn("m-0 mt-1 text-[0.8125rem] opacity-70 min-h-[1.25em]", !yearly && "invisible")} aria-hidden={!yearly}>
        {caption ?? "billed yearly"}
      </p>
    </div>
  );
}

/* the plan's button: a real <button>, or a link dressed as one (with the same
   concentric hover fill, which Button draws for itself) */
function PlanAction({ action, variant, size = "md", className }: { action: PricingAction; variant: ButtonVariant; size?: "sm" | "md"; className?: string }) {
  if (!action.href)
    return (
      <Button variant={variant} size={size} block onClick={action.onClick} className={className}>
        {action.label}
      </Button>
    );
  return (
    <a data-slot="button" data-variant={variant} href={action.href} onClick={action.onClick} className={cn(buttonVariants({ variant, size, block: true }), className)}>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-1 rounded-[max(0px,calc(var(--rap-radius-pill)-1.5px))] bg-(--btn-blob) pointer-events-none",
          "[clip-path:inset(calc(var(--btn-h)/2)_round_max(0px,calc(var(--rap-radius-pill)-1.5px)))] group-hover/btn:[clip-path:inset(0_round_max(0px,calc(var(--rap-radius-pill)-1.5px)))]",
          "transition-[clip-path] duration-(--rap-dur-slow) ease-soft",
          "calm:[clip-path:inset(0_round_max(0px,calc(var(--rap-radius-pill)-1.5px)))] calm:opacity-0 calm:group-hover/btn:opacity-100 calm:transition-opacity calm:duration-(--rap-dur)",
        )}
      />
      <span>{action.label}</span>
    </a>
  );
}

function Features({ items, mark, className }: { items: string[]; mark: ReactNode; className?: string }) {
  return (
    <ul data-slot="pricing-features" className={cn("m-0 p-0 list-none flex flex-col gap-(--rap-space-xs)", className)}>
      {items.map((f) => (
        <li key={f} className="flex items-start gap-[0.7em] leading-snug">
          {mark}
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function BillingSwitch({
  billing,
  onChange,
  note,
  look,
}: {
  billing: PricingBilling;
  onChange: (b: PricingBilling) => void;
  note?: ReactNode;
  look: BlockLook;
}) {
  return (
    <div data-slot="pricing-billing" className="flex flex-wrap items-center gap-(--rap-space-sm)">
      <ToggleGroup
        type="single"
        size="sm"
        value={billing}
        onValueChange={(v) => v && onChange(v as PricingBilling)}
        aria-label="Billing period"
        className={cn(look === "signal" && "font-mono uppercase", look === "minimal" && "bg-transparent shadow-[inset_0_0_0_1px_var(--rap-line)]")}
      >
        <ToggleGroupItem value="monthly" className={cn(look === "signal" && "font-mono text-[0.75rem] tracking-[0.06em]")}>
          Monthly
        </ToggleGroupItem>
        <ToggleGroupItem value="yearly" className={cn(look === "signal" && "font-mono text-[0.75rem] tracking-[0.06em]")}>
          Yearly
        </ToggleGroupItem>
      </ToggleGroup>
      {note &&
        (look === "fun" ? (
          <Sticker color="acid" shape="pill" rotate={-6} size="0.875rem">
            {note}
          </Sticker>
        ) : (
          <span
            data-slot="pricing-billing-note"
            className={cn(
              "text-[0.875rem]",
              look === "civic" && "text-ink-2",
              look === "signal" && "font-mono text-[0.75rem] uppercase tracking-[0.06em] text-flame",
              look === "product" && "text-plum",
              look === "minimal" && "text-ink-2",
            )}
          >
            {note}
          </span>
        ))}
    </div>
  );
}

/* ── the looks ── */

type LookProps = { plans: PricingPlan[]; billing: PricingBilling; caption?: ReactNode };
/* columns per step [narrow, medium, wide]: three plans go straight from one to three
   (two-and-an-orphan reads as a mistake), four go 1 → 2 → 4 */
const cols = (n: number): [number, number, number] => {
  const k = Math.max(1, Math.min(n, 4));
  return [1, k === 3 ? 3 : Math.min(k, 2), k];
};

/* fun: light tiles (a light island, so their ink stays dark on acid in dark mode too) */
const FUN_TILES = ["bg-sky", "bg-acid", "bg-bubble", "bg-paper-2"];

function FunPlans({ plans, billing, caption }: LookProps) {
  let tone = 0;
  return (
    <Grid cols={cols(plans.length)} gap="tile">
      {plans.map((plan) => {
        const featured = !!plan.featured;
        const bg = featured ? "bg-accent text-accent-ink" : cn(FUN_TILES[tone++ % FUN_TILES.length], "text-ink");
        return (
          <article
            key={plan.name}
            data-slot="pricing-plan"
            data-featured={featured || undefined}
            {...(featured ? {} : { "data-rap-theme": "light" })}
            className={cn(
              "relative flex flex-col gap-(--rap-space-lg) min-h-[30rem] p-(--rap-space-lg) rounded-card",
              "transition-[rotate,translate] duration-(--rap-dur) ease-spring fun:hover:-rotate-1 fun:hover:-translate-y-1",
              bg,
            )}
          >
            {featured && (
              <RotatingBadge
                text={`${plan.badge ?? "Most popular"} • ${plan.badge ?? "Most popular"} • `}
                size={108}
                color="acid"
                className="absolute -top-7 right-5 z-1"
              />
            )}
            <header className={cn("flex flex-col gap-(--rap-space-xs)", featured && "pr-24")}>
              <h3 className="m-0 text-[1.375rem] font-medium tracking-[-0.03em]">{plan.name}</h3>
              {plan.description && <p className="m-0 text-[0.9375rem] leading-snug opacity-75">{plan.description}</p>}
            </header>
            <Price plan={plan} billing={billing} roll caption={caption} className="font-display text-display-xl leading-[0.9] tracking-[-0.05em]" />
            <Features
              items={plan.features}
              className="text-[0.9375rem]"
              mark={
                <span
                  aria-hidden
                  className={cn("grid place-items-center flex-none size-5 rounded-full [&_svg]:size-3", featured ? "bg-accent-ink text-accent" : "bg-ink text-paper")}
                >
                  <Check strokeWidth={3} />
                </span>
              }
            />
            <PlanAction action={plan.cta} variant="solid" className="mt-auto" />
          </article>
        );
      })}
    </Grid>
  );
}

function CivicPlans({ plans, billing, caption }: LookProps) {
  return (
    <Grid cols={cols(plans.length)} gap="tile">
      {plans.map((plan) => {
        const featured = !!plan.featured;
        return (
          <article
            key={plan.name}
            data-slot="pricing-plan"
            data-featured={featured || undefined}
            {...(featured ? { "data-rap-theme": "dark" } : {})}
            className={cn(
              "flex flex-col gap-(--rap-space-lg) p-(--rap-space-xl) rounded-lg text-ink",
              featured ? "bg-paper-2" : "bg-surface",
            )}
          >
            <header className="flex flex-col gap-(--rap-space-sm)">
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.01em]">{plan.name}</h3>
                {featured && <Badge variant="outline">{plan.badge ?? "Most popular"}</Badge>}
              </div>
              {plan.description && <p className="m-0 text-ink-2 leading-relaxed">{plan.description}</p>}
            </header>
            <Price plan={plan} billing={billing} caption={caption} className="font-display text-display-lg tracking-[-0.03em]" periodClassName="text-ink-2 opacity-100" />
            <Features
              items={plan.features}
              className="text-ink-2"
              mark={<Check aria-hidden className="flex-none size-4 text-mute mt-[3px]" />}
            />
            <PlanAction action={plan.cta} variant={featured ? "accent" : "solid"} className="mt-auto" />
          </article>
        );
      })}
    </Grid>
  );
}

function SignalPlans({ plans, billing, caption }: LookProps) {
  return (
    <div className="rounded-xs overflow-hidden bg-line p-px">
      <Grid cols={cols(plans.length)} gap="tile">
        {plans.map((plan, i) => {
          const featured = !!plan.featured;
          return (
            <article
              key={plan.name}
              data-slot="pricing-plan"
              data-featured={featured || undefined}
              className={cn("relative flex flex-col gap-(--rap-space-lg) p-(--rap-space-lg)", featured ? "bg-paper-2" : "bg-paper")}
            >
              {featured && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-accent" />}
              <header className="flex flex-col gap-(--rap-space-xs)">
                <div className="flex items-center justify-between gap-3 font-mono text-[0.75rem] uppercase tracking-[0.08em]">
                  <h3 className="m-0 font-normal text-ink">
                    <span className="text-flame">[{String(i + 1).padStart(2, "0")}]</span> {plan.name}
                  </h3>
                  {featured && <span className="text-flame">{plan.badge ?? "Most popular"}</span>}
                </div>
                {plan.description && <p className="m-0 text-[0.9375rem] text-ink-2 leading-snug">{plan.description}</p>}
              </header>
              <Price
                plan={plan}
                billing={billing}
                caption={caption}
                className="font-mono text-[clamp(2.25rem,4vw,3rem)] tracking-[-0.04em]"
                periodClassName="font-mono uppercase text-[0.75rem]"
              />
              <Features
                items={plan.features}
                className="text-[0.9375rem] text-ink-2 border-t border-line pt-(--rap-space-md)"
                mark={<span aria-hidden className="flex-none size-2 mt-[0.45em] bg-accent" />}
              />
              <PlanAction action={plan.cta} variant={featured ? "accent" : "outline"} size="sm" className="mt-auto font-mono uppercase text-[0.75rem] tracking-[0.06em]" />
            </article>
          );
        })}
      </Grid>
    </div>
  );
}

function ProductPlans({ plans, billing, caption }: LookProps) {
  return (
    <Grid cols={cols(plans.length)} gap="tile" className="items-stretch">
      {plans.map((plan) => {
        const featured = !!plan.featured;
        return (
          <article
            key={plan.name}
            data-slot="pricing-plan"
            data-featured={featured || undefined}
            // the featured plan is the inverted card: the page's ink as its ground
            {...(featured ? { "data-rap-theme": "dark" } : {})}
            className={cn(
              "relative flex flex-col gap-(--rap-space-md) p-(--rap-space-lg) rounded-card text-ink",
              featured ? "bg-paper shadow-pop" : "bg-surface shadow-[inset_0_0_0_1px_var(--rap-line)]",
            )}
          >
            <header className="flex flex-col gap-(--rap-space-2xs)">
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 text-base font-semibold tracking-[-0.01em]">{plan.name}</h3>
                {featured && (
                  <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-flame px-2.5 text-[0.75rem] font-semibold text-white">
                    <span aria-hidden className="size-1.5 rounded-pill bg-white" />
                    {plan.badge ?? "Most popular"}
                  </span>
                )}
              </div>
              {plan.description && <p className="m-0 text-[0.875rem] text-ink-2 leading-snug">{plan.description}</p>}
            </header>
            <Price
              plan={plan}
              billing={billing}
              caption={caption}
              roll
              className="py-(--rap-space-xs) font-display text-[clamp(2.75rem,5cqi,3.5rem)] font-semibold tracking-[-0.05em] leading-none"
              periodClassName="text-mute opacity-100"
            />
            <PlanAction action={plan.cta} variant={featured ? "accent" : "solid"} />
            <Features
              items={plan.features}
              className="text-[0.875rem] text-ink-2 pt-(--rap-space-xs)"
              mark={<Check aria-hidden className={cn("flex-none size-4 mt-0.5", featured ? "text-flame" : "text-ink")} />}
            />
          </article>
        );
      })}
    </Grid>
  );
}

function MinimalPlans({ plans, billing, caption }: LookProps) {
  return (
    <ol data-slot="pricing-list" className="m-0 p-0 list-none border-b border-line">
      {plans.map((plan, i) => (
        <li key={plan.name} data-slot="pricing-plan" data-featured={plan.featured || undefined} className="border-t border-line py-(--rap-space-lg)">
          <Grid gap="column" rowGap="md">
            <GridItem span={3} className="flex flex-col gap-(--rap-space-2xs)">
              <h3 className="m-0 text-base font-medium">
                <span className="text-mute tabular-nums">{String(i + 1).padStart(2, "0")} — </span>
                {plan.name}
              </h3>
              {plan.featured && <span className="text-[0.8125rem] text-ink-2">{plan.badge ?? "Most popular"}</span>}
              {plan.description && <p className="m-0 text-[0.875rem] text-ink-2 leading-snug max-w-[28ch]">{plan.description}</p>}
            </GridItem>
            <GridItem span={3}>
              <Price plan={plan} billing={billing} caption={caption} className="font-display text-display-lg tracking-[-0.04em] leading-none" periodClassName="text-ink-2 opacity-100" />
            </GridItem>
            <GridItem span={4}>
              <Features items={plan.features} className="text-[0.9375rem] text-ink-2 gap-(--rap-space-2xs)" mark={<span aria-hidden className="text-mute">—</span>} />
            </GridItem>
            <GridItem span={2} className="flex @min-[46rem]:justify-end items-start">
              {plan.cta.href ? (
                <a href={plan.cta.href} onClick={plan.cta.onClick} className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2">
                  {plan.cta.label}
                </a>
              ) : (
                <button type="button" onClick={plan.cta.onClick} className="p-0 bg-transparent border-0 cursor-pointer text-ink underline decoration-1 underline-offset-4 hover:decoration-2 font-sans text-base">
                  {plan.cta.label}
                </button>
              )}
            </GridItem>
          </Grid>
        </li>
      ))}
    </ol>
  );
}

const LOOKS = { fun: FunPlans, civic: CivicPlans, signal: SignalPlans, product: ProductPlans, minimal: MinimalPlans } as const;

export function Pricing({
  eyebrow,
  index,
  title,
  lead,
  plans,
  billing: billingProp,
  defaultBilling = "monthly",
  onBillingChange,
  billingNote,
  yearlyCaption,
  look: lookProp,
  className,
  ...rest
}: PricingProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const [own, setOwn] = useState<PricingBilling>(defaultBilling);
  const billing = billingProp ?? own;
  const setBilling = (b: PricingBilling) => {
    if (billingProp == null) setOwn(b);
    onBillingChange?.(b);
  };
  const hasYearly = plans.some((p) => p.price.yearly != null);
  const centred = look === "civic" || look === "product";
  const Plans = LOOKS[look] ?? FunPlans;

  const toggle = hasYearly ? <BillingSwitch billing={billing} onChange={setBilling} note={billingNote} look={look} /> : null;
  const hasHead = eyebrow || index || title || lead;

  return (
    <Section ref={ref} data-look={look} data-slot="pricing" className={cn("rap-pricing", className)} {...rest}>
      <Stack gap={look === "minimal" ? "xl" : "lg"}>
        {(hasHead || toggle) && (
          <div className={cn("flex flex-wrap gap-(--rap-space-md)", centred ? "flex-col items-center text-center" : "items-end justify-between")}>
            {hasHead && (
              <SectionHeader
                eyebrow={eyebrow}
                index={index}
                title={title ?? ""}
                lead={lead}
                align={centred ? "center" : "start"}
                size={look === "fun" ? "xl" : "lg"}
              />
            )}
            {toggle}
          </div>
        )}
        <Plans plans={plans} billing={billing} caption={yearlyCaption} />
      </Stack>
    </Section>
  );
}
