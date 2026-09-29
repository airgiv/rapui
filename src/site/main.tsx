import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
// site.css first: it declares Tailwind's layer order (theme, base, components,
// utilities) before any component stylesheet can declare a layer of its own
import "./site.css";
import "../rapui/fonts";
import "../rapui";
import { App } from "./App";
import { SoundProvider, type SoundSettings } from "../rapui";
/* the explorer pulls in charts, tables, calendars…: load it only when opened */
const Docs = lazy(() => import("./Docs").then((m) => ({ default: m.Docs })));

/* Two views on one bundle, picked by the hash:
   #docs or #docs.<slug> → the components explorer, anything else → the landing page.
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
  useEffect(() => {
    if (!inDocs) document.title = "rap/ui — interfaces with nerve";
  }, [inDocs]);

  return (
    <SoundProvider {...sound}>
      {inDocs ? (
        <Suspense fallback={<div className="rap-root" style={{ minHeight: "100vh" }} />}>
          <Docs slug={hash.slice(5)} dark={dark} setDark={setDark} sound={sound} setSound={setSound} />
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
