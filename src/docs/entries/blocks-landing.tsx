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
      "Every block on one page, for one made-up product — Commons, an assistant that answers residents' questions from a city's open data. Nothing in it is styled per preset: switch the preset at the top and the same JSX re-lays itself — a loud tiled page in fun, a public-service site in civic, ruled data sheets in signal, a centred product page, a numbered black-on-white one. Open it full screen to see it at real size, with the grid overlay a Shift+G away.",
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
<Hero eyebrow="Now live in 38 cities" title="Ask your city anything" lead={lead} actions={actions} media={shot} />
<LogoCloud title="Answering for residents of" logos={cities} />
<Features index="01" eyebrow="How it works" title={title} items={features} />
<FeatureSplit index="02" eyebrow="For staff" title={title} points={points} media={digest} />
<Stats index="03" title="A year of answers" items={stats} />
<Testimonials index="04" title="What cities say" items={quotes} />
<Pricing index="05" title="Priced by population" plans={plans} />
<FAQ index="06" title="Before you ask Commons, ask us" items={questions} />
<CTA title="Give your residents a clerk who never closes" actions={actions} />
<SiteFooter logo={logo} wordmark="Commons" columns={columns} />`,
  },
];
