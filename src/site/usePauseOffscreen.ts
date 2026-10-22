import { useEffect, type RefObject } from "react";

/* Holds the endless CSS animations of a long page still while they can't be seen.

   The page is cut into blocks — the root's `main` children (a wrapper with data-pause-split hands the job to
   its own children instead) and its footer — and each block is watched with an IntersectionObserver. When a
   block leaves the view (plus a small margin), every running CSS animation inside it that loops forever (spinning
   stars, typing dots, pulsing badges and dots) gets an inline
   `animation-play-state: paused` on its element; when the block comes back the inline style is removed again,
   so the component's own rules (a marquee pausing under the hand, say) are in charge once more. One-off
   animations are left alone, and only the animated elements are touched: a block-wide attribute would make the
   browser restyle every node of the block each time it crosses the edge, a visible hitch mid-scroll.

   Inside a block that is in view, each looping element is watched on its own as well, so a pulsing dot at the
   bottom of a tall block holds still until it itself scrolls in.

   Blocks that mount later (lazy sections) are picked up by a MutationObserver on `main`. A hidden tab needs
   nothing: the browser already stops CSS animations and animation frames there. */
export function usePauseOffscreen(root: RefObject<HTMLElement | null>, margin = "10% 0px") {
  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined" || typeof Element.prototype.getAnimations !== "function") return;
    const ours = new Set<HTMLElement>(); // elements we paused
    const tracked = new Map<Element, HTMLElement[]>(); // block -> its looping elements under watch
    const hold = (el: HTMLElement) => {
      if (ours.has(el)) return;
      if (el.style.animationPlayState) return; // the component set its own
      el.style.animationPlayState = "paused";
      ours.add(el);
    };
    const free = (el: HTMLElement) => {
      if (!ours.delete(el)) return;
      el.style.removeProperty("animation-play-state");
    };
    /* the elements of a block that run (or that we hold) an endless CSS animation */
    const loopers = (block: Element) => {
      const out = new Set<HTMLElement>();
      for (const a of block.getAnimations({ subtree: true })) {
        if (!(a instanceof CSSAnimation)) continue;
        const fx = a.effect as KeyframeEffect | null;
        const target = fx?.target;
        if (!fx || fx.pseudoElement || !(target instanceof HTMLElement || target instanceof SVGElement)) continue;
        const el = target as HTMLElement;
        if (fx.getTiming().iterations !== Infinity) continue;
        if (a.playState === "running" || ours.has(el)) out.add(el);
      }
      return [...out];
    };
    const elIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? free : hold)(e.target as HTMLElement);
      },
      { rootMargin: margin },
    );
    const blockIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const prev = tracked.get(e.target) ?? [];
          for (const el of prev) elIo.unobserve(el);
          tracked.delete(e.target);
          if (e.isIntersecting) {
            // in view: each looper follows its own visibility
            const els = loopers(e.target);
            tracked.set(e.target, els);
            for (const el of els) elIo.observe(el);
          } else {
            for (const el of [...prev, ...loopers(e.target)]) hold(el);
          }
        }
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
        blockIo.observe(el);
      }
    };
    scan();
    const main = node.querySelector("main");
    const mo = main ? new MutationObserver(scan) : null;
    mo?.observe(main!, { childList: true });
    return () => {
      blockIo.disconnect();
      elIo.disconnect();
      mo?.disconnect();
      for (const el of [...ours]) free(el);
    };
  }, [root, margin]);
}
