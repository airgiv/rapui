/* ══ AudioPlayer ══════════════════════════════════════════
   A track on a card: the round play button, the title, the time,
   and the track itself drawn as its own waveform — the thing you
   scrub is the sound, not a grey line standing in for it.

   ── THE WAVEFORM IS THE SCRUBBER ────────────────────────
   Bars come from the decoded file (MediaKit.usePeaks: RMS in 256
   buckets, resampled to as many 3px bars as fit with 2px gaps —
   rap/ui's tight gap, so it reads as one object, not a comb).
   What has played is the same bars in ink, drawn as a second
   layer clipped at the playhead, so a bar is half-filled while
   the playhead crosses it instead of flicking over whole. The
   part you are hovering toward is pre-shaded at 35% — "you would
   land here". Drag anywhere to seek: ChartKit's hairline and a
   time pill follow the pointer, the media is paused while held
   (a seek per pointermove on a playing element stutters) and
   resumes on release.

   ── A MAGNIFIER UNDER THE POINTER ───────────────────────
   Bars within 44px of the pointer swell by up to 40%, on a raised
   cosine so the lens has no edge. Bars are drawn at 70% of the
   height so the swollen ones still fit: 0.7 × 1.4 = 0.98.

   ── DELIGHT: IT BREATHES ────────────────────────────────
   While it plays, the bars breathe with the music's live level
   (an AnalyserNode spliced in on first play — same-origin media
   only, see MediaKit.useLevel). The swell is strongest at the
   playhead and fades along a Gaussian (σ = 12% of the width), so
   the sound looks like it is coming FROM the point being played,
   and a whole-card pulse is avoided — that reads as a VU meter,
   not a waveform. Level is smoothed (fast attack 0.5, slow
   release 0.12) so a kick lifts the bars and they sink back.
   Calm and reduced motion: still bars, no lens, the glyph swaps.

   ── SOUND ───────────────────────────────────────────────
   Only presses click (play, speed). Scrubbing and the volume
   slider stay silent: a UI ratchet over the music is the one
   place interface sound is unwelcome. */
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from "react";
import { useSound } from "../sound";
import { isCalm } from "../hooks/useGlide";
import { clamp, cn } from "../utils";
import { RollingNumber } from "./ScrubNumber";
import { PlayGlyph, RateTabs, VolumeControl, fmt, resample, scrubKeys, useLevel, useMedia, usePeaks, useScrub, useWidth, valueText } from "./MediaKit";

const BAR = 3;
const GAP = 2;
/* the lens: radius in px and the most a bar grows */
const LENS = 44;
const SWELL = 0.4;
/* how much the live level can add at the playhead, and everywhere */
const BREATH_PEAK = 0.45;
const BREATH_ALL = 0.12;

const TONES = {
  ink: "bg-ink",
  flame: "bg-flame",
  blue: "bg-select",
} as const;

export interface AudioPlayerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  src: string;
  title?: string;
  artist?: string;
  /** Precomputed waveform (0..1). Skips decoding the file. */
  peaks?: number[];
  /** Colour of the played bars. */
  tone?: keyof typeof TONES;
  /** Playback speeds offered; pass [] to hide the speed tabs. */
  rates?: number[];
  /** Show the volume control. */
  volume?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  /** Turn the breathing bars off for this instance (they are always off under calm). */
  playful?: boolean;
  /** Called when playback starts / stops. */
  onPlayingChange?: (playing: boolean) => void;
}

