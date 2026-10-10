import { useEffect, useRef, useState } from "react";
import PdfView from "./PdfView";
import RangeMarks from "./RangeMarks";
import { fetchSourceContent } from "../lib/api";
import { selectionOffsets, selectionRect } from "../lib/domText";

const A = "/assets";

function WebSection({ index, heading, text, annotations, focusPassage, onAnnotate }) {
  const hostRef = useRef(null);
  const [flash, setFlash] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!focusPassage) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;
    const needle = (focusPassage.passage || "").trim();
    const haystack = host.textContent || "";
    let idx = needle ? haystack.indexOf(needle) : -1;
    let match = needle;
    if (idx < 0 && needle.length > 40) {
      const short = needle.slice(0, 40);
      idx = haystack.indexOf(short);
      match = short;
    }
    const sectionHit =
      focusPassage.section != null &&
      heading &&
      String(heading).includes(String(focusPassage.section));
    if (idx < 0 && !sectionHit) return undefined;
    try {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* ignore */
    }
    if (idx >= 0) {
      setFlash({ id: `cite-${focusPassage.nonce}`, start: idx, end: idx + match.length, text: match, tone: "citation" });
      const timer = setTimeout(() => setFlash(null), 2100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [focusPassage, heading]);

  const items = [...(annotations || []).map((a) => ({ ...a, tone: "annotation" })), ...(flash ? [flash] : [])];

  return (
    <section ref={sectionRef} className="relative">
      <div
        ref={hostRef}
        onMouseUp={() => {
          const offsets = selectionOffsets(hostRef.current);
          if (offsets) onAnnotate?.({ page: index, ...offsets, rect: selectionRect() });
        }}
      >
        {heading && (
          <h2 className="font-inter font-semibold text-[17px] text-[#e2e8f0] leading-[26px] mb-[6px]">
            {heading}
          </h2>
        )}
        {text
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="font-inter text-[14px] text-[#cbd5e1] leading-[24px] mb-[10px]">
              {para}
            </p>
          ))}
      </div>
      <RangeMarks hostRef={hostRef} items={items} />
    </section>
  );
}

function WebView({ source, focusPassage, annotations, onAnnotate }) {
  const [state, setState] = useState({ status: "loading" });
  const focus = focusPassage ? { ...focusPassage, nonce: focusPassage.nonce } : null;

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchSourceContent(source.url)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", error: err?.message || "Could not load this source." });
      });
    return () => {
      cancelled = true;
    };
  }, [source.url]);

  if (state.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-inter text-[13px] text-[#64748b]">Fetching a copy of this page…</span>
      </div>
    );
  }

  const available = state.status === "ready" && state.data?.available && (state.data.sections || []).length;
  if (!available) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-[10px] px-[24px] text-center">
        <span className="font-inter text-[13px] text-[#94a3b8]">A readable copy of this page isn't available.</span>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="font-inter text-[13px] text-[#a5b4fc] underline decoration-[#6366f1] break-all"
        >
          {source.url}
        </a>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden no-scrollbar bg-[#0e111a] px-[20px] py-[18px]">
      {(state.data.sections || []).map((section, i) => (
        <WebSection
          key={i}
          index={i + 1}
          heading={section.heading}
          text={section.text}
          annotations={(annotations || []).filter((a) => a.page === i + 1)}
          focusPassage={focus}
          onAnnotate={onAnnotate}
        />
      ))}
    </div>
  );
}

export default function SourceViewer({ source, focus, annotations, onAnnotate, onClose }) {
  if (!source) return null;
  const isPdf = source.kind === "pdf";

  return (
    <div className="bg-[#0b0d13] content-stretch flex flex-col items-stretch h-full w-full overflow-hidden">
      <div className="border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between gap-[10px] px-[16px] py-[11px] shrink-0 w-full bg-[#11141d]">
        <div className="content-stretch flex gap-[8px] items-center min-w-0 flex-1">
          <img alt="" src={isPdf ? `${A}/chat-doc.svg` : `${A}/chat-globe.svg`} className="relative shrink-0 size-[15px]" />
          <div className="min-w-0 flex-1">
            <div className="font-inter font-semibold text-[13px] text-[#e2e8f0] leading-[16px] truncate">
              {source.title || (isPdf ? "Document" : source.url)}
            </div>
            {!isPdf && (
              <div className="font-inter text-[11px] text-[#64748b] leading-[14px] truncate">{source.url}</div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bg-[#1a1e2b] border border-[#2a3044] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#20263a] transition-colors"
        >
          <span className="font-inter font-medium text-[12px] text-[#cbd5e1] leading-[16px] whitespace-nowrap">
            Close resource
          </span>
          <img alt="" src={`${A}/chat-panel-close.svg`} className="relative shrink-0 size-[10.5px]" />
        </button>
      </div>
      <div className="flex-1 min-h-0 relative">
        {isPdf ? (
          <PdfView url={source.pdfUrl} focus={focus} annotations={annotations} onAnnotate={onAnnotate} />
        ) : (
          <WebView source={source} focusPassage={focus} annotations={annotations} onAnnotate={onAnnotate} />
        )}
      </div>
    </div>
  );
}
