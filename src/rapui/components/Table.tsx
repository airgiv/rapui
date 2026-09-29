import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cx } from "../utils";
import "./Table.css";

/** Plain, hairline-separated table. Wraps in a horizontally scrollable box. */
export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(function Table({ className, ...rest }, ref) {
  return (
    <div className="rap-table-wrap">
      <table ref={ref} className={cx("rap-table", className)} {...rest} />
    </div>
  );
});

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableHeader(
  { className, ...rest },
  ref,
) {
  return <thead ref={ref} className={cx("rap-table__head", className)} {...rest} />;
});

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableBody(
  { className, ...rest },
  ref,
) {
  return <tbody ref={ref} className={cx("rap-table__body", className)} {...rest} />;
});

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(function TableFooter(
  { className, ...rest },
  ref,
) {
  return <tfoot ref={ref} className={cx("rap-table__foot", className)} {...rest} />;
});

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow({ className, ...rest }, ref) {
  return <tr ref={ref} className={cx("rap-table__row", className)} {...rest} />;
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(function TableHead(
  { className, scope = "col", ...rest },
  ref,
) {
  return <th ref={ref} scope={scope} className={cx("rap-table__th", className)} {...rest} />;
});

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(function TableCell(
  { className, ...rest },
  ref,
) {
  return <td ref={ref} className={cx("rap-table__td", className)} {...rest} />;
});

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(function TableCaption(
  { className, ...rest },
  ref,
) {
  return <caption ref={ref} className={cx("rap-table__caption", className)} {...rest} />;
});
