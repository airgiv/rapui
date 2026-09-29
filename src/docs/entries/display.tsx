import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Command, Plus, RefreshCw, Search, Upload } from "../../rapui/icons";
import {
  Alert,
  AspectRatio,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  chartAxisProps,
  chartGridProps,
  CircularProgress,
  createDataTableColumns,
  DataTable,
  EmptyState,
  FancyIcon,
  Input,
  Kbd,
  KbdGroup,
  Progress,
  Separator,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Spinner,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toaster,
  toast,
  type AlertVariant,
  type AvatarSize,
  type BadgeVariant,
  type ChartConfig,
  type ProgressTone,
} from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* ── shared demo bits ─────────────────────────────── */

/** Cards are white; the docs stage is white too, so show them on a paper backdrop. */
function Paper({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: "100%",
        padding: "clamp(1rem, 3vw, 2rem)",
        borderRadius: "var(--rap-radius)",
        background: "var(--rap-paper)",
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Gradient "photo" — external images are blocked, and gradients theme nicely. */
const gradient = (a: string, b: string, c = "var(--rap-paper-3)") =>
  ({
    width: "100%",
    height: "100%",
    background: `radial-gradient(120% 90% at 20% 15%, ${a} 0%, transparent 55%), radial-gradient(90% 80% at 85% 90%, ${b} 0%, transparent 60%), ${c}`,
  }) as CSSProperties;

/** A tiny inline SVG portrait, used as an avatar image. */
const portrait = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#0582ff"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><circle cx="40" cy="32" r="14" fill="#f5f5f5"/><path d="M14 80c2-16 13-24 26-24s24 8 26 24z" fill="#f5f5f5"/></svg>`,
)}`;

type Status = "Live" | "In review" | "Draft" | "Overdue" | "Paused";
const STATUS_BADGE: Record<Status, BadgeVariant> = {
  Live: "success",
  "In review": "blue",
  Draft: "neutral",
  Overdue: "danger",
  Paused: "warning",
};

interface Project {
  id: string;
  name: string;
  client: string;
  lead: string;
  status: Status;
  budget: number;
  updated: string; // ISO date
}

const PROJECTS: Project[] = [
  { id: "p1", name: "Spring lookbook", client: "Norrøna Knit", lead: "Mira Okafor", status: "Live", budget: 18400, updated: "2026-09-26" },
  { id: "p2", name: "Annual report 2026", client: "Halden Bank", lead: "Jonas Weber", status: "In review", budget: 42000, updated: "2026-09-28" },
  { id: "p3", name: "Gallery microsite", client: "Kunsthal Oost", lead: "Aiko Tanaka", status: "Draft", budget: 9600, updated: "2026-09-21" },
  { id: "p4", name: "Menu longread", client: "Brasa Lisboa", lead: "Rui Fonseca", status: "Overdue", budget: 5200, updated: "2026-09-12" },
  { id: "p5", name: "Brand book", client: "Tallow Candles", lead: "Mira Okafor", status: "Live", budget: 14800, updated: "2026-09-19" },
  { id: "p6", name: "Festival programme", client: "Kino Sever", lead: "Lena Morozova", status: "In review", budget: 23500, updated: "2026-09-27" },
  { id: "p7", name: "Product launch", client: "Orbit Audio", lead: "Sam Adeyemi", status: "Paused", budget: 31000, updated: "2026-08-30" },
  { id: "p8", name: "Recruiting page", client: "Field Studio", lead: "Aiko Tanaka", status: "Live", budget: 4200, updated: "2026-09-02" },
  { id: "p9", name: "Portfolio refresh", client: "Atelier Vogt", lead: "Jonas Weber", status: "Draft", budget: 7800, updated: "2026-09-24" },
  { id: "p10", name: "Impact report", client: "Green Rail", lead: "Lena Morozova", status: "Live", budget: 26900, updated: "2026-09-15" },
  { id: "p11", name: "Exhibition catalogue", client: "Kunsthal Oost", lead: "Rui Fonseca", status: "In review", budget: 12300, updated: "2026-09-25" },
  { id: "p12", name: "Holiday campaign", client: "Norrøna Knit", lead: "Sam Adeyemi", status: "Draft", budget: 16500, updated: "2026-09-29" },
  { id: "p13", name: "Podcast landing", client: "Orbit Audio", lead: "Mira Okafor", status: "Live", budget: 3900, updated: "2026-09-08" },
  { id: "p14", name: "Investor deck", client: "Halden Bank", lead: "Aiko Tanaka", status: "Overdue", budget: 8800, updated: "2026-09-10" },
  { id: "p15", name: "City guide", client: "Brasa Lisboa", lead: "Lena Morozova", status: "In review", budget: 11200, updated: "2026-09-23" },
  { id: "p16", name: "Type specimen", client: "Field Studio", lead: "Jonas Weber", status: "Live", budget: 6400, updated: "2026-09-18" },
];

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/* weekly published pages */
const WEEKS = [
  { week: "Jul 6", published: 42, drafts: 18 },
  { week: "Jul 13", published: 51, drafts: 22 },
  { week: "Jul 20", published: 47, drafts: 31 },
  { week: "Jul 27", published: 63, drafts: 26 },
  { week: "Aug 3", published: 58, drafts: 19 },
  { week: "Aug 10", published: 39, drafts: 14 },
  { week: "Aug 17", published: 44, drafts: 21 },
  { week: "Aug 24", published: 71, drafts: 35 },
  { week: "Aug 31", published: 86, drafts: 40 },
  { week: "Sep 7", published: 79, drafts: 33 },
  { week: "Sep 14", published: 94, drafts: 38 },
  { week: "Sep 21", published: 102, drafts: 44 },
];
const chartConfig: ChartConfig = {
  published: { label: "Published", color: "var(--rap-blue)" },
  drafts: { label: "Drafts", color: "var(--rap-flame)" },
};

/* ── controls ─────────────────────────────────────── */

const badgeControls: Control[] = [
  {
    type: "select",
    prop: "variant",
    options: ["neutral", "ink", "blue", "flame", "success", "warning", "danger", "outline"],
    default: "success",
    codeDefault: "neutral",
  },
  { type: "select", prop: "size", options: ["sm", "md"], default: "md" },
  { type: "boolean", prop: "dot", default: true, codeDefault: false },
  { type: "boolean", prop: "live", default: true, codeDefault: false },
  { type: "text", prop: "label", default: "Published" },
];

const avatarControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg", "xl"], default: "lg", codeDefault: "md" },
  { type: "text", prop: "name", default: "Mira Okafor", codeDefault: null },
  { type: "boolean", prop: "image", label: "with image", default: false },
  { type: "number", prop: "max", label: "group max", min: 2, max: 7, default: 4 },
];

const cardControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "pressable", default: true, codeDefault: false },
  { type: "boolean", prop: "footer", default: true },
  { type: "text", prop: "title", default: "Spring lookbook" },
];

const tableControls: Control[] = [
  { type: "boolean", prop: "caption", default: true },
  { type: "boolean", prop: "avatars", default: true },
];

const dataTableControls: Control[] = [
  { type: "boolean", prop: "selectable", default: true, codeDefault: false },
  { type: "boolean", prop: "columnToggle", label: "column menu", default: true, codeDefault: false },
  { type: "number", prop: "pageSize", label: "page size", min: 3, max: 10, default: 4, codeDefault: 5 },
  { type: "text", prop: "filterPlaceholder", label: "filter placeholder", default: "Filter projects", codeDefault: "Filter…" },
];

const skeletonControls: Control[] = [
  { type: "select", prop: "layout", options: ["card", "list", "block"], default: "card" },
  { type: "number", prop: "lines", min: 1, max: 6, default: 3 },
];

const progressControls: Control[] = [
  { type: "select", prop: "variant", options: ["bar", "circular"], default: "bar" },
  { type: "number", prop: "value", min: 0, max: 100, default: 64, codeDefault: null },
  { type: "select", prop: "tone", options: ["blue", "flame", "ink", "success"], default: "blue" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
];

const alertControls: Control[] = [
  { type: "select", prop: "variant", options: ["info", "success", "warning", "danger", "neutral"], default: "info" },
  { type: "text", prop: "title", default: "Custom domain is almost ready" },
  { type: "text", prop: "description", default: "DNS changes can take up to an hour. We’ll email you when studio.ooo goes live." },
  { type: "boolean", prop: "action", default: true },
  { type: "boolean", prop: "dismissible", default: true, codeDefault: false },
];

const separatorControls: Control[] = [
  { type: "select", prop: "orientation", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "text", prop: "label", default: "or" },
];

const aspectControls: Control[] = [
  { type: "select", prop: "ratio", options: ["16/9", "4/3", "1/1", "3/4", "21/9"], default: "16/9", codeDefault: null },
  { type: "select", prop: "radius", options: ["none", "sm", "md", "lg"], default: "md" },
];

const kbdControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md"], default: "md" },
  { type: "text", prop: "keys", label: "keys (space separated)", default: "⌘ Shift P" },
];

const toastControls: Control[] = [
  {
    type: "select",
    prop: "position",
    options: ["bottom-right", "bottom-center", "bottom-left", "top-right", "top-center", "top-left"],
    default: "bottom-right",
  },
  { type: "boolean", prop: "closeButton", label: "close button", default: false },
  { type: "boolean", prop: "expand", default: false },
];

const chartControls: Control[] = [
  { type: "select", prop: "type", options: ["area", "bar"], default: "area" },
  { type: "boolean", prop: "drafts", label: "drafts series", default: true },
  { type: "boolean", prop: "grid", default: true },
  { type: "boolean", prop: "legend", default: true },
];

const spinnerControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "lg", codeDefault: "md" },
  { type: "select", prop: "color", options: ["ink", "blue", "flame", "mute"], default: "ink" },
];

const emptyControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md"], default: "md" },
  { type: "text", prop: "title", default: "No projects yet" },
  { type: "text", prop: "description", default: "Start from a blank canvas or pick one of 40 templates made by the studio." },
  { type: "boolean", prop: "action", default: true },
];

/* ── DataTable columns ─────────────────────────────── */

const col = createDataTableColumns<Project>();
const projectColumns = col.columns([
  col.accessor("name", {
    header: "Project",
    cell: (c) => <span style={{ fontWeight: 500 }}>{c.getValue()}</span>,
  }),
  col.accessor("client", { header: "Client" }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => (
      <Badge variant={STATUS_BADGE[c.getValue()]} dot>
        {c.getValue()}
      </Badge>
    ),
  }),
  col.accessor("budget", {
    header: "Budget",
    meta: { align: "end" },
    enableGlobalFilter: false,
    cell: (c) => money(c.getValue()),
  }),
  col.accessor("updated", {
    header: "Updated",
    meta: { align: "end" },
    enableGlobalFilter: false,
    cell: (c) => <span style={{ color: "var(--rap-ink-2)" }}>{shortDate(c.getValue())}</span>,
  }),
]);

/* ── entries ──────────────────────────────────────── */

export const entries: DocEntry[] = [
  /* Badge */
  {
    slug: "badge",
    name: "Badge",
    group: "Data display",
    description:
      "Small pill for a status, a count or a tag. The label is centred on its cap height, so it sits dead centre in the pill. Delight: change what a badge says and it hops — press “+1 comment” — and a live dot breathes.",
    controls: badgeControls,
    Demo: function BadgeDemo({ p }) {
      const [n, setN] = useState(3);
      return (
        <div className="doc-stack" style={{ alignItems: "center", gap: "1.5rem" }}>
          <Badge variant={p.variant as BadgeVariant} size={p.size as "sm" | "md"} dot={Boolean(p.dot)} live={Boolean(p.live)}>
            {String(p.label)}
          </Badge>
          <div className="doc-row" style={{ justifyContent: "center" }}>
            <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>Comments</span>
            <Badge variant="flame" size="sm">
              {n}
            </Badge>
            <Button size="sm" variant="soft" icon={<Plus />} onClick={() => setN((x) => x + 1)}>
              1 comment
            </Button>
          </div>
        </div>
      );
    },
    code: (p) => `import { Badge } from "rapui";

