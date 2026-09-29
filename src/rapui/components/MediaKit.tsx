/* ══ MediaKit ═════════════════════════════════════════════
   The parts every rap/ui player is built from, so the AudioPlayer,
   the Playlist, the VoiceNote and the VideoPlayer speak one language
   (the way ChartKit serves the chart cards):

     useMedia()      an <audio>/<video> element's state as React state:
                     playing, time, duration, buffered, volume, rate.
                     Time is read every frame WHILE PLAYING (rAF), not
                     from `timeupdate`, which fires ~4× a second and
                     makes a playhead visibly step.
     usePeaks()      the waveform: the file decoded once with Web Audio
                     (an OfflineAudioContext, so no user gesture and no
                     sound device are needed) and reduced to 256 peak
                     buckets, cached per src; until then — or if the
                     file cannot be read (CORS, codec) — a pattern
                     seeded from the src, so the shape never jumps.
     useLevel()      the live loudness for the "breathing" bars: an
                     AnalyserNode spliced in on first play. Only for
                     same-origin media — a cross-origin element routed
                     through Web Audio without CORS plays SILENCE, and
                     a player that goes quiet to look pretty is broken.
     useScrub()      pointer → time on a track, with pause-while-held,
                     magnetic snap points and a velocity for the skew.
     PlayGlyph       play ⇄ pause as ONE shape morphing on the spring:
                     the triangle is cut into two quads that become
                     the two bars, so it reads as a thing changing
                     state, not an icon being swapped. Drawn inline
                     because a morph needs matching points, which two
                     icon-set glyphs never have.
     RateTabs        1× · 1.5× · 2× with one pill that travels.
     VolumeControl   mute button + the ElasticSlider, silenced: the
                     slider's detent ticks are lovely on a canvas and
                     rude over music, so it sits in a muted
                     SoundProvider. UI sound in the players is kept
                     to discrete presses (play, rate, chapter snap).
     fmt()           0:07 · 3:10 · 1:02:33 — tabular, never "00:07". */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { SoundProvider, useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { isCalm } from "../hooks/useGlide";
import { clamp, cn } from "../utils";
import { ElasticSlider } from "./ElasticSlider";
import { Volume1, Volume2, VolumeX } from "../icons";

/* ── time ─────────────────────────────────────────────────── */

/** 0:07, 3:10, 1:02:33. Unknown/infinite → 0:00. */
export function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1 minute 24 seconds" — for aria-valuetext, which a screen reader reads aloud. */
export function spoken(sec: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const part = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  return m ? (r ? `${part(m, "minute")} ${part(r, "second")}` : part(m, "minute")) : part(r, "second");
}

/** The scrubber's aria-valuetext: "1:24 of 3:10". */
export const valueText = (t: number, d: number) => `${fmt(t)} of ${fmt(d)}`;

/* ── the element as state ─────────────────────────────────── */

export interface MediaState {
  playing: boolean;
  time: number;
  duration: number;
  /** end of the buffered range that contains the playhead, seconds */
  buffered: number;
  volume: number;
  muted: boolean;
  rate: number;
  waiting: boolean;
  ended: boolean;
}

export function useMedia(ref: RefObject<HTMLMediaElement | null>, src?: string) {
  const [s, setS] = useState<MediaState>({
    playing: false,
    time: 0,
    duration: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    rate: 1,
    waiting: false,
    ended: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bufferedEnd = () => {
      const b = el.buffered;
      for (let i = 0; i < b.length; i++) if (b.start(i) <= el.currentTime + 0.5 && b.end(i) >= el.currentTime) return b.end(i);
      return b.length ? b.end(b.length - 1) : 0;
    };
    const read = () =>
      setS({
        playing: !el.paused && !el.ended,
        time: el.currentTime,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
        buffered: bufferedEnd(),
        volume: el.volume,
        muted: el.muted,
        rate: el.playbackRate,
        waiting: el.readyState < 3 && !el.paused,
        ended: el.ended,
      });
    let raf = 0;
    const loop = () => {
      read();
      raf = el.paused ? 0 : requestAnimationFrame(loop);
    };
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const evs = ["loadedmetadata", "durationchange", "progress", "timeupdate", "pause", "seeked", "seeking", "volumechange", "ratechange", "waiting", "canplay", "ended", "emptied"];
    evs.forEach((e) => el.addEventListener(e, read));
    el.addEventListener("play", onPlay);
    el.addEventListener("playing", onPlay);
    read();
    if (!el.paused) onPlay();
    return () => {
      cancelAnimationFrame(raf);
      evs.forEach((e) => el.removeEventListener(e, read));
      el.removeEventListener("play", onPlay);
      el.removeEventListener("playing", onPlay);
    };
  }, [ref, src]);

  const api = {
    toggle: () => {
      const el = ref.current;
      if (!el) return;
      if (el.paused || el.ended) void el.play().catch(() => {});
      else el.pause();
    },
    play: () => void ref.current?.play().catch(() => {}),
    pause: () => ref.current?.pause(),
    seek: (t: number) => {
      const el = ref.current;
      if (!el) return;
      const d = Number.isFinite(el.duration) ? el.duration : 0;
      el.currentTime = d ? clamp(t, 0, d) : Math.max(0, t);
      setS((x) => ({ ...x, time: el.currentTime, ended: false }));
    },
    setVolume: (v: number) => {
      const el = ref.current;
      if (!el) return;
      el.volume = clamp(v, 0, 1);
      if (v > 0 && el.muted) el.muted = false;
    },
    setMuted: (m: boolean) => {
      if (ref.current) ref.current.muted = m;
    },
    setRate: (r: number) => {
      if (ref.current) ref.current.playbackRate = r;
    },
  };
  return [s, api] as const;
}
export type MediaApi = ReturnType<typeof useMedia>[1];

/* ── the waveform ─────────────────────────────────────────── */

const BUCKETS = 256;
const peakCache = new Map<string, Promise<number[] | null>>();

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A plausible waveform from a seed: phrases of louder and quieter, never flat. */
export function seededPeaks(seed: string, n = BUCKETS) {
  let s = hash(seed) || 1;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out: number[] = [];
  let phrase = 0.6;
  for (let i = 0; i < n; i++) {
    if (i % 16 === 0) phrase = 0.35 + r() * 0.6;
    const beat = i % 4 === 0 ? 0.25 : 0;
    out.push(clamp(phrase * (0.55 + r() * 0.45) + beat, 0.08, 1));
  }
  return out;
}

async function decodePeaks(src: string): Promise<number[] | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    const Ctx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx(1, 1, 44100);
    const buf = await ctx.decodeAudioData(bytes);
    const ch = buf.getChannelData(0);
    const size = Math.max(1, Math.floor(ch.length / BUCKETS));
    const out: number[] = [];
    for (let b = 0; b < BUCKETS; b++) {
      /* RMS rather than peak: a peak waveform of music is a solid
         block (every bucket has one loud sample); RMS keeps the
         phrasing visible */
      let sum = 0;
      const start = b * size;
      for (let i = start; i < start + size && i < ch.length; i++) sum += ch[i] * ch[i];
      out.push(Math.sqrt(sum / size));
    }
    const max = Math.max(...out, 1e-6);
    /* a gentle curve so quiet passages still read as bars */
    return out.map((v) => clamp(Math.pow(v / max, 0.7), 0.06, 1));
  } catch {
    return null;
  }
}

