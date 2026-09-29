/* ══ VideoPlayer ══════════════════════════════════════════
   A rounded frame with the controls floating in one pill at the
   bottom — the card's own shape repeated small — that slides away
   when you stop moving, so the picture gets the whole frame.

   ── WHEN THE CONTROLS LEAVE ─────────────────────────────
   2.4 s after the last pointer move or key, while playing, and
   never while the pointer is on the pill, focus is inside it, or
   the scrubber is held. They leave by sliding down past the edge
   (their own height + 16px) and fading on --rap-ease-rm, and come
   back the instant the pointer moves — a hide can be lazy, a
   return cannot. The cursor hides with them. Calm: fade only.

   ── THE SCRUBBER ────────────────────────────────────────
   Split at the chapters into segments with a 3px cut between them
   (the chapter "ticks" are gaps, not marks, so nothing sits on the
   line), each carrying its own buffered and played fill. Hovering
   shows a bubble with the time, the chapter title and a live
   thumbnail — a second, muted <video> of the same file seeking to
   the hovered time (one seek in flight at a time, the latest wins),
   so no canvas and no CORS taint. Dragging snaps magnetically to a
   chapter start within 10px, with one detent click as it catches.

   ── DELIGHT: THE FRAME HAS MASS ─────────────────────────
   Scrubbing drags the picture: the frame skews in the direction
   of travel by its speed (150° per unit of duration a frame, capped
   at 7°, a touch of scale so the corners stay covered) and, on
   release, springs upright on Bencho's spring (0.16 / 0.72 — one
   small overshoot). Arrow-key seeks give it a small kick. And the
   progress line, let go, squishes — thick, thin, a hair thick,
   rest (VideoPlayer.css) — like a rubber band dropped on the desk.
   The big centre button squashes flat under the thumb and springs
   back. Calm / reduced motion: none of it.

   ── SOUND ───────────────────────────────────────────────
   Presses click and a chapter catch ticks once; nothing plays
   while the film does its own talking. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { useSound } from "../sound";
import { isCalm } from "../hooks/useGlide";
import { useReplay } from "../hooks/useReplay";
import { clamp, cn } from "../utils";
import { Loader, Maximize, Minimize } from "../icons";
import { RollingNumber } from "./ScrubNumber";
import { PlayGlyph, VolumeControl, fmt, scrubKeys, useMedia, useScrub, valueText } from "./MediaKit";
import "./VideoPlayer.css";

export interface VideoChapter {
  /** Start, seconds. */
  at: number;
  title: string;
}

export interface VideoPlayerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  src: string;
  poster?: string;
  /** Shown top-left with the controls, and used in labels. */
  title?: string;
  chapters?: VideoChapter[];
  /** CSS aspect-ratio of the frame. */
  aspect?: string;
  /** Live thumbnail in the scrub bubble (loads the file a second time, from cache). */
  preview?: boolean;
  /** ms of stillness before the controls leave. */
  hideAfter?: number;
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  /** Turn the skew and squish off for this instance (always off under calm). */
  playful?: boolean;
}

/* skew per unit of duration a frame, and its cap (deg) */
const SKEW_K = 150;
const SKEW_MAX = 7;
/* Bencho's spring, tune 50 */
const K = 0.16;
const D = 0.72;

const iconBtn = cn(
  "grid place-items-center size-10 flex-none rounded-pill text-ink bg-transparent hover:bg-fill cursor-pointer [&_svg]:size-5",
  "transition-[background-color,scale] duration-(--rap-dur-fast) ease-spring active:scale-90",
  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
);

