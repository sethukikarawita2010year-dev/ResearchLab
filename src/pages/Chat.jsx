import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePdfAttachment, PdfFileInput, PdfChip } from "../components/PdfAttachment";
import RichText from "../components/RichText";
import { analyzePaper, chatMessage, uploadPdf } from "../lib/api";
import { useSidebar } from "../components/sidebarContext";

const A = "/assets";

const sectionTitles = {
  s1: ["01", "Title & Authors & Abstract"],
  s2: ["02", "Problem Statement"],
  s3: ["03", "Methodology"],
  s4: ["04", "Key Results"],
  s5: ["05", "Conclusion"],
};

let nextId = 0;
const uid = () => `m-${Date.now()}-${nextId++}`;

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function Stripper(text) {
  return String(text || "")
    .replace(/\[[^\[\]]+\]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
  } catch {
    /* clipboard API fallback unavailable */
  }
  document.body.removeChild(area);
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.5" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function summaryToText(s) {
  if (!s) return "";
  const results = (s.key_results || [])
    .map((r) => `- ${r.label}: ${r.value}${r.description ? ` — ${r.description}` : ""}`)
    .join("\n");
  return [
    `Title: ${s.title || ""}`,
    `Authors: ${s.authors || ""}`,
    `Abstract: ${s.abstract || ""}`,
    `Problem statement: ${s.problem_statement || ""}`,
    `Methodology: ${s.methodology || ""}`,
    `Key results:\n${results || "—"}`,
    `Conclusion: ${s.conclusion || ""}`,
  ].join("\n\n");
}

function toHistory(msgs) {
  return msgs
    .filter((m) => !m.error && (m.kind !== "summary" || Boolean(m.sections)))
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content:
        m.kind === "summary"
          ? summaryToText(m.sections)
          : typeof m.content === "string"
            ? m.content
            : "",
    }))
    .filter((m) => m.content.trim().length > 0);
}

function Code({ children }) {
  return (
    <code className="bg-[#12151e] border border-[#2a3044] border-solid font-mono text-[13px] leading-[20px] text-[#a5b4fc] px-[7px] py-[1.5px] rounded-[4px] whitespace-nowrap">
      {children}
    </code>
  );
}

function SectionHeader({ num, title, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full cursor-pointer text-left"
    >
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <span className="font-inter font-semibold text-[#818cf8] text-[16px] tracking-[0.8px] uppercase leading-[24px]">
          {num}
        </span>
        <h3 className="font-inter font-semibold text-[#f1f5f9] text-[16px] tracking-[-0.08px] leading-[26px]">
          {title}
        </h3>
      </div>
      <img
        alt=""
        src={`${A}/chat-caret-up.svg`}
        className={`h-[7.4px] w-[12px] transition-transform duration-200 ${open ? "" : "rotate-180"}`}
      />
    </button>
  );
}

