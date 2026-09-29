import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../rapui/fonts";
import "../rapui";
import "./site.css";
import { App } from "./App";
import { Docs } from "./Docs";

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

  const inDocs = hash === "docs" || hash.startsWith("docs.");
  useEffect(() => {
    if (!inDocs) document.title = "rap/ui — interfaces with nerve";
  }, [inDocs]);

  return inDocs ? <Docs slug={hash.slice(5)} dark={dark} setDark={setDark} /> : <App dark={dark} setDark={setDark} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
