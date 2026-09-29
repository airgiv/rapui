import { useState } from "react";
import { cn } from "../rapui/utils";

/** Tiny single-pass highlighter for JSX / shell snippets — zero deps. */
const TOKEN =
  /(\{\/\*[\s\S]*?\*\/\}|\/\/[^\n]*)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|(<\/?)([A-Za-z][\w.]*)|\b(import|from|export|const|let|return|function|npm|npx|install)\b|([a-zA-Z-]+)(?==)/g;

function highlight(src: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = "";
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += esc(src.slice(last, m.index));
    const [all, com, str, lt, tag, kw, attr] = m;
    if (com) out += `<span class="tk-com">${esc(com)}</span>`;
    else if (str) out += `<span class="tk-str">${esc(str)}</span>`;
    else if (tag) out += `${esc(lt)}<span class="${/^[A-Z]/.test(tag) ? "tk-cmp" : "tk-tag"}">${tag}</span>`;
    else if (kw) out += `<span class="tk-kw">${kw}</span>`;
    else if (attr) out += `<span class="tk-attr">${attr}</span>`;
    else out += esc(all);
    last = m.index! + all.length;
  }
  return out + esc(src.slice(last));
}

export function Code({ children, className, wrap = false }: { children: string; className?: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    // a dark slab in both themes (a touch lighter on the dark page so it still reads as a slab)
    <div className={cn("relative rounded-card bg-[#111110] text-[#e9e6de] overflow-hidden dark:bg-[#1d1d1b]", className)}>
      <button
        className={cn(
          "absolute top-[0.9rem] right-[0.9rem] py-[0.45rem] px-[0.9rem] border border-solid border-white/20 rounded-pill bg-transparent",
          "text-[#e9e6de] font-mono text-[0.75rem] cursor-pointer transition-colors duration-(--rap-dur-fast) hover:bg-[#e9e6de] hover:text-[#111]",
          copied && "bg-acid text-[#111] border-acid hover:bg-acid",
        )}
        onClick={copy}
        type="button"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre className={cn("m-0 py-7 px-8 font-mono text-[0.9rem] leading-[1.7]", wrap ? "whitespace-pre-wrap break-words pr-20" : "overflow-x-auto")}>
        <code dangerouslySetInnerHTML={{ __html: highlight(children.trim()) }} />
      </pre>
    </div>
  );
}
