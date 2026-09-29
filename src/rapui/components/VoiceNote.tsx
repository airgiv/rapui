/* ══ VoiceNote ════════════════════════════════════════════
   A chat voice message: a bubble with a play button, the note's
   waveform, how long it is, and a speed chip (1× → 1.5× → 2×, one
   press each, round and round — the gesture of messaging apps,
   where tabs would be too much furniture for a bubble).

   Outgoing notes are the selection blue with white, like every
   "mine" in rap/ui; incoming sit on the fill. The corner nearest
   the sender is pinched to 6px — the bubble's tail, without a tail.
   Everything inside colours with currentColor, so one set of
   classes serves both.

   ── DELIGHT: A FINGER READING ALONG ─────────────────────
   While it plays, the bars under the playhead lift — the current
   bar by 55%, its neighbours falling off on a Gaussian two bars
   wide — as if a finger were following the line of sound. It
   rides the playhead continuously (not bar to bar), so it glides.
   The speed chip's digits roll. Calm / reduced motion: flat bars.

   The waveform is decoded from the file like the AudioPlayer's
   (MediaKit.usePeaks) and is a slider: drag to seek, arrows ±2 s
   (a note is short, so 5 s would be a third of it). */
import { forwardRef, useRef, type HTMLAttributes } from "react";
import { useSound } from "../sound";
import { isCalm } from "../hooks/useGlide";
import { clamp, cn } from "../utils";
import { RollingNumber } from "./ScrubNumber";
import { PlayGlyph, fmt, resample, scrubKeys, useMedia, usePeaks, useScrub, valueText } from "./MediaKit";

const BARS = 34;
const LIFT = 0.55;
const SIGMA = 2; /* bars */

export interface VoiceNoteProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  src: string;
  /** "me" = outgoing (blue, tail right), "them" = incoming (fill, tail left). */
  from?: "me" | "them";
  /** Precomputed waveform (0..1). */
  peaks?: number[];
  /** When it was sent, shown small ("14:02"). */
  sent?: string;
  /** Speeds the chip cycles through; [] hides it. */
  rates?: number[];
}

/** A chat-bubble voice message with a waveform and a speed chip. */
export const VoiceNote = forwardRef<HTMLDivElement, VoiceNoteProps>(function VoiceNote(
  { src, from = "me", peaks: given, sent, rates = [1, 1.5, 2], className, ...rest },
  ref,
) {
  const audio = useRef<HTMLAudioElement>(null);
  const [s, media] = useMedia(audio, src);
  const sound = useSound();
  const peaks = usePeaks(src, given);
  const wave = useRef<HTMLDivElement>(null);
  const scrub = useScrub(wave, { duration: s.duration, media, state: s });
  /* a drag pauses the element under the hand; it still reads as playing */
  const playing = s.playing || scrub.holding;
  const bars = resample(peaks.v, BARS);
  const d = s.duration;
  const t = scrub.drag ?? s.time;
  const p = d ? clamp(t / d, 0, 1) : 0;
  const me = from === "me";
  const lifting = (playing || scrub.drag !== null) && !isCalm(wave.current);
  const head = p * BARS - 0.5;
  const rate = s.rate;
  const nextRate = rates[(Math.max(0, rates.indexOf(rate)) + 1) % Math.max(1, rates.length)];

  return (
    <div
      ref={ref}
      data-slot="voice-note"
      data-from={from}
      data-state={playing ? "playing" : "paused"}
      className={cn(
        "inline-flex items-center gap-2.5 w-full max-w-[20rem] p-2 pr-2.5 rounded-[22px] font-sans",
        me ? "bg-select text-select-ink rounded-br-[6px]" : "bg-fill text-ink rounded-bl-[6px]",
        className,
      )}
      {...rest}
    >
      <audio ref={audio} src={src} preload="auto" data-slot="voice-note-media" />
      <button
        type="button"
        data-slot="voice-note-play"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        onClick={() => {
          sound.play("tap", { pitch: playing ? 0.8 : 1 });
          media.toggle();
        }}
        className={cn(
          "grid place-items-center size-10 flex-none rounded-pill cursor-pointer [&_svg]:size-5",
          me ? "bg-select-ink text-select" : "bg-ink text-paper",
          "transition-[scale] duration-(--rap-dur-fast) ease-spring active:scale-90",
          me ? "focus-visible:outline-2 focus-visible:outline-select-ink focus-visible:outline-offset-2" : "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        )}
      >
        <PlayGlyph playing={playing} />
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div
          ref={wave}
          data-slot="voice-note-wave"
          role="slider"
          tabIndex={0}
          aria-label="Seek voice message"
          aria-valuemin={0}
          aria-valuemax={Math.round(d)}
          aria-valuenow={Math.round(t)}
          aria-valuetext={valueText(t, d)}
          onKeyDown={(e) => scrubKeys(e, s, media, 2)}
          {...scrub.bind}
          className={cn(
            "flex items-center gap-[2px] h-7 cursor-pointer touch-none rounded-[6px]",
            me ? "focus-visible:outline-2 focus-visible:outline-select-ink focus-visible:outline-offset-2" : "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          )}
        >
          {bars.map((b, i) => {
            const k = lifting ? 1 + LIFT * Math.exp(-(((i - head) / SIGMA) ** 2)) : 1;
            return (
              <span
                key={i}
                data-slot="voice-note-bar"
                data-played={i / BARS < p || undefined}
                className="flex-1 min-w-[2px] rounded-pill bg-current opacity-40 data-played:opacity-100 transition-opacity duration-150"
                style={{ height: `${Math.max(12, b * 62)}%`, transform: k === 1 ? undefined : `scaleY(${k.toFixed(3)})` }}
              />
            );
          })}
        </div>
        <div data-slot="voice-note-meta" className="flex items-center justify-between text-[0.75rem] font-medium tabular-nums opacity-80">
          <span aria-hidden>{playing || t > 0 ? <RollingNumber text={fmt(t)} /> : fmt(d)}</span>
          {sent && <span data-slot="voice-note-sent" className="opacity-75">{sent}</span>}
        </div>
      </div>

      {rates.length > 0 && (
        <button
          type="button"
          data-slot="voice-note-speed"
          aria-label={`Playback speed ${rate}×, change to ${nextRate}×`}
          onClick={() => {
            sound.play("tap", { strength: 0.45, pitch: 1 + rates.indexOf(nextRate) * 0.12 });
            media.setRate(nextRate);
          }}
          className={cn(
            "flex-none h-7 min-w-11 px-2 rounded-pill cursor-pointer text-[0.75rem] font-semibold tabular-nums",
            "bg-current/15 hover:bg-current/25 transition-[background-color,scale] duration-(--rap-dur-fast) ease-spring active:scale-90",
            me ? "focus-visible:outline-2 focus-visible:outline-select-ink focus-visible:outline-offset-2" : "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          )}
        >
          {/* bg-current tints the chip; the label keeps the bubble's ink on top */}
          <span className="inline-flex items-baseline">
            <RollingNumber text={String(rate)} />×
          </span>
        </button>
      )}
    </div>
  );
});
