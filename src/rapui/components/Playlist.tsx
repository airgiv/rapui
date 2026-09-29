/* ══ Playlist ═════════════════════════════════════════════
   A compact player over a list of tracks: the record that is on,
   prev / play / next, a slim scrubber, and the rows. One <audio>
   element plays whichever row is current; the end of a track
   rolls on to the next.

   ── DELIGHT: A RECORD WITH A MOTOR ──────────────────────
   The cover of the playing track is a disc on a turntable. It
   does not start and stop, it spins UP and spins DOWN: the angular
   speed chases its target every frame (dt-corrected, like every
   rap/ui spring) — 0.045 of the gap per frame toward 33⅓ rpm
   (200°/s) when playing, about a second to speed like a real
   platter, and only 0.018 per frame toward zero on pause, so the
   disc coasts for two-odd seconds and settles where friction
   leaves it, never snapping back to 0°. The angle is written
   straight to the element (no React render per frame) and the
   loop parks once it is still. Calm / reduced motion: a still
   cover.

   ── ONE HIGHLIGHT, ONE EQUALISER ────────────────────────
   The current row is marked by a single fill that glides between
   rows (useGlide, the caterpillar, axis y) instead of each row
   lighting up. Its duration makes room for a three-bar equaliser
   that dances while playing and lies down (not vanishes) on
   pause — the row still says "this one". The equaliser is CSS
   (Playlist.css: three phase-shifted keyframes, so the bars never
   move in step). */
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { useSound } from "../sound";
import { isCalm, useGlide } from "../hooks/useGlide";
import { clamp, cn } from "../utils";
import { ChevronsLeft, ChevronsRight } from "../icons";
import { PlayGlyph, fmt, scrubKeys, useMedia, useScrub, valueText } from "./MediaKit";
import "./Playlist.css";

export interface PlaylistTrack {
  src: string;
  title: string;
  artist?: string;
  /** Seconds; read from the file's metadata when left out. */
  duration?: number;
  /** A cover image URL. Without one a gradient is generated from the title. */
  cover?: string;
}

export interface PlaylistProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children" | "onChange"> {
  tracks: PlaylistTrack[];
  /** Index of the current track (controlled). */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Start again from the first track after the last. */
  loop?: boolean;
  /** Heading above the list. */
  label?: string;
}

/* ── generated covers ─────────────────────────────────────── */
const HUES = ["--rap-flame", "--rap-blue", "--rap-plum", "--rap-acid", "--rap-bubble", "--rap-sky"];
function hashOf(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}
/** A two-hue gradient cover from a seed, in rap/ui's accent tokens (so it follows the theme). */
export function coverStyle(seed: string, image?: string): CSSProperties {
  if (image) return { backgroundImage: `url("${image}")`, backgroundSize: "cover", backgroundPosition: "center" };
  /* unsigned shifts only: a signed >> of a hash past 2³¹ goes negative and indexes nothing */
  const h = hashOf(seed);
  const pick = (shift: number) => HUES[(h >>> shift) % HUES.length];
  const a = pick(0);
  const b = pick(3) === a ? HUES[(HUES.indexOf(a) + 2) % HUES.length] : pick(3);
  const angle = (h >>> 7) % 360;
  return {
    backgroundImage: `radial-gradient(circle at ${20 + ((h >>> 5) % 50)}% ${20 + ((h >>> 9) % 40)}%, var(${b}) 0 22%, transparent 60%), linear-gradient(${angle}deg, var(${a}), var(${b}))`,
  };
}

/* ── the turntable ────────────────────────────────────────── */
const RPM_DEG = 200; /* 33⅓ rpm in degrees a second */
const SPIN_UP = 0.045;
const SPIN_DOWN = 0.018;

