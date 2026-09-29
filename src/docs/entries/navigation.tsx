import { useState, type CSSProperties, type ReactNode } from "react";
import {
  BarChart3,
  Box,
  ChevronDown,
  Code2,
  Eye,
  FileText,
  Folder,
  Frame,
  Home,
  Image,
  Inbox,
  Layers,
  LayoutGrid,
  LifeBuoy,
  MousePointer2,
  Newspaper,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Type,
  Users,
} from "../../rapui/icons";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  NavigationMenu,
  NavigationMenuCard,
  NavigationMenuContent,
  NavigationMenuGrid,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Paginator,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Stepper,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry, Props } from "../types";

type Size = "sm" | "md" | "lg";

/** Re-seed local state when a control changes, but let the demo own it in between. */
function useSynced<T>(value: T, seed: Props[string]) {
  const [state, setState] = useState<T>(value);
  const [last, setLast] = useState(seed);
  if (last !== seed) {
    setLast(seed);
    setState(value);
  }
  return [state, setState] as const;
}

/* small presentational helpers for demos (tokens only) */
const muted: CSSProperties = { color: "var(--rap-mute)", fontSize: "0.8125rem" };
const tileTitle: CSSProperties = { fontSize: "0.8125rem", fontWeight: 500, color: "var(--rap-mute)" };

const GRADIENTS = [
  "linear-gradient(135deg, var(--rap-flame), var(--rap-bubble))",
  "linear-gradient(135deg, var(--rap-blue), var(--rap-sky))",
  "linear-gradient(135deg, var(--rap-acid), var(--rap-sky))",
  "linear-gradient(135deg, var(--rap-plum), var(--rap-flame))",
  "linear-gradient(135deg, var(--rap-ink-2), var(--rap-mute))",
  "linear-gradient(135deg, var(--rap-bubble), var(--rap-blue))",
];

/* ── Breadcrumb ────────────────────────────────────── */
const breadcrumbControls: Control[] = [
  { type: "select", prop: "separator", options: ["chevron", "slash"], default: "chevron" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "collapse", label: "collapse middle", default: false },
  { type: "boolean", prop: "icon", label: "home icon", default: true },
];

/* ── Pagination ────────────────────────────────────── */
const paginationControls: Control[] = [
  { type: "number", prop: "total", min: 1, max: 40, default: 12, codeDefault: null },
  { type: "number", prop: "siblings", min: 0, max: 2, default: 1 },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "labels", label: "prev/next labels", default: true },
];

/* ── NavigationMenu ────────────────────────────────── */
const navControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "columns", options: ["1", "2", "3"], default: "2" },
  { type: "boolean", prop: "icons", default: true },
];

/* ── Tabs ──────────────────────────────────────────── */
const tabsControls: Control[] = [
  { type: "select", prop: "variant", options: ["pill", "line"], default: "pill" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "orientation", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "boolean", prop: "icons", default: false },
];

/* ── Stepper ───────────────────────────────────────── */
const stepperControls: Control[] = [
  { type: "select", prop: "orientation", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "number", prop: "current", min: 0, max: 5, default: 2, codeDefault: null },
  { type: "boolean", prop: "clickable", label: "click to go back", default: true },
];

/* ── Sidebar ───────────────────────────────────────── */
const sidebarControls: Control[] = [
  { type: "boolean", prop: "collapsed", default: false },
  { type: "select", prop: "size", label: "row size", options: ["sm", "md"], default: "md" },
  { type: "boolean", prop: "badges", default: true },
];

/* ── ScrollArea ────────────────────────────────────── */
const scrollControls: Control[] = [
  { type: "select", prop: "orientation", options: ["vertical", "horizontal", "both"], default: "vertical" },
  { type: "select", prop: "type", label: "scrollbars", options: ["hover", "always", "auto", "scroll"], default: "hover" },
  { type: "number", prop: "height", min: 160, max: 420, step: 20, default: 300 },
];

/* ── Resizable ─────────────────────────────────────── */
const resizableControls: Control[] = [
  { type: "select", prop: "orientation", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "select", prop: "variant", options: ["tiles", "plain"], default: "tiles" },
  { type: "boolean", prop: "withHandle", label: "show handle", default: true },
  { type: "boolean", prop: "collapsible", label: "layers collapse", default: true },
];

