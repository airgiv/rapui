import { GROUPS, type DocEntry } from "./types";
import { entries as actions } from "./entries/actions";
import { entries as buttonsFun } from "./entries/buttons-fun";
import { entries as forms } from "./entries/forms";
import { entries as overlays } from "./entries/overlays";
import { entries as display } from "./entries/display";
import { entries as navigation } from "./entries/navigation";
import { entries as expressive } from "./entries/expressive";
import { entries as scrubbers } from "./entries/scrubbers";
import { entries as charts } from "./entries/charts";
import { entries as chartsA } from "./entries/charts-a";
import { entries as chartsB } from "./entries/charts-b";
import { entries as galleries } from "./entries/galleries";
import { entries as players } from "./entries/players";
import { entries as tools } from "./entries/tools";
import { entries as patterns } from "./entries/patterns";
import { entries as signal } from "./entries/signal";
import { entries as aiCore } from "./entries/ai-core";
import { entries as aiSources } from "./entries/ai-sources";
import { entries as aiPrompt } from "./entries/ai-prompt";
import { entries as aiChat } from "./entries/ai-chat";
import { entries as aiAgent } from "./entries/ai-agent";
import { entries as layout } from "./entries/layout";
import { entries as figures } from "./entries/figures";
import { entries as financeMoney } from "./entries/finance-money";
import { entries as financePayments } from "./entries/finance-payments";
import { entries as financeMarkets } from "./entries/finance-markets";
import { entries as blocksFeatures } from "./entries/blocks-features";
import { entries as blocksHero } from "./entries/blocks-hero";
import { entries as blocksPricing } from "./entries/blocks-pricing";
import { entries as blocksLanding } from "./entries/blocks-landing";

/** Every documented component, sorted by sidebar group then name. */
export const ENTRIES: DocEntry[] = [...actions, ...aiCore, ...aiSources, ...aiPrompt, ...aiChat, ...aiAgent, ...buttonsFun, ...forms, ...scrubbers, ...overlays, ...display, ...charts, ...chartsA, ...chartsB, ...galleries, ...players, ...tools, ...patterns, ...signal, ...navigation, ...expressive, ...layout, ...blocksFeatures, ...blocksHero, ...blocksPricing, ...blocksLanding, ...financeMoney, ...financePayments, ...financeMarkets, ...figures].sort(
  (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.name.localeCompare(b.name),
);