<Badge${attrs(p, badgeControls, ["label"])}>${p.label}</Badge>`,
    examples: [
      {
        title: "Variants",
        Demo: () => (
          <div className="doc-row" style={{ justifyContent: "center" }}>
            <Badge>Draft</Badge>
            <Badge variant="ink">Pro</Badge>
            <Badge variant="blue">In review</Badge>
            <Badge variant="flame">New</Badge>
            <Badge variant="success">Published</Badge>
            <Badge variant="warning">Paused</Badge>
            <Badge variant="danger">Overdue</Badge>
            <Badge variant="outline">Template</Badge>
          </div>
        ),
        code: `<Badge>Draft</Badge>
<Badge variant="ink">Pro</Badge>
<Badge variant="blue">In review</Badge>
<Badge variant="flame">New</Badge>
<Badge variant="success">Published</Badge>
<Badge variant="warning">Paused</Badge>
<Badge variant="danger">Overdue</Badge>
<Badge variant="outline">Template</Badge>`,
      },
      {
        title: "Status with dot",
        Demo: () => (
          <div className="doc-row" style={{ justifyContent: "center" }}>
            <Badge variant="success" live>Live</Badge>
            <Badge variant="warning" dot>Syncing</Badge>
            <Badge variant="danger" dot>Build failed</Badge>
            <Badge dot>Offline</Badge>
            <Badge variant="outline" dot size="sm">12 pages</Badge>
          </div>
        ),
        code: `<Badge variant="success" live>Live</Badge>
