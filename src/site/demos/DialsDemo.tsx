import { useState, type ReactNode } from "react";
import { RangeDial, TimeScrubber } from "../../rapui";
import { DateScrubber, ElasticSlider, HueRing, Knob, LensRuler, SplitSlider, TempoDial, hueName } from "../../rapui/groups/scrubbers";
import { Volume1, Volume2 } from "../../rapui/icons";
import { cn } from "../../rapui/utils";

/* ══ Dials demo — "Plan the night" ════════════════════════
   Every scrubber on one desk, each setting one thing about the
   same night: which night (the date ruler), lights out (the time
   ruler), how long to sleep (the range dial), the room (the lens
   ruler, as a thermostat), the lamp (the hue ring), the lullaby
   (the tempo dial) and the noise (the split, the volume, the fade).

   ── A BENTO, NOT A ROW ──────────────────────────────────
   White cards of different sizes on the paper ground, 4px apart
   (the tile gap), laid out by the container's width, not the
   window's, so it composes the same on the landing stage and in
   the docs: three columns from 62rem, two from 44rem, a stack
   below. The two big round things (sleep, lamp) and the one tall
   thing (the thermostat) anchor the grid; the long rulers take the
   wide cells, where their length is the point.

   ── THE PIECES TALK ─────────────────────────────────────
   The last card is the only dark one: it reads the whole desk back
   as one sentence, and its lamp takes the ring's hue and flashes
   on every beat of the tempo dial. The thermostat names its zone
   as it moves. Nothing else is linked — the story is the link. */

const CARD = "relative flex flex-col gap-4 min-w-0 p-3 @min-[26rem]/card:p-5 rounded-card bg-surface text-ink";

function Card({ title, aside, className, children }: { title: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section data-slot="dials-card" className={cn("@container/card", className)}>
      <div className={cn(CARD, "h-full")}>
        <header className="flex items-baseline justify-between gap-3 px-1 pt-0.5">
          <span className="text-[0.9375rem] font-medium tracking-[-0.01em]">{title}</span>
          {aside && <span className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute text-right">{aside}</span>}
        </header>
        {children}
      </div>
    </section>
  );
}

const zone = (t: number) => (t < 17.5 ? "Crisp" : t < 19.5 ? "Cool, best for deep sleep" : t < 21.5 ? "Cosy" : "Warm, a bit much");

const DAY_MS = 86_400_000;
const todayIso = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())).toISOString().slice(0, 10);
};
const nightOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const i = Date.UTC(y, m - 1, d) / DAY_MS;
  const off = Math.round(i - Date.parse(todayIso()) / DAY_MS);
  if (off === 0) return "Tonight";
  if (off === 1) return "Tomorrow night";
  return `${new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(new Date(i * DAY_MS))} night`;
};

