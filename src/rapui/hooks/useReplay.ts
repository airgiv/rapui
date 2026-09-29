import { useCallback, useState } from "react";

/**
 * Re-trigger a CSS keyframe class on demand (shake on error, hop on update…).
 * `const [shakeKey, shake] = useReplay();` then put `key`-free
 * `data-anim={shakeKey}` + class, or use the returned `cls(name)` helper:
 *   <div className={cls("rap-anim-shake")} onAnimationEnd={done} />
 */
export function useReplay() {
  const [n, setN] = useState(0);
  const [on, setOn] = useState(false);
  const play = useCallback(() => {
    setOn(false);
    requestAnimationFrame(() => {
      setOn(true);
      setN((x) => x + 1);
    });
  }, []);
  const done = useCallback(() => setOn(false), []);
  const cls = (name: string) => (on ? name : "");
  return { play, done, cls, count: n, playing: on };
}
