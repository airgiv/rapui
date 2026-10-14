/* ══ MediaFrame ═══════════════════════════════════════════
   A photo or video seen through an old screen: horizontal scan
   lines, film grain, an optional blur and a colour tint — the
   analogue texture of the signal preset, for hero images, cards
   and backgrounds. Anything can sit on top (children are laid
   over the picture, e.g. a DotText or a caption card).

     <MediaFrame src="/leaves.jpg" alt="" blur={6} tint="var(--rap-blue)" />
     <MediaFrame video src="/reel.webm" />
     <MediaFrame><MyIllustration /></MediaFrame>   // any node as the picture

   Delight: fun rolls a faint brighter band down the screen every
   few seconds, the way a tube refreshes; calm and still keep the
   lines steady. */
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";
import "./MediaFrame.css";

export interface MediaFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Image (or video, with `video`) source. */
  src?: string;
  alt?: string;
  video?: boolean;
  /** A node to use as the picture instead of src (an SVG, a canvas…). */
  picture?: ReactNode;
  /** Blur radius, px. */
  blur?: number;
  /** Scan lines over the picture. */
  scanlines?: boolean;
  /** Pitch of the scan lines, px. */
  linePitch?: number;
  /** Film grain over the picture. */
  grain?: boolean;
  /** A colour laid over the picture in `color` blend (any CSS colour). */
  tint?: string;
  /** Laid over the picture. */
  children?: ReactNode;
}

export function MediaFrame({
  src,
  alt = "",
  video = false,
  picture,
  blur = 0,
  scanlines = true,
  linePitch = 3,
  grain = true,
  tint,
  className,
  style,
  children,
  ...rest
}: MediaFrameProps) {
  const media = picture ?? (video ? (
    <video src={src} autoPlay muted loop playsInline aria-label={alt || undefined} />
  ) : src ? (
    <img src={src} alt={alt} />
  ) : null);

  return (
    <div
      data-slot="media-frame"
      className={cn("rap-media-frame relative isolate overflow-hidden rounded-card bg-ink", className)}
      style={{ "--mf-blur": `${blur}px`, "--mf-pitch": `${linePitch}px`, ...style } as CSSProperties}
      {...rest}
    >
      <div className="rap-mf-media absolute inset-0">{media}</div>
      {tint && <div aria-hidden className="absolute inset-0 mix-blend-color" style={{ background: tint }} />}
      {scanlines && <div aria-hidden className="rap-mf-lines absolute inset-0 pointer-events-none" />}
      {grain && <div aria-hidden className="rap-mf-grain absolute inset-0 pointer-events-none" />}
      {children !== undefined && <div className="relative h-full">{children}</div>}
    </div>
  );
}
