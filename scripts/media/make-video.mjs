/* Demo video for the docs site's VideoPlayer. No network and no system
   ffmpeg here, so the film is drawn on a canvas in headless Chromium,
   one frame at a time (deterministic, no dropped frames), piped as JPEG
   into Playwright's own ffmpeg build (which has an MJPEG decoder and a
   VP8 encoder and nothing else), and muxed with a soundtrack Chromium's
   MediaRecorder encodes to Opus from the synthesised grid-lines.wav.

   Four scenes, matching the chapters the docs demo passes in:
     0 s Intro   · 3 s Shapes · 6 s Type · 9 s Outro     (12 s total)

   Needs the global playwright package (node 22) and the browsers under
   /opt/pw-browsers.
     node scripts/media/make-video.mjs   → src/site/media/reel.webm        */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH || "/opt/node22/lib/node_modules/playwright");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "src/site/media");
const FFMPEG = "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux";
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const W = 640;
const H = 360;
const FPS = 30;
const SECONDS = 12;

const font = readFileSync(join(ROOT, "node_modules/@fontsource-variable/onest/files/onest-latin-wght-normal.woff2")).toString("base64");
const wav = readFileSync(join(OUT, "grid-lines.wav")).toString("base64");

/* the film, drawn at time t. Palette = rap/ui tokens (paper, ink, flame,
   blue, acid, bubble), big shapes and big type, eased like the UI. */
const PAGE = `<!doctype html><style>
@font-face{font-family:Onest;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900}
body{margin:0;background:#000}</style><canvas id=c width=${W} height=${H}></canvas>
<script>
const c = document.getElementById("c"), g = c.getContext("2d");
const P = { paper:"#f5f5f5", ink:"#282828", flame:"#ec520b", blue:"#0582ff", acid:"#d7ff3c", bubble:"#ff9be0", sky:"#8fd3ff", plum:"#8e0d99" };
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
const spring = (x) => { if (x <= 0) return 0; if (x >= 1.6) return 1; return 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
const pill = (x, y, w, h, fill) => { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill(); };
const text = (s, x, y, size, fill, weight = 600, align = "left") => {
  g.font = weight + " " + size + "px Onest"; g.fillStyle = fill; g.textAlign = align; g.textBaseline = "alphabetic";
  g.letterSpacing = (-0.04 * size) + "px"; g.fillText(s, x, y);
};
function draw(t) {
  g.save();
  g.clearRect(0, 0, ${W}, ${H});
  if (t < 3) {                                   /* Intro: paper, a flame sun rising, the title */
    g.fillStyle = P.paper; g.fillRect(0, 0, ${W}, ${H});
    const r = 150 * spring(t / 1.2);
    g.fillStyle = P.flame; g.beginPath(); g.arc(470, 250 - 40 * ease(t / 2), r, 0, 7); g.fill();
    pill(-200 + 260 * ease((t - 0.3) / 1), 250, 300, 64, P.blue);
    const k = ease((t - 0.6) / 0.9);
    g.globalAlpha = k; text("Studio reel", 44, 130 + 20 * (1 - k), 64, P.ink); g.globalAlpha = 1;
    text("rap/ui · 2026", 46, 170, 18, P.ink, 500);
  } else if (t < 6) {                            /* Shapes: ink ground, marbles bouncing on a grid */
    const u = t - 3;
    g.fillStyle = P.ink; g.fillRect(0, 0, ${W}, ${H});
    g.strokeStyle = "rgba(245,245,245,0.12)"; g.lineWidth = 1;
    for (let x = 40; x < ${W}; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ${H}); g.stroke(); }
    for (let y = 40; y < ${H}; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(${W}, y); g.stroke(); }
    const cols = [P.flame, P.acid, P.blue, P.bubble, P.sky];
    for (let i = 0; i < 5; i++) {
      const ph = u * 2.2 - i * 0.18;
      const bounce = Math.abs(Math.sin(ph * Math.PI * 0.9));
      const y = 300 - 190 * bounce * Math.exp(-Math.max(0, ph) * 0.15);
      const sq = 1 + 0.25 * Math.max(0, 1 - bounce * 6);
      g.save(); g.translate(90 + i * 115, y); g.scale(sq, 1 / sq);
      g.fillStyle = cols[i]; g.beginPath(); g.arc(0, -28, 28 + i * 3, 0, 7); g.fill(); g.restore();
    }
    g.save(); g.translate(320, 70); g.rotate(u * 0.8);
    g.fillStyle = P.paper; g.beginPath(); g.roundRect(-26, -26, 52, 52, 14); g.fill(); g.restore();
  } else if (t < 9) {                            /* Type: acid ground, a huge word sliding through */
    const u = t - 6;
    g.fillStyle = P.acid; g.fillRect(0, 0, ${W}, ${H});
    text("Big type,", 40 - 60 * u, 170, 150, P.ink, 700);
    text("lots of air.", 640 - 120 * u - 260, 320, 150, P.ink, 300);
    pill(460, 36 + 8 * Math.sin(u * 3), 140, 44, P.ink);
    text("Onest 700", 530, 64 + 8 * Math.sin(u * 3), 18, P.acid, 500, "center");
  } else {                                       /* Outro: blue, rings expanding, end card */
    const u = t - 9;
    g.fillStyle = P.blue; g.fillRect(0, 0, ${W}, ${H});
    for (let i = 0; i < 6; i++) {
      const r = ((u * 120 + i * 70) % 420);
      g.strokeStyle = "rgba(255,255,255," + (0.5 * (1 - r / 420)).toFixed(3) + ")"; g.lineWidth = 3;
      g.beginPath(); g.arc(320, 180, r, 0, 7); g.stroke();
    }
    const k = spring(u / 1.1);
    g.save(); g.translate(320, 180); g.scale(k, k);
    pill(-150, -44, 300, 88, "#ffffff");
    text("Made with rap/ui", 0, 9, 30, P.ink, 600, "center");
    g.restore();
  }
  /* a burnt-in timecode, bottom left: small, so the player's own controls stay the story */
  const s = Math.floor(t), f = Math.floor((t - s) * ${FPS});
  g.globalAlpha = 0.55;
  text("00:" + String(s).padStart(2, "0") + ":" + String(f).padStart(2, "0"), 20, ${H} - 18, 13, t >= 3 && t < 6 ? P.paper : P.ink, 500);
  g.restore();
}
window.frame = (t) => { draw(t); return c.toDataURL("image/jpeg", 0.92); };

/* the soundtrack: the first ${SECONDS}s of grid-lines.wav, recorded to Opus */
window.record = async () => {
  const ac = new AudioContext();
  const bin = Uint8Array.from(atob("${wav}"), (ch) => ch.charCodeAt(0));
  const buf = await ac.decodeAudioData(bin.buffer);
  const dest = ac.createMediaStreamDestination();
  const src = ac.createBufferSource(); src.buffer = buf;
  const gain = ac.createGain(); gain.gain.setValueAtTime(0.9, 0);
  gain.gain.setValueAtTime(0.9, ${SECONDS} - 0.6); gain.gain.linearRampToValueAtTime(0, ${SECONDS});
  src.connect(gain).connect(dest);
  const rec = new MediaRecorder(dest.stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 64000 });
  const parts = [];
  rec.ondataavailable = (e) => parts.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  rec.start(); src.start();
  await new Promise((r) => setTimeout(r, ${SECONDS} * 1000 + 250));
  rec.stop(); await done;
  const b = new Uint8Array(await new Blob(parts).arrayBuffer());
  let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
};
</script>`;