<Badge variant="danger" dot>Build failed</Badge>
<Badge variant="outline" dot size="sm">12 pages</Badge>`,
      },
    ],
  },

  /* Avatar */
  {
    slug: "avatar",
    name: "Avatar",
    group: "Data display",
    basedOn: "Radix Avatar",
    description:
      "Round picture of a person or team. Without an image it shows initials on a colour chosen from the name, so the same person always gets the same colour. Delight: point at a group and the stack fans out like a hand of cards; the face under the pointer lifts.",
    controls: avatarControls,
    Demo: ({ p }) => {
      const size = p.size as AvatarSize;
      const team = ["Mira Okafor", "Jonas Weber", "Aiko Tanaka", "Rui Fonseca", "Lena Morozova", "Sam Adeyemi", "Noor Haddad"];
      return (
        <div className="doc-stack" style={{ alignItems: "center", gap: "2rem" }}>
          <div className="doc-row">
            <Avatar size={size} name={String(p.name)} src={p.image ? portrait : undefined} />
            <div className="doc-stack" style={{ gap: 2 }}>
              <span style={{ fontWeight: 500 }}>{String(p.name) || "Unnamed"}</span>
              <span className="doc-muted" style={{ fontSize: "0.875rem" }}>Art director</span>
            </div>
          </div>
          <AvatarGroup size={size} max={Number(p.max)} ring="surface">
            {team.map((n) => (
              <Avatar key={n} name={n} />
            ))}
          </AvatarGroup>
        </div>
      );
    },
    code: (p) => `import { Avatar, AvatarGroup } from "rapui";

<Avatar${attrs(p, avatarControls, ["image", "max"])}${p.image ? ' src="/team/mira.jpg"' : ""} />

<AvatarGroup max={${p.max}}${p.size !== "md" ? ` size="${p.size}"` : ""}>
  <Avatar name="Mira Okafor" />
  <Avatar name="Jonas Weber" />
  <Avatar name="Aiko Tanaka" />
  …
</AvatarGroup>`,
    examples: [
      {
        title: "Sizes",
        Demo: () => (
          <div className="doc-row" style={{ alignItems: "flex-end" }}>
            <Avatar size="sm" name="Noor Haddad" />
            <Avatar size="md" name="Rui Fonseca" />
            <Avatar size="lg" name="Aiko Tanaka" />
            <Avatar size="xl" name="Jonas Weber" src={portrait} />
          </div>
        ),
        code: `<Avatar size="sm" name="Noor Haddad" />
<Avatar size="md" name="Rui Fonseca" />
<Avatar size="lg" name="Aiko Tanaka" />
<Avatar size="xl" name="Jonas Weber" src="/team/jonas.jpg" />`,
      },
    ],
  },

  /* Card */
  {
    slug: "card",
    name: "Card",
    group: "Data display",
    description:
      "A white surface with the big 28px radius for grouping related content. No border and no shadow: it sits on the grey paper. Delight: a pressable card (or one with onClick) gives under your finger like card stock — press near a corner and that corner dips, then it springs back.",
    controls: cardControls,
    Demo: ({ p }) => (
      <Paper>
        <Card size={p.size as "sm" | "md" | "lg"} pressable={Boolean(p.pressable)} style={{ width: "min(100%, 24rem)" }}>
          <AspectRatio ratio={16 / 9} radius="sm">
            <div style={gradient("var(--rap-bubble)", "var(--rap-flame)")} />
          </AspectRatio>
          <CardHeader>
            <div className="doc-row doc-between">
              <CardTitle>{String(p.title)}</CardTitle>
              <Badge variant="success" dot size="sm">
                Live
              </Badge>
            </div>
            <CardDescription>Norrøna Knit · 14 pages · edited by Mira 2 hours ago</CardDescription>
          </CardHeader>
          {p.footer && (
            <CardFooter>
              <ButtonGroup>
                <Button size="sm">Open editor</Button>
                <Button size="sm" variant="soft">
                  Share
                </Button>
              </ButtonGroup>
            </CardFooter>
          )}
        </Card>
      </Paper>
    ),
    code: (p) => `import { Card, CardHeader, CardTitle, CardDescription, CardFooter, Button, ButtonGroup } from "rapui";