/** Waveform peaks (0..1, 256 buckets) for `src`: `given` if passed, else decoded, else seeded. */
export function usePeaks(src: string | undefined, given?: number[]) {
  const seed = src ?? "rapui";
  const [peaks, setPeaks] = useState<{ src: string; v: number[]; real: boolean }>(() => ({ src: seed, v: given ?? seededPeaks(seed), real: !!given }));
  useEffect(() => {
    if (given) {
      setPeaks({ src: seed, v: given, real: true });
      return;
    }
    setPeaks({ src: seed, v: seededPeaks(seed), real: false });
    if (!src || typeof window === "undefined") return;
    let live = true;
    let job = peakCache.get(src);
    if (!job) peakCache.set(src, (job = decodePeaks(src)));
    job.then((v) => live && v && setPeaks({ src: seed, v, real: true }));
    return () => {
      live = false;
    };
  }, [src, seed, given]);
  return peaks;
}

/** Resample peaks to n bars (max within each span, so short transients survive). */
export function resample(peaks: number[], n: number) {
  if (n <= 0) return [];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i / n) * peaks.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / n) * peaks.length));
    let m = 0;
    for (let j = a; j < b; j++) m = Math.max(m, peaks[j] ?? 0);
    out.push(m);
  }
  return out;
}

