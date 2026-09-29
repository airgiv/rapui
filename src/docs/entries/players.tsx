import { AudioPlayer, Playlist, VideoPlayer, VoiceNote } from "../../rapui/groups/players";
import type { PlaylistTrack, VideoChapter } from "../../rapui/groups/players";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";
/* The demo media is synthesised and rendered by scripts/media/ (the preview
   cannot fetch anything external) and bundled with the docs site only. */
import gridLines from "../../site/media/grid-lines.wav";
import softKerning from "../../site/media/soft-kerning.wav";
import paperWeight from "../../site/media/paper-weight.wav";
import voiceNote from "../../site/media/voice-note.wav";
import reel from "../../site/media/reel.webm";

/* a paper ground inside the white stage, for cards drawn on the page colour */
const GROUND = "grid grid-cols-[minmax(0,1fr)] place-items-center w-full min-h-72 p-2 sm:p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

const TRACKS: PlaylistTrack[] = [
  { src: gridLines, title: "Grid Lines", artist: "The Baseline Club" },
  { src: softKerning, title: "Soft Kerning", artist: "Optical Margins" },
  { src: paperWeight, title: "Paper Weight", artist: "Bleed & Slug" },
  { src: gridLines, title: "Grid Lines (Reprise)", artist: "The Baseline Club" },
];

const CHAPTERS: VideoChapter[] = [
  { at: 0, title: "Intro" },
  { at: 3, title: "Shapes" },
  { at: 6, title: "Type" },
  { at: 9, title: "Outro" },
];

/* ── AudioPlayer ─────────────────────────────────────────── */
const audioControls: Control[] = [
  { type: "text", prop: "title", default: "Grid Lines", codeDefault: null },
  { type: "text", prop: "artist", default: "The Baseline Club", codeDefault: "" },
  { type: "select", prop: "tone", options: ["ink", "flame", "blue"], default: "ink" },
  { type: "boolean", prop: "volume", default: true },
  { type: "boolean", prop: "speeds", label: "speed tabs", default: true },
  { type: "boolean", prop: "loop", default: true, codeDefault: false },
  { type: "boolean", prop: "playful", default: true },
];

/* ── Playlist ────────────────────────────────────────────── */
const listControls: Control[] = [
  { type: "text", prop: "label", default: "Up next", codeDefault: "" },
  { type: "boolean", prop: "loop", default: true },
];

/* ── VideoPlayer ─────────────────────────────────────────── */
const videoControls: Control[] = [
  { type: "text", prop: "title", default: "Studio reel", codeDefault: "" },
  { type: "boolean", prop: "chapters", default: true, codeDefault: false },
  { type: "boolean", prop: "preview", label: "thumbnail preview", default: true },
  { type: "number", prop: "hideAfter", label: "hide after (ms)", min: 800, max: 6000, step: 200, default: 2400 },
  { type: "select", prop: "aspect", options: ["16 / 9", "4 / 3", "1 / 1"], default: "16 / 9" },
  { type: "boolean", prop: "playful", default: true },
];

/* ── VoiceNote ───────────────────────────────────────────── */
const voiceControls: Control[] = [
  { type: "select", prop: "from", options: ["me", "them"], default: "me" },
  { type: "text", prop: "sent", default: "14:02", codeDefault: "" },
  { type: "boolean", prop: "speeds", label: "speed chip", default: true },
];

