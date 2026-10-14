/* placeholder until the chain reaction figure is drawn */
import type { CSSProperties } from "react";
export function ChainReaction({ className, style }: { className?: string; style?: CSSProperties; framed?: boolean }) {
  return <div className={className} style={{ ...style, aspectRatio: "1 / 1" }} />;
}
