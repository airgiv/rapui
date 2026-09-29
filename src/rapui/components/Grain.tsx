import "./Grain.css";

/** Fixed film-grain overlay. Put once at the root. */
export function Grain({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <div className="rap-grain" style={{ opacity }} aria-hidden>
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