/** Width of an element, tracked. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    setW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ── the live level ───────────────────────────────────────── */

type Graph = { ctx: AudioContext; an: AnalyserNode; buf: Uint8Array<ArrayBuffer> };
const graphs = new WeakMap<HTMLMediaElement, Graph>();

function sameOrigin(el: HTMLMediaElement) {
  const src = el.currentSrc || el.src;
  if (!src) return false;
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  try {
    return new URL(src, location.href).origin === location.origin || !!el.crossOrigin;
  } catch {
    return false;
  }
}

/**
 * Live loudness 0..1 of a playing element, read on demand (`read()` each
 * frame). Splices an AnalyserNode in on the first play when `enabled`;
 * returns 0 when it cannot (cross-origin, no Web Audio).
 */
export function useLevel(ref: RefObject<HTMLMediaElement | null>, enabled: boolean) {
  const graph = useRef<Graph | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const hook = () => {
      if (graphs.has(el)) {
        graph.current = graphs.get(el)!;
      } else if (sameOrigin(el) && typeof AudioContext !== "undefined") {
        try {
          const ctx = new AudioContext();
          const node = ctx.createMediaElementSource(el);
          const an = ctx.createAnalyser();
          an.fftSize = 512;
          an.smoothingTimeConstant = 0.8;
          node.connect(an);
          an.connect(ctx.destination);
          const g = { ctx, an, buf: new Uint8Array(new ArrayBuffer(an.fftSize)) };
          graphs.set(el, g);
          graph.current = g;
        } catch {
          return;
        }
      }
      /* the element's sound now flows through the context: it must be
         running, and play() is a user gesture, so resume here */
      void graph.current?.ctx.resume().catch(() => {});
    };
    el.addEventListener("play", hook);
    if (graphs.has(el)) graph.current = graphs.get(el)!;
    return () => el.removeEventListener("play", hook);
  }, [ref, enabled]);

  return useCallback(() => {
    const g = graph.current;
    if (!g) return 0;
    g.an.getByteTimeDomainData(g.buf);
    let sum = 0;
    for (let i = 0; i < g.buf.length; i++) {
      const v = (g.buf[i] - 128) / 128;
      sum += v * v;
    }
    /* RMS of music sits around 0.05–0.3; stretch it into 0..1 */
    return clamp(Math.sqrt(sum / g.buf.length) * 3.2, 0, 1);
  }, []);
}

/* ── scrubbing ────────────────────────────────────────────── */

export interface ScrubOptions {
  duration: number;
  media: MediaApi;
  state: MediaState;
  /** snap targets, seconds (chapters) */
  snaps?: number[];
  /** how close, px, the pointer must come for a snap to catch it */
  snapPx?: number;
  onSnap?: () => void;
  onRelease?: () => void;
}

/**
 * Pointer → time on a horizontal track. While held the media is paused
 * (a seek per pointer move on a PLAYING element stutters) and resumes on
 * release. `hover` is the time under a hovering pointer, `drag` the time
 * being held, `vel` a smoothed fraction-per-frame for effects.
 */
