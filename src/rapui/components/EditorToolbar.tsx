import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Toolbar as ToolbarPrimitive } from "radix-ui";
import { useGlide } from "../hooks/useGlide";
import { useSound } from "../sound";
import { cn } from "../utils";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { editorIcons, type EditorIconComponent } from "./editorIcons";
import "./EditorToolbar.css";

/* ── EditorToolbar ───────────────────────────────────────────
   The big tool bar of a canvas editor, at the scale of rap/ui's hero
   inputs rather than the usual 32px icon strip: slots are 60 / 72 / 88px
   pills (88 = Button/Input `hero`), holding the bespoke two-tone
   editorIcons. Built on Radix Toolbar (roving focus, arrow keys along
   the orientation) with one single-choice ToggleGroup across all
   groups, and Radix Popover (via rap/ui's Popover) for the "+" flyout.

   Delight: the tool in your hand is ONE pad that travels — useGlide's
   caterpillar, leading edge on the quick spring, tail catching up — so
   picking a tool reads as moving your hand, not a light switching.
   On arrival the icon plays its own little gesture (the ball bounces,
   the pen scribbles, the sticker peels; see editorIcons.tsx), and a
   label pops above the hovered tool with a back-eased overshoot and one
   wag. Picking a widget from the flyout parks the pad on the "+" slot,
   which now wears that widget's face — the bar shows what you are
   about to place.

   Numbers: slot 60/72/88, icon a bit over half the slot (32/40/48), so the
   32-grid's 2px strokes land at 2–3px — chunky, like the slot; inset 5/6/8 keeps the rail a concentric pill
   around circular slots; slots sit 2px apart (gap-tight) like every
   rap/ui group, and groups are split by a 12–18px gap with a 4px dot —
   a pause, not a wall. Keys: arrows move (detent), Enter/Space pick,
   1–9 pick the n-th tool directly (tap, pitched up the row). */

export interface EditorTool {
  id: string;
  label: string;
  icon: EditorIconComponent;
  /** Tint behind the icon's ink (any colour); defaults to acid. */
  hue?: string;
}
export type EditorToolbarSize = "md" | "lg" | "hero";
export type EditorToolbarTone = "blue" | "ink" | "flame" | "acid" | "plum";

export interface EditorToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "dir"> {
  /** Tool groups, left to right (top to bottom when vertical). */
  groups?: EditorTool[][];
  /** Widgets in the "+" flyout; `false` hides the button. */
  widgets?: EditorTool[] | false;
  value?: string;
  defaultValue?: string;
  /** Called with a tool or widget id. */
  onValueChange?: (id: string) => void;
  /** Called when a widget is picked from the flyout (after onValueChange). */
  onAddWidget?: (id: string) => void;
  size?: EditorToolbarSize;
  orientation?: "horizontal" | "vertical";
  /** Colour of the selected pad. */
  tone?: EditorToolbarTone;
  /** Frosted rail for toolbars floating over content. */
  glass?: boolean;
  /** Hover labels. Default true. */
  labels?: boolean;
}

const I = editorIcons;
export const EDITOR_TOOLS: EditorTool[][] = [
  [
    { id: "select", label: "Select", icon: I.select, hue: "var(--rap-sky)" },
    { id: "hand", label: "Hand", icon: I.hand, hue: "var(--rap-bubble)" },
  ],
  [
    { id: "frame", label: "Section", icon: I.frame, hue: "var(--rap-acid)" },
    { id: "text", label: "Text", icon: I.text, hue: "var(--rap-acid)" },
    { id: "shape", label: "Shape", icon: I.shape, hue: "var(--rap-bubble)" },
    { id: "pen", label: "Pen", icon: I.pen, hue: "var(--rap-sky)" },
  ],
  [{ id: "comment", label: "Comment", icon: I.comment, hue: "var(--rap-acid)" }],
];
export const EDITOR_WIDGETS: EditorTool[] = [
  { id: "image", label: "Image", icon: I.image, hue: "var(--rap-sky)" },
  { id: "video", label: "Video", icon: I.video, hue: "var(--rap-flame)" },
  { id: "audio", label: "Audio", icon: I.audio, hue: "var(--rap-plum)" },
  { id: "animation", label: "Animation", icon: I.animation, hue: "var(--rap-flame)" },
  { id: "sticker", label: "Sticker", icon: I.sticker, hue: "var(--rap-bubble)" },
  { id: "widget", label: "Embed", icon: I.widget, hue: "var(--rap-acid)" },
];

