import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/surfaces.css";
import "./styles/motion.css";

export { cx } from "./utils";
export { useInView } from "./hooks/useInView";
export { useMagnetic } from "./hooks/useMagnetic";
export { useSpring, useSpringLag } from "./hooks/useSpring";
export { useGlide } from "./hooks/useGlide";
export { useReplay } from "./hooks/useReplay";

// opt-in interface sound
export { SoundProvider, useSound, synth } from "./sound";
export type { SoundApi, SoundSettings, SoundName, PlayOptions } from "./sound";

export { Display, Accent, Eyebrow, Lead, Highlight } from "./components/Typography";
export type { DisplayProps, AccentTone } from "./components/Typography";
export { RollText } from "./components/RollText";
export { Button, ButtonGroup, CircleButton, Arrow } from "./components/Button";
export type { ButtonProps, ButtonGroupProps, ButtonVariant, ButtonSize, CircleButtonProps } from "./components/Button";
export { Magnetic } from "./components/Magnetic";
export { Marquee } from "./components/Marquee";
export { SplitReveal } from "./components/SplitReveal";
export { Sticker } from "./components/Sticker";
export type { StickerProps, StickerColor, StickerShape } from "./components/Sticker";
export { RotatingBadge } from "./components/RotatingBadge";
export { TiltCard } from "./components/TiltCard";
export { Field } from "./components/Field";
export { Switch } from "./components/Switch";
export { Accordion } from "./components/Accordion";
export type { AccordionItem } from "./components/Accordion";
export { Tabs } from "./components/Tabs";
export type { TabItem } from "./components/Tabs";
export { Counter } from "./components/Counter";
export { Cursor } from "./components/Cursor";
export { Grain } from "./components/Grain";
export { TimeScrubber } from "./components/TimeScrubber";

// icons: thin technical set (Phosphor Light) as a namespace, fancy Solar duotone
export * as icons from "./icons";
export type { IconComponent, IconProps } from "./icons";
export { FancyIcon, FANCY_ICONS } from "./components/FancyIcon";
export type { FancyIconName, FancyIconProps, FancyTone, SolarIcon } from "./components/FancyIcon";
export { BigLink } from "./components/BigLink";
export { FeatureCard } from "./components/FeatureCard";
export { Checklist } from "./components/Checklist";
export { CanvasToolbar } from "./components/CanvasToolbar";

// admin / product kit (Radix-based), grouped like the docs sidebar
export * from "./groups/forms";
export * from "./groups/overlays";
export * from "./groups/display";
export * from "./groups/navigation";
export * from "./groups/scrubbers";
