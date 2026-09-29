import { useState } from "react";

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

export function Code({ children }: { children: string }) {
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
    <div className="site-code">
      <button className={`site-code__copy ${copied ? "is-done" : ""}`} onClick={copy} type="button">
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlight(children.trim()) }} />
      </pre>
    </div>
  );
}
