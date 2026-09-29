// Media: audio and video players. Each lives in ../components/<Name>.tsx; the
// shared parts (media state, waveform peaks, scrubbing, the play/pause morph,
// speed tabs, volume) are in ../components/MediaKit.tsx.
export { AudioPlayer } from "../components/AudioPlayer";
export type { AudioPlayerProps } from "../components/AudioPlayer";
export { Playlist } from "../components/Playlist";
export type { PlaylistProps, PlaylistTrack } from "../components/Playlist";
export { VideoPlayer } from "../components/VideoPlayer";
export type { VideoPlayerProps, VideoChapter } from "../components/VideoPlayer";
export { VoiceNote } from "../components/VoiceNote";
export type { VoiceNoteProps } from "../components/VoiceNote";
export { PlayGlyph, RateTabs, useMedia, usePeaks } from "../components/MediaKit";
export type { MediaState, MediaApi, RateTabsProps } from "../components/MediaKit";
