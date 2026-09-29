/* ───────────────────────────────────────────────────────────
   rap/ui technical icons.

   One place for every interface glyph (chevrons, close, check,
   menu actions…). Components import the names below — kept
   close to the common lucide/shadcn vocabulary — and the set
   underneath is Hugeicons "Stroke Rounded" (free, MIT): round
   caps and joins, softened corners, a rounded play triangle and
   squircle-ish boxes, so the glyphs sit happily inside rap/ui's
   big round pills. Drawn at a medium 2px stroke by default (the
   old Phosphor Light read too thin — e.g. the Slide-to-publish
   arrow). 4,000+ free glyphs to grow into. Swapping the whole
   library to another set is a change to this file only.

   For illustrative, "fancy" spots use FancyIcon (Solar duotone).
   ─────────────────────────────────────────────────────────── */
import { forwardRef, type SVGProps } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  AlertCircleIcon,
  AlignBottomIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  Archive02Icon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowRightDoubleIcon,
  ArrowShrink02Icon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  AtIcon,
  Bookmark02Icon,
  Calendar01Icon,
  Calendar03Icon,
  Call02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartColumnIcon,
  CheckmarkCircle02Icon,
  CircleIcon,
  ClipboardIcon,
  Clock01Icon,
  CodeIcon,
  CommandIcon,
  Copy01Icon,
  CubeIcon,
  Cursor01Icon,
  Delete02Icon,
  Download04Icon,
  DragDropHorizontalIcon,
  DragDropVerticalIcon,
  FavouriteIcon,
  FileAddIcon,
  FileTextIcon,
  FilterIcon,
  FlashIcon,
  FloppyDiskIcon,
  Folder01Icon,
  FolderOpenIcon,
  FrameIcon,
  Globe02Icon,
  Grid3x3Icon,
  GridViewIcon,
  Home01Icon,
  Image01Icon,
  InboxIcon,
  InformationCircleIcon,
  LayerBringToFrontIcon,
  LayerSendToBackIcon,
  Layers01Icon,
  LayoutThreeColumnIcon,
  LifebuoyIcon,
  Link04Icon,
  LinkSquare02Icon,
  LogOutIcon,
  Mail01Icon,
  Menu01Icon,
  MinusSignIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  NewsIcon,
  Notification01Icon,
  PaintBoardIcon,
  PauseIcon,
  PenTool02Icon,
  PencilEdit01Icon,
  PencilEdit02Icon,
  PinIcon,
  PlayIcon,
  RadioButtonIcon,
  RedoIcon,
  RefreshCwIcon,
  ScissorIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  Share08Icon,
  SidebarLeftIcon,
  SlashIcon,
  SlidersHorizontalIcon,
  SmileIcon,
  SortByDown02Icon,
  SortByUp02Icon,
  SourceCodeIcon,
  SparklesIcon,
  SplineIcon,
  SquareIcon,
  SquareLock02Icon,
  StarIcon,
  StrikethroughIcon,
  Sun03Icon,
  Tag01Icon,
  TextBoldIcon,
  TextIcon,
  TextUnderlineIcon,
  ThumbsUpIcon,
  Tick02Icon,
  UndoIcon,
  UnfoldMoreIcon,
  Upload04Icon,
  UserIcon,
  UserMultipleIcon,
  Video01Icon,
  ViewIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons";

/** Named weights, kept from the Phosphor era; each maps to a stroke width. */
export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
const WEIGHT_STROKE: Record<IconWeight, number> = { thin: 1.25, light: 1.5, regular: 2, bold: 2.5, fill: 2, duotone: 2 };
/** The library default: medium and rounded. */
const DEFAULT_STROKE = 2;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  /** px number or CSS length. Default 24 — most components size icons from CSS. */
  size?: number | string;
  /** Stroke width on the 24px grid, lucide-style. Default 2. */
  strokeWidth?: number;
  /** Named alternative to `strokeWidth` (thin 1.25 · light 1.5 · regular 2 · bold 2.5). */
  weight?: IconWeight;
  /** Flip horizontally (for RTL). */
  mirrored?: boolean;
}
export type IconComponent = ReturnType<typeof make>;