/* Picture-in-picture: not in the icon set, drawn in its stroke (Phosphor Light-ish, 1.5 on 24) */
function PipGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <rect x="12" y="11.5" width="6.5" height="5" rx="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A video frame with floating pill controls, chapters, a thumbnail scrub bubble and fullscreen. */
export const VideoPlayer = forwardRef<HTMLDivElement, VideoPlayerProps>(function VideoPlayer(
  {
    src,
    poster,
    title,
    chapters = [],
    aspect = "16 / 9",
    preview = true,
    hideAfter = 2400,
    loop,
    autoPlay,
    muted,
    playful = true,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  const video = useRef<HTMLVideoElement>(null);
  const [s, media] = useMedia(video, src);
  const sound = useSound();
  const bar = useRef<HTMLDivElement>(null);
  const squish = useReplay();

  const chaps = [...chapters].sort((a, b) => a.at - b.at);
  const d = s.duration;
  const scrub = useScrub(bar, {
    duration: d,
    media,
    state: s,
    snaps: chaps.map((c) => c.at).filter((a) => a > 0),
    onSnap: () => sound.detent(0.7),
    onRelease: () => {
      if (playful && !isCalm(root.current)) squish.play();
    },
  });
  const t = scrub.drag ?? s.time;
  /* a drag pauses the element under the hand; it still reads as playing */
  const playing = s.playing || scrub.holding;

  /* ── controls: awake / asleep ─────────────────────────── */
  const [awake, setAwake] = useState(true);
  const [onPill, setOnPill] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const timer = useRef(0);
  const wake = useCallback(() => {
    setAwake(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAwake(false), hideAfter);
  }, [hideAfter]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (playing) wake();
  }, [playing, wake]);
  const shown = awake || !playing || onPill || focusIn || scrub.drag !== null;

  /* ── fullscreen, pip ───────────────────────────────────── */
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFull = () => {
    const el = root.current;
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.();
  };
  const pipOK = typeof document !== "undefined" && !!document.pictureInPictureEnabled;
  const togglePip = () => {
    const v = video.current;
    if (!v) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {});
    else void v.requestPictureInPicture?.().catch(() => {});
  };

  /* ── the skew: a spring toward the hand's speed ────────── */
  const heldRef = useRef(false);
  heldRef.current = scrub.drag !== null;
  const skew = useRef({ x: 0, v: 0, raf: 0 });
  const runSkew = useCallback(() => {
    const c = skew.current;
    if (c.raf) return;
    let prev = 0;
    const tick = (now: number) => {
      const el = video.current;
      const dt = prev ? clamp((now - prev) / 16.67, 0, 2.5) : 1;
      prev = now;
      if (!el || isCalm(root.current)) {
        c.x = c.v = 0;
        c.raf = 0;
        if (el) el.style.transform = "";
        return;
      }
      /* the hand's speed decays when it stops moving, so a held-still
         drag straightens up even before release */
      scrub.vel.current *= Math.pow(0.82, dt);
      const target = heldRef.current ? clamp(-scrub.vel.current * SKEW_K, -SKEW_MAX, SKEW_MAX) : 0;
      c.v += (target - c.x) * K * dt;
      c.v *= Math.pow(D, dt);
      c.x += c.v * dt;
      el.style.transform = Math.abs(c.x) < 0.01 ? "" : `skewX(${c.x.toFixed(3)}deg) scale(${(1 + Math.abs(c.x) * 0.012).toFixed(4)})`;
      if (!heldRef.current && Math.abs(c.x) < 0.01 && Math.abs(c.v) < 0.01) {
        c.x = c.v = 0;
        el.style.transform = "";
        c.raf = 0;
        return;
      }
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
  }, [scrub.vel]);
  useEffect(() => {
    if (scrub.drag !== null && playful) runSkew();
  }, [scrub.drag, playful, runSkew]);
  useEffect(() => () => cancelAnimationFrame(skew.current.raf), []);
  const kick = (dir: number) => {
    if (!playful || isCalm(root.current)) return;
    skew.current.v += -dir * 1.6;
    runSkew();
  };

  /* ── keyboard ──────────────────────────────────────────── */
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target as HTMLElement).tagName;
    const onButton = tag === "BUTTON" || tag === "INPUT";
    const onSlider = (e.target as HTMLElement).getAttribute("role") === "slider";
    wake();
    const k = e.key;
    if ((k === " " || k === "Enter") && onButton) return;
    if (k === " " || k === "k" || k === "K") media.toggle();
    else if (k === "ArrowRight" || k === "ArrowLeft") {
      if (onSlider) return;
      const dir = k === "ArrowRight" ? 1 : -1;
      media.seek(s.time + dir * 5);
      kick(dir);
    } else if ((k === "ArrowUp" || k === "ArrowDown") && !onSlider) media.setVolume(s.volume + (k === "ArrowUp" ? 0.1 : -0.1));
    else if (k === "m" || k === "M") media.setMuted(!s.muted);
    else if (k === "f" || k === "F") toggleFull();
    else return;
    e.preventDefault();
  };

  /* ── scrubber geometry ─────────────────────────────────── */
  const segs = (() => {
    if (!d) return [{ a: 0, b: 1, title: "" }];
    const starts = chaps.filter((c) => c.at > 0 && c.at < d);
    const out: { a: number; b: number; title: string }[] = [];
    let a = 0;
    let name = chaps.find((c) => c.at <= 0)?.title ?? "";
    for (const c of starts) {
      out.push({ a, b: c.at, title: name });
      a = c.at;
      name = c.title;
    }
    out.push({ a, b: d, title: name });
    return out;
  })();
  const chapterAt = (time: number) => [...chaps].reverse().find((c) => c.at <= time + 0.01)?.title;
  const frac = (v: number, a: number, b: number) => clamp((v - a) / (b - a || 1), 0, 1);
  const hoverT = scrub.hover?.t ?? null;

  /* the bubble is placed in the player's coordinates and kept inside it */
  const [box, setBox] = useState({ left: 0, w: 0, root: 0 });
  useEffect(() => {
    const measure = () => {
      const b = bar.current?.getBoundingClientRect();
      const r = root.current?.getBoundingClientRect();
      if (b && r) setBox({ left: b.left - r.left, w: b.width, root: r.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (root.current) ro.observe(root.current);
    if (bar.current) ro.observe(bar.current);
    return () => ro.disconnect();
  }, []);
  const narrow = box.root < 520;
  const bubbleW = preview && !narrow ? 176 : 96;
  const bubbleX = scrub.hover ? clamp(box.left + scrub.hover.x, bubbleW / 2 + 8, box.root - bubbleW / 2 - 8) - box.left : 0;

  /* ── the preview video: latest seek wins, one in flight ── */
  const [wantPreview, setWantPreview] = useState(false);
  const pv = useRef<HTMLVideoElement>(null);
  const pending = useRef<number | null>(null);
  useEffect(() => {
    if (hoverT !== null && preview && !narrow) setWantPreview(true);
  }, [hoverT, preview, narrow]);
  useEffect(() => {
    const v = pv.current;
    if (!v || hoverT === null) return;
    if (v.seeking) {
      pending.current = hoverT;
      return;
    }
    v.currentTime = hoverT;
  }, [hoverT, wantPreview]);
  const onPreviewSeeked = () => {
    const v = pv.current;
    if (v && pending.current !== null) {
      v.currentTime = pending.current;
      pending.current = null;
    }
  };

  return (
    <div
      ref={root}
      data-slot="video-player"
      data-state={playing ? "playing" : "paused"}
      data-controls={shown ? "shown" : "hidden"}
      data-fullscreen={full || undefined}
      role="region"
      aria-label={title ? `Video: ${title}` : "Video player"}
      tabIndex={-1}
      onKeyDown={keys}
      onPointerMove={wake}
      onPointerDown={wake}
      onPointerLeave={() => playing && setAwake(false)}
      onFocus={(e) => setFocusIn(e.target !== root.current && !!e.target.closest("[data-slot=video-player-controls]"))}
      onBlur={() => setFocusIn(false)}
      className={cn(
        "@container group/vp relative isolate w-full overflow-hidden rounded-card bg-black text-ink font-sans select-none outline-none",
        "data-fullscreen:rounded-none",
        !shown && "cursor-none",
        className,
      )}
      style={{ aspectRatio: full ? undefined : aspect, ...style }}
      {...rest}
    >
      <video
        ref={video}
        data-slot="video-player-media"
        src={src}
        poster={poster}
        loop={loop}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-contain will-change-transform"
        onClick={() => media.toggle()}
        onDoubleClick={toggleFull}
      />

      {title && (
        <div
          data-slot="video-player-title"
          className={cn(
            "absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate px-3.5 py-2 rounded-pill bg-surface/90 backdrop-blur-md",
            "text-[0.875rem] font-medium tracking-[-0.01em] pointer-events-none",
            "transition-[opacity,translate] duration-(--rap-dur) ease-rm",
            !shown && "opacity-0 -translate-y-[calc(100%+16px)] calm:translate-y-0",
          )}
        >
          {title}
        </div>
      )}

      {/* the big button: shown while paused; squashes flat under the press */}
      <button
        type="button"
        data-slot="video-player-center"
        aria-label={playing ? "Pause" : "Play"}
        tabIndex={playing ? -1 : 0}
        onClick={() => {
          sound.play("tap", { pitch: 0.9 });
          media.toggle();
        }}
        className={cn(
          "absolute left-1/2 top-1/2 -translate-1/2 grid place-items-center size-16 @md:size-20 rounded-pill cursor-pointer",
          "bg-surface/92 backdrop-blur-md text-ink [&_svg]:size-7 @md:[&_svg]:size-8",
          "transition-[opacity,scale] duration-(--rap-dur-fast) ease-spring",
          "fun:active:scale-x-118 fun:active:scale-y-80 fun:active:duration-100",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-3",
          playing && "opacity-0 scale-75 pointer-events-none",
        )}
      >
        <PlayGlyph playing={playing} />
      </button>
      {s.waiting && (
        <span data-slot="video-player-wait" aria-hidden className="absolute left-1/2 top-1/2 -translate-1/2 text-white/85 [&_svg]:size-9 animate-spin">
          <Loader />
        </span>
      )}

      {/* ── the pill ── */}
      <div
        data-slot="video-player-controls"
        onPointerEnter={(e) => e.pointerType === "mouse" && setOnPill(true)}
        onPointerLeave={() => setOnPill(false)}
        className={cn(
          "absolute inset-x-2 bottom-2 @md:inset-x-3 @md:bottom-3 flex items-center gap-0.5 @md:gap-1 p-1 @md:p-1.5 rounded-pill",
          "bg-surface/92 backdrop-blur-md shadow-pop",
          "transition-[opacity,translate] duration-(--rap-dur) ease-rm",
          !shown && "opacity-0 translate-y-[calc(100%+16px)] pointer-events-none calm:translate-y-0",
        )}
      >
        <button
          type="button"
          data-slot="video-player-play"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => {
            sound.play("tap", { pitch: playing ? 0.8 : 1 });
            media.toggle();
          }}
          className={cn(iconBtn, "bg-ink text-paper hover:bg-ink-2")}
        >
          <PlayGlyph playing={playing} className="size-5" />
        </button>

        <div data-slot="video-player-time" aria-hidden className="flex-none flex items-baseline gap-1 px-1.5 @md:px-2 text-[0.8125rem] @md:text-[0.875rem] font-medium tabular-nums">
          <RollingNumber text={fmt(t)} />
          <span className="hidden @md:inline text-mute">/ {fmt(d)}</span>
        </div>

        {/* the scrubber: a control-height hit area around a 6px line */}
        <div
          ref={bar}
          data-slot="video-player-scrubber"
          role="slider"
          tabIndex={0}
          aria-label={title ? `Seek ${title}` : "Seek"}
          aria-valuemin={0}
          aria-valuemax={Math.round(d)}
          aria-valuenow={Math.round(t)}
          aria-valuetext={`${valueText(t, d)}${chapterAt(t) ? `, ${chapterAt(t)}` : ""}`}
          onKeyDown={(e) => {
            wake();
            if (scrubKeys(e, s, media)) {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") kick(e.key === "ArrowRight" ? 1 : -1);
            }
          }}
          {...scrub.bind}
          data-scrub={scrub.drag !== null || undefined}
          className="group/bar relative flex-1 min-w-12 h-10 mx-1 @md:mx-2 cursor-pointer touch-none rounded-pill focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
        >
          <div
            data-slot="video-player-rail"
            className={cn("absolute inset-x-0 top-1/2 h-1.5 -mt-[3px]", squish.cls("fun:animate-[rap-vp-squish_480ms_var(--rap-ease-out)]"))}
            onAnimationEnd={squish.done}
          >
            {segs.map((g, i) => {
              const on = hoverT !== null && hoverT >= g.a && hoverT <= g.b;
              return (
                <span
                  key={i}
                  data-slot="video-player-segment"
                  className={cn(
                    "absolute inset-y-0 overflow-hidden rounded-pill bg-fill-strong",
                    "transition-[scale] duration-(--rap-dur-fast) ease-spring",
                    on && "scale-y-150",
                  )}
                  style={{ left: `calc(${(g.a / (d || 1)) * 100}% + ${i ? 1.5 : 0}px)`, width: `calc(${((g.b - g.a) / (d || 1)) * 100}% - ${i ? 1.5 : 0}px - ${i < segs.length - 1 ? 1.5 : 0}px)` }}
                >
                  <span data-slot="video-player-buffered" className="absolute inset-y-0 left-0 bg-ink/15" style={{ width: `${frac(s.buffered, g.a, g.b) * 100}%` }} />
                  {on && hoverT !== null && hoverT > t && (
                    <span className="absolute inset-y-0 left-0 bg-ink/25" style={{ width: `${frac(hoverT, g.a, g.b) * 100}%` }} />
                  )}
                  <span data-slot="video-player-played" className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${frac(t, g.a, g.b) * 100}%` }} />
                </span>
              );
            })}
          </div>
          <span
            data-slot="video-player-thumb"
            aria-hidden
            className={cn(
              "absolute top-1/2 size-3.5 -mt-[7px] -ml-[7px] rounded-full bg-ink shadow-[0_0_0_2px_var(--rap-surface)] pointer-events-none",
              "scale-0 transition-[scale] duration-(--rap-dur-fast) ease-spring",
              "group-hover/bar:scale-100 group-focus-visible/bar:scale-100 group-data-scrub/bar:scale-115",
            )}
            style={{ left: `${(d ? t / d : 0) * 100}%` }}
          />
          {/* the bubble */}
          {scrub.hover && (
            <div
              data-slot="video-player-bubble"
              aria-hidden
              className="absolute bottom-[calc(100%+10px)] -translate-x-1/2 flex flex-col items-center gap-1 p-1 rounded-pop bg-surface shadow-pop pointer-events-none fun:animate-pop-in origin-bottom"
              style={{ left: bubbleX, width: bubbleW }}
            >
              {wantPreview && preview && (
                <video
                  ref={pv}
                  data-slot="video-player-preview"
                  src={src}
                  muted
                  playsInline
                  preload="auto"
                  onSeeked={onPreviewSeeked}
                  onLoadedMetadata={(e) => hoverT !== null && (e.currentTarget.currentTime = hoverT)}
                  className={cn("w-full aspect-video rounded-[14px] bg-black object-cover", narrow && "hidden")}
                />
              )}
              <div className="flex flex-col items-center px-2 pb-1 pt-0.5 max-w-full">
                <span className="text-[0.8125rem] font-medium tabular-nums">{fmt(scrub.hover.t)}</span>
                {chapterAt(scrub.hover.t) && <span className="max-w-full truncate text-[0.75rem] font-medium tracking-[-0.01em] text-mute">{chapterAt(scrub.hover.t)}</span>}
              </div>
            </div>
          )}
        </div>

        <VolumeControl state={s} media={media} className="hidden @sm:flex" sliderClassName="hidden @2xl:flex w-24" />
        {pipOK && (
          <button type="button" data-slot="video-player-pip" aria-label="Picture in picture" className={cn(iconBtn, "hidden @lg:grid")}
            onClick={() => {
              sound.play("tap", { strength: 0.45 });
              togglePip();
            }}
          >
            <PipGlyph />
          </button>
        )}
        <button
          type="button"
          data-slot="video-player-fullscreen"
          aria-label={full ? "Exit full screen" : "Full screen"}
          aria-pressed={full}
          onClick={() => {
            sound.play("tap", { strength: 0.45 });
            toggleFull();
          }}
          className={iconBtn}
        >
          {full ? <Minimize /> : <Maximize />}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{playing ? "" : t > 0 ? `Paused at ${fmt(t)}` : ""}</span>
    </div>
  );
});
