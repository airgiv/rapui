// Data display & feedback. Each component lives in ../components/<Name>.tsx, styled with Tailwind utilities.
export { Badge } from "../components/Badge";
export type { BadgeProps, BadgeVariant } from "../components/Badge";
export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarTone, initials } from "../components/Avatar";
export type { AvatarProps, AvatarGroupProps, AvatarSize, AvatarTone } from "../components/Avatar";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
export type { CardProps } from "../components/Card";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../components/Table";
export { DataTable, dataTableFeatures, createDataTableColumns } from "../components/DataTable";
export type { DataTableProps, DataTableColumn, DataTableColumnMeta, DataTableFeatures } from "../components/DataTable";
export { Skeleton, SkeletonText, SkeletonCircle } from "../components/Skeleton";
export type { SkeletonProps } from "../components/Skeleton";
export { Progress, CircularProgress } from "../components/Progress";
export type { ProgressProps, CircularProgressProps, ProgressTone } from "../components/Progress";
export { Alert, AlertTitle, AlertDescription } from "../components/Alert";
export type { AlertProps, AlertVariant } from "../components/Alert";
export { Separator } from "../components/Separator";
export type { SeparatorProps } from "../components/Separator";
export { AspectRatio } from "../components/AspectRatio";
export type { AspectRatioProps } from "../components/AspectRatio";
export { Kbd, KbdGroup } from "../components/Kbd";
export type { KbdProps } from "../components/Kbd";
export { Toaster, toast } from "../components/Toast";
export type { ToasterProps } from "../components/Toast";
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  chartAxisProps,
  chartGridProps,
  useChartConfig,
  chartLineProps,
} from "../components/Chart";
export type { ChartConfig, ChartContainerProps, ChartTooltipContentProps } from "../components/Chart";
export { Spinner } from "../components/Spinner";
export type { SpinnerProps } from "../components/Spinner";
export { EmptyState } from "../components/EmptyState";
export type { EmptyStateProps } from "../components/EmptyState";
export { Pattern, patternStyle } from "../components/Pattern";
export type { PatternProps, PatternOptions, PatternVariant, PatternFade } from "../components/Pattern";
// the signal set: dot matrices, dotted type, redaction bars, screen-textured media
export { DotMatrix } from "../components/DotMatrix";
export type { DotMatrixProps, DotMatrixAnimation, DotMatrixPattern } from "../components/DotMatrix";
export { MatrixStatus } from "../components/MatrixStatus";
export type { MatrixStatusProps } from "../components/MatrixStatus";
export { DotText } from "../components/DotText";
export type { DotTextProps } from "../components/DotText";
export { Redact } from "../components/Redact";
export type { RedactProps } from "../components/Redact";
export { MediaFrame } from "../components/MediaFrame";
export type { MediaFrameProps } from "../components/MediaFrame";
export { ModGrid, ModCell } from "../components/ModGrid";
export type { ModGridProps, ModCellProps } from "../components/ModGrid";
export { TechClock, DotScreen, Dial, CompassDial, LeaderLines, SideLabel, CrossGrid, TickCircle, PlusMark, IndexTag, SpacedLabel, ArrowLine, SquareMarks, Horizon, OutlineBlob, Asterisk, Molecule } from "../components/TechMarks";
export type { TechClockProps, LeaderLabel } from "../components/TechMarks";
// thin-line 3D figures
export { Figure, FIGURE_SHAPES } from "../components/Figure";
export type { FigureProps, FigureShape, FigureHidden, FigureLook } from "../components/Figure";
