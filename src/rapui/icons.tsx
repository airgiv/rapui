/* ───────────────────────────────────────────────────────────
   rap/ui technical icons.

   One place for every interface glyph (chevrons, close, check,
   menu actions…). Components import the names below — kept
   close to the common lucide/shadcn vocabulary — and the set
   underneath is Phosphor at its Light weight: thin, even and
   technical, with 1,500+ glyphs to grow into. Swapping the
   whole library to another set is a change to this file only.

   For illustrative, "fancy" spots use FancyIcon (Solar duotone).
   ─────────────────────────────────────────────────────────── */
import { forwardRef, type SVGProps } from "react";
import * as Ph from "@phosphor-icons/react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  /** px number or CSS length. Default 24 — most components size icons from CSS. */
  size?: number | string;
  /**
   * Accepted for lucide-style call sites. Phosphor draws with weights, so it is
   * mapped: ≥ 2.4 → bold, ≥ 1.9 → regular, otherwise light (the default).
   */
  strokeWidth?: number;
  weight?: Ph.IconWeight;
  mirrored?: boolean;
}
export type IconComponent = ReturnType<typeof make>;

const weightOf = (w?: number): Ph.IconWeight => (w == null ? "light" : w >= 2.4 ? "bold" : w >= 1.9 ? "regular" : "light");

function make(P: Ph.Icon, name: string) {
  const C = forwardRef<SVGSVGElement, IconProps>(function RapIcon({ size = 24, strokeWidth, weight, ...rest }, ref) {
    return <P ref={ref} size={size} weight={weight ?? weightOf(strokeWidth)} {...(rest as object)} />;
  });
  C.displayName = name;
  return C;
}

export const AlignCenterHorizontal = make(Ph.AlignCenterVertical, "AlignCenterHorizontal");
export const AlignEndHorizontal = make(Ph.AlignBottom, "AlignEndHorizontal");
export const AlignStartHorizontal = make(Ph.AlignTop, "AlignStartHorizontal");
export const ArrowDown = make(Ph.ArrowDown, "ArrowDown");
export const ArrowLeft = make(Ph.ArrowLeft, "ArrowLeft");
export const ArrowRight = make(Ph.ArrowRight, "ArrowRight");
export const ArrowUp = make(Ph.ArrowUp, "ArrowUp");
export const ArrowUpDown = make(Ph.ArrowsDownUp, "ArrowUpDown");
export const ArrowUpRight = make(Ph.ArrowUpRight, "ArrowUpRight");
export const AtSign = make(Ph.At, "AtSign");
export const BarChart3 = make(Ph.ChartBar, "BarChart3");
export const Bold = make(Ph.TextB, "Bold");
export const Box = make(Ph.Cube, "Box");
export const BringToFront = make(Ph.SelectionForeground, "BringToFront");
export const CalendarDays = make(Ph.CalendarDots, "CalendarDays");
export const Check = make(Ph.Check, "Check");
export const ChevronDown = make(Ph.CaretDown, "ChevronDown");
export const ChevronLeft = make(Ph.CaretLeft, "ChevronLeft");
export const ChevronRight = make(Ph.CaretRight, "ChevronRight");
export const ChevronUp = make(Ph.CaretUp, "ChevronUp");
export const Circle = make(Ph.Circle, "Circle");
export const CircleAlert = make(Ph.WarningCircle, "CircleAlert");
export const CircleCheck = make(Ph.CheckCircle, "CircleCheck");
export const Clipboard = make(Ph.Clipboard, "Clipboard");
export const Code = make(Ph.Code, "Code");
export const Code2 = make(Ph.CodeSimple, "Code2");
export const Columns3 = make(Ph.Columns, "Columns3");
export const Command = make(Ph.Command, "Command");
export const Copy = make(Ph.Copy, "Copy");
export const Download = make(Ph.DownloadSimple, "Download");
export const Eye = make(Ph.Eye, "Eye");
export const FilePlus = make(Ph.FilePlus, "FilePlus");
export const FileText = make(Ph.FileText, "FileText");
export const Folder = make(Ph.Folder, "Folder");
export const FolderOpen = make(Ph.FolderOpen, "FolderOpen");
export const Frame = make(Ph.Hash, "Frame");
export const Globe = make(Ph.Globe, "Globe");
export const Grid3x3 = make(Ph.GridNine, "Grid3x3");
export const Home = make(Ph.House, "Home");
export const Image = make(Ph.Image, "Image");
export const Inbox = make(Ph.Tray, "Inbox");
export const Info = make(Ph.Info, "Info");
export const Layers = make(Ph.Stack, "Layers");
export const LayoutGrid = make(Ph.SquaresFour, "LayoutGrid");
export const LifeBuoy = make(Ph.Lifebuoy, "LifeBuoy");
export const Link2 = make(Ph.LinkSimple, "Link2");
export const Lock = make(Ph.Lock, "Lock");
export const Minus = make(Ph.Minus, "Minus");
export const MoreHorizontal = make(Ph.DotsThree, "MoreHorizontal");
export const MousePointer2 = make(Ph.Cursor, "MousePointer2");
export const Newspaper = make(Ph.Newspaper, "Newspaper");
export const Palette = make(Ph.Palette, "Palette");
export const PanelLeft = make(Ph.SidebarSimple, "PanelLeft");
export const PenLine = make(Ph.PencilLine, "PenLine");
export const PenTool = make(Ph.PenNib, "PenTool");
export const Plus = make(Ph.Plus, "Plus");
export const Scissors = make(Ph.Scissors, "Scissors");
export const Search = make(Ph.MagnifyingGlass, "Search");
export const SendToBack = make(Ph.SelectionBackground, "SendToBack");
export const Settings = make(Ph.Gear, "Settings");
export const Settings2 = make(Ph.SlidersHorizontal, "Settings2");
export const Share2 = make(Ph.ShareNetwork, "Share2");
export const Slash = make(Ph.LineSegment, "Slash");
export const Sparkles = make(Ph.Sparkle, "Sparkles");
export const Spline = make(Ph.BezierCurve, "Spline");
export const Square = make(Ph.Square, "Square");
export const Star = make(Ph.Star, "Star");
export const Strikethrough = make(Ph.TextStrikethrough, "Strikethrough");
export const Trash2 = make(Ph.Trash, "Trash2");
export const TriangleAlert = make(Ph.Warning, "TriangleAlert");
export const Type = make(Ph.TextT, "Type");
export const Underline = make(Ph.TextUnderline, "Underline");
export const Upload = make(Ph.UploadSimple, "Upload");
export const Users = make(Ph.Users, "Users");
export const X = make(Ph.X, "X");
