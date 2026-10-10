import { useEffect, useLayoutEffect, useState } from "react";
import { rangeFromOffsets, rangeRects } from "../lib/domText";

// Non-destructive highlight layer. Given a `hostRef` whose text nodes form the
// annotation coordinate space, it draws absolutely-positioned, click-through
// boxes over each annotation's character range. It never edits the markup, so
// selection and rendering stay intact.
export default function RangeMarks({ hostRef, items, revision = 0 }) {
  const [rects, setRects] = useState([]);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const root = hostRef.current;
    if (!root || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setRev((value) => value + 1));
    observer.observe(root);
    return () => observer.disconnect();
  }, [hostRef]);

  useLayoutEffect(() => {
    const root = hostRef.current;
    if (!root) {
      setRects([]);
      return undefined;
    }
    let raf = requestAnimationFrame(() => {
      const out = [];
      (items || []).forEach((item) => {
        const range = rangeFromOffsets(root, item.start, item.end, item.text);
        if (!range) return;
        rangeRects(root, range).forEach((rect) => {
          out.push({ ...rect, id: item.id, tone: item.tone || "annotation" });
        });
      });
      setRects(out);
    });
    return () => cancelAnimationFrame(raf);
  }, [hostRef, items, revision, rev]);

  if (!rects.length) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[1]">
      {rects.map((rect, index) => (
        <span
          key={`${rect.id}-${index}`}
          className={`absolute rounded-[3px] ${
            rect.tone === "citation" ? "rl-mark-citation" : "rl-mark-annotation"
          }`}
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ))}
    </div>
  );
}
