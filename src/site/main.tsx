import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
// site.css first: it declares Tailwind's layer order (theme, base, components,
// utilities) before any component stylesheet can declare a layer of its own
import "./site.css";
import "../rapui/fonts";
import "../rapui";
import { App } from "./App";
import { SoundProvider, type SoundSettings } from "../rapui";
/* The explorer pulls in charts, tables, calendars…: load it only when opened.
   Every deploy renames that chunk, so a tab opened before a deploy asks for a file
   that no longer exists and the import fails — the click on Docs would do nothing.
   When that happens, reload once (the hash is kept, so the fresh page opens straight
   in the docs); the session flag stops a real outage from looping. */
const RELOADED = "rapui-chunk-reload";
const flag = {
  get: () => {
    try {
      return sessionStorage.getItem(RELOADED);
    } catch {
      return "1"; // storage blocked: never auto-reload, so never loop
    }
  },
  set: (on: boolean) => {
    try {
      if (on) sessionStorage.setItem(RELOADED, "1");
      else sessionStorage.removeItem(RELOADED);
    } catch {
      /* storage blocked */
    }
  },
};
function lazyPage<T>(load: () => Promise<T>) {
  return lazy(() =>
    load()
      .then((m) => {
        flag.set(false);
        return m as never;
      })
      .catch((err) => {
        if (!flag.get()) {
          flag.set(true);
          window.location.reload();
          return new Promise<never>(() => {}); // the page is going away
        }
        throw err;
      }),
  );
}
const Docs = lazyPage(() => import("./Docs").then((m) => ({ default: m.Docs })));
/* the beginners' guide: its own small chunk too */
const Guide = lazyPage(() => import("./Guide").then((m) => ({ default: m.Guide })));

/* Three views on one bundle, picked by the hash:
   #docs or #docs.<slug> → the components explorer, #start → the beginners' guide,
   anything else → the landing page.
   Plain tokens only (no slashes), so deep links survive hosts that strip paths. */
function useHash() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

function Root() {
  const hash = useHash();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute("data-rap-theme", dark ? "dark" : "light");
  }, [dark]);

  // site-wide opt-in sound, remembered per browser
  const [sound, setSound] = useState<SoundSettings>(() => {
    const base = { enabled: false, volume: 0.6, fun: 25, haptics: true };
    try {
      return { ...base, ...JSON.parse(localStorage.getItem("rapui-sound") ?? "{}") };
    } catch {
      return base;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("rapui-sound", JSON.stringify(sound));
    } catch {
      /* storage blocked */
    }
  }, [sound]);

  const inDocs = hash === "docs" || hash.startsWith("docs.");
  const inGuide = hash === "start";
  useEffect(() => {
    if (!inDocs && !inGuide) document.title = "rapui — all the components, none of the boring";
  }, [inDocs, inGuide]);

  return (
    <SoundProvider {...sound}>
      {inDocs ? (
        <Suspense fallback={<div className="rap-root" style={{ minHeight: "100vh" }} />}>
          <Docs slug={hash.slice(5)} dark={dark} setDark={setDark} sound={sound} setSound={setSound} />
        </Suspense>
      ) : inGuide ? (
        <Suspense fallback={<div className="rap-root" style={{ minHeight: "100vh" }} />}>
          <Guide dark={dark} setDark={setDark} />
        </Suspense>
      ) : (
        <App dark={dark} setDark={setDark} sound={sound} setSound={setSound} />
      )}
    </SoundProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
