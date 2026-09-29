import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Search } from "../rapui/icons";
import {
  Display,
  Input,
  Select,
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "../rapui";
import { ENTRIES } from "../docs/registry";
import { defaults } from "../docs/codegen";
import { GROUPS, type Control, type DocEntry, type Props } from "../docs/types";
import { Code } from "./Code";
import { Wordmark } from "./Wordmark";
import { SMALL_SWITCH, SoundControls } from "./SoundControls";
import { cn } from "../rapui/utils";
import type { SoundSettings } from "../rapui";
import "./docs.css";

/* ── settings panel ─────────────────────────────────────────── */

const CTL = "flex flex-col gap-[0.45rem]";
const CTL_LABEL = "flex justify-between text-[0.8125rem] font-medium text-mute";
/* the demo stage: a white card the component sits in the middle of */
const STAGE = "relative grid place-items-center min-h-[22rem] p-[clamp(1.5rem,4vw,3rem)] rounded-card bg-surface overflow-hidden";

function ControlField({ c, value, onChange }: { c: Control; value: Props[string]; onChange: (v: Props[string]) => void }) {
  const label = c.label ?? c.prop;
  const id = `ctl-${c.prop}`;
  switch (c.type) {
    case "boolean":
      return (
        <div className={cn(CTL, "flex-row items-center justify-between")}>
          <span className={CTL_LABEL}>{label}</span>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} onText="" offText="" className={SMALL_SWITCH} />
        </div>
      );
    case "select":
      return (
        <div className={CTL}>
          <span className={CTL_LABEL}>{label}</span>
          {c.options.length <= 3 && c.options.join("").length <= 16 ? (
            <ToggleGroup type="single" size="sm" value={String(value)} onValueChange={(v) => v && onChange(v)} className="flex [&_[data-slot=toggle-group-item]]:flex-1 [&_[data-slot=toggle-group-item]]:px-2 [&_[data-slot=toggle-group-item]]:text-[0.8125rem]"
            >
              {c.options.map((o) => (
                <ToggleGroupItem key={o} value={o}>
                  {o}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : (
            <Select value={String(value)} onValueChange={onChange}>
              <SelectTrigger size="sm" aria-label={label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {c.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      );
    case "text":
      return (
        <div className={CTL}>
          <label className={CTL_LABEL} htmlFor={id}>
            {label}
          </label>
          <Input id={id} size="sm" value={String(value)} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "number":
      return (
        <div className={CTL}>
          <span className={CTL_LABEL}>
            {label} <span className="text-ink tabular-nums">{String(value)}</span>
          </span>
          <Slider value={[Number(value)]} min={c.min} max={c.max} step={c.step ?? 1} onValueChange={([v]) => onChange(v)} />
        </div>
      );
  }
}

function Playground({ entry }: { entry: DocEntry }) {
  const [p, setP] = useState<Props>(() => defaults(entry.controls));
  const { Demo } = entry;
  const hasControls = (entry.controls?.length ?? 0) > 0;
  return (
    <>
      <section
        data-slot="docs-play"
        className={cn("grid gap-tile grid-cols-[minmax(0,1fr)]", hasControls && "min-[901px]:grid-cols-[minmax(0,1fr)_18rem]")}
      >
        <div data-slot="docs-stage" className={STAGE}>
          <Demo p={p} />
        </div>
        {hasControls && (
          <div className="flex flex-col gap-4 p-5 rounded-card bg-surface" aria-label="Settings">
            <div className="flex justify-between items-center font-medium">
              <span>Settings</span>
              <button
                type="button"
                className="border-0 py-[0.3rem] px-3 rounded-pill bg-fill text-ink text-[0.8125rem] cursor-pointer hover:bg-fill-hover"
                onClick={() => setP(defaults(entry.controls))}
              >
                Reset
              </button>
            </div>
            {entry.controls!.map((c) => (
              <ControlField key={c.prop} c={c} value={p[c.prop]} onChange={(v) => setP((cur) => ({ ...cur, [c.prop]: v }))} />
            ))}
          </div>
        )}
      </section>
      <Code>{entry.code(p)}</Code>
    </>
  );
}

/* ── page ───────────────────────────────────────────────────── */

/* the current page is ink on paper */
const NAV_LINK = cn(
  "flex items-center h-9 px-[0.9rem] rounded-pill text-[0.9375rem] tracking-[-0.01em]",
  "transition-colors duration-(--rap-dur-fast) ease-rm hover:bg-fill",
  "aria-[current=page]:bg-ink! aria-[current=page]:text-paper",
);

/* The list of every component, by group, with its search — the desktop sidebar,
   and on a phone the same list inside the menu sheet. */
function NavList({
  q,
  setQ,
  groups,
  entry,
  onPick,
  big = false,
}: {
  q: string;
  setQ: (q: string) => void;
  groups: { g: string; items: DocEntry[] }[];
  entry: DocEntry;
  onPick?: () => void;
  big?: boolean;
}) {
  return (
    <>
      <Input
        className="flex-none"
        size={big ? "md" : "sm"}
        placeholder={`Search ${ENTRIES.length} components`}
        prefix={<Search />}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search components"
      />
      <nav className="flex flex-col gap-5">
        {groups.map(({ g, items }) => (
          <div className="flex flex-col gap-tight" key={g}>
            <span className="px-[0.9rem] pb-[0.3rem] text-[0.8125rem] font-medium text-mute">{g}</span>
            {items.map((e) => (
              <a
                key={e.slug}
                href={`#docs.${e.slug}`}
                className={cn(NAV_LINK, big && "h-11 text-[1.0625rem]")}
                aria-current={e === entry ? "page" : undefined}
                onClick={onPick}
              >
                {e.name}
              </a>
            ))}
          </div>
        ))}
        {groups.length === 0 && <p className="px-[0.9rem] text-mute text-[0.9375rem]">Nothing called “{q}”.</p>}
      </nav>
    </>
  );
}
const PAGER_LINK =
  "inline-flex items-center gap-2 h-12 px-[1.3rem] rounded-pill bg-surface font-medium transition-colors duration-(--rap-dur-fast) ease-rm hover:bg-ink hover:text-paper [&_svg]:size-[18px]";

export function Docs({
  slug,
  dark,
  setDark,
  sound,
  setSound,
}: {
  slug: string;
  dark: boolean;
  setDark: (v: boolean) => void;
  sound: SoundSettings;
  setSound: (v: SoundSettings) => void;
}) {
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  // Calm switches off the playful layer everywhere (data-rap-motion="calm" on <html>, so portals follow)
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    if (calm) document.documentElement.setAttribute("data-rap-motion", "calm");
    else document.documentElement.removeAttribute("data-rap-motion");
    return () => document.documentElement.removeAttribute("data-rap-motion");
  }, [calm]);
  const entry = ENTRIES.find((e) => e.slug === slug) ?? ENTRIES[0];
  const idx = ENTRIES.indexOf(entry);
  const prev = ENTRIES[idx - 1];
  const next = ENTRIES[idx + 1];

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GROUPS.map((g) => ({
      g,
      items: ENTRIES.filter((e) => e.group === g && (!needle || e.name.toLowerCase().includes(needle))),
    })).filter((x) => x.items.length);
  }, [q]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `${entry.name} · rap/ui`;
  }, [entry]);

  return (
    <div className="rap-root min-h-screen bg-paper">
      <header
        className={cn(
          "sticky top-0 z-50 flex items-center gap-[0.9rem] h-16 px-[clamp(1rem,2.5vw,1.5rem)] border-b border-line",
          "bg-[color-mix(in_srgb,var(--rap-paper)_85%,transparent)] backdrop-blur-[14px]",
        )}
      >
        <a href="#top" className="text-[1.4rem]" aria-label="rapui, home">
          <Wordmark />
        </a>
        <span className="w-px h-5 bg-line max-[900px]:hidden" aria-hidden />
        <span className="font-medium max-[900px]:hidden">Components</span>
        <span className="py-[0.1rem] px-[0.55rem] rounded-pill bg-fill text-[0.8125rem] font-medium tabular-nums max-[900px]:hidden">{ENTRIES.length}</span>
        {/* on a phone the sidebar lives behind this button: it names the page you are
            on and opens the menu — search, every component by group, and the switches */}
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="hidden max-[900px]:inline-flex min-w-0 items-center gap-2 h-10 pl-4 pr-3 rounded-pill bg-fill font-medium text-[0.9375rem] transition-colors hover:bg-fill-strong [&_svg]:size-4 [&_svg]:flex-none"
          aria-haspopup="dialog"
        >
          <span className="truncate">{entry.name}</span>
          <ChevronDown />
        </button>
        <div className="ml-auto flex items-center gap-tight">
          <div className="contents max-[900px]:hidden">
            <SoundControls value={sound} onChange={setSound} />
            <label className="inline-flex items-center gap-2 mr-3 text-[0.875rem] font-medium text-mute">
              <span>Calm</span>
              <Switch checked={calm} onCheckedChange={setCalm} onText="" offText="" className={SMALL_SWITCH} />
            </label>
          </div>
          <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        </div>
      </header>

      {/* the phone menu: the sidebar's list in a sheet, with the switches under it */}
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="gap-4 p-5 pt-6 [--sheet-size:360px]">
          <SheetTitle className="text-[1.25rem]">Components</SheetTitle>
          <SheetBody className="-mx-5 px-5 flex flex-col gap-4">
            <NavList q={q} setQ={setQ} groups={groups} entry={entry} onPick={() => setMenu(false)} big />
          </SheetBody>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-4 border-t border-line">
            <SoundControls value={sound} onChange={setSound} />
            <label className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-mute">
              <span>Calm</span>
              <Switch checked={calm} onCheckedChange={setCalm} onText="" offText="" className={SMALL_SWITCH} />
            </label>
          </div>
        </SheetContent>
      </Sheet>

      {/* sidebar + page; under 900px the sidebar moves into the menu sheet */}
      <div className="grid grid-cols-[17rem_minmax(0,1fr)] gap-[clamp(1rem,3vw,3rem)] px-[clamp(1rem,2.5vw,1.5rem)] max-[900px]:grid-cols-[minmax(0,1fr)]">
        <aside className="sticky top-16 self-start flex flex-col gap-4 h-[calc(100vh-64px)] pt-5 pb-8 overflow-y-auto [scrollbar-width:thin] max-[900px]:hidden">
          <NavList q={q} setQ={setQ} groups={groups} entry={entry} />
        </aside>

        <main className="flex flex-col gap-5 min-w-0 pt-10 pb-20 max-w-[72rem]" key={entry.slug}>
          <div className="flex items-center gap-[0.6rem] text-[0.875rem] font-medium text-mute">
            <span>{entry.group}</span>
            {entry.basedOn && <span className="py-[0.15rem] px-[0.6rem] rounded-pill bg-fill text-ink-2">{entry.basedOn}</span>}
          </div>
          <Display as="h1" size="xl">
            {entry.name}
          </Display>
          <p className="mt-0 mb-4 max-w-[60ch] text-[1.125rem] leading-[1.45] text-ink-2">{entry.description}</p>

          <Playground entry={entry} />

          {entry.examples?.map((ex) => (
            <section key={ex.title}>
              <h2 className="mt-8 mb-0 text-[1.375rem] font-medium tracking-[-0.03em]">{ex.title}</h2>
              <div className={cn(STAGE, "min-h-56")}>
                <ex.Demo />
              </div>
              <Code>{ex.code}</Code>
            </section>
          ))}

          <nav className="flex justify-between gap-tight mt-8">
            {prev ? (
              <a href={`#docs.${prev.slug}`} className={PAGER_LINK}>
                <ArrowLeft /> {prev.name}
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={`#docs.${next.slug}`} className={PAGER_LINK}>
                {next.name} <ArrowRight />
              </a>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