export function useScrub(track: RefObject<HTMLElement | null>, o: ScrubOptions) {
  const [hover, setHover] = useState<{ t: number; x: number } | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [resume, setResume] = useState(false);
  const held = useRef<{ was: boolean; last: number; lt: number; snapped: number | null } | null>(null);
  const vel = useRef(0);
  const opts = useRef(o);
  opts.current = o;

  const at = (clientX: number) => {
    const el = track.current;
    const { duration, snaps, snapPx = 10 } = opts.current;
    if (!el || !duration) return { t: 0, x: 0, snap: null as number | null };
    const r = el.getBoundingClientRect();
    const x = clamp(clientX - r.left, 0, r.width);
    let t = (x / (r.width || 1)) * duration;
    let snap: number | null = null;
    for (const s of snaps ?? []) {
      const sx = (s / duration) * r.width;
      if (Math.abs(sx - x) <= snapPx) {
        t = s;
        snap = s;
        break;
      }
    }
    return { t, x: snap === null ? x : (snap / duration) * r.width, snap };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || !opts.current.duration) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    const { t, x, snap } = at(e.clientX);
    held.current = { was: opts.current.state.playing, last: t, lt: performance.now(), snapped: snap };
    setResume(opts.current.state.playing);
    vel.current = 0;
    opts.current.media.pause();
    opts.current.media.seek(t);
    setDrag(t);
    setHover({ t, x });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const { t, x, snap } = at(e.clientX);
    setHover({ t, x });
    const h = held.current;
    if (!h) return;
    const now = performance.now();
    const dt = Math.max(1, now - h.lt) / 16.67;
    const d = opts.current.duration || 1;
    vel.current = vel.current * 0.5 + ((t - h.last) / d / dt) * 0.5;
    h.last = t;
    h.lt = now;
    if (snap !== null && snap !== h.snapped) opts.current.onSnap?.();
    h.snapped = snap;
    opts.current.media.seek(t);
    setDrag(t);
  };
  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const h = held.current;
    held.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
    if (!h) return;
    setDrag(null);
    if (e.pointerType !== "mouse") setHover(null);
    if (h.was) opts.current.media.play();
    opts.current.onRelease?.();
  };
  const onPointerLeave = () => {
    if (!held.current) setHover(null);
  };

  return {
    hover,
    drag,
    /** true while a drag holds a PLAYING element paused: show it as playing */
    holding: drag !== null && resume,
    vel,
    bind: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onPointerLeave },
  };
}

/** Keyboard for a time slider: ←/→ 5 s, PageUp/Down 10%, Home/End, Space toggles. Returns true if handled. */
export function scrubKeys(e: React.KeyboardEvent, s: MediaState, media: MediaApi, step = 5) {
  const d = s.duration;
  const big = Math.max(step, d / 10);
  const moves: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
  if (e.key in moves) media.seek(s.time + moves[e.key]);
  else if (e.key === "Home") media.seek(0);
  else if (e.key === "End") media.seek(Math.max(0, d - 0.05));
  else if (e.key === " " || e.key === "k" || e.key === "K") media.toggle();
  else return false;
  e.preventDefault();
  e.stopPropagation();
  return true;
}

/* ── play ⇄ pause, one shape ──────────────────────────────── */

/* the triangle (tip at 19,12) cut at x=12.5 into two quads, and the
   two pause bars, point for point: TL, TR, BR, BL */
const PLAY = [
  [7, 5, 12.5, 8.4, 12.5, 15.6, 7, 19],
  [12.5, 8.4, 19, 12, 19, 12, 12.5, 15.6],
];
const PAUSE = [
  [6.5, 5, 10, 5, 10, 19, 6.5, 19],
  [14, 5, 17.5, 5, 17.5, 19, 14, 19],
];

