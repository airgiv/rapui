import { useEffect, useState, type CSSProperties } from "react";
import {
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartHorizontal,
  BringToFront,
  ChevronDown,
  Clipboard,
  Copy,
  Download,
  FilePlus,
  Frame,
  Globe,
  Image,
  Lock,
  MousePointer2,
  PenLine,
  PenTool,
  Scissors,
  SendToBack,
  Settings2,
  Share2,
  Square,
  Trash2,
  Type,
  Users,
} from "../../rapui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Label,
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";
type Size = "sm" | "md" | "lg";

/* small layout helpers for demos (docs.css is shared, so these stay inline) */
const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const muted: CSSProperties = { margin: 0, color: "var(--rap-mute)", fontSize: "0.875rem", lineHeight: 1.45 };

/* ── Dialog ────────────────────────────────────────── */
const dialogControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "showClose", label: "close button", default: true },
  { type: "text", prop: "title", default: "Rename project" },
];

/* ── AlertDialog ───────────────────────────────────── */
const alertControls: Control[] = [
  { type: "select", prop: "variant", label: "action variant", options: ["danger", "solid", "accent", "blue"], default: "danger" },
  { type: "select", prop: "size", options: ["sm", "md"], default: "sm" },
  { type: "text", prop: "action", label: "action label", default: "Delete project" },
];

/* ── Sheet ─────────────────────────────────────────── */
const sheetControls: Control[] = [
  { type: "select", prop: "side", options: ["right", "left", "top", "bottom"], default: "right" },
  { type: "boolean", prop: "showClose", label: "close button", default: true },
];

/* ── Drawer ────────────────────────────────────────── */
const drawerControls: Control[] = [
  { type: "boolean", prop: "handle", default: true },
  { type: "boolean", prop: "dismissible", default: true },
];

/* ── Popover ───────────────────────────────────────── */
const popoverControls: Control[] = [
  { type: "select", prop: "side", options: ["bottom", "top", "right", "left"], default: "bottom" },
  { type: "select", prop: "align", options: ["center", "start", "end"], default: "center" },
  { type: "number", prop: "sideOffset", min: 0, max: 24, step: 2, default: 8 },
];

/* ── HoverCard ─────────────────────────────────────── */
const hoverControls: Control[] = [
  { type: "select", prop: "side", options: ["bottom", "top", "right", "left"], default: "bottom" },
  { type: "select", prop: "align", options: ["center", "start", "end"], default: "center" },
  { type: "number", prop: "openDelay", min: 0, max: 1000, step: 50, default: 300 },
];

/* ── Tooltip ───────────────────────────────────────── */
const tooltipControls: Control[] = [
  { type: "select", prop: "side", options: ["top", "bottom", "right", "left"], default: "top" },
  { type: "number", prop: "delayDuration", label: "delay", min: 0, max: 1000, step: 50, default: 300 },
  { type: "boolean", prop: "arrow", default: true, codeDefault: false },
  { type: "boolean", prop: "shortcut", label: "show shortcut", default: true },
];

/* ── DropdownMenu ──────────────────────────────────── */
const dropdownControls: Control[] = [
  { type: "select", prop: "align", options: ["start", "center", "end"], default: "start" },
  { type: "select", prop: "side", options: ["bottom", "top", "right", "left"], default: "bottom" },
  { type: "boolean", prop: "icons", label: "show icons", default: true },
  { type: "boolean", prop: "shortcuts", label: "show shortcuts", default: true },
];

/* ── ContextMenu ───────────────────────────────────── */
const contextControls: Control[] = [
  { type: "boolean", prop: "icons", label: "show icons", default: true },
  { type: "boolean", prop: "shortcuts", label: "show shortcuts", default: true },
];

/* ── Menubar ───────────────────────────────────────── */
const menubarControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "shortcuts", label: "show shortcuts", default: true },
];

/* ── Command ───────────────────────────────────────── */
const commandControls: Control[] = [
  { type: "text", prop: "placeholder", default: "Type a command or search" },
  { type: "boolean", prop: "icons", label: "show icons", default: true },
  { type: "boolean", prop: "shortcuts", label: "show shortcuts", default: true },
];

/* shared demo bits */
function Avatar({ initials, color = "var(--rap-flame)", size = 48 }: { initials: string; color?: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "grid",
        placeItems: "center",
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        fontSize: size * 0.34,
        fontWeight: 500,
        letterSpacing: "-0.02em",
      }}
    >
      {initials}
    </span>
  );
}

