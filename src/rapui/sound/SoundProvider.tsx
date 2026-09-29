/* ───────────────────────────────────────────────────────────
   Opt-in interface sound. Off unless a <SoundProvider enabled>
   sits above the component, so nothing in rap/ui ever makes a
   noise by default.

     <SoundProvider enabled volume={0.6} fun={20}>…</SoundProvider>
     const sound = useSound();
     sound.play("tap");            // any SoundName
     sound.detent(strength)        // rate-limited notch for drags

   Rate limiting: a fast drag can cross dozens of notches a
   frame. Notches closer than 28ms apart are dropped and the
   next one plays quieter, so a flick sounds like a ratchet
   spinning rather than a buzz.

   Haptics: where the device supports it (Android browsers), a
   2–8ms vibration accompanies taps and notches when `haptics`
   is on. iOS Safari ignores it silently.
   ─────────────────────────────────────────────────────────── */
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { synth, type PlayOptions, type SoundName } from "./synth";

export interface SoundSettings {
  enabled: boolean;
  /** 0..1 */
  volume: number;
  /** 0 muted and dull … 100 toy-like and bouncy */
  fun: number;
  haptics: boolean;
}

export interface SoundApi extends SoundSettings {
  play: (name: SoundName, opts?: PlayOptions) => void;
  /** A notch for sliders, dials and scrubbers — rate-limited. `pitch` bends it (e.g. with a value). */
  detent: (strength?: number, opts?: { pitch?: number }) => void;
}

const OFF: SoundApi = {
  enabled: false,
  volume: 0,
  fun: 0,
  haptics: false,
  play: () => {},
  detent: () => {},
};

const Ctx = createContext<SoundApi>(OFF);

const buzz = (ms: number) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not allowed here */
  }
};

export function SoundProvider({
  enabled = true,
  volume = 0.6,
  fun = 25,
  haptics = false,
  children,
}: Partial<SoundSettings> & { children: ReactNode }) {
  const last = useRef(0);
  const settings = useRef({ enabled, volume, fun, haptics });
  settings.current = { enabled, volume, fun, haptics };

  const play = useCallback((name: SoundName, opts?: PlayOptions) => {
    const s = settings.current;
    if (!s.enabled) return;
    if (typeof window !== "undefined" && document.documentElement.getAttribute("data-rap-sound") === "off") return;
    synth(name, s.fun, s.volume, opts);
    if (s.haptics) buzz(name === "detent" ? 2 : name === "error" ? 20 : 6);
  }, []);

  const detent = useCallback(
    (strength = 0.7, opts?: { pitch?: number }) => {
      const now = performance.now();
      const gap = now - last.current;
      if (gap < 28) return;
      last.current = now;
      // back-to-back notches are quieter: a ratchet, not a buzz
      play("detent", { strength: strength * (gap < 70 ? 0.6 : 1), pitch: opts?.pitch });
    },
    [play],
  );

  const api = useMemo<SoundApi>(() => ({ enabled, volume, fun, haptics, play, detent }), [enabled, volume, fun, haptics, play, detent]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Sound for this component. Silent (no-op) without an enabled SoundProvider above it. */
export function useSound(): SoundApi {
  return useContext(Ctx);
}