/* pad colour, the ink on it, and a bright tint for the "+" badge
   (acid on blue/ink/flame; flame on acid; bubble on plum). On the pad the
   icon's own fill turns into a 30% wash of the pad's ink: a coloured fill
   under white strokes lost the strokes, the wash keeps both. */
const TONES: Record<EditorToolbarTone, string> = {
  blue: "[--et-sel:var(--rap-blue)] [--et-sel-ink:#fff] [--et-sel-tone:var(--rap-acid)]",
  ink: "[--et-sel:var(--rap-ink)] [--et-sel-ink:var(--rap-paper)] [--et-sel-tone:var(--rap-acid)]",
  flame: "[--et-sel:var(--rap-flame)] [--et-sel-ink:#fff] [--et-sel-tone:var(--rap-acid)]",
  acid: "[--et-sel:var(--rap-acid)] [--et-sel-ink:#282828] [--et-sel-tone:var(--rap-flame)]",
  plum: "[--et-sel:var(--rap-plum)] [--et-sel-ink:#fff] [--et-sel-tone:var(--rap-bubble)]",
};
const SIZES: Record<EditorToolbarSize, string> = {
  md: "[--et-slot:60px] [--et-icon:32px] [--et-inset:5px] [--et-split:12px]",
  lg: "[--et-slot:72px] [--et-icon:40px] [--et-inset:6px] [--et-split:14px]",
  hero: "[--et-slot:88px] [--et-icon:48px] [--et-inset:8px] [--et-split:18px]",
};

/* the per-tool tint, softened: 55% on paper, 40% in the dark so the light
   ink still reads over it. On the pad it becomes a wash of the pad's ink
   and the "cut" fills inside icons take the pad colour. */
const TINT = cn(
  "[--et-mix:55%] dark:[--et-mix:40%]",
  "[--tone:color-mix(in_oklab,var(--et-hue,var(--rap-acid))_var(--et-mix),transparent)]",
  "data-on:[--tone:color-mix(in_oklab,var(--et-sel-ink)_30%,transparent)] data-on:[--eti-cut:var(--et-sel)]",
);

const SLOT = cn(
  "group/tool rap-eti-host relative grid place-items-center shrink-0 size-(--et-slot) p-0",
  "rounded-pill border-0 bg-transparent text-ink cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]",
  "transition-[background-color,color] duration-(--rap-dur-fast) ease-rm",
  "hover:bg-fill data-on:hover:bg-transparent data-on:text-(--et-sel-ink)",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // the glyph lifts a hair on the pad and yields when pressed
  "[&>svg]:size-(--et-icon) [&>svg]:transition-[scale] [&>svg]:duration-300 [&>svg]:ease-spring",
  "data-on:[&>svg]:scale-106 active:[&>svg]:scale-90 active:[&>svg]:duration-100",
  TINT,
);

/* the label pops out of the tool: from half size on ease-back, then one wag */
const LABEL = cn(
  "pointer-events-none absolute z-10 flex items-center gap-2 h-8 pl-3.5 pr-1.5 rounded-pill bg-ink text-paper",
  "whitespace-nowrap font-sans text-[0.875rem] font-medium tracking-[-0.01em] shadow-pop",
  "opacity-0 scale-50 transition-[opacity,scale] duration-(--rap-dur-fast) ease-back",
  "group-hover/tool:opacity-100 group-hover/tool:scale-100 group-focus-visible/tool:opacity-100 group-focus-visible/tool:scale-100",
  "group-data-[state=open]/tool:hidden",
  "fun:group-hover/tool:animate-[eti-wag_520ms_var(--rap-ease-out)]",
);
const KEY =
  "grid place-items-center min-w-5 h-5 px-1 rounded-pill bg-[color-mix(in_oklab,var(--rap-paper)_18%,transparent)] text-[0.75rem] tabular-nums";