function make(icon: IconSvgElement, name: string) {
  const C = forwardRef<SVGSVGElement, IconProps>(function RapIcon(
    { size = 24, strokeWidth, weight, mirrored, style, className, ...rest },
    ref,
  ) {
    const labelled = rest["aria-label"] != null || rest["aria-labelledby"] != null;
    return (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        size={size}
        strokeWidth={strokeWidth ?? (weight ? WEIGHT_STROKE[weight] : DEFAULT_STROKE)}
        className={className}
        aria-hidden={labelled ? undefined : true}
        focusable="false"
        style={mirrored ? { transform: "scaleX(-1)", ...style } : style}
        {...rest}
      />
    );
  });
  C.displayName = name;
  return C;
}

/* not in the free set: an open ring (CircleNotch), drawn in the same style */
const LoaderIcon: IconSvgElement = [
  ["path", { d: "M12 3a9 9 0 1 0 9 9", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2", key: "0" }],
];

export const AlignCenterHorizontal = make(AlignVerticalCenterIcon, "AlignCenterHorizontal");
export const AlignEndHorizontal = make(AlignBottomIcon, "AlignEndHorizontal");
export const AlignStartHorizontal = make(AlignTopIcon, "AlignStartHorizontal");
export const ArrowDown = make(ArrowDown02Icon, "ArrowDown");
export const ArrowLeft = make(ArrowLeft02Icon, "ArrowLeft");
export const ArrowRight = make(ArrowRight02Icon, "ArrowRight");
export const ArrowUp = make(ArrowUp02Icon, "ArrowUp");
export const ArrowUpDown = make(ArrowUpDownIcon, "ArrowUpDown");
export const ArrowUpRight = make(ArrowUpRight01Icon, "ArrowUpRight");
export const AtSign = make(AtIcon, "AtSign");
export const BarChart3 = make(ChartColumnIcon, "BarChart3");
export const Bold = make(TextBoldIcon, "Bold");
export const Box = make(CubeIcon, "Box");
export const BringToFront = make(LayerBringToFrontIcon, "BringToFront");
export const CalendarDays = make(Calendar03Icon, "CalendarDays");
export const Check = make(Tick02Icon, "Check");
export const ChevronDown = make(ArrowDown01Icon, "ChevronDown");
export const ChevronLeft = make(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = make(ArrowRight01Icon, "ChevronRight");
export const ChevronUp = make(ArrowUp01Icon, "ChevronUp");
export const Circle = make(CircleIcon, "Circle");
export const CircleAlert = make(AlertCircleIcon, "CircleAlert");
export const CircleCheck = make(CheckmarkCircle02Icon, "CircleCheck");
export const Clipboard = make(ClipboardIcon, "Clipboard");
export const Code = make(SourceCodeIcon, "Code");
export const Code2 = make(CodeIcon, "Code2");
export const Columns3 = make(LayoutThreeColumnIcon, "Columns3");
export const Command = make(CommandIcon, "Command");
export const Copy = make(Copy01Icon, "Copy");
export const Download = make(Download04Icon, "Download");
export const Eye = make(ViewIcon, "Eye");
export const FilePlus = make(FileAddIcon, "FilePlus");
export const FileText = make(FileTextIcon, "FileText");
export const Folder = make(Folder01Icon, "Folder");
export const FolderOpen = make(FolderOpenIcon, "FolderOpen");
export const Frame = make(FrameIcon, "Frame");
export const Globe = make(Globe02Icon, "Globe");
export const Grid3x3 = make(Grid3x3Icon, "Grid3x3");
export const Home = make(Home01Icon, "Home");
export const Image = make(Image01Icon, "Image");
export const Inbox = make(InboxIcon, "Inbox");
export const Info = make(InformationCircleIcon, "Info");
export const Layers = make(Layers01Icon, "Layers");
export const LayoutGrid = make(GridViewIcon, "LayoutGrid");
export const LifeBuoy = make(LifebuoyIcon, "LifeBuoy");
export const Link2 = make(Link04Icon, "Link2");
export const Lock = make(SquareLock02Icon, "Lock");
export const Minus = make(MinusSignIcon, "Minus");
export const MoreHorizontal = make(MoreHorizontalIcon, "MoreHorizontal");
export const MousePointer2 = make(Cursor01Icon, "MousePointer2");
export const Newspaper = make(NewsIcon, "Newspaper");
export const Palette = make(PaintBoardIcon, "Palette");
export const PanelLeft = make(SidebarLeftIcon, "PanelLeft");
export const PenLine = make(PencilEdit02Icon, "PenLine");
export const PenTool = make(PenTool02Icon, "PenTool");
export const Plus = make(Add01Icon, "Plus");
export const Scissors = make(ScissorIcon, "Scissors");
export const Search = make(Search01Icon, "Search");
export const SendToBack = make(LayerSendToBackIcon, "SendToBack");
export const Settings = make(Settings01Icon, "Settings");
export const Settings2 = make(SlidersHorizontalIcon, "Settings2");
export const Share2 = make(Share08Icon, "Share2");
export const Slash = make(SlashIcon, "Slash");
export const Sparkles = make(SparklesIcon, "Sparkles");
export const Spline = make(SplineIcon, "Spline");
export const Square = make(SquareIcon, "Square");
export const Star = make(StarIcon, "Star");
export const Strikethrough = make(StrikethroughIcon, "Strikethrough");
export const Trash2 = make(Delete02Icon, "Trash2");
export const TriangleAlert = make(Alert02Icon, "TriangleAlert");
export const Type = make(TextIcon, "Type");
export const Underline = make(TextUnderlineIcon, "Underline");
export const Upload = make(Upload04Icon, "Upload");
export const Users = make(UserMultipleIcon, "Users");
export const X = make(Cancel01Icon, "X");
export const Archive = make(Archive02Icon, "Archive");
export const Bell = make(Notification01Icon, "Bell");
export const Bookmark = make(Bookmark02Icon, "Bookmark");
export const Calendar = make(Calendar01Icon, "Calendar");
export const ChevronsLeft = make(ArrowLeftDoubleIcon, "ChevronsLeft");
export const ChevronsRight = make(ArrowRightDoubleIcon, "ChevronsRight");
export const ChevronsUpDown = make(UnfoldMoreIcon, "ChevronsUpDown");
export const CircleDot = make(RadioButtonIcon, "CircleDot");
export const CircleX = make(CancelCircleIcon, "CircleX");
export const Clock = make(Clock01Icon, "Clock");
export const Edit = make(PencilEdit01Icon, "Edit");
export const ExternalLink = make(LinkSquare02Icon, "ExternalLink");
export const Filter = make(FilterIcon, "Filter");
export const GripHorizontal = make(DragDropVerticalIcon, "GripHorizontal");
export const GripVertical = make(DragDropHorizontalIcon, "GripVertical");
export const Heart = make(FavouriteIcon, "Heart");
export const Loader = make(LoaderIcon, "Loader");
export const LogOut = make(LogOutIcon, "LogOut");
export const Mail = make(Mail01Icon, "Mail");
export const Maximize = make(ArrowExpand01Icon, "Maximize");
export const Menu = make(Menu01Icon, "Menu");
export const Minimize = make(ArrowShrink02Icon, "Minimize");
export const Moon = make(Moon02Icon, "Moon");
export const Pause = make(PauseIcon, "Pause");
export const Phone = make(Call02Icon, "Phone");
export const Pin = make(PinIcon, "Pin");
export const Play = make(PlayIcon, "Play");
export const Redo = make(RedoIcon, "Redo");
export const RefreshCw = make(RefreshCwIcon, "RefreshCw");
export const Save = make(FloppyDiskIcon, "Save");
export const Send = make(SentIcon, "Send");
export const Smile = make(SmileIcon, "Smile");
export const SortAsc = make(SortByUp02Icon, "SortAsc");
export const SortDesc = make(SortByDown02Icon, "SortDesc");
export const Sparkle = make(SparklesIcon, "Sparkle");
export const Sun = make(Sun03Icon, "Sun");
export const Tag = make(Tag01Icon, "Tag");
export const ThumbsUp = make(ThumbsUpIcon, "ThumbsUp");
export const Undo = make(UndoIcon, "Undo");
export const User = make(UserIcon, "User");
export const Video = make(Video01Icon, "Video");
export const Zap = make(FlashIcon, "Zap");
export const Volume1 = make(VolumeLowIcon, "Volume1");
export const Volume2 = make(VolumeHighIcon, "Volume2");
export const VolumeX = make(VolumeMute02Icon, "VolumeX");
