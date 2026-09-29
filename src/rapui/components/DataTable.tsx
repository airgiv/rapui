import { useState, type ReactNode } from "react";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight, Columns3, Search } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";

const FOCUS_RING = "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]";
const META_TEXT = "text-[0.8125rem] font-medium tracking-[-0.01em] tabular-nums";
/** the checkbox column hugs its content */
const SELECT_CELL = "w-[1%] pr-1 last:pr-1 [&>*]:align-middle";

const NAV = cn(
  "inline-grid place-items-center size-control-sm p-0 border-0 rounded-full bg-fill text-ink cursor-pointer",
  "transition-[background-color,scale] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover active:scale-94",
  FOCUS_RING,
  "disabled:opacity-35 disabled:pointer-events-none [&_svg]:size-[18px]",
);

/** Per-column hints: right-align numbers, a readable name for the column menu. */
export interface DataTableColumnMeta {
  align?: "start" | "end";
  label?: string;
}

/** The table features DataTable registers. Use with `createDataTableColumns` for typed columns. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, text: sortFn_text, datetime: sortFn_datetime },
  filterFns: { includesString: filterFn_includesString },
  columnMeta: {} as DataTableColumnMeta,
});
export type DataTableFeatures = typeof dataTableFeatures;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

/** Typed column helper bound to DataTable's features. */
export function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

