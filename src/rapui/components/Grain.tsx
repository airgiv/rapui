import "./Grain.css";

/** Fixed film-grain overlay. Put once at the root. */
export function Grain({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <div
      data-slot="grain"
      /* twice the viewport, centred, so the jitter (Grain.css) never shows an
         edge; multiply darkens paper, screen lightens the dark theme */
      className="fixed -inset-1/2 w-[200%] h-[200%] z-9998 pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-[rap-grain_0.9s_steps(4)_infinite] motion-reduce:animate-none"
      style={{ opacity }}
      aria-hidden
    >
      <svg width="100%" height="100%">
        <filter id="rap-grain-f">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#rap-grain-f)" />
      </svg>
    </div>
  );
}
