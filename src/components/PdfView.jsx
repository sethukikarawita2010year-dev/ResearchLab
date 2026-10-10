import { useEffect, useRef, useState } from "react";
import pdfjsLib from "../lib/pdfjs";
import { selectionOffsets, selectionRect } from "../lib/domText";
import RangeMarks from "./RangeMarks";

function PdfPage({ doc, number, focus, onAnnotate, annotations, revision = 0 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(null);
  const [rendered, setRendered] = useState(0);
  const [flash, setFlash] = useState(null);

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
    if (!visible || !doc) return undefined;
    let cancelled = false;
    let renderTask = null;
    let textLayer = null;

    (async () => {
      const page = await doc.getPage(number);
      if (cancelled) return;
      const containerWidth = wrapRef.current?.parentElement?.clientWidth || 760;
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(2, Math.max(0.35, (containerWidth - 32) / unscaled.width));
      const viewport = page.getViewport({ scale });
      setSize({ width: viewport.width, height: viewport.height });

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
  }, [visible, doc, number]);

  useEffect(() => {
    if (!visible) return;
    const el = wrapRef.current;
    if (focus?.page === number && el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus, number, visible]);

  useEffect(() => {
    if (!rendered || focus?.page !== number || !focus?.passage) return undefined;
    const layer = textLayerRef.current;
    const haystack = layer?.textContent || "";
    const needle = focus.passage.trim();
    let idx = needle ? haystack.indexOf(needle) : -1;
    let match = needle;
    if (idx < 0 && needle.length > 40) {
      const short = needle.slice(0, 40);
      idx = haystack.indexOf(short);
      match = short;
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
      <div className="relative rounded-[6px] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <canvas ref={canvasRef} className="block" style={size ? { width: size.width, height: size.height } : undefined} />
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
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loaded = null;
    setStatus("loading");
    setError("");
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
    <div className="h-full overflow-y-auto overflow-x-hidden no-scrollbar bg-[#0e111a] px-[16px] py-[16px]">
      {Array.from({ length: pages }, (_, index) => (
        <PdfPage
          key={index + 1}
          doc={doc}
          number={index + 1}
          focus={focus}
          annotations={annotations}
          onAnnotate={onAnnotate}
        />
      ))}
    </div>
  );
}