<Card${attrs(p, cardControls, ["footer", "title", "pressable"])}${p.pressable ? " onClick={openProject}" : ""}>
  <CardHeader>
    <CardTitle>${p.title}</CardTitle>
    <CardDescription>Norrøna Knit · 14 pages · edited by Mira 2 hours ago</CardDescription>
  </CardHeader>${
      p.footer
        ? `
  <CardFooter>
    <ButtonGroup>
      <Button size="sm">Open editor</Button>
      <Button size="sm" variant="soft">Share</Button>
    </ButtonGroup>
  </CardFooter>`
        : ""
    }
</Card>`,
    examples: [
      {
        title: "Dashboard stats",
        Demo: () => (
          <Paper>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "var(--rap-gap-tile)", width: "100%" }}>
              {[
                { label: "Page views", value: "182,430", delta: "+12.4%", tone: "success" as const, progress: 72 },
                { label: "Published pages", value: "1,024", delta: "+38", tone: "blue" as const, progress: 54 },
                { label: "Bounce rate", value: "31.8%", delta: "−2.1%", tone: "success" as const, progress: 32 },
              ].map((s) => (
                <Card key={s.label} size="sm">
                  <CardHeader>
                    <div className="doc-row doc-between">
                      <CardDescription>{s.label}</CardDescription>
                      <ArrowUpRight size={18} style={{ color: "var(--rap-mute)" }} />
                    </div>
                  </CardHeader>
                  <CardContent className="doc-stack" style={{ gap: "0.75rem" }}>
                    <div className="doc-row" style={{ alignItems: "baseline", gap: "0.5rem" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</span>
                      <Badge variant={s.tone} size="sm">
                        {s.delta}
                      </Badge>
                    </div>
                    <Progress value={s.progress} size="sm" tone={s.tone === "blue" ? "blue" : "success"} aria-label={`${s.label} vs goal`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </Paper>
        ),
        code: `<Card size="sm">
  <CardHeader>
    <CardDescription>Page views</CardDescription>
  </CardHeader>
  <CardContent>
    <span className="stat">182,430</span> <Badge variant="success" size="sm">+12.4%</Badge>
    <Progress value={72} size="sm" tone="success" />
  </CardContent>
</Card>`,
      },
    ],
  },

  /* Table */
  {
    slug: "table",
    name: "Table",
    group: "Data display",
    description:
      "Plain semantic table with hairline rows, a soft rounded hover and tabular figures. For sorting, filtering and paging use Data table. Delight: one highlight glides from row to row as you move down the table, and when rows change order (press “Sort by amount”) each one travels to its new place on a spring.",
    controls: tableControls,
    Demo: function TableDemo({ p }) {
      const [byAmount, setByAmount] = useState(false);
      const rows = PROJECTS.slice(0, 5);
      const shown = byAmount ? [...rows].sort((a, b) => b.budget - a.budget) : rows;
      return (
        <div className="doc-stack" style={{ width: "100%", gap: "1rem" }}>
          <div className="doc-row">
            <Button size="sm" variant="soft" onClick={() => setByAmount((x) => !x)}>
              {byAmount ? "Original order" : "Sort by amount"}
            </Button>
          </div>
          <Table>
            {p.caption && <TableCaption>Invoices sent in September 2026.</TableCaption>}
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead data-align="end">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{r.client}</div>
                    <div className="doc-muted" style={{ fontSize: "0.8125rem" }}>{r.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="doc-row" style={{ gap: "0.6rem", flexWrap: "nowrap" }}>
                      {p.avatars && <Avatar size="sm" name={r.lead} />}
                      {r.lead}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[r.status]} dot>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell data-align="end">{money(r.budget)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    },
    code: (p) => `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, Badge${
      p.avatars ? ", Avatar" : ""
    } } from "rapui";