export const entries: DocEntry[] = [
  {
    slug: "audio-player",
    name: "Audio player",
    group: "Media",
    description:
      "A card player whose scrubber is the track's own waveform, decoded from the file with Web Audio: drag or arrow-key to seek, the time rolls, volume is an elastic slider and the speed tabs share one travelling pill. Delight: while it plays the bars breathe with the music's live level, strongest at the playhead, and bars near your pointer swell like under a magnifier.",
    basedOn: "HTMLAudioElement + Web Audio (decodeAudioData, AnalyserNode)",
    controls: audioControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <AudioPlayer
          src={gridLines}
          title={String(p.title)}
          artist={String(p.artist) || undefined}
          tone={p.tone as "ink" | "flame" | "blue"}
          volume={Boolean(p.volume)}
          rates={p.speeds ? [1, 1.5, 2] : []}
          loop={Boolean(p.loop)}
          playful={Boolean(p.playful)}
        />
      </div>
    ),
    code: (p) => `import { AudioPlayer } from "rapui";

<AudioPlayer src="/media/grid-lines.wav"${attrs(p, audioControls, ["speeds"])}${p.speeds ? "" : " rates={[]}"} />`,
    examples: [
      {
        title: "Flame, no extras",
        Demo: () => (
          <div className={GROUND}>
            <AudioPlayer src={softKerning} title="Soft Kerning" artist="Optical Margins" tone="flame" volume={false} rates={[]} />
          </div>
        ),
        code: `<AudioPlayer src="/media/soft-kerning.wav" title="Soft Kerning" artist="Optical Margins"
  tone="flame" volume={false} rates={[]} />`,
      },
    ],
  },
  {
    slug: "playlist",
    name: "Playlist",
    group: "Media",
    description:
      "A compact player over a list of tracks: prev / play / next, a slim scrubber, and rows with a generated cover, title and duration; one highlight glides to the current row, which shows an equaliser. Delight: the playing cover is a record on a turntable — it spins up to 33⅓ on play and coasts to a stop on pause instead of halting.",
    basedOn: "HTMLAudioElement",
    controls: listControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <Playlist tracks={TRACKS} label={String(p.label) || undefined} loop={Boolean(p.loop)} />
      </div>
    ),
    code: (p) => `import { Playlist } from "rapui";

const tracks = [
  { src: "/media/grid-lines.wav", title: "Grid Lines", artist: "The Baseline Club" },
  { src: "/media/soft-kerning.wav", title: "Soft Kerning", artist: "Optical Margins" },
  { src: "/media/paper-weight.wav", title: "Paper Weight", artist: "Bleed & Slug", duration: 12 },
];

<Playlist tracks={tracks}${attrs(p, listControls)} />`,
  },
  {
    slug: "video-player",
    name: "Video player",
    group: "Media",
    description:
      "A rounded video frame whose controls float in one pill and slide away after a moment of stillness; the scrubber is cut into chapters it snaps to, and hovering it shows the time, the chapter and a live thumbnail. Space/K plays, ←/→ seek 5 s, ↑/↓ volume, M mutes, F or a double-click goes full screen, and there is picture-in-picture where supported. Delight: scrubbing drags the picture — the frame skews with your speed and springs upright on release, and the progress line squishes like a dropped rubber band.",
    basedOn: "HTMLVideoElement, Fullscreen and Picture-in-Picture APIs",
    controls: videoControls,
    Demo: ({ p }) => (
      <div className="w-full max-w-3xl mx-auto">
        <VideoPlayer
          src={reel}
          title={String(p.title) || undefined}
          chapters={p.chapters ? CHAPTERS : undefined}
          preview={Boolean(p.preview)}
          hideAfter={Number(p.hideAfter)}
          aspect={String(p.aspect)}
          playful={Boolean(p.playful)}
        />
      </div>
    ),
    code: (p) => `import { VideoPlayer } from "rapui";
${
      p.chapters
        ? `
const chapters = [
  { at: 0, title: "Intro" },
  { at: 3, title: "Shapes" },
  { at: 6, title: "Type" },
  { at: 9, title: "Outro" },
];
`
        : ""
    }
<VideoPlayer src="/media/reel.webm"${attrs(p, videoControls, ["chapters"])}${p.chapters ? " chapters={chapters}" : ""} />`,
  },
  {
    slug: "voice-note",
    name: "Voice note",
    group: "Media",
    description:
      "A chat voice message: a bubble with play, the note's waveform as a scrubber, its length and a speed chip that cycles 1× → 1.5× → 2×. Outgoing notes are blue with the tail on the right, incoming sit on the fill. Delight: while it plays, the bars under the playhead lift like a finger reading along the line.",
    basedOn: "HTMLAudioElement + Web Audio (decodeAudioData)",
    controls: voiceControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="flex flex-col gap-2 w-full max-w-[20rem]">
          <VoiceNote src={voiceNote} from="them" sent="14:01" className="self-start" />
          <VoiceNote src={voiceNote} from={p.from as "me" | "them"} sent={String(p.sent) || undefined} rates={p.speeds ? [1, 1.5, 2] : []} className={p.from === "me" ? "self-end" : "self-start"} />
        </div>
      </div>
    ),
    code: (p) => `import { VoiceNote } from "rapui";

<VoiceNote src="/media/voice-note.wav"${attrs(p, voiceControls, ["speeds"])}${p.speeds ? "" : " rates={[]}"} />`,
  },
];