function SummaryCard({ sections }) {
  const [open, setOpen] = useState({ s1: true, s2: true, s3: true, s4: true, s5: true });
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const s = sections || {};
  const results = Array.isArray(s.key_results) ? s.key_results : [];

  return (
    <div className="relative bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[12px] items-start overflow-hidden pb-[17px] pt-[29px] px-[17px] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] shrink-0 w-full">
      <div className="absolute bg-[#6366f1] bottom-0 left-0 top-0 w-[4px]" />

      <div className="content-stretch flex flex-col gap-[8px] relative shrink-0 w-full">
        <SectionHeader
          num={sectionTitles.s1[0]}
          title={sectionTitles.s1[1]}
          open={open.s1}
          onToggle={() => toggle("s1")}
        />
        {open.s1 && (
          <div className="bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-col gap-[4px] items-start p-[13px] relative rounded-[8px] shrink-0 w-full">
            <div className="font-inter font-semibold text-[18px] text-white tracking-[-0.18px] leading-[26px] w-full">
              {s.title || "Untitled paper"}
            </div>
            {s.authors && (
              <div className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full">{s.authors}</div>
            )}
            {s.abstract && (
              <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pt-[3.125px] pb-[0.875px] w-full">
                <RichText text={s.abstract} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

      <div className="content-stretch flex flex-col gap-[7px] relative shrink-0 w-full">
        <SectionHeader
          num={sectionTitles.s2[0]}
          title={sectionTitles.s2[1]}
          open={open.s2}
          onToggle={() => toggle("s2")}
        />
        {open.s2 && (
          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pb-[0.75px] w-full">
            {s.problem_statement ? <RichText text={s.problem_statement} /> : "No problem statement returned."}
          </div>
        )}
      </div>

      <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

      <div className="content-stretch flex flex-col gap-[8px] relative shrink-0 w-full">
        <SectionHeader
          num={sectionTitles.s3[0]}
          title={sectionTitles.s3[1]}
          open={open.s3}
          onToggle={() => toggle("s3")}
        />
        {open.s3 && (
          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] w-full">
            {s.methodology ? <RichText text={s.methodology} /> : "No methodology returned."}
          </div>
        )}
      </div>

      <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

      <div className="content-stretch flex flex-col gap-[8px] relative shrink-0 w-full">
        <SectionHeader
          num={sectionTitles.s4[0]}
          title={sectionTitles.s4[1]}
          open={open.s4}
          onToggle={() => toggle("s4")}
        />
        {open.s4 &&
          (results.length ? (
            <div className="content-stretch grid grid-cols-2 gap-[8px] items-stretch relative shrink-0 w-full">
              {results.map((r, i) => (
                <div
                  key={`${r.label}-${i}`}
                  className={`bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-col items-start justify-start p-[13px] relative rounded-[8px]${i === results.length - 1 && results.length % 2 === 1 ? " col-span-2" : ""}`}
                >
                  <div className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px] leading-[14px] w-full">
                    {r.label}
                  </div>
                  {r.value && (
                    <div className="pt-[4px] w-full">
                      <span className="font-inter font-bold text-[#818cf8] text-[30px] tracking-[-0.75px] leading-[38px]">
                        {r.value}
                      </span>
                    </div>
                  )}
                  {r.description && (
                    <div className="pt-[4px] w-full">
                      <div className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full">
                        <RichText text={r.description} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] w-full">
              No key results were returned.
            </p>
          ))}
      </div>

      <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />

      <div className="content-stretch flex flex-col gap-[7.125px] relative shrink-0 w-full">
        <SectionHeader
          num={sectionTitles.s5[0]}
          title={sectionTitles.s5[1]}
          open={open.s5}
          onToggle={() => toggle("s5")}
        />
        {open.s5 && (
          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pb-[0.875px] w-full">
            {s.conclusion ? <RichText text={s.conclusion} /> : "No conclusion returned."}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageView({ msg, onCopy, onShare }) {
  if (msg.role === "user") {
    return (
      <div className="content-stretch flex flex-col items-start pl-[48px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col gap-[6px] items-end relative shrink-0 w-full">
          <div className="content-stretch flex gap-[7.99px] items-center relative shrink-0">
            <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px] leading-[14px]">
              {msg.time}
            </span>
            <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px]">
              You
            </span>
          </div>
          {msg.pdfName && (
            <div className="bg-[rgba(30,27,75,0.7)] border border-[rgba(67,56,202,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[9px] py-[5px] relative rounded-full shrink-0">
              <img alt="" src={`${A}/chat-doc.svg`} className="shrink-0 size-[11px]" />
              <span className="font-inter font-semibold text-[#a5b4fc] text-[11px] text-center tracking-[0.33px] leading-[14px] whitespace-nowrap">
                {msg.pdfName}
              </span>
            </div>
          )}
          {msg.content && (
            <div className="bg-[#4f46e5] content-stretch flex flex-col items-start max-w-[493px] pl-[16px] pr-[45.53px] py-[12px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[2px] shrink-0 shadow-[0px_4px_6px_-1px_rgba(30,27,75,0.4),0px_2px_4px_-2px_rgba(30,27,75,0.4)]">
              <p className="font-inter text-[14px] text-white leading-[22.75px] whitespace-pre-wrap">{msg.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="content-stretch flex flex-col items-start pr-[148px] relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
        <div className="content-stretch flex items-center justify-between px-[4px] relative shrink-0 w-full">
          <span className="font-inter font-semibold text-[#64748b] text-[11px] tracking-[0.33px] leading-[14px]">
            {msg.time}
          </span>
          <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
            <button
              type="button"
              onClick={() => onCopy?.({ msg })}
              aria-label="Copy response"
              title="Copy response"
              className="content-stretch flex items-center justify-center p-[5px] relative rounded-[7px] shrink-0 cursor-pointer text-[#64748b] hover:bg-[#1b202e] hover:text-[#cbd5e1] transition-colors"
            >
              <CopyIcon />
            </button>
            <button
              type="button"
              onClick={() => onShare?.({ msg })}
              aria-label="Share response"
              title="Share response"
              className="content-stretch flex items-center justify-center p-[5px] relative rounded-[7px] shrink-0 cursor-pointer text-[#64748b] hover:bg-[#1b202e] hover:text-[#cbd5e1] transition-colors"
            >
              <ShareIcon />
            </button>
          </div>
        </div>
        {msg.kind === "summary" ? (
          <SummaryCard sections={msg.sections} />
        ) : (
          <div
            className={`relative bg-[#161922] border content-stretch flex flex-col gap-[12px] items-start p-[17px] rounded-[12px] shrink-0 w-full shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] ${
              msg.error ? "border-[#7f1d1d]" : "border-[#2a3044]"
            }`}
          >
            {msg.error ? (
              <p className="font-inter text-[14px] leading-[22.75px] w-full whitespace-pre-wrap text-[#fecaca]">
                {msg.content}
              </p>
            ) : (
              <div className="font-inter text-[14px] leading-[22.75px] text-[#cbd5e1] w-full">
                <RichText
                  text={typeof msg.content === "string" ? msg.content : ""}
                  citations={msg.citations}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ pdfName }) {
  return (
    <div className="content-stretch flex flex-col items-center gap-[10px] pt-[72px] pb-[24px] relative shrink-0 w-full">
      <div className="bg-[#12151e] border border-[#2a3044] border-solid content-stretch flex flex-col items-center justify-center rounded-[16px] size-[64px]">
        <img alt="" src={`${A}/chat-sources.svg`} className="h-[24px] w-[22.667px]" />
      </div>
      <h2 className="font-inter font-semibold text-[#e2e8f0] text-[18px] tracking-[-0.18px] leading-[26px]">
        {pdfName ? "Ask anything about this paper" : "Start a research conversation"}
      </h2>
      <p className="font-inter text-[14px] text-[#94a3b8] leading-[22px] text-center max-w-[420px]">
        {pdfName
          ? "Ask for explanations, test hypotheses, or probe the equations. Answers are grounded in the paper with page-level citations."
          : "Attach a PDF and ask anything — ResearchLab will extract a structured summary and answer with page-level citations."}
      </p>
    </div>
  );
}

export default function Chat() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const [documentId, setDocumentId] = useState(
    () => location.state?.uploadId || sessionStorage.getItem("researchlab.uploadId") || null,
  );
  const [pdfName, setPdfName] = useState(
    () =>
      location.state?.pdfName ||
      sessionStorage.getItem("researchlab.pdfName") ||
      "Attention_Vaswani_2017.pdf",
  );
  const [messages, setMessages] = useState([]);
  const [webSearch, setWebSearch] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("idle");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesMaximized, setNotesMaximized] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState(null);
  const [extraDocs, setExtraDocs] = useState(() => {
    try {
      const arr = JSON.parse(sessionStorage.getItem("researchlab.extraDocs") || "[]");
      return Array.isArray(arr) ? arr.filter((d) => d && d.id) : [];
    } catch {
      return [];
    }
  });
  const noteKey = documentId ? `researchlab.notepad.${documentId}` : null;
  const {
    file,
    error,
    inputRef,
    open: openPdf,
    onChange: onPdfChange,
    clear: clearPdf,
  } = usePdfAttachment();

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const webSearchRef = useRef(webSearch);
  useEffect(() => {
    webSearchRef.current = webSearch;
  }, [webSearch]);
  const startedRef = useRef(false);
  const sendGuard = useRef(Promise.resolve());
  const enqueue = (fn) => {
    const run = sendGuard.current.then(fn);
    sendGuard.current = run.catch(() => {});
    return run;
  };

  const addMsg = (m) => {
    messagesRef.current = [...messagesRef.current, m];
    setMessages((prev) => [...prev, m]);
  };
  const addUser = (content, name) =>
    addMsg({ id: uid(), role: "user", kind: "text", content, pdfName: name, time: nowLabel() });
  const addSummary = (sections) =>
    addMsg({ id: uid(), role: "assistant", kind: "summary", sections, time: nowLabel() });
  const addAssistant = (content, citations) =>
    addMsg({
      id: uid(),
      role: "assistant",
      kind: "text",
      content,
      citations: citations || [],
      time: nowLabel(),
    });
  const addError = (title, err) =>
    addMsg({
      id: uid(),
      role: "assistant",
      kind: "text",
      content: `${title}: ${err?.message || err}`,
      error: true,
      time: nowLabel(),
    });

  const runTurn = async (userMsg, docId, docIdList, { newDoc = false } = {}) => {
    const alreadySummarized = !newDoc && messagesRef.current.some((m) => m.kind === "summary");
    if (!alreadySummarized) {
      setBusy("analyzing");
      try {
        const summary = await analyzePaper({ documentId: docId });
        addSummary(summary);
      } catch (err) {
        addError("Structured summary failed", err);
      }
    }
    const userContent = (userMsg.content || "").trim();
    if (!userContent) {
      setBusy("idle");
      return;
    }
    setBusy("answering");
    const history = alreadySummarized
      ? toHistory(messagesRef.current)
      : [{ role: "user", content: userContent }];
    const finalIds = Array.from(new Set([docId, ...(docIdList || [])])).filter(Boolean);
    try {
      const res = await chatMessage({
        documentId: docId,
        documentIds: finalIds,
        chatId: docId,
        messages: history,
        webSearch: webSearchRef.current,
      });
      addAssistant(res.text, res.citations);
    } catch (err) {
      addError("AI couldn't answer this turn", err);
    }
    setBusy("idle");
  };

  useEffect(() => {
    if (startedRef.current) return;
    const state = location.state || {};
    const prompt = (state.prompt || sessionStorage.getItem("researchlab.prompt") || "").trim();
    const docId = state.uploadId || sessionStorage.getItem("researchlab.uploadId");
    const name =
      state.pdfName || sessionStorage.getItem("researchlab.pdfName") || "document.pdf";
    if (!docId) return;
    startedRef.current = true;
    setDocumentId(docId);
    setPdfName(name);
    const userMsg = { id: uid(), role: "user", kind: "text", content: prompt, pdfName: name, time: nowLabel() };
    setMessages([userMsg]);
    messagesRef.current = [userMsg];
    enqueue(() => runTurn(userMsg, docId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    const q = query.trim();
    const attach = file;
    if (!q && !attach) {
      if (!documentId) setStatus("Attach a PDF to start a conversation.");
      return;
    }
    if (!attach && !documentId) {
      setStatus("Attach a PDF to start a conversation.");
      return;
    }

    let docId = documentId;
    let name = pdfName;
    let docIdList = [documentId, ...extraDocs.map((d) => d.id)].filter(Boolean);
    if (attach) {
      clearPdf();
      try {
        const uploaded = await uploadPdf(attach);
        docId = uploaded.id;
        name = uploaded.filename || attach.name;
      } catch (err) {
        setStatus(err.message || "Upload failed");
        return;
      }
      if (documentId && documentId !== docId) {
        const nextExtras = [...extraDocs, { id: documentId, name: pdfName }];
        setExtraDocs(nextExtras);
        try {
          sessionStorage.setItem("researchlab.extraDocs", JSON.stringify(nextExtras));
        } catch {
          /* ignore */
        }
        docIdList = [docId, ...nextExtras.map((d) => d.id)];
      }
    }
    setQuery("");
    sessionStorage.setItem("researchlab.pdfName", name);
    sessionStorage.setItem("researchlab.prompt", q);
    if (docId) {
      sessionStorage.setItem("researchlab.uploadId", docId);
      setDocumentId(docId);
    }
    setPdfName(name);

    const userMsg = { id: uid(), role: "user", kind: "text", content: q, pdfName: name, time: nowLabel() };
    addMsg(userMsg);
    enqueue(() => runTurn(userMsg, docId, docIdList, { newDoc: Boolean(attach) }));
  };

  const copyTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const copyResponse = ({ msg }) => {
    const plain = msg.kind === "summary" ? summaryToText(msg.sections) : msg.content;
    const cleaned = Stripper(plain);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleaned).catch(() => legacyCopy(cleaned));
    } else {
      legacyCopy(cleaned);
    }
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = ({ msg }) => {
    const index = messagesRef.current.findIndex((m) => m.id === msg.id);
    const prior = messagesRef.current.slice(0, index).filter((m) => m.role === "user");
    const prompt = prior.length ? prior[prior.length - 1].content || "" : "";
    const body = msg.kind === "summary" ? summaryToText(msg.sections) : msg.content;
    const chunk = `#${prompt}\n${Stripper(body || "")}\n\n`;
    setNoteText((prev) => (prev ? prev + chunk : chunk));
    notify("Added to the notepad!");
  };

  const toastTimerRef = useRef(null);
  const noteSaveRef = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(toastTimerRef.current);
      clearTimeout(noteSaveRef.current);
    },
    [],
  );

  const notify = (label) => {
    setToast(label);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    if (!noteKey) {
      setNoteText("");
      return;
    }
    try {
      setNoteText(localStorage.getItem(noteKey) || "");
    } catch {
      setNoteText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteKey]);

  useEffect(() => {
    if (!noteKey) return undefined;
    clearTimeout(noteSaveRef.current);
    noteSaveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(noteKey, noteText);
      } catch {
        /* storage full or unavailable */
      }
    }, 400);
    return () => clearTimeout(noteSaveRef.current);
  }, [noteText, noteKey]);

  const exportNotes = () => {
    const safe = (pdfName || "chat").replace(/[^A-Za-z0-9._ -]/g, "").trim() || "chat";
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const blob = new Blob([`\uFEFF${noteText}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ResearchLab-notes-${safe}-${stamp}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Notepad exported");
  };

  const clearNotes = () => {
    if (!noteText) return;
    if (!window.confirm("Clear this chat's notepad?")) return;
    setNoteText("");
    if (noteKey) {
      try {
        localStorage.setItem(noteKey, "");
      } catch {
        /* ignore */
      }
    }
    notify("Notepad cleared");
  };

  const sources = useMemo(() => {
    const list = [];
    const docs = [
      { id: documentId, name: pdfName, primary: true },
      ...extraDocs.map((d) => ({ ...d, primary: false })),
    ];
    const seenPdf = new Set();
    docs.forEach((d) => {
      if (!d.id || !d.name || seenPdf.has(d.id)) return;
      seenPdf.add(d.id);
      list.push({
        key: `pdf-${d.id}`,
        icon: `${A}/chat-doc.svg`,
        title: d.name,
        badge: "PDF",
        meta: d.primary ? "Uploaded document • primary source" : "Uploaded document • attached",
      });
    });
    const seen = new Set();
    messages.forEach((m) => {
      (m.citations || []).forEach((c) => {
        if (c.type === "web" && c.url && !seen.has(c.url)) {
          seen.add(c.url);
          list.push({
            key: c.url,
            icon: `${A}/chat-globe.svg`,
            title: c.title || hostOf(c.url),
            badge: "WEB",
            meta: c.url,
          });
        }
      });
    });
    return list;
  }, [messages, documentId, pdfName, extraDocs]);

  return (
    <div
      className={`content-stretch flex flex-col items-start relative size-full h-screen overflow-hidden transition-[padding] duration-200 ease-out ${
        collapsed ? "pl-[130px]" : "pl-[260px]"
      }`}
    >
      {copied && (
        <div className="pointer-events-none absolute left-1/2 top-[76px] -translate-x-1/2 w-max z-[60]">
          <div className="backdrop-blur-[12px] bg-[rgba(17,20,29,0.95)] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.3),0px_4px_6px_-4px_rgba(0,0,0,0.3)] flex items-center gap-[8px] px-[14px] py-[9px] relative rounded-[10px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m8.5 12.5 2.5 2.5 4.5-5" />
            </svg>
            <span className="font-inter font-medium text-[13px] text-[#e2e8f0] leading-[18px] whitespace-nowrap">
              Response copied to the clipboard!
            </span>
          </div>
        </div>
      )}
      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-[76px] -translate-x-1/2 w-max z-[60]">
          <div className="backdrop-blur-[12px] bg-[rgba(17,20,29,0.95)] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.3),0px_4px_6px_-4px_rgba(0,0,0,0.3)] flex items-center gap-[8px] px-[14px] py-[9px] relative rounded-[10px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m8.5 12.5 2.5 2.5 4.5-5" />
            </svg>
            <span className="font-inter font-medium text-[13px] text-[#e2e8f0] leading-[18px] whitespace-nowrap">
              {toast}
            </span>
          </div>
        </div>
      )}
      <div
        className={`content-stretch flex h-full w-[200%] relative transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          notesOpen ? (notesMaximized ? "-translate-x-1/2" : "-translate-x-1/4") : "translate-x-0"
        }`}
      >
      <div className="bg-[#0b0d13] content-stretch flex flex-col items-start pt-[64px] px-[24px] relative shrink-0 w-1/2 h-full min-h-0">
        {/* Subheader ribbon */}
        <div className="backdrop-blur-[6px] bg-[rgba(17,20,29,0.95)] border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between pb-[9px] pt-[8px] px-[16px] relative shrink-0 w-full z-[2]">
          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
            <span className="font-inter font-medium text-[#94a3b8] text-[13px] tracking-[0.13px] leading-[16px] whitespace-nowrap">
              Workspace
            </span>
            <img alt="" src={`${A}/chat-chevron.svg`} className="h-[7px] w-[4.317px] shrink-0" />
            <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px] whitespace-nowrap">
              {pdfName}
            </span>
          </div>
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <div className="bg-[#2a3044] h-[16px] relative shrink-0 w-px" />
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              aria-label="Toggle notepad"
              title={notesOpen ? "Close notepad" : "Open notepad"}
              className={`border border-solid content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[34px] cursor-pointer transition-colors ${
                notesOpen
                  ? "bg-[rgba(79,70,229,0.25)] border-[#6366f1]"
                  : "bg-[#1a1e2b] border-[#2a3044] hover:bg-[#20263a]"
              }`}
            >
              <img alt="" src={`${A}/chat-note.svg`} className="relative shrink-0 size-[15px]" />
            </button>
            <button
              type="button"
              onClick={() => setSourcesOpen((v) => !v)}
              className="bg-[#1a1e2b] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[6px] items-center px-[13px] py-[7px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#20263a]"
            >
              <img alt="" src={`${A}/chat-undock.svg`} className="relative shrink-0 size-[13.5px]" />
              <span className="font-inter font-medium text-[#a5b4fc] text-[13px] text-center tracking-[0.13px] leading-[16px] whitespace-nowrap">
                {sourcesOpen ? "Undock Sources" : "Dock Sources"}
              </span>
            </button>
          </div>
        </div>

        {/* Primary working grid */}
        <div className="content-stretch flex flex-1 min-h-0 items-stretch relative shrink-0 w-full z-[1]">
          <div className="content-stretch flex flex-1 flex-col min-w-px relative shrink-0">
            <div className="content-stretch flex flex-1 flex-col items-center min-w-px no-scrollbar px-[12px] relative overflow-y-auto overflow-x-hidden">
            <div className="content-stretch flex flex-col gap-[16px] items-start max-w-[1040px] pt-[16px] pb-[84px] relative shrink-0 w-full">
              {messages.length === 0 && <EmptyState pdfName={documentId ? pdfName : ""} />}
              {messages.map((m) => (
                <MessageView key={m.id} msg={m} onCopy={copyResponse} onShare={handleShare} />
              ))}
              {busy !== "idle" && (
                <div className="content-stretch flex flex-col items-start pr-[48px] relative shrink-0 w-full">
                  <div className="content-stretch flex items-center gap-[8px] px-[4px] pt-[6px] relative shrink-0">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#6366f1] animate-pulse shrink-0" />
                    <span className="font-inter text-[13px] text-[#94a3b8] leading-[18px]">
                      {busy === "analyzing"
                        ? "Analyzing the paper — generating the structured summary…"
                        : "Consulting the paper and the web…"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Floating query console, styled like the workspace composer (no destination folder) */}
            <div className="absolute bottom-0 content-stretch flex flex-col items-center inset-x-0 px-[12px] pb-[14px] pt-[12px] pointer-events-none relative z-10">
              <div className="backdrop-blur-[12px] bg-[rgba(22,25,34,0.95)] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[4px] items-start p-[9px] pointer-events-auto relative rounded-[12px] w-full">
                <div className="absolute bg-[rgba(255,255,255,0)] inset-[-1px_-1px_-1.33px_-1px] rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-none" />

                {(file || error || status) && (
                  <div className="relative shrink-0 w-full">
                    <div className="flex flex-wrap items-center gap-[6px] px-[5px] pb-[2px] pt-[6px]">
                      {file && <PdfChip file={file} onRemove={clearPdf} />}
                      {error && <span className="font-inter text-[12px] text-[#f87171]">{error}</span>}
                      {!error && status && <span className="font-inter text-[12px] text-[#94a3b8]">{status}</span>}
                    </div>
                  </div>
                )}

                <div className="relative shrink-0 w-full">
                  <div className="flex gap-[4px] items-center px-[4px] relative size-full">
                    <button
                      type="button"
                      onClick={openPdf}
                      aria-label="Attach a PDF"
                      className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#1b202e] transition-colors"
                    >
                      <div className="h-[16.667px] relative shrink-0 w-[10.417px]">
                        <img alt="" src={`${A}/ws-attach.svg`} className="absolute block inset-0 max-w-none size-full" />
                      </div>
                    </button>
                    <PdfFileInput inputRef={inputRef} onChange={onPdfChange} />
                    <div className="content-stretch flex flex-1 flex-col items-start min-w-px overflow-clip pb-[11px] pt-[10px] px-[12px] relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSend();
                        }}
                        placeholder="Ask a question about this paper, test hypotheses, or probe equations..."
                        className="bg-transparent border-0 font-inter font-normal text-[14px] text-[#f8fafc] leading-normal outline-none p-0 placeholder:text-[#64748b] w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSend}
                      className={`bg-[#4f46e5] relative rounded-[12px] shrink-0 size-[40px] cursor-pointer shadow-[0px_4px_6px_-1px_rgba(49,46,129,0.4),0px_2px_4px_-2px_rgba(49,46,129,0.4)] ${
                        busy !== "idle" ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-center relative size-full">
                        <img alt="" src={`${A}/chat-send.svg`} className="relative shrink-0 size-[13.333px]" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Docked sources panel */}
          <aside
            className={`bg-[#11141d] content-stretch flex flex-col items-start overflow-hidden relative shrink-0 self-stretch transition-[width] duration-200 ease-out ${
              sourcesOpen
                ? "border-[#1e2230] border-l border-solid w-[320px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
                : "w-0"
            }`}
          >
            <div className="flex-1 min-h-px relative w-full overflow-hidden">
              <div
                className={`bg-clip-padding content-stretch flex flex-col items-start origin-left relative size-full transition-[opacity,transform] duration-200 ease-out w-[320px] ${
                  sourcesOpen
                    ? "opacity-100 [transform:scaleX(1)]"
                    : "opacity-0 pointer-events-none [transform:scaleX(0.75)]"
                }`}
              >
                <div className="border-[#1e2230] border-b border-solid content-stretch flex items-center gap-[4px] pb-[17px] pt-[16px] px-[16px] relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                    <img alt="" src={`${A}/chat-sources.svg`} className="h-[15.875px] w-[15px] shrink-0" />
                    <span className="font-inter font-semibold text-[#f1f5f9] text-[14px] leading-[22px]">
                      Sources
                    </span>
                  </div>
                </div>

                <div className="content-stretch flex flex-col items-start pt-[12px] px-[16px] relative shrink-0 w-full">
                  <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex items-center justify-between p-[13px] relative rounded-[12px] shrink-0 w-full">
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px] whitespace-nowrap">
                        Academic Web Search
                      </span>
                      <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px] leading-[14px] whitespace-nowrap">
                        Search accross the web
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={webSearch}
                      onClick={() => setWebSearch((v) => !v)}
                      className={`h-[24px] relative rounded-full shrink-0 w-[44px] cursor-pointer transition-colors duration-200 ${
                        webSearch ? "bg-[#22c55e]" : "bg-[#2a3044]"
                      }`}
                    >
                      <div
                        className={`absolute bg-white rounded-full size-[20px] top-[2px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] transition-transform duration-200 ${
                          webSearch ? "translate-x-[22px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 no-scrollbar overflow-y-auto relative w-full">
                  <div className="font-inter font-semibold text-[#94a3b8] text-[16px] tracking-[0.8px] uppercase leading-[24px] px-[20px] pt-[16px] pb-[8px]">
                    Referenced Corpus
                  </div>
                  {sources.length ? (
                    <div className="content-stretch flex flex-col gap-[8px] items-start px-[16px] pb-[16px] w-full">
                      {sources.map((s) => (
                        <div
                          key={s.key}
                          className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[4px] items-start p-[13px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:border-[#3b4361] transition-colors"
                        >
                          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                            <div className="content-stretch flex gap-[4px] items-center min-w-px overflow-hidden relative shrink-0">
                              <img alt="" src={s.icon} className="relative shrink-0 size-[15px]" />
                              <span className="font-inter font-semibold text-[#e2e8f0] text-[13px] tracking-[0.13px] leading-[16px] truncate">
                                {s.title}
                              </span>
                            </div>
                            <div
                              className={`content-stretch flex flex-col items-start px-[7px] py-[3px] relative rounded-[4px] shrink-0 border ${
                                s.badge === "PDF"
                                  ? "bg-[rgba(30,27,75,0.7)] border-[rgba(55,48,163,0.4)]"
                                  : "bg-[rgba(8,47,73,0.7)] border-[rgba(7,89,133,0.4)]"
                              }`}
                            >
                              <span
                                className={`font-inter font-semibold text-[11px] tracking-[0.33px] leading-[14px] ${
                                  s.badge === "PDF" ? "text-[#a5b4fc]" : "text-[#7dd3fc]"
                                }`}
                              >
                                {s.badge}
                              </span>
                            </div>
                          </div>
                          <div className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full truncate">{s.meta}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="font-inter text-[13px] text-[#64748b] leading-[18px] px-[16px] pb-[16px]">
                      Nothing referenced yet — sources accumulate as the conversation grows.
                    </div>
                  )}
                </div>

                <div className="border-[#1e2230] border-t border-solid content-stretch flex flex-col items-start pb-[16px] pt-[17px] px-[16px] relative shrink-0 w-full">
                  <button
                    type="button"
                    className="bg-[#161922] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center justify-center px-[13px] py-[9px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#1b202e] transition-colors"
                  >
                    <img alt="" src={`${A}/chat-plus.svg`} className="relative shrink-0 size-[10.5px]" />
                    <span className="font-inter font-medium text-[#e2e8f0] text-[13px] text-center tracking-[0.13px] leading-[16px]">
                      Add External Source
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      </div>

      <div
        className={`bg-[#0b0d13] content-stretch flex flex-col items-start relative shrink-0 self-stretch h-full min-h-0 overflow-hidden border-[#1e2230] border-l border-solid ${
          notesMaximized ? "w-1/2" : "w-1/4"
        }`}
      >
        <div className="border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between pb-[11px] pt-[16px] px-[16px] relative shrink-0 w-full">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <img alt="" src={`${A}/chat-note.svg`} className="relative shrink-0 size-[16px]" />
            <span className="font-inter font-semibold text-[#f1f5f9] text-[14px] leading-[22px] whitespace-nowrap">
              Notepad
            </span>
          </div>
          <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
            <button
              type="button"
              onClick={exportNotes}
              title="Export notes"
              className="bg-[#1a1e2b] border border-[#2a3044] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[6px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#20263a] transition-colors"
            >
              <img alt="" src={`${A}/pc-download.svg`} className="relative shrink-0 size-[13px]" />
              <span className="font-inter font-medium text-[#a5b4fc] text-[12px] leading-[16px] whitespace-nowrap">
                Export
              </span>
            </button>
            <button
              type="button"
              onClick={clearNotes}
              aria-label="Clear notepad"
              title="Clear notepad"
              className="content-stretch flex items-center justify-center p-[7px] relative rounded-[8px] shrink-0 cursor-pointer text-[#64748b] hover:bg-[#1b202e] hover:text-[#f87171] transition-colors"
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              onClick={() => setNotesMaximized((v) => !v)}
              aria-label={notesMaximized ? "Restore notepad" : "Maximise notepad"}
              title={notesMaximized ? "Restore" : "Maximise"}
              className="content-stretch flex items-center justify-center p-[7px] relative rounded-[8px] shrink-0 cursor-pointer text-[#64748b] hover:bg-[#1b202e] hover:text-[#cbd5e1] transition-colors"
            >
              {notesMaximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
          </div>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          spellCheck="false"
          placeholder={"Take notes for this chat…\n\nUse the share button on a response to append it here."}
          className="bg-transparent border-0 flex-1 min-h-0 resize-none outline-none p-[16px] font-inter text-[14px] leading-[22.75px] text-[#e2e8f0] placeholder:text-[#64748b] w-full"
        />
        <div className="border-[#1e2230] border-t border-solid content-stretch flex items-center px-[16px] py-[10px] relative shrink-0 w-full">
          <span className="font-inter text-[12px] text-[#64748b] leading-[16px]">
            Saved per chat and kept on this device.
          </span>
        </div>
      </div>
    </div>
  );
}