<Table>${p.caption ? "\n  <TableCaption>Invoices sent in September 2026.</TableCaption>" : ""}
  <TableHeader>
    <TableRow>
      <TableHead>Client</TableHead>
      <TableHead>Lead</TableHead>
      <TableHead>Status</TableHead>
      <TableHead data-align="end">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Norrøna Knit</TableCell>
      <TableCell>${p.avatars ? '<Avatar size="sm" name="Mira Okafor" /> ' : ""}Mira Okafor</TableCell>
      <TableCell><Badge variant="success" dot>Live</Badge></TableCell>
      <TableCell data-align="end">€18,400</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
  },

  /* DataTable */
  {
    slug: "data-table",
    name: "Data table",
    group: "Data display",
    basedOn: "TanStack Table v9",
    description:
      "Table with sorting, a quick filter, row selection and paging. Click a column header to sort; the arrow shows the direction. Delight: sort by Budget and watch every row travel to its new place; type in the filter and the survivors slide up to close the gaps; one highlight glides between rows under the pointer.",
    controls: dataTableControls,
    Demo: ({ p }) => (
      <div style={{ width: "100%", alignSelf: "start" }}>
        <DataTable
          key={`${p.pageSize}-${p.selectable}`}
          data={PROJECTS}
          columns={projectColumns}
          getRowId={(r) => r.id}
          selectable={Boolean(p.selectable)}
          columnToggle={Boolean(p.columnToggle)}
          pageSize={Number(p.pageSize)}
          filterPlaceholder={String(p.filterPlaceholder)}
          actions={
            <Button size="sm" variant="solid" icon={<Plus />}>
              New project
            </Button>
          }
        />
      </div>
    ),
    code: (p) => `import { DataTable, createDataTableColumns, Badge } from "rapui";

const col = createDataTableColumns<Project>();
const columns = col.columns([
  col.accessor("name", { header: "Project" }),
  col.accessor("client", { header: "Client" }),
  col.accessor("status", {
    header: "Status",
    cell: (c) => <Badge variant={toVariant(c.getValue())} dot>{c.getValue()}</Badge>,
  }),
  col.accessor("budget", { header: "Budget", meta: { align: "end" }, cell: (c) => money(c.getValue()) }),
  col.accessor("updated", { header: "Updated", meta: { align: "end" } }),
]);

<DataTable data={projects} columns={columns} getRowId={(r) => r.id}${attrs(p, dataTableControls)} />`,
  },

  /* AspectRatio */
  {
    slug: "aspect-ratio",
    name: "Aspect ratio",
    group: "Data display",
    basedOn: "Radix AspectRatio",
    description: "Holds an image, video or embed at a fixed ratio as the width changes. Rounded and clipped by default.",
    controls: aspectControls,
    Demo: ({ p }) => {
      const [w, h] = String(p.ratio).split("/").map(Number);
      return (
        <div style={{ width: w / h < 1 ? "min(100%, 16rem)" : "min(100%, 30rem)" }}>
          <AspectRatio ratio={w / h} radius={p.radius as "none" | "sm" | "md" | "lg"}>
            <div style={gradient("var(--rap-sky)", "var(--rap-blue)")} role="img" aria-label="Cover of the Kunsthal Oost microsite" />
          </AspectRatio>
        </div>
      );
    },
    code: (p) => `import { AspectRatio } from "rapui";

<AspectRatio${attrs(p, aspectControls, ["ratio"])} ratio={${p.ratio}}>
  <img src="/covers/kunsthal.jpg" alt="Cover of the Kunsthal Oost microsite" />
</AspectRatio>`,
    examples: [
      {
        title: "Template grid",
        Demo: () => (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "var(--rap-gap-tile)", width: "100%" }}>
            {[
              ["Lookbook", "var(--rap-bubble)", "var(--rap-plum)"],
              ["Longread", "var(--rap-acid)", "var(--rap-sky)"],
              ["Portfolio", "var(--rap-flame)", "var(--rap-bubble)"],
              ["Report", "var(--rap-sky)", "var(--rap-blue)"],
            ].map(([name, a, b]) => (
              <figure key={name} style={{ margin: 0, display: "grid", gap: "0.5rem" }}>
                <AspectRatio ratio={3 / 4}>
                  <div style={gradient(a, b)} />
                </AspectRatio>
                <figcaption style={{ fontSize: "0.875rem", fontWeight: 500 }}>{name}</figcaption>
              </figure>
            ))}
          </div>
        ),
        code: `<AspectRatio ratio={3 / 4}>
  <img src="/templates/lookbook.jpg" alt="" />
</AspectRatio>`,
      },
    ],
  },

  /* Kbd */
  {
    slug: "kbd",
    name: "Kbd",
    group: "Data display",
    description:
      "A keyboard key for shortcuts in menus, tooltips and help text. Group keys to show a chord. Delight: press the real key on your keyboard — try ⌘, Shift or K — and every cap showing it goes down with you.",
    controls: kbdControls,
    Demo: ({ p }) => {
      const keys = String(p.keys).split(/\s+/).filter(Boolean);
      const size = p.size as "sm" | "md";
      return (
        <div className="doc-stack" style={{ alignItems: "center", gap: "1.5rem" }}>
          <KbdGroup>
            {keys.map((k, i) => (
              <Kbd key={i} size={size}>
                {k}
              </Kbd>
            ))}
          </KbdGroup>
          <p className="doc-muted" style={{ margin: 0, fontSize: "0.9375rem" }}>
            Press{" "}
            <KbdGroup>
              <Kbd size={size}>⌘</Kbd>
              <Kbd size={size}>K</Kbd>
            </KbdGroup>{" "}
            to search every page in the project.
          </p>
        </div>
      );
    },
    code: (p) => {
      const keys = String(p.keys).split(/\s+/).filter(Boolean);
      const a = attrs(p, kbdControls, ["keys"]);
      return `import { Kbd, KbdGroup } from "rapui";

<KbdGroup>
${keys.map((k) => `  <Kbd${a}>${k}</Kbd>`).join("\n")}
</KbdGroup>`;
    },
    examples: [
      {
        title: "In a search field",
        Demo: () => (
          <div style={{ width: "min(100%, 22rem)" }}>
            <Input
              placeholder="Search projects"
              prefix={<Search />}
              suffix={
                <KbdGroup>
                  <Kbd size="sm" keyName="Meta">
                    <Command />
                  </Kbd>
                  <Kbd size="sm">K</Kbd>
                </KbdGroup>
              }
            />
          </div>
        ),
        code: `<Input
  placeholder="Search projects"
  prefix={<Search />}
  suffix={
    <KbdGroup>
      <Kbd size="sm" keyName="Meta"><Command /></Kbd>
      <Kbd size="sm">K</Kbd>
    </KbdGroup>
  }
/>`,
      },
    ],
  },

  /* Chart */
  {
    slug: "chart",
    name: "Chart",
    group: "Data display",
    basedOn: "Recharts 3",
    description:
      "A themed wrapper for Recharts. Series colours come from CSS variables, so charts follow the theme; grid, ticks and tooltip use rap/ui tokens. Delight: lines are drawn in by a pen and bars grow out of the baseline one after another with a springy overshoot — press “Replay”, switch the type or toggle a series.",
    controls: chartControls,
    Demo: function ChartDemo({ p }) {
      const [take, setTake] = useState(0);
      const config: ChartConfig = p.drafts ? chartConfig : { published: chartConfig.published };
      const tooltip = <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => `${v} pages`} />} />;
      return (
        <div className="doc-stack" style={{ width: "100%", gap: "1.25rem" }}>
          <div className="doc-row doc-between">
            <div className="doc-stack" style={{ gap: 2 }}>
              <span style={{ fontWeight: 500 }}>Weekly published pages</span>
              <span className="doc-muted" style={{ fontSize: "0.875rem" }}>Jul 6 – Sep 27, all workspaces</span>
            </div>
            <Button size="sm" variant="soft" icon={<RefreshCw />} onClick={() => setTake((t) => t + 1)}>
              Replay
            </Button>
          </div>
          <ChartContainer key={take} config={config} height={260}>
            {p.type === "bar" ? (
              <BarChart data={WEEKS} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barGap={2}>
                {p.grid && <CartesianGrid {...chartGridProps} />}
                <XAxis dataKey="week" {...chartAxisProps} interval="preserveStartEnd" minTickGap={16} />
                <YAxis {...chartAxisProps} width={48} />
                {tooltip}
                <Bar dataKey="published" fill="var(--color-published)" radius={[8, 8, 8, 8]} maxBarSize={22} />
                {p.drafts && <Bar dataKey="drafts" fill="var(--color-drafts)" radius={[8, 8, 8, 8]} maxBarSize={22} />}
              </BarChart>
            ) : (
              <AreaChart data={WEEKS} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-published" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-published)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-published)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fill-drafts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-drafts)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-drafts)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {p.grid && <CartesianGrid {...chartGridProps} />}
                <XAxis dataKey="week" {...chartAxisProps} interval="preserveStartEnd" minTickGap={16} />
                <YAxis {...chartAxisProps} width={48} />
                {tooltip}
                <Area
                  type="monotone"
                  dataKey="published"
                  stroke="var(--color-published)"
                  strokeWidth={2.5}
                  fill="url(#fill-published)"
                />
                {p.drafts && (
                  <Area type="monotone" dataKey="drafts" stroke="var(--color-drafts)" strokeWidth={2.5} fill="url(#fill-drafts)" />
                )}
              </AreaChart>
            )}
          </ChartContainer>
          {p.legend && <ChartLegend config={config} />}
        </div>
      );
    },
    code: (p) => {
      const Chart = p.type === "bar" ? "BarChart" : "AreaChart";
      const series = (key: string) =>
        p.type === "bar"
          ? `    <Bar dataKey="${key}" fill="var(--color-${key})" radius={8} />`
          : `    <Area dataKey="${key}" type="monotone" stroke="var(--color-${key})" fill="var(--color-${key})" fillOpacity={0.15} />`;
      return `import { ${Chart}, ${p.type === "bar" ? "Bar" : "Area"}, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, chartAxisProps, chartGridProps${
        p.legend ? ", ChartLegend" : ""
      }, type ChartConfig } from "rapui";

const config = {
  published: { label: "Published", color: "var(--rap-blue)" },${p.drafts ? `\n  drafts: { label: "Drafts", color: "var(--rap-flame)" },` : ""}
} satisfies ChartConfig;

<ChartContainer config={config} height={260}>
  <${Chart} data={weeks}>${p.grid ? "\n    <CartesianGrid {...chartGridProps} />" : ""}
    <XAxis dataKey="week" {...chartAxisProps} />
    <YAxis {...chartAxisProps} />
    <ChartTooltip content={<ChartTooltipContent />} />
${series("published")}${p.drafts ? `\n${series("drafts")}` : ""}
  </${Chart}>
</ChartContainer>${p.legend ? "\n<ChartLegend config={config} />" : ""}`;
    },
  },

  /* Separator */
  {
    slug: "separator",
    name: "Separator",
    group: "Data display",
    basedOn: "Radix Separator",
    description:
      "A hairline between groups of content, horizontal or vertical. A horizontal one can carry a short label in the middle. Delight: the first time it scrolls into view the rule draws itself from the centre out to both ends — press “Replay”.",
    controls: separatorControls,
    Demo: function SeparatorDemo({ p }) {
      const [take, setTake] = useState(0);
      const replay = (
        <Button size="sm" variant="ghost" icon={<RefreshCw />} onClick={() => setTake((t) => t + 1)}>
          Replay
        </Button>
      );
      return p.orientation === "vertical" ? (
        <div className="doc-stack" style={{ alignItems: "center", gap: "1.5rem" }}>
          <div className="doc-row" style={{ height: 24, gap: "1rem", fontSize: "0.9375rem" }}>
            <span>Pages</span>
            <Separator key={`a${take}`} orientation="vertical" />
            <span>Assets</span>
            <Separator key={`b${take}`} orientation="vertical" />
            <span>Settings</span>
          </div>
          {replay}
        </div>
      ) : (
        <div className="doc-stack" style={{ width: "min(100%, 22rem)", gap: "1.25rem" }}>
          <Button variant="solid" style={{ width: "100%" }}>
            Continue with email
          </Button>
          <Separator key={take} label={String(p.label) || undefined} />
          <Button variant="soft" style={{ width: "100%" }}>
            Continue with SSO
          </Button>
          <div style={{ display: "grid", placeItems: "center" }}>{replay}</div>
        </div>
      );
    },
    code: (p) =>
      p.orientation === "vertical"
        ? `import { Separator } from "rapui";

<span>Pages</span>
<Separator orientation="vertical" />
<span>Assets</span>`
        : `import { Separator } from "rapui";

<Separator${p.label ? ` label="${p.label}"` : ""} />`,
  },

  /* EmptyState */
  {
    slug: "empty-state",
    name: "Empty state",
    group: "Data display",
    description:
      "What a list or page shows before it has anything in it: an icon, one line on why it’s empty, and a way forward. Delight: the illustration floats over its own shadow, and after a pause the first action wiggles once to point the way.",
    controls: emptyControls,
    Demo: function EmptyDemo({ p }) {
      const [take, setTake] = useState(0);
      return (
        <div className="doc-stack" style={{ alignItems: "center", width: "100%" }}>
          <EmptyState
            key={take}
            size={p.size as "sm" | "md"}
            icon={<FancyIcon icon="folder" tone="blue" size={p.size === "sm" ? 28 : 38} />}
            title={String(p.title)}
            description={String(p.description)}
            action={
              p.action ? (
                <ButtonGroup>
                  <Button size="sm" icon={<Plus />}>
                    New project
                  </Button>
                  <Button size="sm" variant="soft">
                    Browse templates
                  </Button>
                </ButtonGroup>
              ) : undefined
            }
          />
          <Button size="sm" variant="ghost" icon={<RefreshCw />} onClick={() => setTake((t) => t + 1)}>
            Replay
          </Button>
        </div>
      );
    },
    code: (p) => `import { EmptyState, FancyIcon, Button } from "rapui";

<EmptyState${attrs(p, emptyControls, ["title", "description", "action"])}
  icon={<FancyIcon icon="folder" tone="blue" size={38} />}
  title="${p.title}"
  description="${p.description}"${
      p.action
        ? `
  action={<Button size="sm" icon={<Plus />}>New project</Button>}`
        : ""
    }
/>`,
    examples: [
      {
        title: "Inside a table",
        Demo: () => (
          <div style={{ width: "100%" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead data-align="end">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3}>
                    <EmptyState
                      size="sm"
                      icon={<FancyIcon icon="inbox" tone="flame" size={28} />}
                      title="No submissions"
                      description="Share the page to start collecting replies."
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ),
        code: `<TableCell colSpan={3}>
  <EmptyState size="sm" icon={<FancyIcon icon="inbox" tone="flame" size={28} />} title="No submissions" description="Share the page to start collecting replies." />
</TableCell>`,
      },
    ],
  },

  /* ── Feedback ── */

  /* Alert */
  {
    slug: "alert",
    name: "Alert",
    group: "Feedback",
    description:
      "An inline message on a tinted fill: info, success, warning, danger or neutral. Use it for things the reader should notice without being interrupted. Delight: dismiss it with the × and it comes unpinned at one corner, swings, and falls off the page while the layout closes up at once.",
    controls: alertControls,
    Demo: ({ p }) => {
      const [open, setOpen] = useState(true);
      useEffect(() => setOpen(true), [p.dismissible, p.variant]);
      return (
        <div style={{ width: "min(100%, 36rem)" }}>
          {open ? (
            <Alert
              variant={p.variant as AlertVariant}
              title={String(p.title) || undefined}
              action={p.action ? <Button size="sm" variant="soft">Check DNS</Button> : undefined}
              onDismiss={p.dismissible ? () => setOpen(false) : undefined}
            >
              {String(p.description) || undefined}
            </Alert>
          ) : (
            <Button size="sm" variant="soft" onClick={() => setOpen(true)}>
              Show again
            </Button>
          )}
        </div>
      );
    },
    code: (p) => `import { Alert, Button } from "rapui";

<Alert${attrs(p, alertControls, ["title", "description", "action", "dismissible"])}
  title="${p.title}"${p.action ? `\n  action={<Button size="sm" variant="soft">Check DNS</Button>}` : ""}${
      p.dismissible ? "\n  onDismiss={() => setOpen(false)}" : ""
    }
>
  ${p.description}
</Alert>`,
    examples: [
      {
        title: "All variants",
        Demo: () => (
          <div className="doc-stack" style={{ width: "min(100%, 36rem)", gap: "var(--rap-gap-tile)" }}>
            <Alert variant="info" title="New: version history">Every publish is saved. Roll back from the page menu.</Alert>
            <Alert variant="success" title="Published">“Spring lookbook” is live at norrona.studio/spring.</Alert>
            <Alert variant="warning" title="Storage 92% full">Remove unused videos or upgrade the workspace.</Alert>
            <Alert variant="danger" title="Payment failed">We couldn’t charge the card ending 4242. Update it to keep custom domains.</Alert>
            <Alert variant="neutral">Autosaved 12 seconds ago.</Alert>
          </div>
        ),
        code: `<Alert variant="success" title="Published">“Spring lookbook” is live.</Alert>
<Alert variant="warning" title="Storage 92% full">Remove unused videos or upgrade.</Alert>
<Alert variant="danger" title="Payment failed">Update the card to keep custom domains.</Alert>
<Alert variant="neutral">Autosaved 12 seconds ago.</Alert>`,
      },
    ],
  },

  /* Toast */
  {
    slug: "toast",
    name: "Toast",
    group: "Feedback",
    basedOn: "Sonner",
    description:
      "Short-lived notifications that stack in a corner. Mount one Toaster, then call toast() from anywhere — success, error, promise and action toasts included. Delight: each toast is slapped down like a sticker with its own small tilt, so a few quick ones make a pile; swipe one away and it flings off spinning.",
    controls: toastControls,
    Demo: ({ p }) => (
      <>
        <Toaster
          position={p.position as "bottom-right"}
          closeButton={Boolean(p.closeButton)}
          expand={Boolean(p.expand)}
        />
        <div className="doc-row" style={{ justifyContent: "center" }}>
          <Button size="sm" variant="soft" onClick={() => toast.success("Page published", { description: "norrona.studio/spring is live." })}>
            Success
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() => toast.error("Couldn’t connect domain", { description: "The CNAME record points somewhere else." })}
          >
            Error
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
                loading: "Exporting 14 pages…",
                success: "Export ready — lookbook.pdf",
                error: "Export failed",
              })
            }
          >
            Promise
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              toast("Project moved to trash", {
                description: "Spring lookbook",
                action: { label: "Undo", onClick: () => toast.success("Restored") },
              })
            }
          >
            With action
          </Button>
        </div>
      </>
    ),
    code: (p) => `import { Toaster, toast } from "rapui";

// once, near the root
<Toaster${attrs(p, toastControls)} />

toast.success("Page published", { description: "norrona.studio/spring is live." });
toast.error("Couldn’t connect domain");
toast.promise(exportPdf(), {
  loading: "Exporting 14 pages…",
  success: "Export ready — lookbook.pdf",
  error: "Export failed",
});
toast("Project moved to trash", { action: { label: "Undo", onClick: restore } });`,
  },

  /* Progress */
  {
    slug: "progress",
    name: "Progress",
    group: "Feedback",
    basedOn: "Radix Progress",
    description:
      "Shows how far along a task is: an 8px pill bar that eases to each new value, or a ring with the number in the middle. Delight: the fill runs like liquid — its head stretches into a nose while it moves and rounds up when it stops — and when it hits 100 it splats against the end. Try “Jump” and “Finish”.",
    controls: progressControls,
    Demo: function ProgressDemo({ p }) {
      const [own, setOwn] = useState<number | null>(null);
      useEffect(() => setOwn(null), [p.value]);
      const v = own ?? Number(p.value);
      const buttons = (
        <div className="doc-row" style={{ justifyContent: "center" }}>
          <Button size="sm" variant="soft" onClick={() => setOwn(v >= 90 ? 12 : Math.min(100, v + 35))}>
            Jump
          </Button>
          <Button size="sm" variant="soft" onClick={() => setOwn(100)}>
            Finish
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOwn(0)}>
            Reset
          </Button>
        </div>
      );
      const tone = p.tone as ProgressTone;
      if (p.variant === "circular") {
        const d = p.size === "sm" ? 64 : p.size === "lg" ? 120 : 88;
        return (
          <div className="doc-stack" style={{ alignItems: "center", gap: "1.5rem" }}>
            <CircularProgress value={v} tone={tone} size={d} thickness={p.size === "lg" ? 10 : 8} aria-label="Upload" />
            {buttons}
          </div>
        );
      }
      return (
        <div className="doc-stack" style={{ width: "min(100%, 24rem)", gap: "0.6rem" }}>
          <div className="doc-row doc-between" style={{ fontSize: "0.9375rem" }}>
            <span style={{ fontWeight: 500 }}>Uploading showreel.mp4</span>
            <span className="doc-muted" style={{ fontVariantNumeric: "tabular-nums" }}>{v}%</span>
          </div>
          <Progress value={v} tone={tone} size={p.size as "sm" | "md" | "lg"} aria-label="Upload" />
          <div style={{ marginTop: "1rem" }}>{buttons}</div>
        </div>
      );
    },
    code: (p) =>
      p.variant === "circular"
        ? `import { CircularProgress } from "rapui";

<CircularProgress value={${p.value}}${p.tone !== "blue" ? ` tone="${p.tone}"` : ""}${
            p.size === "sm" ? " size={64}" : p.size === "lg" ? " size={120} thickness={10}" : ""
          } />`
        : `import { Progress } from "rapui";

<Progress${attrs(p, progressControls, ["variant"])} />`,
    examples: [
      {
        title: "Live upload",
        Demo: function LiveUpload() {
          const [v, setV] = useState(8);
          useEffect(() => {
            const t = setInterval(() => setV((x) => (x >= 100 ? 8 : Math.min(100, x + 9 + Math.round(Math.random() * 10)))), 900);
            return () => clearInterval(t);
          }, []);
          return (
            <div className="doc-row" style={{ width: "min(100%, 30rem)", gap: "1.5rem", flexWrap: "nowrap" }}>
              <CircularProgress value={v} size={64} tone="flame" />
              <div className="doc-stack" style={{ flex: 1, gap: "0.6rem" }}>
                <div className="doc-row doc-between" style={{ fontSize: "0.9375rem" }}>
                  <span style={{ fontWeight: 500 }}>
                    <Upload size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                    {v >= 100 ? "Uploaded" : "Uploading 12 images"}
                  </span>
                  <span className="doc-muted">{Math.round((v / 100) * 12)} / 12</span>
                </div>
                <Progress value={v} tone="flame" aria-label="Upload" />
              </div>
            </div>
          );
        },
        code: `<CircularProgress value={value} size={64} tone="flame" />
<Progress value={value} tone="flame" />`,
      },
      {
        title: "Indeterminate",
        Demo: () => (
          <div style={{ width: "min(100%, 24rem)" }}>
            <Progress value={null} aria-label="Preparing preview" />
          </div>
        ),
        code: `<Progress value={null} />`,
      },
    ],
  },

  /* Skeleton */
  {
    slug: "skeleton",
    name: "Skeleton",
    group: "Feedback",
    description:
      "Placeholders in the shape of what’s loading: rounded blocks, pill text lines and circles for avatars. Delight: one soft diagonal light sweeps the whole layout — every block shows its slice of the same beam, like window light passing over a table.",
    controls: skeletonControls,
    Demo: ({ p }) => {
      const lines = Number(p.lines);
      if (p.layout === "list")
        return (
          <div className="doc-stack" style={{ width: "min(100%, 24rem)", gap: "1rem" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="doc-row" style={{ flexWrap: "nowrap" }}>
                <SkeletonCircle size={40} />
                <SkeletonText lines={Math.min(lines, 2)} style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        );
      if (p.layout === "block") return <Skeleton width="min(100%, 24rem)" height={160} />;
      return (
        <div className="doc-stack" style={{ width: "min(100%, 20rem)", gap: "1rem" }}>
          <Skeleton height={150} style={{ borderRadius: 20 }} />
          <div className="doc-row" style={{ flexWrap: "nowrap" }}>
            <SkeletonCircle size={32} />
            <Skeleton shape="pill" height={12} width="40%" />
          </div>
          <SkeletonText lines={lines} />
        </div>
      );
    },
    code: (p) => `import { Skeleton, SkeletonCircle, SkeletonText } from "rapui";

${
  p.layout === "block"
    ? `<Skeleton height={160} />`
    : p.layout === "list"
      ? `<SkeletonCircle size={40} />
<SkeletonText lines={${Math.min(Number(p.lines), 2)}} />`
      : `<Skeleton height={150} />
<SkeletonCircle size={32} />
<SkeletonText lines={${p.lines}} />`
}`,
  },

  /* Spinner */
  {
    slug: "spinner",
    name: "Spinner",
    group: "Feedback",
    description:
      "A small spinner for short waits. It takes the current text colour, so it fits inside buttons and badges. Delight: a squishy ball runs laps — it speeds up and slows down, and stretches along its path when it’s fast.",
    controls: spinnerControls,
    Demo: ({ p }) => {
      const color = { ink: "var(--rap-ink)", blue: "var(--rap-blue)", flame: "var(--rap-flame)", mute: "var(--rap-mute)" }[String(p.color)];
      return (
        <div className="doc-stack" style={{ alignItems: "center", gap: "2rem" }}>
          <span style={{ color }}>
            <Spinner size={p.size as "sm" | "md" | "lg"} />
          </span>
          <div className="doc-row">
            <Button size="sm" variant="blue" icon={<Spinner size="sm" />} disabled>
              Publishing
            </Button>
            <Badge variant="outline">
              <span className="doc-row" style={{ gap: "0.4em", flexWrap: "nowrap" }}>
                <Spinner size={12} /> Syncing
              </span>
            </Badge>
          </div>
        </div>
      );
    },
    code: (p) => `import { Spinner } from "rapui";

<span style={{ color: "var(--rap-${p.color})" }}>
  <Spinner${attrs(p, spinnerControls, ["color"])} />
</span>

<Button icon={<Spinner size="sm" />} disabled>Publishing</Button>`,
  },
];
