import { cn } from "../rapui/utils";

/* ── the wordmark ─────────────────────────────────────────
   The rapui logo, from the Figma file (vector "rapui", 164 × 50):
   a heavy upright "rap" and a slanted "ui", five filled shapes. Drawn
   in currentColor so it follows the ink of wherever it sits — the
   header on paper, the footer on ink.

   Sized by height: `h-[1em]` against the parent's font size, so
   `text-[1.6rem]` on the link sets the logo the way it would set a
   word. The width follows the 165:50 viewBox.

   On hover the slanted i leans a little further, on a spring
   (behind `fun:`) — the one moving part of an otherwise still mark. */
export function Wordmark({ className, title = "rapui" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 165 50"
      role="img"
      aria-label={title}
      className={cn("group/wm inline-block h-[1em] w-auto overflow-visible fill-current align-[-0.18em]", className)}
    >
      <path d="M0 36.084V0.743998H11.594L12.648 5.642H12.958C14.136 1.674 16.306 0.743998 19.53 0.743998H25L21.142 16.616H18.538C16.244 16.616 15.128 17.856 15.128 20.584V36.084H0Z" />
      <path d="M38.8653 36.828C29.3793 36.828 22.6833 29.388 22.6833 18.538C22.6833 7.44 29.5033 0 38.8653 0C43.2053 0 47.0493 2.046 48.8473 4.526H49.0953L49.5293 0.743998H63.0453V36.084H49.5293L49.0953 32.364H48.8473C46.6773 35.216 42.8333 36.828 38.8653 36.828ZM42.8953 23.622C45.6853 23.622 47.9173 21.514 47.9173 18.414C47.9173 15.5 45.6853 13.268 42.8953 13.268C40.1673 13.268 37.8733 15.562 37.8733 18.414C37.8733 21.514 40.1673 23.622 42.8953 23.622Z" />
      <path d="M66.1172 49.724V0.743998H80.2532L80.6872 4.65H80.9972C83.1052 1.798 86.7632 0 90.9172 0C100.279 0 106.479 7.502 106.479 18.352C106.479 29.512 99.6592 36.828 91.0412 36.828C87.1352 36.828 83.3532 35.34 81.6792 33.046H81.2452V49.724H66.1172ZM86.2672 23.56C89.0572 23.56 91.3512 21.266 91.3512 18.414C91.3512 15.376 89.0572 13.206 86.2672 13.206C83.4772 13.206 81.2452 15.376 81.2452 18.414C81.2452 21.328 83.4772 23.56 86.2672 23.56Z" />
      <path d="M122.261 36.828C110.109 36.828 106.017 29.76 108.497 18.352L112.217 0.743998H127.655L123.439 20.584C123.191 21.7 123.253 22.754 124.493 22.754C125.423 22.754 125.919 21.948 126.167 20.832L130.445 0.743998H145.883L141.419 21.824C139.435 31.248 133.173 36.828 122.261 36.828Z" />
      <path
        d="M141.412 36.084L148.852 0.743998H164.042L156.602 36.084H141.412Z"
        className="[transform-box:fill-box] origin-bottom transition-transform duration-500 ease-spring fun:group-hover/wm:-skew-x-12"
      />
    </svg>
  );
}