function PaletteItems({ icons = true, shortcuts = true, onRun }: { icons?: boolean; shortcuts?: boolean; onRun?: () => void }) {
  const run = () => onRun?.();
  return (
    <>
      <CommandEmpty>Nothing matches. Try “frame” or “export”.</CommandEmpty>
      <CommandGroup heading="Create">
        <CommandItem onSelect={run}>
          {icons && <FilePlus />}New page{shortcuts && <CommandShortcut>⌘N</CommandShortcut>}
        </CommandItem>
        <CommandItem onSelect={run}>
          {icons && <Frame />}Add frame{shortcuts && <CommandShortcut>F</CommandShortcut>}
        </CommandItem>
        <CommandItem onSelect={run}>
          {icons && <Type />}Add text block{shortcuts && <CommandShortcut>T</CommandShortcut>}
        </CommandItem>
        <CommandItem onSelect={run}>
          {icons && <Image />}Insert image{shortcuts && <CommandShortcut>⇧⌘I</CommandShortcut>}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Project">
        <CommandItem onSelect={run}>
          {icons && <Globe />}Publish to studio.site{shortcuts && <CommandShortcut>⌘P</CommandShortcut>}
        </CommandItem>
        <CommandItem onSelect={run}>
          {icons && <Download />}Export as PDF{shortcuts && <CommandShortcut>⇧⌘E</CommandShortcut>}
        </CommandItem>
        <CommandItem onSelect={run}>
          {icons && <Users />}Invite collaborators
        </CommandItem>
        <CommandItem onSelect={run} disabled>
          {icons && <Lock />}Transfer ownership
        </CommandItem>
        <CommandItem onSelect={run}>
          {icons && <Settings2 />}Project settings{shortcuts && <CommandShortcut>⌘,</CommandShortcut>}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export const entries: DocEntry[] = [
  /* ── Dialog ── */
  {
    slug: "dialog",
    name: "Dialog",
    group: "Overlays",
    basedOn: "Radix Dialog",
    description:
      "A centred card over a dimmed page for focused tasks. Focus stays inside; Esc or a click outside closes it. Delight: open it and it is tossed onto the table, turning as it lands; close it and watch it fall away under gravity.",
    controls: dialogControls,
    Demo: ({ p }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="soft">Rename project</Button>
        </DialogTrigger>
        <DialogContent size={p.size as Size} showClose={Boolean(p.showClose)}>
          <DialogHeader>
            <DialogTitle>{String(p.title)}</DialogTitle>
            <DialogDescription>Give it a name your team will recognise. The public URL updates too.</DialogDescription>
          </DialogHeader>
          <div style={field}>
            <Label htmlFor="doc-dlg-name">Project name</Label>
            <Input id="doc-dlg-name" defaultValue="Autumn lookbook 2026" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="soft">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Save name</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    code: (p) =>
      `import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input } from "rapui";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="soft">Rename project</Button>
  </DialogTrigger>
  <DialogContent${attrs(p, dialogControls, ["title"])}>
    <DialogHeader>
      <DialogTitle>${p.title}</DialogTitle>
      <DialogDescription>Give it a name your team will recognise.</DialogDescription>
    </DialogHeader>
    <Input defaultValue="Autumn lookbook 2026" />
    <DialogFooter>
      <DialogClose asChild><Button variant="soft">Cancel</Button></DialogClose>
      <Button>Save name</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    examples: [
      {
        title: "Invite collaborators",
        Demo: () => (
          <Dialog>
            <DialogTrigger asChild>
              <Button icon={<Users size={18} />}>Invite</Button>
            </DialogTrigger>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Invite to “Autumn lookbook”</DialogTitle>
                <DialogDescription>People you invite can see every page, including drafts.</DialogDescription>
              </DialogHeader>
              <div className="doc-row" style={{ gap: 2, flexWrap: "nowrap" }}>
                <Input placeholder="name@studio.com" aria-label="Email" />
                <ToggleGroup type="single" defaultValue="edit" aria-label="Role">
                  <ToggleGroupItem value="view">Viewer</ToggleGroupItem>
                  <ToggleGroupItem value="edit">Editor</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="doc-stack" style={{ gap: 12 }}>
                {[
                  ["MK", "Mira Kovač", "Owner", "var(--rap-flame)"],
                  ["JB", "Jonah Bell", "Editor", "var(--rap-blue)"],
                  ["SA", "Saskia Arendt", "Viewer", "var(--rap-plum)"],
                ].map(([i, n, r, c]) => (
                  <div key={n} className="doc-row doc-between">
                    <span className="doc-row" style={{ gap: 12 }}>
                      <Avatar initials={i} color={c} size={36} />
                      {n}
                    </span>
                    <span className="doc-muted">{r}</span>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Send invites</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ),
        code: `<DialogContent size="lg">
  <DialogHeader>…</DialogHeader>
  <div style={{ display: "flex", gap: 2 }}>
    <Input placeholder="name@studio.com" />
    <ToggleGroup type="single" defaultValue="edit">…</ToggleGroup>
  </div>
  <DialogFooter><Button>Send invites</Button></DialogFooter>
</DialogContent>`,
      },
    ],
  },

  /* ── AlertDialog ── */
  {
    slug: "alert-dialog",
    name: "Alert dialog",
    group: "Overlays",
    basedOn: "Radix AlertDialog",
    description:
      "Asks for a decision before something irreversible. A click outside does not close it; Cancel gets focus first. Delight: rest the pointer on a danger action and it trembles nervously; confirm and the card falls away like a Dialog.",
    controls: alertControls,
    Demo: ({ p }) => (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" icon={<Trash2 size={18} />} iconPosition="start">
            Delete project
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size={p.size as "sm" | "md"}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “Autumn lookbook”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project, its 24 pages and every published version. Visitors will see a 404. This can’t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant={p.variant as "danger"}>{String(p.action)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    code: (p) =>
      `import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button } from "rapui";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Delete project</Button>
  </AlertDialogTrigger>
  <AlertDialogContent${p.size !== "sm" ? ` size="${p.size}"` : ""}>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete “Autumn lookbook”?</AlertDialogTitle>
      <AlertDialogDescription>This removes the project and every published version.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep it</AlertDialogCancel>
      <AlertDialogAction variant="${p.variant}" onClick={deleteProject}>${p.action}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    examples: [
      {
        title: "Non-destructive confirm",
        Demo: () => (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="blue" icon={<Globe size={18} />}>
                Publish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish 3 changed pages?</AlertDialogTitle>
                <AlertDialogDescription>
                  Home, Journal and Contact go live on studio.site right away. The previous version stays in history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Not yet</AlertDialogCancel>
                <AlertDialogAction variant="blue">Publish now</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ),
        code: `<AlertDialogFooter>
  <AlertDialogCancel>Not yet</AlertDialogCancel>
  <AlertDialogAction variant="blue">Publish now</AlertDialogAction>
</AlertDialogFooter>`,
      },
    ],
  },

  /* ── Sheet ── */
  {
    slug: "sheet",
    name: "Sheet",
    group: "Overlays",
    basedOn: "Radix Dialog",
    description:
      "A panel that slides in from any edge and floats 8px off the viewport. Use it for settings and details that keep the page in view. Delight: the panel arrives on a spring, running a touch past its place, and then its contents are dealt in one after another.",
    controls: sheetControls,
    Demo: ({ p }) => (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="soft" icon={<Settings2 size={18} />}>
            Page settings
          </Button>
        </SheetTrigger>
        <SheetContent side={p.side as Side} showClose={Boolean(p.showClose)}>
          <SheetHeader>
            <SheetTitle>Page settings</SheetTitle>
            <SheetDescription>How “Journal” appears in search results and link previews.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div className="doc-stack" style={{ gap: 18 }}>
              <div style={field}>
                <Label htmlFor="doc-sh-title">Page title</Label>
                <Input id="doc-sh-title" defaultValue="Journal — Studio Vale" />
              </div>
              <div style={field}>
                <Label htmlFor="doc-sh-slug">URL</Label>
                <Input id="doc-sh-slug" defaultValue="journal" prefix="studio.site/" />
              </div>
              <div style={field}>
                <Label>Layout width</Label>
                <ToggleGroup type="single" defaultValue="fixed" aria-label="Layout width">
                  <ToggleGroupItem value="fixed">Fixed 1280</ToggleGroupItem>
                  <ToggleGroupItem value="fluid">Fluid</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="soft">Cancel</Button>
            </SheetClose>
            <SheetClose asChild>
              <Button>Save</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
    code: (p) =>
      `import { Button, Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "rapui";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="soft">Page settings</Button>
  </SheetTrigger>
  <SheetContent${attrs(p, sheetControls)}>
    <SheetHeader>
      <SheetTitle>Page settings</SheetTitle>
      <SheetDescription>How “Journal” appears in search results.</SheetDescription>
    </SheetHeader>
    <SheetBody>…fields…</SheetBody>
    <SheetFooter>
      <SheetClose asChild><Button variant="soft">Cancel</Button></SheetClose>
      <Button>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
    examples: [
      {
        title: "Every side",
        Demo: () => (
          <div className="doc-row" style={{ gap: 2 }}>
            {(["left", "top", "bottom", "right"] as const).map((side) => (
              <Sheet key={side}>
                <SheetTrigger asChild>
                  <Button variant="soft" size="sm">
                    {side[0].toUpperCase() + side.slice(1)}
                  </Button>
                </SheetTrigger>
                <SheetContent side={side}>
                  <SheetHeader>
                    <SheetTitle>Layers</SheetTitle>
                    <SheetDescription>Sliding in from the {side}.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        ),
        code: `<SheetContent side="left">…</SheetContent>
<SheetContent side="top">…</SheetContent>
<SheetContent side="bottom">…</SheetContent>`,
      },
    ],
  },

  /* ── Drawer ── */
  {
    slug: "drawer",
    name: "Drawer",
    group: "Overlays",
    basedOn: "vaul",
    description:
      "A panel that rises from the bottom and follows your finger. Drag it down or flick to close. Best for touch-first flows. Delight: grab the drawer and pull; the handle stretches thin like taffy and snaps back with a wobble when you let go.",
    controls: drawerControls,
    Demo: ({ p }) => (
      <Drawer dismissible={Boolean(p.dismissible)}>
        <DrawerTrigger asChild>
          <Button variant="soft" icon={<Download size={18} />}>
            Export
          </Button>
        </DrawerTrigger>
        <DrawerContent handle={Boolean(p.handle)}>
          <DrawerHeader>
            <DrawerTitle>Export “Hero — 1440”</DrawerTitle>
            <DrawerDescription>The frame and everything inside it, at the size you choose.</DrawerDescription>
          </DrawerHeader>
          <div style={field}>
            <Label>Format</Label>
            <ToggleGroup type="single" defaultValue="png" aria-label="Format">
              <ToggleGroupItem value="png">PNG</ToggleGroupItem>
              <ToggleGroupItem value="jpg">JPG</ToggleGroupItem>
              <ToggleGroupItem value="svg">SVG</ToggleGroupItem>
              <ToggleGroupItem value="pdf">PDF</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div style={field}>
            <Label>Scale</Label>
            <ToggleGroup type="single" defaultValue="2" aria-label="Scale">
              <ToggleGroupItem value="1">1×</ToggleGroupItem>
              <ToggleGroupItem value="2">2×</ToggleGroupItem>
              <ToggleGroupItem value="3">3×</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="soft">Cancel</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button>Export 2880 × 1800</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
    code: (p) =>
      `import { Button, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "rapui";

<Drawer${p.dismissible ? "" : " dismissible={false}"}>
  <DrawerTrigger asChild>
    <Button variant="soft">Export</Button>
  </DrawerTrigger>
  <DrawerContent${p.handle ? "" : " handle={false}"}>
    <DrawerHeader>
      <DrawerTitle>Export “Hero — 1440”</DrawerTitle>
      <DrawerDescription>The frame and everything inside it.</DrawerDescription>
    </DrawerHeader>
    …
    <DrawerFooter>
      <DrawerClose asChild><Button variant="soft">Cancel</Button></DrawerClose>
      <Button>Export</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
  },

  /* ── Popover ── */
  {
    slug: "popover",
    name: "Popover",
    group: "Overlays",
    basedOn: "Radix Popover",
    description: "A small floating panel for quick edits next to the thing being edited. Closes on outside click or Esc. Delight: it swings out of the trigger on a spring, like a sign on a hinge, tilted toward the side it opens to; switch the side to see it swing the other way.",
    controls: popoverControls,
    Demo: ({ p }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="soft" icon={<Square size={16} />}>
            Dimensions
          </Button>
        </PopoverTrigger>
        <PopoverContent side={p.side as Side} align={p.align as Align} sideOffset={Number(p.sideOffset)}>
          <div className="doc-stack" style={{ gap: 14 }}>
            <div>
              <div style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>Dimensions</div>
              <p style={muted}>Frame size in pixels.</p>
            </div>
            {[
              ["Width", "1440"],
              ["Height", "900"],
              ["Corner radius", "28"],
            ].map(([l, v]) => (
              <div key={l} className="doc-row doc-between" style={{ flexWrap: "nowrap" }}>
                <Label htmlFor={`doc-pop-${l}`}>{l}</Label>
                <div style={{ width: 120 }}>
                  <Input id={`doc-pop-${l}`} size="sm" defaultValue={v} suffix="px" />
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    ),
    code: (p) =>
      `import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from "rapui";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="soft">Dimensions</Button>
  </PopoverTrigger>
  <PopoverContent${attrs(p, popoverControls)}>
    <Label htmlFor="w">Width</Label>
    <Input id="w" size="sm" defaultValue="1440" suffix="px" />
  </PopoverContent>
</Popover>`,
    examples: [
      {
        title: "Swatch picker",
        Demo: function Swatches() {
          const colors = ["--rap-flame", "--rap-blue", "--rap-plum", "--rap-acid", "--rap-bubble", "--rap-sky", "--rap-ink"];
          const [c, setC] = useState(colors[0]);
          return (
            <Popover>
              <PopoverTrigger
                aria-label="Fill colour"
                style={{
                  width: 44,
                  height: 44,
                  border: 0,
                  borderRadius: "50%",
                  background: `var(${c})`,
                  boxShadow: "0 0 0 4px var(--rap-fill)",
                  cursor: "pointer",
                }}
              />
              <PopoverContent style={{ width: "auto" }}>
                <div className="doc-row" style={{ gap: 4 }}>
                  {colors.map((k) => (
                    <button
                      key={k}
                      aria-label={k.replace("--rap-", "")}
                      onClick={() => setC(k)}
                      style={{
                        width: 32,
                        height: 32,
                        border: 0,
                        borderRadius: "50%",
                        background: `var(${k})`,
                        boxShadow: k === c ? "0 0 0 2px var(--rap-surface), 0 0 0 4px var(--rap-select)" : "none",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          );
        },
        code: `<Popover>
  <PopoverTrigger aria-label="Fill colour" className="swatch" />
  <PopoverContent style={{ width: "auto" }}>
    {colors.map((c) => <button key={c} onClick={() => setColor(c)} />)}
  </PopoverContent>
</Popover>`,
      },
    ],
  },

  /* ── HoverCard ── */
  {
    slug: "hover-card",
    name: "Hover card",
    group: "Overlays",
    basedOn: "Radix HoverCard",
    description:
      "A preview that appears when a pointer rests on a link. Extra context for sighted mouse users; the link must still work on its own. Delight: once it swings open, move the pointer around and onto it; the card tilts in 3D toward your pointer as if your finger were resting on it.",
    controls: hoverControls,
    Demo: ({ p }) => (
      <p style={{ margin: 0, fontSize: "1.0625rem" }}>
        Typeface drawn by{" "}
        <HoverCard openDelay={Number(p.openDelay)}>
          <HoverCardTrigger asChild>
            <a href="#docs.hover-card" style={{ color: "var(--rap-blue)", textDecoration: "none", fontWeight: 500 }}>
              @mira.kovac
            </a>
          </HoverCardTrigger>
          <HoverCardContent side={p.side as Side} align={p.align as Align}>
            <div className="doc-stack" style={{ gap: 12 }}>
              <div className="doc-row" style={{ gap: 12 }}>
                <Avatar initials="MK" />
                <div>
                  <div style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>Mira Kovač</div>
                  <div style={{ ...muted, fontSize: "0.8125rem" }}>Type designer · Studio Vale</div>
                </div>
              </div>
              <p style={{ margin: 0, lineHeight: 1.45 }}>
                Draws grotesks with too much personality. Runs the Thursday kerning club in Rotterdam.
              </p>
              <div className="doc-row" style={{ gap: 16, fontSize: "0.8125rem" }}>
                <span>
                  <b style={{ fontWeight: 500 }}>48</b> <span className="doc-muted">projects</span>
                </span>
                <span>
                  <b style={{ fontWeight: 500 }}>2.3k</b> <span className="doc-muted">followers</span>
                </span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        for the spring issue.
      </p>
    ),
    code: (p) =>
      `import { HoverCard, HoverCardContent, HoverCardTrigger } from "rapui";

<HoverCard${p.openDelay !== 300 ? ` openDelay={${p.openDelay}}` : ""}>
  <HoverCardTrigger asChild>
    <a href="/@mira.kovac">@mira.kovac</a>
  </HoverCardTrigger>
  <HoverCardContent${attrs(p, hoverControls, ["openDelay"])}>
    <Avatar initials="MK" />
    <strong>Mira Kovač</strong>
    <p>Draws grotesks with too much personality.</p>
  </HoverCardContent>
</HoverCard>`,
  },

  /* ── Tooltip ── */
  {
    slug: "tooltip",
    name: "Tooltip",
    group: "Overlays",
    basedOn: "Radix Tooltip",
    description:
      "A short ink label on hover or keyboard focus. Name icon-only buttons with it; never hide essential information inside. Delight: it pops with a springy overshoot and, with the arrow on, the arrow wags once toward the trigger; sweep along a row of triggers and the pops get quick and small.",
    controls: tooltipControls,
    Demo: ({ p }) => {
      const tools = [
        { v: "move", label: "Move", key: "V", Icon: MousePointer2 },
        { v: "frame", label: "Frame", key: "F", Icon: Frame },
        { v: "text", label: "Text", key: "T", Icon: Type },
        { v: "pen", label: "Pen", key: "P", Icon: PenTool },
        { v: "image", label: "Image", key: "⇧⌘I", Icon: Image },
      ];
      return (
        <TooltipProvider delayDuration={Number(p.delayDuration)}>
          <ToggleGroup type="single" defaultValue="move" aria-label="Tools">
            {tools.map(({ v, label, key, Icon }) => (
              <Tooltip key={v} delayDuration={Number(p.delayDuration)}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={v} aria-label={label} style={{ padding: 0 }}>
                    <Icon />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side={p.side as Side} arrow={Boolean(p.arrow)}>
                  {label}
                  {p.shortcut && <kbd>{key}</kbd>}
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>
      );
    },
    code: (p) =>
      `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "rapui";

<TooltipProvider${p.delayDuration !== 300 ? ` delayDuration={${p.delayDuration}}` : ""}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button aria-label="Frame"><Frame /></button>
    </TooltipTrigger>
    <TooltipContent${attrs(p, tooltipControls, ["delayDuration", "shortcut"])}>
      Frame${p.shortcut ? " <kbd>F</kbd>" : ""}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`,
  },

  /* ── DropdownMenu ── */
  {
    slug: "dropdown-menu",
    name: "Dropdown menu",
    group: "Overlays",
    basedOn: "Radix DropdownMenu",
    description:
      "A list of actions behind a button. Supports icons, shortcuts, checkable and radio rows, and nested sub-menus. Delight: the rows are dealt in as it opens, and one highlight glides from row to row like a caterpillar; arrow down quickly to watch it stretch, and it turns red over the trash row.",
    controls: dropdownControls,
    Demo: function DropdownDemo({ p }) {
      const [grid, setGrid] = useState(true);
      const [snap, setSnap] = useState(false);
      const [device, setDevice] = useState("desktop");
      const ic = Boolean(p.icons);
      const sc = Boolean(p.shortcuts);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="soft" icon={<ChevronDown size={18} />} roll={false}>
              Autumn lookbook
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={p.align as Align} side={p.side as Side}>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                {ic && <PenLine />}Rename{sc && <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {ic && <Copy />}Duplicate{sc && <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {ic && <Share2 />}Share…{sc && <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{ic && <Download />}Export as</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>PNG, 2×</DropdownMenuItem>
                  <DropdownMenuItem>PDF for print</DropdownMenuItem>
                  <DropdownMenuItem>Static HTML</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
              Show layout grid{sc && <DropdownMenuShortcut>⌃G</DropdownMenuShortcut>}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={snap} onCheckedChange={setSnap}>
              Snap to pixels
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel inset>Preview on</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={device} onValueChange={setDevice}>
              <DropdownMenuRadioItem value="desktop">Desktop</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mobile">Mobile</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">
              {ic && <Trash2 />}Move to trash{sc && <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    code: (p) =>
      `import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "rapui";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="soft">Autumn lookbook</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent${attrs(p, dropdownControls, ["icons", "shortcuts"])}>
    <DropdownMenuLabel>Project</DropdownMenuLabel>
    <DropdownMenuItem>${p.icons ? "<PenLine />" : ""}Rename${p.shortcuts ? "<DropdownMenuShortcut>⌘R</DropdownMenuShortcut>" : ""}</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Export as</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>PNG, 2×</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>Show layout grid</DropdownMenuCheckboxItem>
    <DropdownMenuRadioGroup value={device} onValueChange={setDevice}>
      <DropdownMenuRadioItem value="desktop">Desktop</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="mobile">Mobile</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="danger">Move to trash</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  },

  /* ── ContextMenu ── */
  {
    slug: "context-menu",
    name: "Context menu",
    group: "Overlays",
    basedOn: "Radix ContextMenu",
    description:
      "The right-click menu, placed at the pointer. Same parts as the dropdown menu; long-press opens it on touch screens. Delight: rows are dealt in where you clicked, and a single highlight glides between them as you move.",
    controls: contextControls,
    Demo: function ContextDemo({ p }) {
      const [locked, setLocked] = useState(false);
      const [hidden, setHidden] = useState(false);
      const ic = Boolean(p.icons);
      const sc = Boolean(p.shortcuts);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              style={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                width: "100%",
                height: 300,
                borderRadius: "var(--rap-radius)",
                background:
                  "radial-gradient(circle, var(--rap-fill-strong) 1px, transparent 1.5px) 0 0 / 20px 20px, var(--rap-paper)",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 260,
                  height: 150,
                  borderRadius: 16,
                  background: "var(--rap-surface)",
                  boxShadow: "0 0 0 2px var(--rap-select)",
                  opacity: hidden ? 0.35 : 1,
                }}
              >
                <span style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
                  Hero — 1440 {locked && <Lock size={14} style={{ verticalAlign: -1 }} />}
                </span>
              </div>
              <span className="doc-muted" style={{ position: "absolute", bottom: 14, fontSize: "0.8125rem" }}>
                Right-click the canvas
              </span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Hero — 1440</ContextMenuLabel>
            <ContextMenuItem>
              {ic && <Scissors />}Cut{sc && <ContextMenuShortcut>⌘X</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem>
              {ic && <Copy />}Copy{sc && <ContextMenuShortcut>⌘C</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem disabled>
              {ic && <Clipboard />}Paste{sc && <ContextMenuShortcut>⌘V</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              {ic && <BringToFront />}Bring to front{sc && <ContextMenuShortcut>⌥⌘]</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem>
              {ic && <SendToBack />}Send to back{sc && <ContextMenuShortcut>⌥⌘[</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>{ic && <AlignCenterHorizontal />}Align</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>
                  {ic && <AlignStartHorizontal />}Top{sc && <ContextMenuShortcut>⌥W</ContextMenuShortcut>}
                </ContextMenuItem>
                <ContextMenuItem>
                  {ic && <AlignCenterHorizontal />}Middle{sc && <ContextMenuShortcut>⌥V</ContextMenuShortcut>}
                </ContextMenuItem>
                <ContextMenuItem>
                  {ic && <AlignEndHorizontal />}Bottom{sc && <ContextMenuShortcut>⌥S</ContextMenuShortcut>}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked={locked} onCheckedChange={setLocked}>
              Lock{sc && <ContextMenuShortcut>⇧⌘L</ContextMenuShortcut>}
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem checked={hidden} onCheckedChange={setHidden}>
              Hide{sc && <ContextMenuShortcut>⇧⌘H</ContextMenuShortcut>}
            </ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="danger">
              {ic && <Trash2 />}Delete{sc && <ContextMenuShortcut>⌫</ContextMenuShortcut>}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    code: (p) =>
      `import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "rapui";

<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="canvas">…</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>${p.icons ? "<Copy />" : ""}Copy${p.shortcuts ? "<ContextMenuShortcut>⌘C</ContextMenuShortcut>" : ""}</ContextMenuItem>
    <ContextMenuItem>${p.icons ? "<BringToFront />" : ""}Bring to front${p.shortcuts ? "<ContextMenuShortcut>⌥⌘]</ContextMenuShortcut>" : ""}</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuCheckboxItem checked={locked} onCheckedChange={setLocked}>Lock</ContextMenuCheckboxItem>
    <ContextMenuItem variant="danger">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  },

  /* ── Menubar ── */
  {
    slug: "menubar",
    name: "Menubar",
    group: "Overlays",
    basedOn: "Radix Menubar",
    description:
      "An app-style menu bar on a pill track. Once a menu is open, hovering or arrowing to the next trigger switches menus. Delight: open a menu and slide along the bar; the ink pill travels from trigger to trigger, and inside each menu one highlight glides between the dealt-in rows.",
    controls: menubarControls,
    Demo: function MenubarDemo({ p }) {
      const [rulers, setRulers] = useState(true);
      const [guides, setGuides] = useState(true);
      const [zoom, setZoom] = useState("fit");
      const sc = Boolean(p.shortcuts);
      const K = ({ children }: { children: string }) => (sc ? <MenubarShortcut>{children}</MenubarShortcut> : null);
      return (
        <Menubar size={p.size as Size}>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New page<K>⌘N</K>
              </MenubarItem>
              <MenubarItem>
                Duplicate page<K>⌘D</K>
              </MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PNG</MenubarItem>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>Static HTML</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>
                Publish<K>⌘P</K>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo<K>⌘Z</K>
              </MenubarItem>
              <MenubarItem>
                Redo<K>⇧⌘Z</K>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Cut<K>⌘X</K>
              </MenubarItem>
              <MenubarItem>
                Copy<K>⌘C</K>
              </MenubarItem>
              <MenubarItem>
                Paste<K>⌘V</K>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={rulers} onCheckedChange={setRulers}>
                Rulers<K>⇧R</K>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked={guides} onCheckedChange={setGuides}>
                Guides<K>⌘;</K>
              </MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
                <MenubarRadioItem value="50">
                  50%<K>⌘0</K>
                </MenubarRadioItem>
                <MenubarRadioItem value="100">
                  100%<K>⌘1</K>
                </MenubarRadioItem>
                <MenubarRadioItem value="fit">
                  Zoom to fit<K>⇧1</K>
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Arrange</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Bring to front<K>⌥⌘]</K>
              </MenubarItem>
              <MenubarItem>
                Send to back<K>⌥⌘[</K>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Group selection<K>⌘G</K>
              </MenubarItem>
              <MenubarItem disabled>Ungroup</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    },
    code: (p) =>
      `import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "rapui";

<Menubar${attrs(p, menubarControls, ["shortcuts"])}>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New page${p.shortcuts ? "<MenubarShortcut>⌘N</MenubarShortcut>" : ""}</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Publish${p.shortcuts ? "<MenubarShortcut>⌘P</MenubarShortcut>" : ""}</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>…</MenubarContent>
  </MenubarMenu>
</Menubar>`,
  },

  /* ── Command ── */
  {
    slug: "command",
    name: "Command",
    group: "Overlays",
    basedOn: "cmdk",
    description:
      "A searchable list of commands: type to filter, arrows to move, Enter to run. Inline, or as a ⌘K palette with CommandDialog. Delight: the rows are dealt in when the list appears, and one highlight glides between them; type a few letters and watch it run up to the first match.",
    controls: commandControls,
    Demo: ({ p }) => (
      <div style={{ width: "min(100%, 26rem)" }}>
        <Command label="Commands">
          <CommandInput placeholder={String(p.placeholder)} />
          <CommandList>
            <PaletteItems icons={Boolean(p.icons)} shortcuts={Boolean(p.shortcuts)} />
          </CommandList>
        </Command>
      </div>
    ),
    code: (p) =>
      `import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "rapui";

<Command>
  <CommandInput placeholder="${p.placeholder}" />
  <CommandList>
    <CommandEmpty>Nothing matches.</CommandEmpty>
    <CommandGroup heading="Create">
      <CommandItem onSelect={addPage}>${p.icons ? "<FilePlus />" : ""}New page${p.shortcuts ? "<CommandShortcut>⌘N</CommandShortcut>" : ""}</CommandItem>
      <CommandItem onSelect={addFrame}>${p.icons ? "<Frame />" : ""}Add frame${p.shortcuts ? "<CommandShortcut>F</CommandShortcut>" : ""}</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Project">…</CommandGroup>
  </CommandList>
</Command>`,
    examples: [
      {
        title: "⌘K palette",
        Demo: function Palette() {
          const [open, setOpen] = useState(false);
          useEffect(() => {
            const onKey = (e: KeyboardEvent) => {
              if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
              }
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
          }, []);
          return (
            <>
              <Button variant="soft" onClick={() => setOpen(true)} roll={false}>
                Search commands <kbd className="doc-kbd">⌘K</kbd>
              </Button>
              <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="What do you want to do?" />
                <CommandList>
                  <PaletteItems onRun={() => setOpen(false)} />
                </CommandList>
              </CommandDialog>
            </>
          );
        },
        code: `const [open, setOpen] = useState(false);
useEffect(() => {
  const onKey = (e) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="What do you want to do?" />
  <CommandList>
    <CommandEmpty>Nothing matches.</CommandEmpty>
    <CommandGroup heading="Create">
      <CommandItem onSelect={() => setOpen(false)}><FilePlus />New page</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>`,
      },
    ],
  },
];