export const EditorToolbar = forwardRef<HTMLDivElement, EditorToolbarProps>(function EditorToolbar(
  {
    groups = EDITOR_TOOLS,
    widgets = EDITOR_WIDGETS,
    value: valueProp,
    defaultValue,
    onValueChange,
    onAddWidget,
    size = "lg",
    orientation = "horizontal",
    tone = "blue",
    glass = false,
    labels = true,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  const vertical = orientation === "vertical";
  const flat = useMemo(() => groups.flat(), [groups]);
  const all = useMemo(() => [...flat, ...(widgets || [])], [flat, widgets]);
  const [inner, setInner] = useState(defaultValue ?? flat[0]?.id ?? "");
  const value = valueProp ?? inner;
  const widget = widgets ? widgets.find((w) => w.id === value) : undefined;
  const [open, setOpen] = useState(false);
  const sound = useSound();

  const pick = useCallback(
    (id: string) => {
      if (id === value) return;
      // a tap, pitched up the row so the bar reads as a little scale
      sound.play("tap", { pitch: 0.88 + Math.max(0, all.findIndex((t) => t.id === id)) * 0.045 });
      if (valueProp === undefined) setInner(id);
      onValueChange?.(id);
    },
    [value, valueProp, all, onValueChange, sound],
  );

  // the pad follows whichever slot holds the value (a widget parks it on "+")
  const [active, setActive] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    setActive(
      widget
        ? el.querySelector<HTMLElement>('[data-slot="editor-toolbar-add"]')
        : Array.from(el.querySelectorAll<HTMLElement>('[data-slot="editor-toolbar-tool"]')).find((b) => b.dataset.tool === value) ?? null,
    );
  }, [value, widget, groups]);
  const glide = useGlide(root, active, { axis: vertical ? "y" : "x" });

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    // portalled flyout events bubble through React; only handle our own
    if (e.defaultPrevented || !e.currentTarget.contains(e.target as Node)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key)) {
      const t = flat[Number(e.key) - 1];
      if (!t) return;
      e.preventDefault();
      pick(t.id);
      Array.from(root.current?.querySelectorAll<HTMLElement>('[data-slot="editor-toolbar-tool"]') ?? [])
        .find((b) => b.dataset.tool === t.id)
        ?.focus();
    } else if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
      sound.play("detent", { strength: 0.35 });
    }
  };

  const labelPos = vertical
    ? "left-[calc(100%+var(--et-inset)+10px)] top-1/2 -translate-y-1/2 origin-left"
    : "bottom-[calc(100%+var(--et-inset)+10px)] left-1/2 -translate-x-1/2 origin-bottom";
  const split = cn(
    "relative shrink-0 self-stretch",
    vertical ? "h-(--et-split)" : "w-(--et-split)",
    "after:absolute after:top-1/2 after:left-1/2 after:size-1 after:-translate-1/2 after:rounded-full after:bg-fill-strong",
  );

  let n = 0;
  const AddFace = widget?.icon ?? editorIcons.plus;

  return (
    <ToolbarPrimitive.Root
      ref={root}
      orientation={orientation}
      loop
      aria-label="Tools"
      data-slot="editor-toolbar"
      data-size={size}
      data-orientation={orientation}
      className={cn(
        "relative isolate inline-flex items-center gap-tight p-(--et-inset) rounded-pill text-ink shadow-pop",
        glass ? "bg-[color-mix(in_oklab,var(--rap-surface)_62%,transparent)] backdrop-blur-md backdrop-saturate-150" : "bg-surface",
        vertical && "flex-col",
        SIZES[size],
        TONES[tone],
        className,
      )}
      style={style}
      onKeyDown={keys}
      {...rest}
    >
      <span
        aria-hidden
        data-slot="editor-toolbar-pad"
        className="absolute top-0 left-0 -z-1 rounded-pill bg-(--et-sel) pointer-events-none"
        style={glide.style}
      />
      <ToolbarPrimitive.ToggleGroup
        type="single"
        value={widget ? "" : value}
        onValueChange={(v) => v && pick(v)}
        aria-label="Tool"
        className="contents"
      >
        {groups.map((group, gi) => (
          <GroupFragment key={gi} first={gi === 0} split={split}>
            {group.map((t) => {
              const key = ++n;
              const on = !widget && t.id === value;
              const Icon = t.icon;
              return (
                <ToolbarPrimitive.ToggleItem
                  key={t.id}
                  value={t.id}
                  aria-label={t.label}
                  aria-keyshortcuts={key <= 9 ? String(key) : undefined}
                  data-slot="editor-toolbar-tool"
                  data-tool={t.id}
                  data-on={on || undefined}
                  className={cn(SLOT, on && "rap-eti-on")}
                  style={{ "--et-hue": t.hue } as CSSProperties}
                >
                  <Icon />
                  {labels && (
                    <span aria-hidden data-slot="editor-toolbar-label" className={cn(LABEL, labelPos)}>
                      {t.label}
                      {key <= 9 ? <span className={KEY}>{key}</span> : <span className="w-1.5" />}
                    </span>
                  )}
                </ToolbarPrimitive.ToggleItem>
              );
            })}
          </GroupFragment>
        ))}
      </ToolbarPrimitive.ToggleGroup>

      {widgets && widgets.length > 0 && (
        <>
          <ToolbarPrimitive.Separator className={split} />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <ToolbarPrimitive.Button
                aria-label={widget ? `${widget.label} — add a widget` : "Add a widget"}
                data-slot="editor-toolbar-add"
                data-on={widget ? true : undefined}
                className={cn(SLOT, widget && "rap-eti-on")}
                style={{ "--et-hue": widget?.hue ?? "var(--rap-acid)" } as CSSProperties}
              >
                <AddFace key={widget?.id ?? "plus"} />
                {widget && (
                  // a small "+" badge: this is still the add button, wearing the widget
                  <span
                    aria-hidden
                    className="absolute top-[14%] right-[14%] grid place-items-center size-[22%] rounded-full bg-(--et-sel-tone) text-[#282828] text-[0.75rem] font-semibold leading-none"
                  >
                    +
                  </span>
                )}
                {labels && (
                  <span aria-hidden data-slot="editor-toolbar-label" className={cn(LABEL, labelPos, "pr-3.5")}>
                    {widget ? widget.label : "Add"}
                  </span>
                )}
              </ToolbarPrimitive.Button>
            </PopoverTrigger>
            <PopoverContent
              side={vertical ? "right" : "top"}
              sideOffset={14}
              data-slot="editor-toolbar-flyout"
              className={cn("w-auto p-2", TONES[tone])}
            >
              <div className="px-2.5 pt-1 pb-2 text-[0.8125rem] font-medium tracking-[-0.01em] text-mute">Add a widget</div>
              {/* three across (3 × 92 + 2 × 2 = 280), wrapping to two when the screen is narrower than that */}
              <div className="deal flex flex-wrap gap-tight w-[280px] max-w-[calc(var(--radix-popover-content-available-width)-16px)]">
                {widgets.map((w, i) => {
                  const Icon = w.icon;
                  const on = w.id === value;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      data-slot="editor-toolbar-widget"
                      data-on={on || undefined}
                      className={cn(
                        "rap-eti-host flex flex-col items-center justify-center gap-1.5 size-[92px] rounded-[20px] border-0 bg-fill text-ink cursor-pointer",
                        "font-sans text-[0.8125rem] font-medium tracking-[-0.01em] outline-none",
                        "transition-[background-color,color,scale] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover active:scale-95",
                        "data-on:bg-(--et-sel) data-on:text-(--et-sel-ink) data-on:hover:bg-(--et-sel)",
                        "focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
                        TINT,
                      )}
                      style={{ "--i": i, "--et-hue": w.hue } as CSSProperties}
                      onClick={() => {
                        pick(w.id);
                        onAddWidget?.(w.id);
                        setOpen(false);
                      }}
                    >
                      <Icon size={40} />
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </ToolbarPrimitive.Root>
  );
});

function GroupFragment({ first, split, children }: { first: boolean; split: string; children: ReactNode }) {
  return (
    <>
      {!first && <ToolbarPrimitive.Separator className={split} />}
      {children}
    </>
  );
}