export function DialsDemo() {
  const [date, setDate] = useState(todayIso);
  const [temp, setTemp] = useState(19);
  const [hue, setHue] = useState(62);
  const [bpm, setBpm] = useState(68);
  const [mix, setMix] = useState(60);
  const [vol, setVol] = useState(35);
  const [fade, setFade] = useState(30);
  const [beat, setBeat] = useState(0);

  const lamp = `oklch(0.72 0.15 ${hue})`;

  return (
    <div data-slot="dials-demo" className="@container w-full min-w-0 font-sans">
      <div
        className={cn(
          "grid grid-cols-1 gap-tile",
          "@min-[44rem]:grid-cols-2 @min-[62rem]:grid-cols-3",
        )}
      >
        <Card
          title="Which night"
          aside="Fling the days"
          className="@min-[44rem]:col-[1/3] @min-[62rem]:col-[1/3] @min-[62rem]:row-[1]"
        >
          <DateScrubber aria-label="Night" value={date} onValueChange={setDate} className="pt-1" />
        </Card>

        <Card
          title="Bedroom"
          aside="Thermostat"
          className="@min-[44rem]:col-[2] @min-[44rem]:row-[2] @min-[62rem]:col-[3] @min-[62rem]:row-[1/3]"
        >
          <div className="grid place-items-center flex-1">
            <LensRuler label="Room" unit="°" min={15} max={25} step={0.5} value={temp} onValueChange={setTemp} height={300} hint={zone(temp)} />
          </div>
        </Card>

        <Card
          title="Sleep window"
          aside="Drag either end"
          className="@min-[44rem]:col-[1] @min-[44rem]:row-[2] @min-[62rem]:col-[1] @min-[62rem]:row-[2/4]"
        >
          <div className="grid place-items-center flex-1 min-w-0 overflow-hidden">
            {/* the dial is a fixed 288px; in a card narrower than it
                needs (19.5rem with padding) it is drawn at 5/6 — RangeDial
                measures its own scale, so the handles stay put */}
            <div className="size-[288px] @max-[19.5rem]/card:size-[240px]">
              <div className="origin-top-left @max-[19.5rem]/card:scale-[0.8333]">
                <RangeDial />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Lights out" aside="Fling the hours" className="@min-[44rem]:col-[1] @min-[44rem]:row-[3] @min-[62rem]:col-[2] @min-[62rem]:row-[2]">
          <div className="grid place-items-center flex-1 [&>div]:w-full [&>div]:max-w-[300px]">
            <TimeScrubber step="15" start={1380} format="24h" />
          </div>
        </Card>

        <Card title="Lullaby" aside="Spin or tap" className="@min-[44rem]:col-[2] @min-[44rem]:row-[3] @min-[62rem]:col-[2] @min-[62rem]:row-[3]">
          <div className="grid place-items-center flex-1">
            <TempoDial aria-label="Lullaby tempo" value={bpm} onValueChange={setBpm} onBeat={() => setBeat((b) => b + 1)} min={40} max={160} size={208} />
          </div>
        </Card>

        <Card title="Lamp" aside="Colour" className="@min-[44rem]:col-[1] @min-[44rem]:row-[4] @min-[62rem]:col-[3] @min-[62rem]:row-[3]">
          <div className="grid place-items-center flex-1">
            <HueRing aria-label="Lamp colour" value={hue} onValueChange={setHue} size={208} />
          </div>
        </Card>

        <Card title="Noise" aside="Mix, level, fade" className="@min-[44rem]:col-[1/3] @min-[44rem]:row-[5] @min-[62rem]:col-[1/3] @min-[62rem]:row-[4]">
          <div className="@container/mix">
            <div className="grid gap-6 @min-[34rem]/mix:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] @min-[34rem]/mix:gap-8 items-center px-1 pb-1">
              <SplitSlider aria-label="Noise mix" labels={["Rain", "Brown noise"]} value={mix} onValueChange={setMix} />
              <div className="flex items-center gap-5 min-w-0">
                <div className="flex-1 min-w-0 pt-7">
                  <ElasticSlider aria-label="Noise volume" value={vol} onValueChange={setVol} icons={[<Volume1 />, <Volume2 />]} bubble="active" />
                </div>
                <Knob size="sm" label="Fade" min={0} max={60} step={5} value={fade} onValueChange={setFade} format={(v) => `${v}m`} />
              </div>
            </div>
          </div>
        </Card>

        {/* the read-back: the one dark card */}
        <section
          data-slot="dials-summary"
          className="@min-[44rem]:col-[2] @min-[44rem]:row-[4] @min-[62rem]:col-[3] @min-[62rem]:row-[4] min-w-0"
        >
          <div className="relative flex flex-col justify-between gap-6 h-full p-5 rounded-card bg-ink text-paper overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[1.75rem] font-medium leading-none tracking-[-0.04em]">{nightOf(date)}</span>
              {/* the lamp: the ring's colour, flashing on the lullaby's beat */}
              <span className="relative grid place-items-center size-7" aria-hidden="true">
                <span
                  key={beat}
                  className="absolute inset-0 rounded-full opacity-0 fun:animate-[rap-tempo-flash_520ms_cubic-bezier(0.2,0.7,0.3,1)_both]"
                  style={{ background: lamp, filter: "blur(6px)" }}
                />
                <span className="relative size-4 rounded-full" style={{ background: lamp }} />
              </span>
            </div>
            <p className="text-[1.25rem] leading-[1.3] font-medium tracking-[-0.025em] text-paper/60 text-pretty">
              Lamp <span className="text-paper">{hueName(hue).toLowerCase()}</span>, room at{" "}
              <span className="text-paper tabular-nums">{temp.toFixed(1)}°</span>,{" "}
              <span className="text-paper tabular-nums">{mix}%</span> rain over brown noise at{" "}
              <span className="text-paper tabular-nums">{vol}%</span>, a <span className="text-paper tabular-nums">{bpm} bpm</span> lullaby{" "}
              {fade === 0 ? (
                <>playing <span className="text-paper">all night</span></>
              ) : (
                <>fading out over <span className="text-paper tabular-nums">{fade} min</span></>
              )}
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