/* ── Collapsible ───────────────────────────────────── */
const collapsibleControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "defaultOpen", label: "open", default: true, codeDefault: false },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── Carousel ──────────────────────────────────────── */
const carouselControls: Control[] = [
  { type: "select", prop: "orientation", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "select", prop: "perView", label: "slides in view", options: ["1", "2", "3"], default: "1" },
  { type: "boolean", prop: "loop", default: false },
  { type: "boolean", prop: "dots", default: true },
];

const TEMPLATES = [
  { name: "Mono portfolio", note: "Grid-first, one typeface" },
  { name: "Launch page", note: "Hero, features, waitlist" },
  { name: "Annual report", note: "Long read with charts" },
  { name: "Studio journal", note: "Essays and case notes" },
  { name: "Lookbook", note: "Full-bleed image sequence" },
  { name: "Event microsite", note: "Schedule, speakers, tickets" },
];

const STEPS = [
  { title: "Template", description: "Mono portfolio" },
  { title: "Brand", description: "Colours and fonts" },
  { title: "Pages", description: "6 of 8 ready" },
  { title: "Domain", description: "studio.north" },
  { title: "Publish" },
];

function Slide({ i, compact }: { i: number; compact?: boolean }) {
  const t = TEMPLATES[i % TEMPLATES.length];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: "100%",
        minHeight: compact ? "10rem" : "16rem",
        padding: compact ? "1rem 1.1rem" : "1.4rem 1.5rem",
        background: GRADIENTS[i % GRADIENTS.length],
        color: i % GRADIENTS.length === 2 ? "rgb(24 24 24)" : "#fff",
      }}
    >
      <span style={{ fontSize: compact ? "1rem" : "1.375rem", fontWeight: 500, letterSpacing: "-0.03em" }}>{t.name}</span>
      <span style={{ fontSize: "0.875rem", opacity: 0.85 }}>{t.note}</span>
    </div>
  );
}

function Tile({ title, children, style }: { title: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%", padding: "1rem", ...style }}>
      <span style={tileTitle}>{title}</span>
      {children}
    </div>
  );
}

const LAYERS = ["Header", "Hero image", "Headline", "Intro text", "Case grid", "Footer"];

