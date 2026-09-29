import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "../rapui/icons";
import {
  Accent,
  Display,
  Input,
  Select,
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
import { SoundControls } from "./SoundControls";
import type { SoundSettings } from "../rapui";
import "./docs.css";

/* ── settings panel ─────────────────────────────────────────── */

function ControlField({ c, value, onChange }: { c: Control; value: Props[string]; onChange: (v: Props[string]) => void }) {
  const label = c.label ?? c.prop;
  const id = `ctl-${c.prop}`;
  switch (c.type) {
    case "boolean":
      return (
        <div className="docs-ctl docs-ctl--row">
          <span className="docs-ctl__label">{label}</span>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} onText="" offText="" />
        </div>
      );
    case "select":
      return (
        <div className="docs-ctl">
          <span className="docs-ctl__label">{label}</span>
          {c.options.length <= 3 && c.options.join("").length <= 16 ? (
            <ToggleGroup type="single" size="sm" value={String(value)} onValueChange={(v) => v && onChange(v)} className="docs-ctl__seg">
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
        <div className="docs-ctl">
          <label className="docs-ctl__label" htmlFor={id}>
            {label}
          </label>
          <Input id={id} size="sm" value={String(value)} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "number":
      return (
        <div className="docs-ctl">
          <span className="docs-ctl__label">
            {label} <span className="docs-ctl__num">{String(value)}</span>
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
      <section className={`docs-play ${hasControls ? "" : "docs-play--solo"}`}>
        <div className="docs-stage">
          <Demo p={p} />
        </div>
        {hasControls && (
          <div className="docs-controls" aria-label="Settings">
            <div className="docs-controls__head">
              <span>Settings</span>
              <button type="button" className="docs-reset" onClick={() => setP(defaults(entry.controls))}>
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
    <div className="rap-root docs">
      <header className="docs-top">
        <a href="#top" className="docs-logo">
          rap<Accent>/</Accent>ui
        </a>
        <span className="docs-top__sep" aria-hidden />
        <span className="docs-top__title">Components</span>
        <span className="docs-top__count">{ENTRIES.length}</span>
        <div className="docs-top__right">
          <SoundControls value={sound} onChange={setSound} />
          <label className="docs-calm">
            <span>Calm</span>
            <Switch checked={calm} onCheckedChange={setCalm} onText="" offText="" />
          </label>
          <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        </div>
      </header>

      <div className="docs-body">
        <aside className="docs-side">
          <Input size="sm" placeholder="Search" prefix={<Search />} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search components" />
          <nav className="docs-nav">
            {groups.map(({ g, items }) => (
              <div className="docs-nav__group" key={g}>
                <span className="docs-nav__title">{g}</span>
                {items.map((e) => (
                  <a key={e.slug} href={`#docs.${e.slug}`} className="docs-nav__link" aria-current={e === entry ? "page" : undefined}>
                    {e.name}
                  </a>
                ))}
              </div>
            ))}
            {groups.length === 0 && <p className="docs-nav__empty">Nothing called “{q}”.</p>}
          </nav>
        </aside>

        <main className="docs-main" key={entry.slug}>
          <div className="docs-crumbs">
            <span>{entry.group}</span>
            {entry.basedOn && <span className="docs-based">{entry.basedOn}</span>}
          </div>
          <Display as="h1" size="xl">
            {entry.name}
          </Display>
          <p className="docs-desc">{entry.description}</p>

          <Playground entry={entry} />

          {entry.examples?.map((ex) => (
            <section className="docs-example" key={ex.title}>
              <h2 className="docs-h2">{ex.title}</h2>
              <div className="docs-stage docs-stage--example">
                <ex.Demo />
              </div>
              <Code>{ex.code}</Code>
            </section>
          ))}

          <nav className="docs-pager">
            {prev ? (
              <a href={`#docs.${prev.slug}`} className="docs-pager__link">
                <ArrowLeft /> {prev.name}
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={`#docs.${next.slug}`} className="docs-pager__link docs-pager__link--next">
                {next.name} <ArrowRight />
              </a>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