const browser = await chromium.launch({ executablePath: CHROME, args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();
await page.setContent(PAGE);
await page.evaluate(() => document.fonts.load("600 20px Onest"));

const silent = join(OUT, ".reel-video.webm");
const audio = join(OUT, ".reel-audio.webm");
const final = join(OUT, "reel.webm");

const ff = spawn(FFMPEG, ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0",
  "-vf", "scale=640:360,format=yuv420p", "-c:v", "libvpx", "-b:v", "700k", "-crf", "10", "-deadline", "good", "-auto-alt-ref", "0", "-g", "30", silent],
  { stdio: ["pipe", "inherit", "inherit"] });
const audioJob = ctx.newPage().then(async (p2) => {
  await p2.setContent(PAGE);
  return p2.evaluate(() => window.record()).catch((e) => { console.warn("audio failed:", e.message); return null; });
});
for (let i = 0; i < FPS * SECONDS; i++) {
  const url = await page.evaluate((t) => window.frame(t), i / FPS);
  const ok = ff.stdin.write(Buffer.from(url.split(",")[1], "base64"));
  if (!ok) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
const a = await audioJob;
await browser.close();

if (a) {
  writeFileSync(audio, Buffer.from(a, "base64"));
  await new Promise((r) => spawn(FFMPEG, ["-y", "-i", silent, "-i", audio, "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", final], { stdio: "inherit" }).on("close", r));
  unlinkSync(audio);
  unlinkSync(silent);
} else {
  writeFileSync(final, readFileSync(silent));
  unlinkSync(silent);
}
console.log("reel.webm", (readFileSync(final).length / 1024).toFixed(0), "KB");
