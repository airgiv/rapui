/* ───────────────────────────────────────────────────────────
   FancyIcon — Solar (480 Design) Bold Duotone icons for the
   illustrative spots: empty states, feature cards, stepper
   milestones, toasts, marketing blocks. Interface chrome keeps
   the thin technical set in ./icons.

   A curated set is addressable by name so docs and configs can
   pick one; any other Solar icon can be passed as a component:
     <FancyIcon icon="rocket" tone="flame" />
     <FancyIcon icon={SomeOtherIcon} />   (from "@solar-icons/react/bold-duotone")
   ─────────────────────────────────────────────────────────── */
import type { CSSProperties } from "react";
import {
  RocketIcon,
  StarIcon,
  StarsIcon,
  HeartIcon,
  PaletteIcon,
  PaintRollerIcon,
  ChatRoundDotsIcon,
  BellIcon,
  FolderIcon,
  GalleryIcon,
  CameraIcon,
  ClapperboardIcon,
  PenIcon,
  CursorIcon,
  LayersIcon,
  WidgetIcon,
  ProgrammingIcon,
  CodeIcon,
  DocumentIcon,
  NotebookIcon,
  BookIcon,
  CaseIcon,
  ChartIcon,
  GraphUpIcon,
  TargetIcon,
  FlagIcon,
  CrownIcon,
  CupIcon,
  ConfettiIcon,
  BalloonIcon,
  GiftIcon,
  FireIcon,
  BoltIcon,
  LightbulbIcon,
  SunIcon,
  PlanetIcon,
  LeafIcon,
  CloudIcon,
  GlobalIcon,
  MapIcon,
  HomeIcon,
  BoxIcon,
  InboxIcon,
  MailboxIcon,
  LetterIcon,
  LinkIcon,
  LockIcon,
  ShieldIcon,
  SettingsIcon,
  CalendarIcon,
  DownloadIcon,
  UploadIcon,
  DangerIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  GhostIcon,
  CatIcon,
  GamepadIcon,
} from "@solar-icons/react/bold-duotone";
import { cx } from "../utils";

/** Any Solar icon component, e.g. from "@solar-icons/react/bold-duotone". */
export type SolarIcon = typeof RocketIcon;
import "./FancyIcon.css";

export const FANCY_ICONS = {
  "rocket": RocketIcon,
  "star": StarIcon,
  "stars": StarsIcon,
  "heart": HeartIcon,
  "palette": PaletteIcon,
  "paint-roller": PaintRollerIcon,
  "chat-round-dots": ChatRoundDotsIcon,
  "bell": BellIcon,
  "folder": FolderIcon,
  "gallery": GalleryIcon,
  "camera": CameraIcon,
  "clapperboard": ClapperboardIcon,
  "pen": PenIcon,
  "cursor": CursorIcon,
  "layers": LayersIcon,
  "widget": WidgetIcon,
  "programming": ProgrammingIcon,
  "code": CodeIcon,
  "document": DocumentIcon,
  "notebook": NotebookIcon,
  "book": BookIcon,
  "case": CaseIcon,
  "chart": ChartIcon,
  "graph-up": GraphUpIcon,
  "target": TargetIcon,
  "flag": FlagIcon,
  "crown": CrownIcon,
  "cup": CupIcon,
  "confetti": ConfettiIcon,
  "balloon": BalloonIcon,
  "gift": GiftIcon,
  "fire": FireIcon,
  "bolt": BoltIcon,
  "lightbulb": LightbulbIcon,
  "sun": SunIcon,
  "planet": PlanetIcon,
  "leaf": LeafIcon,
  "cloud": CloudIcon,
  "global": GlobalIcon,
  "map": MapIcon,
  "home": HomeIcon,
  "box": BoxIcon,
  "inbox": InboxIcon,
  "mailbox": MailboxIcon,
  "letter": LetterIcon,
  "link": LinkIcon,
  "lock": LockIcon,
  "shield": ShieldIcon,
  "settings": SettingsIcon,
  "calendar": CalendarIcon,
  "download": DownloadIcon,
  "upload": UploadIcon,
  "danger": DangerIcon,
  "info-circle": InfoCircleIcon,
  "check-circle": CheckCircleIcon,
  "close-circle": CloseCircleIcon,
  "ghost": GhostIcon,
  "cat": CatIcon,
  "gamepad": GamepadIcon,
} satisfies Record<string, SolarIcon>;

export type FancyIconName = keyof typeof FANCY_ICONS;
export type FancyTone = "flame" | "blue" | "plum" | "acid" | "bubble" | "sky" | "ink";

export interface FancyIconProps {
  icon: FancyIconName | SolarIcon;
  tone?: FancyTone;
  /**
   * tint — one colour, the back layer at 40%;
   * duo — ink front layer over a full-strength accent back layer.
   */
  variant?: "tint" | "duo";
  size?: number | string;
  /** Sit the icon on a soft round badge of its own tone. */
  badge?: boolean;
  /** Gentle idle float, for empty states and hero spots. */
  float?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; omit for decorative icons. */
  label?: string;
}

const TONE: Record<FancyTone, string> = {
  flame: "var(--rap-flame)",
  blue: "var(--rap-blue)",
  plum: "var(--rap-plum)",
  acid: "var(--rap-acid)",
  bubble: "var(--rap-bubble)",
  sky: "var(--rap-sky)",
  ink: "var(--rap-ink)",
};

export function FancyIcon({ icon, tone = "blue", variant = "tint", size = 32, badge, float, className, style, label }: FancyIconProps) {
  const Cmp = typeof icon === "string" ? FANCY_ICONS[icon] : icon;
  const c = TONE[tone];
  const glyph = (
    <Cmp
      size={badge ? "58%" : size}
      color={variant === "duo" ? "var(--rap-ink)" : c}
      secondaryColor={c}
      secondaryOpacity={variant === "duo" ? 1 : 0.4}
      isolated
      aria-hidden={label ? undefined : true}
      alt={label}
    />
  );
  return (
    <span
      className={cx("rap-ficon", badge && "rap-ficon--badge", float && "rap-ficon--float", className)}
      style={{ "--fi-tone": c, "--fi-size": typeof size === "number" ? `${size}px` : size, ...style } as CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {glyph}
    </span>
  );
}
