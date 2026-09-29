import { useEffect, type ReactNode } from "react";
import { Accent, Display, Switch } from "../rapui";
import { cn } from "../rapui/utils";
import { Code } from "./Code";
import { Wordmark } from "./Wordmark";

/* ── Start here: rapui for people who have never shipped code ──────────
   A designer's first project, end to end: install two programs, make a
   project, add rapui, see it in the browser, borrow components from the
   docs, put the site online. Every command is its own copyable block —
   one command per paste, and no "# comments" inside them: a Mac terminal
   runs everything on the line, comments included. The troubleshooting
   list at the end is the real one: every entry happened to someone. */

const toStep = (n: number) => document.getElementById(`step-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

const COPY = "m-0 text-ink-2 text-[1.125rem] leading-[1.55] max-w-[60ch] [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-ink/30 hover:[&_a]:decoration-flame [&_code]:bg-fill [&_code]:py-[0.1em] [&_code]:px-[0.4em] [&_code]:rounded-[6px] [&_code]:text-[0.92em] [&_code]:font-mono";

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-16 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-6 gap-y-4 py-12 border-t border-line max-[700px]:grid-cols-1" id={`step-${n}`}>
      <span className="font-display font-medium text-[4.5rem] leading-[0.85] tracking-[-0.06em] text-flame tabular-nums max-[700px]:text-[3.2rem]" aria-hidden>
        {n}
      </span>
      <div className="flex flex-col gap-5 min-w-0">
        <h2 className="m-0 font-display font-medium text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.02] tracking-[-0.04em]">{title}</h2>
        {children}
      </div>
    </section>
  );
}

/* one line, one command: the Copy button takes exactly what the terminal needs */
function Cmd({ children }: { children: string }) {
  return <Code className="[&_pre]:py-5">{children}</Code>;
}

function Note({ children, tone = "fill" }: { children: ReactNode; tone?: "fill" | "acid" }) {
  return (
    <div className={cn("rounded-card px-6 py-5 text-[1rem] leading-[1.5] max-w-[62ch]", tone === "acid" ? "bg-acid text-[#282828]" : "bg-surface text-ink-2", "[&_code]:font-mono [&_code]:text-[0.92em]")}>
      {children}
    </div>
  );
}

const PROMPT = `Create a new React + TypeScript project with Vite and use the rapui component library (npm package @rapui/react) for all UI.
Follow the setup at https://rapui.dev:
- npm i @rapui/react
- in src/main.tsx import "@rapui/react/styles.css" and "@rapui/react/fonts", remove index.css, and put the class "rap-root" on <body>
- take components and their props from the docs at https://rapui.dev/#docs
Build: [describe your page here — e.g. a one-page portfolio with a big headline, a gallery and a contact form].
Run it locally and tell me the address to open.`;

const MAIN = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@rapui/react/styles.css";
import "@rapui/react/fonts";
import App from "./App";

document.body.className = "rap-root";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);`;

const APP = `import { Accent, Button, Display, Rating } from "@rapui/react";

export default function App() {
  return (
    <main style={{ padding: 48, display: "grid", gap: 32, justifyItems: "start" }}>
      <Display size="xl">
        Hello, <Accent>rapui</Accent>
      </Display>
      <Rating defaultValue={4} className="text-flame" />
      <Button size="lg" variant="accent" icon>
        Let's go
      </Button>
    </main>
  );
}`;

const WORDS: [string, string][] = [
  ["Terminal", "A window where you type commands instead of clicking. On a Mac: the Terminal app, or View → Terminal inside your code editor."],
  ["Node.js", "The engine that runs the tools on your computer. You install it once and forget about it."],
  ["npm", "Comes with Node.js. It downloads code other people published — like rapui — into your project. “npm i something” means “install something”."],
  ["Package", "A published bundle of code with a name, like @rapui/react. The npm version of a Figma library."],
  ["Component", "A reusable piece of interface — a button, a slider, a gallery. The code version of a Figma component."],
  ["Prop", "A setting on a component, written like an HTML attribute: size=\"lg\", variant=\"accent\". The code version of a component property in Figma."],
  ["React", "The way the page is built: small components put together, each one a function that returns what should be on screen."],
  ["Vite", "The tool that turns your project into a website, shows it live while you work (npm run dev) and packs it for the internet (npm run build)."],
  ["Deploy", "Putting the built site on a server so anyone can open it. Vercel does it for you on every change."],
  ["DNS", "The internet's address book: it tells browsers that your-domain.com lives on Vercel's servers. You set it once at the domain shop."],
];

const FIXES: [string, ReactNode][] = [
  [
    "command not found: node (or npm)",
    <>Node.js is not installed yet, or the terminal was open while you installed it. Install it from nodejs.org, then close the terminal and open a new one.</>,
  ],
  [
    "vite: command not found, or Cannot find module …",
    <>The project's packages are not installed. In the project folder, run <code>npm install</code> and try again.</>,
  ],
  [
    "Strange errors right after pasting several commands",
    <>Paste one command at a time and wait for it to finish. Never paste a comment (anything after a <code>#</code>) — a Mac terminal tries to run it and npm fails with odd errors like “Invalid tag name”.</>,
  ],
  [
    "The page in the browser is blank",
    <>Look at the terminal where <code>npm run dev</code> runs, and at the browser console (right-click → Inspect → Console). Copy the red error into your AI assistant — it is usually a typo or a missing import.</>,
  ],
  [
    "“Access is temporarily restricted” on GitHub or npm",
    <>Their bot protection flagged your network. Open the site in an incognito window, or switch your VPN off (or on) and try again. It is not your account.</>,
  ],
  [
    "npm publish says the name is too similar to another package",
    <>npm protects against look-alike names. Publish under a scope instead, like <code>@yourname/package</code> — that is why rapui is <code>@rapui/react</code>.</>,
  ],
];

export function Guide({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = "Start here · rapui";
  }, []);
  return (
    <div className="rap-root min-h-screen bg-paper">
      <header className="sticky top-0 z-50 flex items-center gap-[0.9rem] h-16 px-[clamp(1rem,2.5vw,1.5rem)] border-b border-line bg-[color-mix(in_srgb,var(--rap-paper)_85%,transparent)] backdrop-blur-[14px]">
        <a href="#top" className="text-[1.4rem]" aria-label="rapui, home">
          <Wordmark />
        </a>
        <span className="w-px h-5 bg-line max-sm:hidden" aria-hidden />
        <span className="font-medium max-sm:hidden">Start here</span>
        <div className="ml-auto flex items-center gap-3">
          <a href="#docs" className="h-10 px-4 inline-flex items-center rounded-pill bg-fill font-medium text-[0.9375rem] transition-colors hover:bg-fill-strong">
            Docs
          </a>
          <Switch checked={dark} onCheckedChange={setDark} onText="☾" offText="☀" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[64rem] px-[clamp(1rem,4vw,2.5rem)] pt-16 pb-28">
        <div className="flex flex-col gap-6 pb-14">
          <Display as="h1" size="xxl">
            Start here. <Accent tone="mute">No code background needed.</Accent>
          </Display>
          <p className={COPY}>
            You design in Figma and want the real thing: a site you can click, with rapui’s buttons, sliders and galleries. This page takes you from an empty
            laptop to a site on your own domain. Plan on twenty minutes the first time; after that, a new project is two minutes.
          </p>
        </div>

        {/* two ways in: let an assistant type, or type it yourself */}
        <div className="grid grid-cols-2 items-start gap-tile pb-16 max-[800px]:grid-cols-1">
          <div className="flex flex-col gap-4 rounded-lg bg-ink text-paper p-[clamp(1.5rem,3vw,2.25rem)] min-w-0">
            <h2 className="m-0 font-display font-medium text-[1.9rem] leading-[1.05] tracking-[-0.035em]">The shortcut: ask an AI to do it</h2>
            <p className="m-0 text-[1.05rem] leading-[1.5] opacity-80">
              An AI coding assistant (Claude Code, Cursor and the like) can run every step below for you. You still need Node.js from step 1. Paste this, and
              describe your page in the brackets:
            </p>
            <Code wrap plain>{PROMPT}</Code>
          </div>
          <div className="flex flex-col gap-4 rounded-lg bg-surface p-[clamp(1.5rem,3vw,2.25rem)]">
            <h2 className="m-0 font-display font-medium text-[1.9rem] leading-[1.05] tracking-[-0.035em]">The real way: eight small steps</h2>
            <p className="m-0 text-[1.05rem] leading-[1.5] text-ink-2">
              Worth doing once by hand, so you know what the assistant is doing. Every dark block has a Copy button: paste it into the terminal, press Enter,
              wait until it finishes, then the next one.
            </p>
            <ol className="m-0 mt-2 pl-5 grid gap-1 text-[1rem] text-ink-2 list-decimal marker:text-flame">
              {(
                [
                  [1, "Install Node.js and a code editor"],
                  [3, "Make a project, add rapui"],
                  [5, "See it live, borrow components"],
                  [7, "Put it online, on your own domain"],
                ] as const
              ).map(([n, label]) => (
                <li key={n}>
                  {/* the site routes on the hash, so a #step link would leave this page: scroll instead */}
                  <button type="button" className="underline underline-offset-4 decoration-ink/30 hover:decoration-flame text-left" onClick={() => toStep(n)}>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Step n={1} title="Install Node.js">
          <p className={COPY}>
            Go to <a href="https://nodejs.org" target="_blank" rel="noreferrer">nodejs.org</a>, download the version marked <b>LTS</b> and install it like any app.
            Then open the Terminal app (on a Mac: Spotlight → “Terminal”) and check it worked:
          </p>
          <Cmd>node -v</Cmd>
          <p className={COPY}>You should see something like <code>v22.12.0</code>. Anything from v20.19 up is fine.</p>
        </Step>

        <Step n={2} title="Get a code editor">
          <p className={COPY}>
            Install <a href="https://code.visualstudio.com" target="_blank" rel="noreferrer">VS Code</a> or <a href="https://cursor.com" target="_blank" rel="noreferrer">Cursor</a> — free
            editors that also have a terminal built in (View → Terminal). From here on, “the terminal” can be either one.
          </p>
        </Step>

        <Step n={3} title="Make a project">
          <p className={COPY}>
            In the terminal, go to the folder where your projects live, then create a new one. <code>my-site</code> is its name — change it if you like, but keep
            it lowercase, no spaces.
          </p>
          <Cmd>cd ~/Desktop</Cmd>
          <Cmd>npm create vite@latest my-site -- --template react-ts</Cmd>
          <p className={COPY}>If it asks questions, press Enter to accept the defaults. Then step into the project and install what it needs:</p>
          <Cmd>cd my-site</Cmd>
          <Cmd>npm install</Cmd>
          <p className={COPY}>
            Open the <code>my-site</code> folder in your editor (File → Open Folder). The files you will touch live in <code>src</code>.
          </p>
        </Step>

        <Step n={4} title="Add rapui">
          <Cmd>npm i @rapui/react</Cmd>
          <p className={COPY}>
            Now tell the project to use it. Open <code>src/main.tsx</code>, select everything and replace it with this — it loads rapui’s styles and fonts, and
            gives the page rapui’s paper background:
          </p>
          <Code>{MAIN}</Code>
          <p className={COPY}>
            Then replace everything in <code>src/App.tsx</code> with a first screen:
          </p>
          <Code>{APP}</Code>
          <p className={COPY}>
            You can delete <code>src/App.css</code> and <code>src/index.css</code> — rapui brings its own look.
          </p>
        </Step>

        <Step n={5} title="See it live">
          <Cmd>npm run dev</Cmd>
          <p className={COPY}>
            The terminal prints an address, usually <code>http://localhost:5173</code>. Open it in your browser: a big headline, five stars and an orange button.
            Change a word in <code>App.tsx</code> and save — the browser updates by itself. This terminal is now busy running your site; open a second one for
            other commands, and press <code>Ctrl + C</code> here to stop it.
          </p>
        </Step>

        <Step n={6} title="Borrow components from the docs">
          <p className={COPY}>
            Open <a href="#docs">the docs</a>, pick a component and play with its settings panel — the code under the preview updates as you go. Copy it into{" "}
            <code>App.tsx</code>, inside <code>&lt;main&gt;</code>, and add the component’s name to the <code>import</code> line at the top:
          </p>
          <Code>{`import { Accent, Button, Display, Rating, HoldButton } from "@rapui/react";`}</Code>
          <Note>
            Think of a component like a Figma component and its props like the properties panel: <code>size="lg"</code>, <code>variant="accent"</code>,{" "}
            <code>defaultValue={"{4}"}</code>. Text goes in quotes; numbers and true/false go in curly braces.
          </Note>
        </Step>

        <Step n={7} title="Put it online">
          <p className={COPY}>
            Two free services do this. <b>GitHub</b> keeps your project’s files; <b>Vercel</b> turns them into a website and rebuilds it every time you save a change to
            GitHub.
          </p>
          <ol className={cn(COPY, "pl-5 grid gap-2 list-decimal marker:text-flame")}>
            <li>
              Make an account on <a href="https://github.com" target="_blank" rel="noreferrer">github.com</a> and install{" "}
              <a href="https://desktop.github.com" target="_blank" rel="noreferrer">GitHub Desktop</a> — it saves your project to GitHub with buttons instead of commands.
            </li>
            <li>In GitHub Desktop: File → Add Local Repository → pick <code>my-site</code> → “Publish repository”.</li>
            <li>
              Make an account on <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a> with your GitHub login → Add New → Project → import{" "}
              <code>my-site</code> → Deploy. A minute later you get a link like <code>my-site.vercel.app</code>.
            </li>
            <li>From now on: change the files, press “Commit” and “Push” in GitHub Desktop, and the site updates by itself.</li>
          </ol>
        </Step>

        <Step n={8} title="Your own domain (optional)">
          <p className={COPY}>
            Buy a name at a registrar such as <a href="https://www.namecheap.com" target="_blank" rel="noreferrer">Namecheap</a> or{" "}
            <a href="https://www.cloudflare.com/products/registrar/" target="_blank" rel="noreferrer">Cloudflare</a> (skip their hosting and email add-ons). Then:
          </p>
          <ol className={cn(COPY, "pl-5 grid gap-2 list-decimal marker:text-flame")}>
            <li>In Vercel: your project → Settings → Domains → add <code>yourname.com</code>.</li>
            <li>Vercel shows two records (an <b>A</b> record and a <b>CNAME</b>). Copy them into the DNS settings at your registrar, and delete the “parking” records it added.</li>
            <li>Wait 10–60 minutes. When Vercel says “Valid Configuration”, your site is live, with https, on your own name.</li>
          </ol>
        </Step>

        <section className="pt-16 border-t border-line">
          <Display as="h2" size="lg">
            Words you will meet
          </Display>
          <dl className="m-0 mt-8 grid grid-cols-2 gap-tile max-[800px]:grid-cols-1">
            {WORDS.map(([w, d]) => (
              <div key={w} className="rounded-card bg-surface px-6 py-5">
                <dt className="font-medium text-[1.15rem] tracking-[-0.02em]">{w}</dt>
                <dd className="m-0 mt-1 text-ink-2 leading-[1.5]">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="pt-20">
          <Display as="h2" size="lg">
            When something breaks
          </Display>
          <div className="mt-8 flex flex-col gap-tile">
            {FIXES.map(([q, a]) => (
              <details key={q} className="group rounded-card bg-surface px-6 py-5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:bg-fill [&_code]:px-[0.35em] [&_code]:rounded-[6px]">
                <summary className="cursor-pointer list-none flex justify-between gap-6 font-medium text-[1.1rem] tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-[0.98rem]">{q}</span>
                  <span className="flex-none text-flame transition-transform duration-300 ease-spring group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="m-0 mt-3 text-ink-2 leading-[1.55] max-w-[64ch]">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6" />
          <Note tone="acid">
            Stuck on something not listed here? Copy the exact error from the terminal into your AI assistant together with the command you ran. Nine times out
            of ten the answer is one line.
          </Note>
        </section>

        <div className="pt-20 flex flex-wrap items-center justify-between gap-6">
          <Display size="lg">
            Ready? <Accent>Go pick a component.</Accent>
          </Display>
          <a href="#docs" className="h-14 px-7 inline-flex items-center rounded-pill bg-flame text-white font-medium text-[1.1rem] transition-colors hover:bg-ink">
            Open the docs →
          </a>
        </div>
      </main>
    </div>
  );
}