function LayerRow({ name, active }: { name: string; active?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        height: 32,
        padding: "0 0.65rem",
        borderRadius: 10,
        fontSize: "0.875rem",
        whiteSpace: "nowrap",
        background: active ? "var(--rap-select)" : undefined,
        color: active ? "var(--rap-select-ink)" : undefined,
      }}
    >
      <Frame size={14} style={{ flex: "none", opacity: 0.7 }} />
      {name}
    </div>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
      <span className="doc-muted">{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

const RELEASES = [
  ["4.12", "Scroll-linked animations on any widget"],
  ["4.11", "Variable fonts with custom axes"],
  ["4.10", "Shared colour styles across projects"],
  ["4.9", "Page transitions: fade, push, reveal"],
  ["4.8", "Form widget sends to webhooks"],
  ["4.7", "Password-protected pages"],
  ["4.6", "Code blocks with syntax colour"],
  ["4.5", "Grid snapping for mobile layouts"],
  ["4.4", "Lottie playback controls"],
  ["4.3", "Custom 404 pages"],
  ["4.2", "Team roles: editor, viewer, owner"],
  ["4.1", "Export to PDF with links"],
  ["4.0", "New editor, rebuilt from scratch"],
];

export const entries: DocEntry[] = [
  /* ───────────── Breadcrumb ───────────── */
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    group: "Navigation",
    description: "Shows where a page sits in the hierarchy. Links are muted; the current page is ink. Delight: point at a crumb and the chevrons after it turn round, one after another, to point back at it.",
    controls: breadcrumbControls,
    Demo: ({ p }) => {
      const sep = <BreadcrumbSeparator variant={p.separator as "chevron" | "slash"} />;
      return (
        <Breadcrumb size={p.size as Size}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#docs.breadcrumb">
                {p.icon && <Home aria-hidden />}
                Studio
              </BreadcrumbLink>
            </BreadcrumbItem>
            {sep}
            {p.collapse ? (
              <BreadcrumbItem>
                <BreadcrumbEllipsis title="Clients / Northwind" />
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#docs.breadcrumb">Clients</BreadcrumbLink>
                </BreadcrumbItem>
                {sep}
                <BreadcrumbItem>
                  <BreadcrumbLink href="#docs.breadcrumb">Northwind</BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            {sep}
            <BreadcrumbItem>
              <BreadcrumbLink href="#docs.breadcrumb">Rebrand 2026</BreadcrumbLink>
            </BreadcrumbItem>
            {sep}
            <BreadcrumbItem>
              <BreadcrumbPage>Homepage</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    },
    code: (p) => {
      const sep = p.separator === "slash" ? `<BreadcrumbSeparator variant="slash" />` : `<BreadcrumbSeparator />`;
      const middle = p.collapse
        ? `    <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>\n    ${sep}`
        : `    <BreadcrumbItem><BreadcrumbLink href="/clients">Clients</BreadcrumbLink></BreadcrumbItem>
    ${sep}
    <BreadcrumbItem><BreadcrumbLink href="/clients/northwind">Northwind</BreadcrumbLink></BreadcrumbItem>
    ${sep}`;
      return `import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator${
        p.collapse ? ", BreadcrumbEllipsis" : ""
      } } from "rapui";

<Breadcrumb${p.size !== "md" ? ` size="${p.size}"` : ""}>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">${p.icon ? "<Home /> " : ""}Studio</BreadcrumbLink></BreadcrumbItem>
    ${sep}
${middle}
    <BreadcrumbItem><BreadcrumbLink href="/rebrand">Rebrand 2026</BreadcrumbLink></BreadcrumbItem>
    ${sep}
    <BreadcrumbItem><BreadcrumbPage>Homepage</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;
    },
    examples: [
      {
        title: "In a page header",
        Demo: () => (
          <div className="doc-stack" style={{ width: "100%", minWidth: 0, maxWidth: "34rem", gap: "0.4rem" }}>
            <Breadcrumb size="sm">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#docs.breadcrumb">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator variant="slash" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Custom domains</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="doc-row doc-between">
              <span style={{ fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.04em" }}>Custom domains</span>
              <Button size="sm" variant="soft">
                Add domain
              </Button>
            </div>
          </div>
        ),
        code: `<Breadcrumb size="sm">
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/settings">Settings</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator variant="slash" />
    <BreadcrumbItem><BreadcrumbPage>Custom domains</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
      },
    ],
  },

  /* ───────────── Pagination ───────────── */
  {
    slug: "pagination",
    name: "Pagination",
    group: "Navigation",
    description:
      "Moves through pages of a list. Use <Paginator> for the usual case; the composable parts are there when you need a custom row. Delight: jump from page 1 to the last one — the ink pill crawls there like a caterpillar, stretching ahead and pulling its tail in.",
    controls: paginationControls,
    Demo: ({ p }) => {
      const total = Number(p.total);
      const [page, setPage] = useSynced(Math.min(4, total), p.total);
      return (
        <div className="doc-stack" style={{ alignItems: "center" }}>
          <Paginator
            page={Math.min(page, total)}
            total={total}
            onPageChange={setPage}
            siblings={Number(p.siblings)}
            size={p.size as Size}
            labels={Boolean(p.labels)}
          />
          <span style={muted}>
            Showing projects {(Math.min(page, total) - 1) * 24 + 1}–{Math.min(page, total) * 24} of {total * 24}
          </span>
        </div>
      );
    },
    code: (p) =>
      `import { Paginator } from "rapui";

const [page, setPage] = useState(1);

<Paginator page={page} onPageChange={setPage}${attrs(p, paginationControls)} />`,
    examples: [
      {
        title: "Composable parts",
        Demo: () => (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#docs.pagination" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#docs.pagination">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#docs.pagination" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#docs.pagination">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#docs.pagination" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ),
        code: `<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
    <PaginationItem><PaginationLink href="?page=1">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="?page=3">3</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
      },
    ],
  },

  /* ───────────── NavigationMenu ───────────── */
  {
    slug: "navigation-menu",
    name: "Navigation menu",
    group: "Navigation",
    basedOn: "Radix NavigationMenu",
    description:
      "A site header menu. Pill triggers open one shared panel that morphs between sections; arrow keys and Escape work. Delight: sweep the pointer along the bar — one soft fill crawls after it — and open a panel to see its cards dealt in.",
    controls: navControls,
    Demo: ({ p }) => {
      const cols = Number(p.columns) as 1 | 2 | 3;
      const ic = (n: ReactNode) => (p.icons ? n : undefined);
      return (
        <div style={{ alignSelf: "start", width: "100%", minHeight: "20rem" }}>
          <NavigationMenu size={p.size as Size}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuGrid columns={cols}>
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<MousePointer2 />)} title="Editor" description="Place anything, no grid" />
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<LayoutGrid />)} title="Templates" description="200 designer-made starts" />
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<Sparkles />)} title="Animations" description="Scroll and hover triggers" />
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<Code2 />)} title="Custom code" description="Your own HTML, CSS and JS" />
                    {cols === 3 && (
                      <>
                        <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<Type />)} title="Typography" description="Variable and fluid sizes" />
                        <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<BarChart3 />)} title="Analytics" description="Visitors, reading depth" />
                      </>
                    )}
                  </NavigationMenuGrid>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuGrid columns={cols === 3 ? 2 : cols}>
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<Newspaper />)} title="Journal" description="Interviews with studios" />
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<LifeBuoy />)} title="Help center" description="Guides for every widget" />
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<Users />)} title="Community" description="Share work, ask for feedback" />
                    <NavigationMenuCard href="#docs.navigation-menu" icon={ic(<Palette />)} title="Made with rap/ui" description="Sites people published" />
                  </NavigationMenuGrid>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink variant="pill" href="#docs.navigation-menu">
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink variant="pill" href="#docs.navigation-menu" active>
                  Showcase
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      );
    },
    code: (p) =>
      `import {
  NavigationMenu, NavigationMenuCard, NavigationMenuContent, NavigationMenuGrid,
  NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from "rapui";

<NavigationMenu${p.size !== "md" ? ` size="${p.size}"` : ""}>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Product</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuGrid${p.columns !== "2" ? ` columns={${p.columns}}` : ""}>
          <NavigationMenuCard href="/editor"${p.icons ? " icon={<MousePointer2 />}" : ""} title="Editor" description="Place anything anywhere" />
          <NavigationMenuCard href="/templates"${p.icons ? " icon={<LayoutGrid />}" : ""} title="Templates" description="Two hundred starting points" />
        </NavigationMenuGrid>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink variant="pill" href="/pricing">Pricing</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
  },

  /* ───────────── Tabs ───────────── */
  {
    slug: "tabs",
    name: "Tabs",
    group: "Navigation",
    basedOn: "Radix Tabs",
    description:
      "Switches between views of the same object. “pill” is a segmented control with an ink pill; “line” is text tabs with an underline. Delight: click from the first tab to the last — the pill (or underline) travels like a caterpillar, front edge first, tail catching up.",
    controls: tabsControls,
    Demo: ({ p }) => {
      const vertical = p.orientation === "vertical";
      const ic = (n: ReactNode) => (p.icons ? n : null);
      return (
        <div style={{ width: "100%", minWidth: 0, maxWidth: "36rem" }}>
          <TabsRoot
            key={`${p.variant}-${p.orientation}`}
            defaultValue="overview"
            variant={p.variant as "pill" | "line"}
            size={p.size as Size}
            orientation={p.orientation as "horizontal" | "vertical"}
          >
            <TabsList aria-label="Project">
              <TabsTrigger value="overview">
                {ic(<Eye />)}Overview
              </TabsTrigger>
              <TabsTrigger value="pages">
                {ic(<FileText />)}Pages
              </TabsTrigger>
              <TabsTrigger value="assets">
                {ic(<Image />)}Assets
              </TabsTrigger>
              <TabsTrigger value="settings">
                {ic(<Settings />)}Settings
              </TabsTrigger>
            </TabsList>
            {[
              ["overview", "Northwind rebrand", "Last published 2 hours ago by Mira. 1,284 visitors this week."],
              ["pages", "8 pages", "Homepage, Work, Case study ×4, About, Contact. Two drafts not yet published."],
              ["assets", "146 assets", "92 images, 31 videos, 23 Lottie files. 1.2 GB of 5 GB used."],
              ["settings", "Project settings", "Domain northwind.studio, password off, search indexing on."],
            ].map(([v, t, d]) => (
              <TabsContent key={v} value={v}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    padding: "1.25rem 1.4rem",
                    minHeight: vertical ? "100%" : undefined,
                    borderRadius: 20,
                    background: "var(--rap-fill)",
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: "1.0625rem", letterSpacing: "-0.02em" }}>{t}</span>
                  <span className="doc-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.45 }}>
                    {d}
                  </span>
                </div>
              </TabsContent>
            ))}
          </TabsRoot>
        </div>
      );
    },
    code: (p) =>
      `import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "rapui";

<TabsRoot defaultValue="overview"${attrs(p, tabsControls, ["icons"])}>
  <TabsList aria-label="Project">
    <TabsTrigger value="overview">${p.icons ? "<Eye />" : ""}Overview</TabsTrigger>
    <TabsTrigger value="pages">${p.icons ? "<FileText />" : ""}Pages</TabsTrigger>
    <TabsTrigger value="assets">${p.icons ? "<Image />" : ""}Assets</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  <TabsContent value="pages">…</TabsContent>
  <TabsContent value="assets">…</TabsContent>
</TabsRoot>`,
  },

  /* ───────────── Stepper ───────────── */
  {
    slug: "stepper",
    name: "Stepper",
    group: "Navigation",
    description:
      "Progress through a multi-step flow. Done steps turn blue with a check, the current one is ink, the rest wait in grey. Delight: press Next — the check draws itself, blue pours down the connector like liquid and the next circle splats as it arrives.",
    controls: stepperControls,
    Demo: ({ p }) => {
      const [current, setCurrent] = useSynced(Number(p.current), p.current);
      const vertical = p.orientation === "vertical";
      return (
        <div className="doc-stack" style={{ width: "100%", minWidth: 0, maxWidth: vertical ? "22rem" : "44rem", gap: "2rem" }}>
          <Stepper
            steps={STEPS}
            current={current}
            orientation={p.orientation as "horizontal" | "vertical"}
            size={p.size as Size}
            onStepClick={p.clickable ? setCurrent : undefined}
          />
          <div className="doc-row" style={{ justifyContent: vertical ? "flex-start" : "flex-end", gap: "var(--rap-gap-tight)" }}>
            <Button size="sm" variant="soft" disabled={current <= 0} onClick={() => setCurrent(current - 1)}>
              Back
            </Button>
            <Button size="sm" variant="solid" disabled={current >= STEPS.length} onClick={() => setCurrent(current + 1)}>
              {current >= STEPS.length - 1 ? "Publish" : "Continue"}
            </Button>
          </div>
        </div>
      );
    },
    code: (p) =>
      `import { Stepper } from "rapui";

const steps = [
  { title: "Template", description: "Mono portfolio" },
  { title: "Brand", description: "Colours and fonts" },
  { title: "Pages", description: "6 of 8 ready" },
  { title: "Domain", description: "studio.north" },
  { title: "Publish" },
];

<Stepper steps={steps}${attrs(p, stepperControls, ["clickable"])}${p.clickable ? " onStepClick={setCurrent}" : ""} />`,
  },

  /* ───────────── Sidebar ───────────── */
  {
    slug: "sidebar",
    name: "Sidebar",
    group: "Navigation",
    description:
      "App shell for admin pages: a sidebar that collapses to a 56px icon rail (⌘B) next to a rounded main area. Plain flex layout, so it fits any box. Delight: pick a row far down — the ink pill crawls to it — then press ⌘B and the rail snaps shut on a spring, bumping its stop.",
    controls: sidebarControls,
    Demo: ({ p }) => {
      const [collapsed, setCollapsed] = useSynced(Boolean(p.collapsed), p.collapsed);
      const [active, setActive] = useState("Projects");
      const size = p.size as "sm" | "md";
      const item = (icon: ReactNode, label: string, badge?: string) => (
        <SidebarMenuItem key={label}>
          <SidebarMenuButton
            icon={icon}
            size={size}
            isActive={active === label}
            onClick={() => setActive(label)}
            badge={p.badges ? badge : undefined}
          >
            {label}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
      return (
        <div style={{ width: "100%", height: 520, borderRadius: 20, overflow: "hidden", boxShadow: "0 0 0 1px var(--rap-line)" }}>
          <SidebarProvider collapsed={collapsed} onCollapsedChange={setCollapsed}>
            <Sidebar>
              <SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size={size}
                      tooltip="Northwind Studio"
                      icon={
                        <span
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: 22,
                            height: 22,
                            borderRadius: 7,
                            background: "var(--rap-flame)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          N
                        </span>
                      }
                    >
                      <span style={{ fontWeight: 500 }}>Northwind Studio</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                  <SidebarMenu>
                    {item(<Home />, "Home")}
                    {item(<Folder />, "Projects", "12")}
                    {item(<LayoutGrid />, "Templates")}
                    {item(<Inbox />, "Form inbox", "3")}
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Brand</SidebarGroupLabel>
                  <SidebarMenu>
                    {item(<Palette />, "Colours")}
                    {item(<Type />, "Fonts")}
                    {item(<Box />, "Components")}
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <SidebarMenu>
                  {item(<Users />, "Team")}
                  {item(<Settings />, "Settings")}
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset>
              <div className="doc-row" style={{ gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--rap-line)" }}>
                <SidebarTrigger />
                <Breadcrumb size="sm">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#docs.sidebar">Northwind Studio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{active}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <span style={{ marginLeft: "auto" }}>
                  <Button size="sm" variant="solid" icon={<Plus size={16} />}>
                    New project
                  </Button>
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
                  gap: "var(--rap-gap-tile)",
                  padding: "1rem",
                }}
              >
                {TEMPLATES.map((t, i) => (
                  <div key={t.name} style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    <div style={{ height: 96, borderRadius: 16, background: GRADIENTS[i] }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t.name}</span>
                    <span style={muted}>Edited {i + 1}h ago</span>
                  </div>
                ))}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      );
    },
    code: (p) =>
      `import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "rapui";

// ⌘B / Ctrl+B toggles. The shell fills its parent — give that a height.
<div style={{ height: "100vh" }}>
  <SidebarProvider${p.collapsed ? " defaultCollapsed" : ""}>
    <Sidebar>
      <SidebarHeader>…</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton icon={<Folder />} isActive${p.size !== "md" ? ` size="${p.size}"` : ""}${
        p.badges ? ` badge="12"` : ""
      }>Projects</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>…</SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <SidebarTrigger />
      …
    </SidebarInset>
  </SidebarProvider>
</div>`,
  },

  /* ───────────── ScrollArea ───────────── */
  {
    slug: "scroll-area",
    name: "Scroll area",
    group: "Layout",
    basedOn: "Radix ScrollArea",
    description: "Native scrolling with a thin round thumb instead of the system scrollbar. Vertical, horizontal or both. Delight: keep scrolling past the end — the thumb squashes against it like a soft bead and springs back when you stop.",
    controls: scrollControls,
    Demo: ({ p }) => {
      const h = Number(p.height);
      const type = p.type as "hover" | "always" | "auto" | "scroll";
      const box: CSSProperties = { height: h, borderRadius: 20, background: "var(--rap-fill)" };
      if (p.orientation === "horizontal")
        return (
          <ScrollArea orientation="horizontal" type={type} style={{ ...box, height: "auto", width: "100%", minWidth: 0, maxWidth: "34rem" }}>
            <div style={{ display: "flex", gap: "var(--rap-gap-tile)", padding: "0.75rem" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{ flex: "none", width: 132 }}>
                  <div style={{ height: 96, borderRadius: 14, background: GRADIENTS[i % GRADIENTS.length] }} />
                  <div style={{ padding: "0.45rem 0.2rem 0.2rem", fontSize: "0.8125rem", fontWeight: 500 }}>
                    {TEMPLATES[i % TEMPLATES.length].name}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        );
      if (p.orientation === "both")
        return (
          <ScrollArea orientation="both" type={type} style={{ ...box, width: "100%", minWidth: 0, maxWidth: "30rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 96px)",
                gap: "var(--rap-gap-tile)",
                padding: "0.75rem",
              }}
            >
              {Array.from({ length: 80 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: 72,
                    borderRadius: 12,
                    background: i % 7 === 0 ? GRADIENTS[i % GRADIENTS.length] : "var(--rap-fill)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "0.75rem",
                    color: "var(--rap-mute)",
                  }}
                >
                  {String.fromCharCode(65 + (i % 10))}
                  {Math.floor(i / 10) + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        );
      return (
        <ScrollArea type={type} style={{ ...box, width: "100%", minWidth: 0, maxWidth: "22rem" }}>
          <div style={{ padding: "1rem 1.1rem" }}>
            <div style={{ ...tileTitle, marginBottom: "0.5rem" }}>Release notes</div>
            {RELEASES.map(([v, t]) => (
              <div key={v} style={{ display: "flex", gap: "0.75rem", padding: "0.55rem 0", borderTop: "1px solid var(--rap-line)" }}>
                <span style={{ flex: "none", width: "2.5rem", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                <span style={{ fontSize: "0.9375rem", color: "var(--rap-ink-2)" }}>{t}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      );
    },
    code: (p) =>
      `import { ScrollArea } from "rapui";

<ScrollArea${attrs(p, scrollControls, ["height"])} style={{ height: ${p.height} }}>
  …long content…
</ScrollArea>`,
  },

  /* ───────────── Resizable ───────────── */
  {
    slug: "resizable",
    name: "Resizable",
    group: "Layout",
    basedOn: "react-resizable-panels",
    description:
      "Panels you can resize by dragging the gap between them, or with arrow keys on a focused handle. Numbers are pixels, strings are percentages. Delight: grab the grip and drag fast — it stretches like a rubber tab with your speed, jolts at a panel's limit and snaps back when you let go.",
    controls: resizableControls,
    Demo: ({ p }) => {
      const vertical = p.orientation === "vertical";
      const handle = <ResizableHandle withHandle={Boolean(p.withHandle)} />;
      const variant = p.variant as "tiles" | "plain";
      if (vertical)
        return (
          <div style={{ width: "100%", height: 440 }}>
            <ResizablePanelGroup key="v" orientation="vertical" variant={variant}>
              <ResizablePanel defaultSize="68" minSize="30">
                <Tile title="Canvas">
                  <div style={{ flex: 1, borderRadius: 14, background: GRADIENTS[1] }} />
                </Tile>
              </ResizablePanel>
              {handle}
              <ResizablePanel defaultSize="32" minSize="15" collapsible={Boolean(p.collapsible)} collapsedSize="0">
                <Tile title="Timeline">
                  {["Headline — fade in", "Hero image — parallax", "Case grid — stagger"].map((t, i) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem" }}>
                      <span style={{ width: "10rem", flex: "none", whiteSpace: "nowrap" }}>{t}</span>
                      <span
                        style={{
                          height: 10,
                          marginLeft: `${i * 12}%`,
                          width: `${30 + i * 8}%`,
                          borderRadius: 999,
                          background: "var(--rap-select)",
                        }}
                      />
                    </div>
                  ))}
                </Tile>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        );
      return (
        <div style={{ width: "100%", height: 440 }}>
          <ResizablePanelGroup key="h" orientation="horizontal" variant={variant}>
            <ResizablePanel defaultSize="22" minSize="160px" maxSize="40" collapsible={Boolean(p.collapsible)} collapsedSize="0">
              <Tile title="Layers">
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {LAYERS.map((l) => (
                    <LayerRow key={l} name={l} active={l === "Headline"} />
                  ))}
                </div>
              </Tile>
            </ResizablePanel>
            {handle}
            <ResizablePanel defaultSize="54" minSize="30">
              <Tile title="Canvas — Homepage">
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "1.25rem",
                    borderRadius: 14,
                    background: GRADIENTS[0],
                    color: "#fff",
                  }}
                >
                  <span style={{ fontSize: "clamp(1.25rem, 2.4vw, 2rem)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    We make brands move.
                  </span>
                </div>
              </Tile>
            </ResizablePanel>
            {handle}
            <ResizablePanel defaultSize="24" minSize="180px" maxSize="40">
              <Tile title="Inspector">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <InspectorRow label="Font" value="Onest" />
                  <InspectorRow label="Size" value="64 px" />
                  <InspectorRow label="Line height" value="100%" />
                  <InspectorRow label="Tracking" value="−4%" />
                  <InspectorRow label="Colour" value="#FFFFFF" />
                  <InspectorRow label="Animation" value="Fade in" />
                </div>
              </Tile>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      );
    },
    code: (p) =>
      p.orientation === "vertical"
        ? `import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "rapui";

<ResizablePanelGroup orientation="vertical"${p.variant !== "tiles" ? ` variant="${p.variant}"` : ""}>
  <ResizablePanel defaultSize="68" minSize="30">Canvas</ResizablePanel>
  <ResizableHandle${p.withHandle ? " withHandle" : ""} />
  <ResizablePanel defaultSize="32" minSize="15"${p.collapsible ? ' collapsible collapsedSize="0"' : ""}>Timeline</ResizablePanel>
</ResizablePanelGroup>`
        : `import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "rapui";

// numbers = pixels, strings = percent ("22") or units ("160px", "12rem")
<ResizablePanelGroup${p.variant !== "tiles" ? ` variant="${p.variant}"` : ""}>
  <ResizablePanel defaultSize="22" minSize="160px" maxSize="40"${p.collapsible ? ' collapsible collapsedSize="0"' : ""}>Layers</ResizablePanel>
  <ResizableHandle${p.withHandle ? " withHandle" : ""} />
  <ResizablePanel defaultSize="54" minSize="30">Canvas</ResizablePanel>
  <ResizableHandle${p.withHandle ? " withHandle" : ""} />
  <ResizablePanel defaultSize="24" minSize="180px" maxSize="40">Inspector</ResizablePanel>
</ResizablePanelGroup>`,
  },

  /* ───────────── Collapsible ───────────── */
  {
    slug: "collapsible",
    name: "Collapsible",
    group: "Layout",
    basedOn: "Radix Collapsible",
    description: "Shows and hides one region with a smooth height animation. For a list of sections use Accordion. Delight: open it — the rows are dealt in one after another like cards onto a table.",
    controls: collapsibleControls,
    Demo: ({ p }) => {
      const [open, setOpen] = useSynced(Boolean(p.defaultOpen), p.defaultOpen);
      return (
        <div style={{ width: "100%", minWidth: 0, maxWidth: "24rem" }}>
          <Collapsible open={open} onOpenChange={setOpen} disabled={Boolean(p.disabled)}>
            <CollapsibleTrigger size={p.size as Size}>
              <Settings />
              Advanced export settings
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  padding: "1rem 1.1rem",
                  borderRadius: 20,
                  background: "var(--rap-fill)",
                }}
              >
                <InspectorRow label="Image quality" value="85%" />
                <InspectorRow label="Lazy-load below fold" value="On" />
                <InspectorRow label="Minify custom code" value="On" />
                <InspectorRow label="Open Graph image" value="Auto" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    },
    code: (p) =>
      `import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "rapui";

<Collapsible${attrs(p, collapsibleControls, ["size"])}>
  <CollapsibleTrigger${p.size !== "md" ? ` size="${p.size}"` : ""}><Settings /> Advanced export settings</CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`,
    examples: [
      {
        title: "Custom trigger (asChild)",
        Demo: function HiddenLayers() {
          return (
            <div style={{ width: "100%", minWidth: 0, maxWidth: "20rem" }}>
              <Collapsible>
                <div className="doc-row doc-between" style={{ padding: "0 0.25rem 0 0.65rem" }}>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>
                    <Layers size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                    Homepage
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button size="sm" variant="soft" icon={<ChevronDown className="rap-collapsible__chevron" />}>
                      3 hidden
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 4 }}>
                    {["Cookie banner", "Old hero (v1)", "Launch countdown"].map((l) => (
                      <LayerRow key={l} name={l} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        },
        code: `<Collapsible>
  <CollapsibleTrigger asChild>
    <Button size="sm" variant="soft" icon={<ChevronDown className="rap-collapsible__chevron" />}>3 hidden</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`,
      },
    ],
  },

  /* ───────────── Carousel ───────────── */
  {
    slug: "carousel",
    name: "Carousel",
    group: "Layout",
    basedOn: "embla-carousel-react",
    description: "Swipeable slides with round prev/next buttons and a dot indicator. Drag, click or use the arrow keys. Delight: fling it — the slides lean with the speed and swing upright when they stop, and the dot pill crawls to its new place.",
    controls: carouselControls,
    Demo: ({ p }) => {
      const vertical = p.orientation === "vertical";
      const per = Number(p.perView);
      const basis = `${100 / per}%`;
      const controls = (
        <div
          className="doc-row"
          style={{
            gap: "var(--rap-gap-tight)",
            flexDirection: vertical ? "column" : "row",
            justifyContent: "space-between",
            flexWrap: "nowrap",
          }}
        >
          {p.dots && <CarouselDots style={vertical ? undefined : { marginRight: "auto" }} />}
          <div style={{ display: "flex", gap: "var(--rap-gap-tight)", flexDirection: vertical ? "column" : "row", order: vertical ? -1 : 0 }}>
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </div>
      );
      return (
        <div style={{ width: "100%", minWidth: 0, maxWidth: vertical ? "30rem" : "46rem" }}>
          <Carousel
            key={`${p.orientation}-${p.loop}-${per}`}
            orientation={p.orientation as "horizontal" | "vertical"}
            opts={{ loop: Boolean(p.loop), align: "start" }}
            style={vertical ? { height: 360 } : undefined}
            aria-label="Templates"
          >
            <CarouselContent>
              {TEMPLATES.map((t, i) => (
                <CarouselItem key={t.name} basis={basis}>
                  <Slide i={i} compact={per > 1 || vertical} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {controls}
          </Carousel>
        </div>
      );
    },
    code: (p) =>
      `import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from "rapui";

<Carousel${p.orientation !== "horizontal" ? ` orientation="${p.orientation}"` : ""}${
        p.loop ? " opts={{ loop: true }}" : ""
      }${p.orientation === "vertical" ? " style={{ height: 360 }}" : ""}>
  <CarouselContent>
    {templates.map((t) => (
      <CarouselItem key={t.id}${p.perView !== "1" ? ` basis="${(100 / Number(p.perView)).toFixed(4).replace(/\.?0+$/, "")}%"` : ""}>
        <TemplateCard {...t} />
      </CarouselItem>
    ))}
  </CarouselContent>${p.dots ? "\n  <CarouselDots />" : ""}
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
  },
];