/** A card audio player whose scrubber is the track's own waveform. */
export const AudioPlayer = forwardRef<HTMLDivElement, AudioPlayerProps>(function AudioPlayer(
  { src, title, artist, peaks: given, tone = "ink", rates = [1, 1.5, 2], volume = true, loop, autoPlay, playful = true, onPlayingChange, className, ...rest },
  ref,
) {
  const audio = useRef<HTMLAudioElement>(null);
  const [s, media] = useMedia(audio, src);
  const sound = useSound();
  const peaks = usePeaks(src, given);
  const [wave, w] = useWidth<HTMLDivElement>();
  const scrub = useScrub(wave, { duration: s.duration, media, state: s });
  /* a drag pauses the element under the hand; it still reads as playing */
  const playing = s.playing || scrub.holding;
  const read = useLevel(audio, playful);

  const n = Math.max(8, Math.floor((w + GAP) / (BAR + GAP)));
  const bars = resample(peaks.v, n);
  const d = s.duration;
  const t = scrub.drag ?? s.time;
  const p = d ? clamp(t / d, 0, 1) : 0;

  useEffect(() => onPlayingChange?.(playing), [playing, onPlayingChange]);

  /* the breath: level read each frame while playing, smoothed with a
     quick rise and a slow fall */
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!playing || !playful) {
      setLevel(0);
      return;
    }
    let raf = 0;
    let l = 0;
    const tick = () => {
      if (isCalm(wave.current)) {
        setLevel(0);
      } else {
        const v = read();
        l += (v - l) * (v > l ? 0.5 : 0.12);
        setLevel(l);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, playful, read, wave]);

  const calm = isCalm(wave.current);
  const hx = scrub.hover && !calm ? scrub.hover.x : null;
  const step = w / n;
  const scale = (i: number) => {
    const cx = i * step + step / 2;
    let k = 1;
    if (hx !== null) {
      const dd = Math.abs(cx - hx) / LENS;
      if (dd < 1) k += SWELL * (0.5 + 0.5 * Math.cos(Math.PI * dd));
    }
    if (level > 0.001) {
      const g = Math.exp(-(((cx / (w || 1) - p) / 0.12) ** 2));
      k *= 1 + level * (BREATH_ALL + BREATH_PEAK * g);
    }
    return k;
  };

  const drawBars = (cls: string, slot: string) => (
    <div data-slot={slot} aria-hidden className="absolute inset-0 flex items-center gap-[2px]">
      {bars.map((b, i) => (
        <span
          key={i}
          className={cn("flex-1 min-w-px rounded-pill", cls)}
          style={{ height: `${Math.max(6, b * 70)}%`, transform: `scaleY(${scale(i).toFixed(3)})` }}
        />
      ))}
    </div>
  );

  const hoverP = scrub.hover && d ? clamp(scrub.hover.t / d, 0, 1) : null;
  const clipTo = (a: number) => `inset(0 ${((1 - a) * 100).toFixed(3)}% 0 0)`;

  return (
    <div
      ref={ref}
      data-slot="audio-player"
      data-state={playing ? "playing" : "paused"}
      className={cn("@container flex flex-col gap-4 w-full min-w-0 max-w-xl p-4 sm:p-5 rounded-card bg-surface text-ink font-sans", className)}
      {...rest}
    >
      <audio ref={audio} src={src} preload="auto" loop={loop} autoPlay={autoPlay} data-slot="audio-player-media" />

      <div data-slot="audio-player-head" className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          data-slot="audio-player-play"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => {
            sound.play("tap", { pitch: playing ? 0.8 : 1 });
            media.toggle();
          }}
          className={cn(
            "grid place-items-center size-14 flex-none rounded-pill bg-ink text-paper cursor-pointer [&_svg]:size-6",
            "transition-[scale,background-color] duration-(--rap-dur-fast) ease-spring hover:bg-ink-2 active:scale-92",
            "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          )}
        >
          <PlayGlyph playing={playing} />
        </button>
        <div data-slot="audio-player-meta" className="flex-1 min-w-0">
          {title && <div data-slot="audio-player-title" className="text-[1.0625rem] font-medium tracking-[-0.02em] truncate">{title}</div>}
          {artist && <div data-slot="audio-player-artist" className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute truncate">{artist}</div>}
        </div>
        <div data-slot="audio-player-time" className="flex-none flex items-baseline gap-1 text-[0.9375rem] font-medium tracking-[-0.01em] tabular-nums" aria-hidden>
          <RollingNumber text={fmt(t)} />
          <span className="text-mute">/ {fmt(d)}</span>
        </div>
      </div>

      <div
        ref={wave}
        data-slot="audio-player-wave"
        role="slider"
        tabIndex={0}
        aria-label={title ? `Seek ${title}` : "Seek"}
        aria-valuemin={0}
        aria-valuemax={Math.round(d)}
        aria-valuenow={Math.round(t)}
        aria-valuetext={valueText(t, d)}
        onKeyDown={(e: KeyboardEvent) => scrubKeys(e, s, media)}
        {...scrub.bind}
        data-scrub={scrub.drag !== null || undefined}
        data-peaks={peaks.real ? "decoded" : "seeded"}
        className={cn(
          "relative h-16 cursor-pointer touch-none select-none rounded-row",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
        )}
        style={{ "--p": p } as CSSProperties}
      >
        {drawBars("bg-fill-strong", "audio-player-bars")}
        {hoverP !== null && hoverP > p && (
          <div data-slot="audio-player-ahead" className="absolute inset-0 opacity-35" style={{ clipPath: clipTo(hoverP) }}>
            {drawBars(TONES[tone], "audio-player-bars-ahead")}
          </div>
        )}
        <div data-slot="audio-player-played" className="absolute inset-0" style={{ clipPath: clipTo(p) }}>
          {drawBars(TONES[tone], "audio-player-bars-played")}
        </div>
        {scrub.hover && (
          <>
            {/* ChartKit's guide: a hairline at 28% ink, only while reading */}
            <i aria-hidden data-slot="audio-player-guide" className="absolute -top-1 -bottom-1 w-px -ml-[0.5px] bg-current opacity-28 pointer-events-none" style={{ left: scrub.hover.x }} />
            <span
              aria-hidden
              data-slot="audio-player-readout"
              className={cn(
                "absolute bottom-[calc(100%+6px)] px-2 py-1 rounded-pill bg-ink text-paper pointer-events-none",
                "text-[0.75rem] font-medium tabular-nums leading-none whitespace-nowrap -translate-x-1/2 fun:animate-pop-in",
              )}
              style={{ left: clamp(scrub.hover.x, 22, Math.max(22, w - 22)) }}
            >
              {fmt(scrub.hover.t)}
            </span>
          </>
        )}
      </div>

      {(volume || rates.length > 0) && (
        <div data-slot="audio-player-foot" className="flex flex-wrap items-center justify-between gap-2">
          {volume ? <VolumeControl state={s} media={media} sliderClassName="w-20 @sm:w-28" /> : <span />}
          {rates.length > 0 && <RateTabs value={s.rate} options={rates} onChange={media.setRate} size="sm" />}
        </div>
      )}
    </div>
  );
});