/** Play ⇄ pause glyph that morphs on the spring (instant under calm / reduced motion). */
export function PlayGlyph({ playing, className }: { playing: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  /* tune 40: one soft overshoot — the bars land slightly too wide and settle */
  const k = useSpring(playing ? 100 : 0, 40, isCalm(ref.current)) / 100;
  const d = PLAY.map((p, i) => {
    const q = p.map((v, j) => v + (PAUSE[i][j] - v) * k);
    return `M${q[0]} ${q[1]}L${q[2]} ${q[3]}L${q[4]} ${q[5]}L${q[6]} ${q[7]}Z`;
  }).join("");
  return (
    <svg ref={ref} data-slot="play-glyph" viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      {/* a round-joined stroke of the fill's own colour rounds every corner, triangle and bars alike */}
      <path d={d} fill="currentColor" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

/* ── playback rate ────────────────────────────────────────── */

export interface RateTabsProps {
  value: number;
  onChange: (rate: number) => void;
  options?: number[];
  className?: string;
  size?: "sm" | "md";
}

/** 1× · 1.5× · 2× with one ink pill that travels (the ChartTabs move, ink on paper). */
export function RateTabs({ value, onChange, options = [1, 1.5, 2], className, size = "md" }: RateTabsProps) {
  const sound = useSound();
  const at = Math.max(0, options.indexOf(value));
  return (
    <div
      data-slot="rate-tabs"
      role="group"
      aria-label="Playback speed"
      className={cn("relative flex p-0.5 rounded-pill bg-fill", className)}
      style={{ "--n": options.length, "--at": at } as CSSProperties}
    >
      {/* the pill: same width as a tab, moved by whole tabs; the curve has a
          hair of overshoot so it lands rather than stops */}
      <span
        aria-hidden
        data-slot="rate-tabs-pill"
        className={cn(
          "absolute top-0.5 bottom-0.5 left-0.5 rounded-pill bg-ink",
          "w-[calc((100%-4px)/var(--n))] translate-x-[calc(var(--at)*100%)]",
          "transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.16,0.5,1)] calm:duration-0 motion-reduce:duration-0",
        )}
      />
      {options.map((r, i) => (
        <button
          key={r}
          type="button"
          data-slot="rate-tabs-item"
          aria-pressed={i === at}
          aria-label={`${r}× speed`}
          data-on={i === at || undefined}
          onClick={() => {
            if (i === at) return;
            sound.play("tap", { strength: 0.5 });
            onChange(r);
          }}
          className={cn(
            "relative z-1 flex-1 rounded-pill border-0 bg-transparent cursor-pointer tabular-nums",
            size === "sm" ? "h-7 min-w-10 px-2 text-[12.5px]" : "h-8 min-w-12 px-2.5 text-[13px]",
            "font-medium tracking-[-0.01em] text-mute hover:text-ink data-on:text-paper",
            "transition-[color,scale] duration-200 ease-[cubic-bezier(0.28,1.2,0.36,1)] active:scale-94",
            "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          )}
        >
          {r}×
        </button>
      ))}
    </div>
  );
}

/* ── volume ───────────────────────────────────────────────── */

export function VolumeControl({
  state,
  media,
  slider = true,
  className,
  sliderClassName,
}: {
  state: MediaState;
  media: MediaApi;
  slider?: boolean;
  className?: string;
  sliderClassName?: string;
}) {
  const sound = useSound();
  const muted = state.muted || state.volume === 0;
  const Icon = muted ? VolumeX : state.volume < 0.5 ? Volume1 : Volume2;
  return (
    <div data-slot="volume" className={cn("flex items-center gap-1 min-w-0", className)}>
      <button
        type="button"
        data-slot="volume-mute"
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        onClick={() => {
          sound.play("tap", { strength: 0.45 });
          if (muted && state.volume === 0) media.setVolume(0.6);
          media.setMuted(!muted);
        }}
        className={cn(
          "grid place-items-center size-9 flex-none rounded-pill text-ink bg-transparent hover:bg-fill cursor-pointer [&_svg]:size-5",
          "transition-[background-color,scale] duration-(--rap-dur-fast) active:scale-92",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
        )}
      >
        <Icon />
      </button>
      {slider && (
        /* the ElasticSlider's ticks would play over the music: silenced here */
        <SoundProvider enabled={false}>
          <ElasticSlider
            aria-label="Volume"
            bubble="active"
            min={0}
            max={100}
            value={muted ? 0 : Math.round(state.volume * 100)}
            onValueChange={(v) => media.setVolume(v / 100)}
            format={(v) => `${v}%`}
            className={cn("min-w-0 w-28", sliderClassName)}
          />
        </SoundProvider>
      )}
    </div>
  );
}