function useTurntable(playing: boolean) {
  const el = useRef<HTMLSpanElement>(null);
  const m = useRef({ a: 0, w: 0, raf: 0, prev: 0 });
  useEffect(() => {
    const c = m.current;
    const node = el.current;
    if (!node) return;
    if (isCalm(node)) {
      node.style.rotate = "";
      return;
    }
    cancelAnimationFrame(c.raf);
    c.prev = 0;
    const target = playing ? RPM_DEG / 60 : 0; /* degrees per frame */
    const tick = (t: number) => {
      const dt = c.prev ? clamp((t - c.prev) / 16.67, 0, 2.5) : 1;
      c.prev = t;
      const k = playing ? SPIN_UP : SPIN_DOWN;
      c.w += (target - c.w) * (1 - Math.pow(1 - k, dt));
      c.a = (c.a + c.w * dt) % 360;
      node.style.rotate = `${c.a.toFixed(2)}deg`;
      if (!playing && Math.abs(c.w) < 0.01) {
        c.w = 0;
        c.raf = 0;
        return;
      }
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(c.raf);
  }, [playing]);
  return el;
}

/* ── durations from metadata, for tracks that did not say ─── */
function useDurations(tracks: PlaylistTrack[]) {
  const [found, setFound] = useState<Record<string, number>>({});
  useEffect(() => {
    const probes: HTMLAudioElement[] = [];
    for (const t of tracks) {
      if (t.duration != null) continue;
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => Number.isFinite(a.duration) && setFound((f) => ({ ...f, [t.src]: a.duration }));
      a.src = t.src;
      probes.push(a);
    }
    return () =>
      probes.forEach((a) => {
        a.onloadedmetadata = null;
        a.removeAttribute("src");
        a.load();
      });
  }, [tracks]);
  return (t: PlaylistTrack) => t.duration ?? found[t.src];
}

/** A compact track list with a spinning-record now-playing header. */
export const Playlist = forwardRef<HTMLDivElement, PlaylistProps>(function Playlist(
  { tracks, index, defaultIndex = 0, onIndexChange, loop = true, label, className, ...rest },
  ref,
) {
  const [inner, setInner] = useState(defaultIndex);
  const at = clamp(index ?? inner, 0, Math.max(0, tracks.length - 1));
  const track = tracks[at];
  const audio = useRef<HTMLAudioElement>(null);
  const [s, media] = useMedia(audio, track?.src);
  const sound = useSound();
  const durationOf = useDurations(tracks);
  const bar = useRef<HTMLDivElement>(null);
  const scrub = useScrub(bar, { duration: s.duration, media, state: s });
  /* a drag pauses the element under the hand; it still reads as playing */
  const playing = s.playing || scrub.holding;
  const disc = useTurntable(playing);

  /* play after the src swaps, if the change came from a press or an ended track */
  const autoplay = useRef(false);
  useEffect(() => {
    if (autoplay.current) media.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.src]);

  const go = (i: number, play = true) => {
    const n = tracks.length;
    if (!n) return;
    const next = ((i % n) + n) % n;
    autoplay.current = play;
    if (next === at) {
      if (play) media.play();
      return;
    }
    if (index === undefined) setInner(next);
    onIndexChange?.(next);
  };

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const ended = () => {
      if (at < tracks.length - 1 || loop) go(at + 1, true);
    };
    el.addEventListener("ended", ended);
    return () => el.removeEventListener("ended", ended);
  });

  /* the gliding row highlight */
  const list = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<(HTMLButtonElement | null)[]>([]);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => setRows([...rowRefs.current]), [tracks.length]);
  const glide = useGlide(list, rows[at], { axis: "y" });

  const d = s.duration || (track ? durationOf(track) ?? 0 : 0);
  const t = scrub.drag ?? s.time;
  const p = d ? clamp(t / d, 0, 1) : 0;

  const rowKeys = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const move = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      rowRefs.current[e.key === "Home" ? 0 : tracks.length - 1]?.focus();
    }
    if (!move) return;
    e.preventDefault();
    rowRefs.current[clamp(i + move, 0, tracks.length - 1)]?.focus();
  };

  const ctrl = cn(
    "grid place-items-center flex-none rounded-pill cursor-pointer [&_svg]:size-5",
    "transition-[scale,background-color] duration-(--rap-dur-fast) ease-spring active:scale-90",
    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
  );

  return (
    <div
      ref={ref}
      data-slot="playlist"
      data-state={playing ? "playing" : "paused"}
      className={cn("@container flex flex-col w-full min-w-0 max-w-md p-3 rounded-card bg-surface text-ink font-sans", className)}
      {...rest}
    >
      <audio ref={audio} src={track?.src} preload="auto" data-slot="playlist-media" />

      <div data-slot="playlist-now" className="flex items-center gap-2.5 @sm:gap-3 p-2 pb-1">
        {/* the record: the cover as a disc with a spindle hole, turned by useTurntable */}
        <span
          ref={disc}
          data-slot="playlist-disc"
          aria-hidden
          className="relative size-12 @sm:size-16 flex-none rounded-full shadow-[inset_0_0_0_1px_var(--rap-line)]"
          style={track ? coverStyle(track.title, track.cover) : undefined}
        >
          <span className="absolute inset-[34%] rounded-full bg-surface/85 shadow-[0_0_0_1px_var(--rap-line)]" />
          <span className="absolute inset-[46%] rounded-full bg-ink/70" />
        </span>
        <div data-slot="playlist-now-meta" className="flex-1 min-w-0">
          <div className="text-[1rem] font-medium tracking-[-0.02em] truncate" aria-live="polite">
            {track?.title ?? "—"}
          </div>
          <div className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute truncate">{track?.artist}</div>
        </div>
        <div data-slot="playlist-transport" className="flex items-center gap-tight">
          <button type="button" aria-label="Previous track" data-slot="playlist-prev" className={cn(ctrl, "size-9 @sm:size-10 bg-fill hover:bg-fill-hover")}
            onClick={() => {
              sound.play("tap", { strength: 0.5 });
              /* past the first 3 s, "previous" restarts the track, as every player does */
              if (s.time > 3) media.seek(0);
              else go(at - 1, playing);
            }}
          >
            <ChevronsLeft />
          </button>
          <button type="button" aria-label={playing ? "Pause" : "Play"} data-slot="playlist-play" className={cn(ctrl, "size-11 @sm:size-12 bg-ink text-paper hover:bg-ink-2")}
            onClick={() => {
              sound.play("tap", { pitch: playing ? 0.8 : 1 });
              media.toggle();
            }}
          >
            <PlayGlyph playing={playing} className="size-5" />
          </button>
          <button type="button" aria-label="Next track" data-slot="playlist-next" className={cn(ctrl, "size-9 @sm:size-10 bg-fill hover:bg-fill-hover")}
            onClick={() => {
              sound.play("tap", { strength: 0.5 });
              go(at + 1, playing);
            }}
          >
            <ChevronsRight />
          </button>
        </div>
      </div>

      <div data-slot="playlist-progress" className="flex items-center gap-2.5 px-2 pt-1 pb-3 text-[0.75rem] font-medium tabular-nums text-mute">
        <span className="w-9 text-right" aria-hidden>{fmt(t)}</span>
        <div
          ref={bar}
          role="slider"
          tabIndex={0}
          aria-label={track ? `Seek ${track.title}` : "Seek"}
          aria-valuemin={0}
          aria-valuemax={Math.round(d)}
          aria-valuenow={Math.round(t)}
          aria-valuetext={valueText(t, d)}
          data-slot="playlist-scrubber"
          onKeyDown={(e) => scrubKeys(e, s, media)}
          {...scrub.bind}
          className="group/bar relative flex-1 h-5 cursor-pointer touch-none rounded-pill focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          <span className="absolute inset-x-0 top-1/2 h-1 -mt-0.5 rounded-pill bg-fill-strong" />
          <span className="absolute left-0 top-1/2 h-1 -mt-0.5 rounded-pill bg-ink" style={{ width: `${p * 100}%` }} />
          <span
            className="absolute top-1/2 size-3 -mt-1.5 -ml-1.5 rounded-full bg-ink scale-0 transition-[scale] duration-(--rap-dur-fast) ease-spring group-hover/bar:scale-100 group-focus-visible/bar:scale-100 group-data-scrub/bar:scale-125"
            style={{ left: `${p * 100}%` }}
          />
        </div>
        <span className="w-9" aria-hidden>{fmt(d)}</span>
      </div>

      {label && <div data-slot="playlist-label" className="px-3 pt-1 pb-1.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-mute">{label}</div>}
      <div ref={list} data-slot="playlist-list" role="list" className="relative flex flex-col gap-tight">
        <span aria-hidden data-slot="playlist-glider" className="absolute left-0 top-0 rounded-row bg-fill pointer-events-none" style={glide.style} />
        {tracks.map((tr, i) => {
          const on = i === at;
          const dur = durationOf(tr);
          return (
            <div role="listitem" key={tr.src + i} className="relative">
              <button
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                type="button"
                data-slot="playlist-row"
                data-current={on || undefined}
                aria-current={on || undefined}
                aria-label={`${on && playing ? "Playing" : "Play"} ${tr.title}${tr.artist ? ` by ${tr.artist}` : ""}`}
                onKeyDown={(e) => rowKeys(e, i)}
                onClick={() => {
                  sound.play("tap", { strength: 0.5 });
                  if (on) media.toggle();
                  else go(i, true);
                }}
                className={cn(
                  "group/row flex items-center gap-3 w-full p-2 pr-3 rounded-row border-0 bg-transparent text-left cursor-pointer",
                  "transition-[background-color] duration-(--rap-dur-fast) hover:bg-fill/60",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2",
                )}
              >
                <span data-slot="playlist-cover" aria-hidden className="size-10 flex-none rounded-[10px]" style={coverStyle(tr.title, tr.cover)} />
                <span className="flex-1 min-w-0">
                  <span data-slot="playlist-row-title" className="block text-[0.9375rem] font-medium tracking-[-0.01em] truncate">{tr.title}</span>
                  {tr.artist && <span className="block text-[0.8125rem] font-medium tracking-[-0.01em] text-mute truncate">{tr.artist}</span>}
                </span>
                {on ? (
                  <span data-slot="playlist-eq" data-playing={playing || undefined} aria-hidden className="rap-eq flex items-end gap-[2px] h-4 w-4 flex-none">
                    <i className="flex-1 rounded-pill bg-ink" />
                    <i className="flex-1 rounded-pill bg-ink" />
                    <i className="flex-1 rounded-pill bg-ink" />
                  </span>
                ) : null}
                <span data-slot="playlist-duration" className="w-9 text-right text-[0.8125rem] font-medium tabular-nums text-mute">
                  {dur != null ? fmt(dur) : ""}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
