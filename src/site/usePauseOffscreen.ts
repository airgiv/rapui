import { useEffect, type RefObject } from "react";

/* Holds the endless CSS animations of a long page still while they can't be seen.

   The page is cut into blocks — the root's `main` children (a wrapper with data-pause-split hands the job to
   its own children instead) and its footer — and each block is watched with an IntersectionObserver. When a
   block leaves the view (plus a small margin), every running CSS animation inside it that loops forever (the
   marquee bands, spinning stars, typing dots, pulsing badges, sticker spins) gets an inline
   `animation-play-state: paused` on its element; when the block comes back the inline style is removed again,
   so the component's own rules (a marquee pausing under the hand, say) are in charge once more. One-off
   animations are left alone, and only the animated elements are touched: a block-wide attribute would make the
   browser restyle every node of the block each time it crosses the edge, a visible hitch mid-scroll.

   Blocks that mount later (lazy sections) are picked up by a MutationObserver on `main`. A hidden tab needs
   nothing: the browser already stops CSS animations and animation frames there. */
export function usePauseOffscreen(root: RefObject<HTMLElement | null>, margin = "10% 0px") {
  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined" || typeof Element.prototype.getAnimations !== "function") return;
    const held = new Map<Element, HTMLElement[]>();
    const pause = (block: Element) => {
      if (held.has(block)) return;
      const els: HTMLElement[] = [];
      for (const a of block.getAnimations({ subtree: true })) {
        if (!(a instanceof CSSAnimation) || a.playState !== "running") continue;
        const fx = a.effect as KeyframeEffect | null;
        const el = fx?.target;
        if (!fx || fx.pseudoElement || !(el instanceof HTMLElement || el instanceof SVGElement)) continue;
        if (fx.getTiming().iterations !== Infinity) continue;
        if ((el as HTMLElement).style.animationPlayState) continue; // the component set its own
        (el as HTMLElement).style.animationPlayState = "paused";
        els.push(el as HTMLElement);
      }
      held.set(block, els);
    };
    const resume = (block: Element) => {
      const els = held.get(block);
      if (!els) return;
      held.delete(block);
      for (const el of els) el.style.removeProperty("animation-play-state");
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? resume : pause)(e.target);
      },
      { rootMargin: margin },
    );
    const watched = new Set<Element>();
    const scan = () => {
      const main = node.querySelector("main");
      const blocks: Element[] = [];
      for (const el of main?.children ?? []) {
        if (el.hasAttribute("data-pause-split")) blocks.push(...el.children);
        else blocks.push(el);
      }
      const footer = node.querySelector(":scope > footer");
      if (footer) blocks.push(footer);
      for (const el of blocks) {
        if (watched.has(el)) continue;
        watched.add(el);
        io.observe(el);
      }
    };
    scan();
    const main = node.querySelector("main");
    const mo = main ? new MutationObserver(scan) : null;
    mo?.observe(main!, { childList: true });
    return () => {
      io.disconnect();
      mo?.disconnect();
      for (const block of [...held.keys()]) resume(block);
    };
  }, [root, margin]);
}