export interface DataTableProps<TData extends RowData> {
  data: TData[];
  columns: DataTableColumn<TData>[];
  /** Placeholder of the search field. Pass `false` to hide the field. */
  filterPlaceholder?: string | false;
  pageSize?: number;
  /** Adds a checkbox column. */
  selectable?: boolean;
  /** Shows a "Columns" menu to hide/show columns. */
  columnToggle?: boolean;
  getRowId?: (row: TData, index: number) => string;
  /** Shown when nothing matches the filter. */
  empty?: ReactNode;
  /** Extra controls on the right side of the toolbar. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Sortable, filterable, paginated table with row selection (TanStack Table v9).
 * Rendered with rap/ui's `Table` parts, so it looks exactly like a static table.
 *
 * Delight comes from those parts (see Table.tsx): one row highlight glides
 * between rows under the pointer, and when you sort — or a filter closes a gap —
 * every row that survives FLIPs to its new place on the shared spring, so you can
 * watch "Brand book" travel to the top instead of the list just being different.
 * Rows are keyed by `getRowId` (or TanStack's index id), which is what lets a row
 * keep its DOM node and fly. With a SoundProvider on, sorting taps and selecting a
 * row ticks.
 */
export function DataTable<TData extends RowData>({
  data,
  columns,
  filterPlaceholder = "Filter…",
  pageSize = 5,
  selectable = false,
  columnToggle = false,
  getRowId,
  empty = "Nothing matches that search.",
  actions,
  className,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const sound = useSound();

  const allColumns: DataTableColumn<TData>[] = selectable
    ? [
        {
          id: "select",
          enableSorting: false,
          enableHiding: false,
          enableGlobalFilter: false,
          header: ({ table }) => (
            <Checkbox
              size="sm"
              aria-label="Select all rows on this page"
              checked={
                table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
              }
              onCheckedChange={(v) => {
                sound.play("tick");
                table.toggleAllPageRowsSelected(v === true);
              }}
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              size="sm"
              aria-label="Select row"
              checked={row.getIsSelected()}
              onCheckedChange={(v) => {
                sound.play("tick", { pitch: v === true ? 1 : 0.9 });
                row.toggleSelected(v === true);
              }}
            />
          ),
        },
        ...columns,
      ]
    : columns;

  const table = useTable({
    features: dataTableFeatures,
    columns: allColumns,
    data,
    getRowId,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    enableRowSelection: selectable,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const rows = table.getRowModel().rows;
  const pageCount = Math.max(1, table.getPageCount());
  const pageIndex = table.state.pagination.pageIndex;
  const selected = selectable ? table.getSelectedRowModel().rows.length : 0;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div data-slot="data-table" className={cn("flex flex-col gap-3 w-full font-sans", className)}>
      {(filterPlaceholder !== false || columnToggle || actions) && (
        <div data-slot="data-table-toolbar" className="flex items-center gap-2 flex-wrap">
          {filterPlaceholder !== false && (
            <Input
              size="sm"
              data-slot="data-table-filter"
              className="w-[min(100%,18rem)]"
              placeholder={filterPlaceholder}
              prefix={<Search />}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              aria-label={filterPlaceholder}
            />
          )}
          <div className="flex items-center gap-tight ml-auto">
            {actions}
            {columnToggle && (
              <MenuPrimitive.Root>
                <MenuPrimitive.Trigger
                  data-slot="data-table-columns"
                  className={cn(
                    "inline-flex items-center gap-[0.45rem] h-control-sm pr-4 pl-[0.85rem] border-0 rounded-pill bg-fill text-ink",
                    "[font-family:inherit] text-[0.875rem] leading-[inherit] font-medium tracking-[-0.01em] cursor-pointer",
                    "transition-[background-color] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover data-[state=open]:bg-fill-hover",
                    FOCUS_RING,
                    "[&_svg]:size-4",
                  )}
                >
                  <Columns3 aria-hidden /> Columns
                </MenuPrimitive.Trigger>
                <MenuPrimitive.Portal>
                  <MenuPrimitive.Content align="end" sideOffset={6} data-slot="data-table-columns-menu"
                    className="pop min-w-48 p-1">
                    {table
                      .getAllLeafColumns()
                      .filter((c) => c.getCanHide())
                      .map((c) => (
                        <MenuPrimitive.CheckboxItem
                          key={c.id}
                          data-slot="data-table-columns-item"
                          className="menu-item pl-9"
                          checked={c.getIsVisible()}
                          onCheckedChange={(v) => c.toggleVisibility(v === true)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <MenuPrimitive.ItemIndicator className="absolute left-3 inline-flex text-select">
                            <Check size={16} strokeWidth={2.5} />
                          </MenuPrimitive.ItemIndicator>
                          {c.columnDef.meta?.label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)}
                        </MenuPrimitive.CheckboxItem>
                      ))}
                  </MenuPrimitive.Content>
                </MenuPrimitive.Portal>
              </MenuPrimitive.Root>
            )}
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const col = header.column;
                const sorted = col.getIsSorted();
                const align = col.columnDef.meta?.align;
                return (
                  <TableHead
                    key={header.id}
                    data-align={align}
                    className={cn(header.id === "select" && SELECT_CELL)}
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                  >
                    {header.isPlaceholder ? null : col.getCanSort() ? (
                      <button
                        type="button"
                        data-slot="data-table-sort"
                        data-sorted={sorted || undefined}
                        // sortable header: the whole label is a quiet button
                        className={cn(
                          "inline-flex items-center gap-[0.35rem] h-7 -mx-2 px-2 border-0 rounded-pill bg-transparent",
                          "text-inherit [font:inherit] tracking-[inherit] cursor-pointer",
                          "transition-[background-color,color] duration-(--rap-dur-fast) ease-rm hover:bg-fill hover:text-ink",
                          FOCUS_RING,
                          "[&_svg]:size-3.5 [&_svg]:flex-none [[data-align=end]>&]:flex-row-reverse",
                          sorted && "text-ink",
                        )}
                        onClick={(e) => {
                          sound.play("tap");
                          col.getToggleSortingHandler()?.(e);
                        }}
                      >
                        <table.FlexRender header={header} />
                        {sorted === "asc" ? (
                          <ArrowUp aria-hidden />
                        ) : sorted === "desc" ? (
                          <ArrowDown aria-hidden />
                        ) : (
                          <ArrowUpDown aria-hidden className="opacity-45" />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    data-align={cell.column.columnDef.meta?.align}
                    className={cn(cell.column.id === "select" && SELECT_CELL)}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-[120px] text-center text-mute">
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div data-slot="data-table-footer" className="flex items-center justify-between gap-4 pl-4">
        <span data-slot="data-table-count" className={cn(META_TEXT, "text-mute")}>
          {selectable && selected > 0 ? `${selected} of ${total} selected` : `${total} ${total === 1 ? "row" : "rows"}`}
        </span>
        <div data-slot="data-table-pager" className="flex items-center gap-tight">
          <span data-slot="data-table-page" className={cn(META_TEXT, "mr-3 text-ink-2")}>
            Page {Math.min(pageIndex + 1, pageCount)} of {pageCount}
          </span>
          <button
            type="button"
            data-slot="data-table-nav"
            className={NAV}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden />
          </button>
          <button
            type="button"
            data-slot="data-table-nav"
            className={NAV}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
