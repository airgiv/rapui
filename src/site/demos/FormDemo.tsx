import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, FormStack, Input, useSound } from "../../rapui";
import type { StackState } from "../../rapui";
import { cn } from "../../rapui/utils";

/* ── a tape of ticks for the party size ─────────────────────
   Drag sideways inside the first pill and the number follows,
   one detent per person, pitched up as the party grows. 1–16 is
   the tape; typing still takes any number (40 won't fit, and it
   says so). The lit ticks are the people you are bringing. */
function PartyScrub({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const MAX = 16;
  const box = useRef<HTMLSpanElement>(null);
  const held = useRef(false);
  const sound = useSound();
  const set = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const n = Math.min(MAX, Math.max(1, Math.round(((clientX - r.left) / r.width) * (MAX - 1)) + 1));
    if (n !== value) {
      sound.detent(0.6, { pitch: 0.8 + n / 20 });
      onChange(n);
    }
  };
  return (
    <span
      ref={box}
      role="slider"
      tabIndex={-1}
      aria-label="Party size"
      aria-valuemin={1}
      aria-valuemax={MAX}
      aria-valuenow={value}
      onPointerDown={(e) => {
        held.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e.clientX);
      }}
      onPointerMove={(e) => held.current && set(e.clientX)}
      onPointerUp={() => (held.current = false)}
      className="flex items-end gap-[5px] h-7 px-1 cursor-ew-resize touch-none select-none"
    >
      {Array.from({ length: MAX }, (_, i) => (
        <i
          key={i}
          className={cn(
            "block w-[2px] rounded-full transition-[height,background-color] duration-200 ease-spring",
            i < value ? "bg-ink" : "bg-ink/20",
          )}
          style={{ height: i === value - 1 ? 26 : i % 4 === 3 ? 16 : 11 }}
        />
      ))}
    </span>
  );
}

/* The liquid stack as a sentence you fill in: "Table for 2 · on Friday · at 8 pm → Book it".
   The three pills and the button melt into one bar (a column on a phone); booking sucks the
   whole sentence into the button. Monday, a party of 40 or a 3 am snack get spat back out,
   with the guilty pill shaking its head. The presets underneath let a visitor try both endings. */

type Booking = { guests: string; day: string; time: string };

const PRESETS: { label: string; value: Booking }[] = [
  { label: "Two of us, Friday at 8", value: { guests: "2", day: "Friday", time: "8 pm" } },
  { label: "Monday night", value: { guests: "4", day: "Monday", time: "7:30 pm" } },
  { label: "The whole office", value: { guests: "40", day: "Thursday", time: "7 pm" } },
  { label: "Midnight snack", value: { guests: "1", day: "Saturday", time: "3 am" } },
];

/* 24h hour from "8 pm", "20:30", "8" (a bare 1–11 is read as evening — nobody books dinner at 8 am) */
function hourOf(time: string): number | null {
  const m = time.trim().toLowerCase().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  if (h > 23) return null;
  if (m[3] === "pm" && h < 12) h += 12;
  else if (m[3] === "am" && h === 12) h = 0;
  else if (!m[3] && h >= 1 && h <= 11) h += 12;
  return h;
}

/* which pill is wrong, and what the button says about it */
function check({ guests, day, time }: Booking): { index: number; message: string } | null {
  const n = Number(guests);
  if (!guests.trim() || !Number.isInteger(n) || n < 1) return { index: 0, message: "How many of you?" };
  if (n > 12) return { index: 0, message: `${n} won't fit` };
  if (!day.trim()) return { index: 1, message: "Which day?" };
  if (/^mon/i.test(day.trim())) return { index: 1, message: "Closed on Mondays" };
  const h = hourOf(time);
  if (h == null) return { index: 2, message: "What time?" };
  if (h < 17 && h >= 4) return { index: 2, message: "We open at 5 pm" };
  if (h < 4) return { index: 2, message: "Kitchen's asleep" };
  return null;
}

export function FormDemo() {
  const [booking, setBooking] = useState<Booking>(PRESETS[0].value);
  const [state, setState] = useState<StackState>("idle");
  const [error, setError] = useState<{ index: number; message: string } | null>(null);
  /* a column, always: in a row, submitting sucked the sentence into the button and
     left a lone pill in a wide empty bar — the stacked form keeps its shape */
  const row = false;
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const edit = (patch: Partial<Booking>) => {
    setBooking((b) => ({ ...b, ...patch }));
    if (state === "error") setState("idle");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (state !== "idle" && state !== "error") return;
    const verdict = check(booking);
    setError(verdict);
    setState("loading");
    later(() => {
      setState(verdict ? "error" : "success");
      if (!verdict) later(() => setState("idle"), 2600);
    }, 1400);
  };

  const day = booking.day.trim();
  const field = (i: number) => ({ size: "hero" as const, invalid: state === "error" && error?.index === i, autoComplete: "off" });

  return (
    <div className="flex flex-col items-center gap-14 w-full [contain:inline-size]">
      <div className="w-full max-w-[36rem]">
      <FormStack
        direction={row ? "row" : "column"}
        state={state}
        errorIndex={error?.index}
        onSubmit={submit}
        aria-label="Book a table"
      >
        <Input
          {...field(0)}
          prefix="Table for"
          aria-label="Guests"
          inputMode="numeric"
          value={booking.guests}
          onChange={(e) => edit({ guests: e.target.value })}
          suffix={<PartyScrub value={Math.min(16, Math.max(1, Number(booking.guests) || 1))} onChange={(n) => edit({ guests: String(n) })} />}
        />
        <Input {...field(1)} prefix="on" aria-label="Day" value={booking.day} onChange={(e) => edit({ day: e.target.value })} />
        <Input {...field(2)} prefix="at" aria-label="Time" value={booking.time} onChange={(e) => edit({ time: e.target.value })} />
        <Button
          size="hero"
          variant="accent"
          type="submit"
          icon
          block={!row}
          align={row ? "center" : "start"}
          className={row ? "min-w-[16.5rem]" : undefined}
          successLabel={day ? `See you ${day}` : "Booked"}
          errorLabel={error?.message}
        >
          Book it
        </Button>
      </FormStack>
      </div>
      {/* the presets: one line, set apart below the form — tap one to fill the sentence */}
      <div
        className="flex flex-nowrap justify-center gap-3 max-w-full overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[700px]:justify-start"
        role="group"
        aria-label="Try a booking"
      >
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="soft"
            type="button"
            className="flex-none"
            onClick={() => {
              setBooking(p.value);
              if (state === "error") setState("idle");
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
