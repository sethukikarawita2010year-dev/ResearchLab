import { useEffect, useRef, useState } from "react";
import pdfjsLib from "../lib/pdfjs";
import { selectionOffsets, selectionRect } from "../lib/domText";
import RangeMarks from "./RangeMarks";

function PdfPage({ doc, number, focus, size, onAnnotate, annotations, revision = 0 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const scrolledRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(0);
  const [flash, setFlash] = useState(null);

  const isTarget = focus?.page === number;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if ((!visible && !isTarget) || !doc || !size) return undefined;
    let cancelled = false;
    let renderTask = null;
    let textLayer = null;

    (async () => {
      const page = await doc.getPage(number);
      if (cancelled) return;
      const unscaled = page.getViewport({ scale: 1 });
      const scale = size.width / unscaled.width;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({
        canvasContext: context,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
      });
      try {
        await renderTask.promise;
      } catch {
        /* cancelled */
      }
      if (cancelled) return;

      const layer = textLayerRef.current;
      if (!layer) return;
      layer.replaceChildren();
      layer.style.setProperty("--scale-factor", String(scale));
      textLayer = new pdfjsLib.TextLayer({
        textContentSource: page.streamTextContent(),
        container: layer,
        viewport,
      });
      try {
        await textLayer.render();
      } catch {
        /* cancelled */
      }
      if (!cancelled) setRendered((value) => value + 1);
    })();

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        /* ignore */
      }
      try {
        textLayer?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [visible, isTarget, doc, number, size]);

  useEffect(() => {
    if (focus?.page !== number || !size) return;
    const key = `${number}-${focus.nonce || focus.page}`;
    if (scrolledRef.current === key) return;
    const el = wrapRef.current;
    if (el) {
      scrolledRef.current = key;
      el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
  }, [focus, number, size]);

  useEffect(() => {
    if (!rendered || focus?.page !== number || !focus?.passage) return undefined;
    const host = textLayerRef.current;
    const haystack = host?.textContent || "";
    const needle = focus.passage.trim();
    let idx = needle ? haystack.indexOf(needle) : -1;
    let match = needle;
    if (idx < 0) {
      const short = needle.slice(0, 40);
      idx = short ? haystack.indexOf(short) : -1;
      match = short || needle;
    }
    if (idx >= 0) {
      setFlash({ id: `cite-${focus.nonce}`, start: idx, end: idx + match.length, text: match, tone: "citation" });
    } else {
      setFlash({ id: `cite-${focus.nonce}`, pageTint: true, tone: "citation" });
    }
    const timer = setTimeout(() => setFlash(null), 2100);
    return () => clearTimeout(timer);
  }, [focus, number, rendered]);

  const pageAnnotations = (annotations || []).filter((a) => a.page === number);
  const items = [...pageAnnotations.map((a) => ({ ...a, tone: "annotation" })), ...(flash && !flash.pageTint ? [flash] : [])];

  return (
    <div ref={wrapRef} data-page={number} className="relative mx-auto mb-[14px] last:mb-0">
      <div
        className="relative rounded-[6px] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
        style={size ? { width: size.width, height: size.height } : undefined}
      >
        <canvas ref={canvasRef} className="block" />
        <div
          ref={textLayerRef}
          className="rl-text-layer"
          onMouseUp={() => {
            const offsets = selectionOffsets(textLayerRef.current);
            if (offsets) onAnnotate?.({ page: number, ...offsets, rect: selectionRect() });
          }}
        />
        <RangeMarks hostRef={textLayerRef} items={items} revision={revision + rendered} />
        {flash?.pageTint && (
          <span aria-hidden="true" className="rl-mark-citation absolute inset-0 rounded-[6px]" />
        )}
      </div>
      <div className="pointer-events-none absolute -bottom-[11px] right-[2px] font-inter text-[10px] text-[#64748b]">
        {number}
      </div>
    </div>
  );
}

export default function PdfView({ url, focus, annotations, onAnnotate }) {
  const scrollRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [pages, setPages] = useState(0);
  const [sizes, setSizes] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let loaded = null;
    setStatus("loading");
    setError("");
    setSizes(null);
    setPages(0);
    const task = pdfjsLib.getDocument({ url, withCredentials: false });
    task.promise
      .then((document) => {
        if (cancelled) {
          document.destroy();
          return;
        }
        loaded = document;
        setDoc(document);
        setPages(document.numPages);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Could not open this document.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
      try {
        task.destroy();
      } catch {
        /* ignore */
      }
      try {
        loaded?.destroy();
      } catch {
        /* ignore */
      }
      setDoc(null);
    };
  }, [url]);

  useEffect(() => {
    if (!doc) return undefined;
    let cancelled = false;
    let raf = 0;
    const compute = async () => {
      const containerWidth = scrollRef.current?.clientWidth || 0;
      if (containerWidth < 160) {
        raf = requestAnimationFrame(compute);
        return;
      }
      const first = await doc.getPage(1);
      if (cancelled) return;
      const unscaled = first.getViewport({ scale: 1 });
      const scale = Math.min(2, Math.max(0.35, (containerWidth - 32) / unscaled.width));
      const next = [];
      for (let n = 1; n <= doc.numPages; n += 1) {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        next.push({ width: viewport.width, height: viewport.height });
      }
      if (!cancelled) setSizes(next);
    };
    compute();
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [doc]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-inter text-[13px] text-[#64748b]">Loading document…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full items-center justify-center px-[24px] text-center">
        <span className="font-inter text-[13px] text-[#f87171]">{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overflow-x-hidden no-scrollbar bg-[#0e111a] px-[16px] py-[16px]"
    >
      {Array.from({ length: pages }, (_, index) => (
        <PdfPage
          key={index + 1}
          doc={doc}
          number={index + 1}
          focus={focus}
          size={sizes ? sizes[index] : null}
          annotations={annotations}
          onAnnotate={onAnnotate}
        />
      ))}
    </div>
  );
}
