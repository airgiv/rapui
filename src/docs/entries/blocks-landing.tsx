import { Button } from "../../rapui";
import { LandingTemplate } from "../../site/landing/Template";
import { BlockFrame } from "../blockFrame";
import type { DocEntry } from "../types";

export const entries: DocEntry[] = [
  {
    slug: "landing-page",
    name: "Landing page",
    group: "Blocks",
    description:
      "Every block on one page — five pages, really: each preset gets its own made-up product and its own copy, and every one of them talks about itself. Hollr shouts in fun, Precedent submits itself respectfully in civic, Fieldkit receives itself in fragments in signal, Shiplog ships itself in product, and Less says less in minimal. The blocks are the same JSX throughout; switch the preset at the top and watch the page re-lay itself. Open it full screen to see it at real size, with the grid overlay a Shift+G away.",
    Demo: () => (
      <BlockFrame>
        <div className="flex justify-center pt-4 pb-2">
          <Button variant="accent" onClick={() => (window.location.hash = "landing")}>
            Open full page
          </Button>
        </div>
        <LandingTemplate />
      </BlockFrame>
    ),
    code: () => `import { SiteHeader, Hero, LogoCloud, Features, FeatureSplit, Stats,
  Testimonials, Pricing, FAQ, CTA, SiteFooter } from "@rapui/react";

<RapStyle preset="civic" />   {/* or fun, signal, product, minimal */}

<SiteHeader logo={logo} links={links} actions={<Button>Book a demo</Button>} />
<Hero eyebrow="The morning edition for 300 firms" title="The law changed overnight. Here’s your brief." lead={lead} actions={actions} media={shot} />
<LogoCloud title="Read every morning at" logos={firms} />
<Features index="01" eyebrow="How it works" title={title} items={features} />
<FeatureSplit index="02" eyebrow="For staff" title={title} points={points} media={digest} />
<Stats index="03" title="A year of answers" items={stats} />
<Testimonials index="04" title="What lawyers say" items={quotes} />
<Pricing index="05" title="Priced by population" plans={plans} />
<FAQ index="06" title="Before you ask Docket, ask us" items={questions} />
<CTA title="Give your residents a clerk who never closes" actions={actions} />
<SiteFooter logo={logo} wordmark="Docket" columns={columns} />`,
  },
];
