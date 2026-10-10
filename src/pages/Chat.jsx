import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePdfAttachment, PdfFileInput, PdfChip } from "../components/PdfAttachment";
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

function citeLabel(c) {
  const parts = [];
  if (c.section_title) parts.push(c.section_title);
  if (c.page != null) parts.push(`p. ${c.page}`);
  if (!parts.length) parts.push(c.section || "source");
  return parts.join(" • ");
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
  const cites = Array.isArray(s.citations) ? s.citations : [];

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
              <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pt-[3.125px] pb-[0.875px] w-full whitespace-pre-wrap">
                {s.abstract}
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
          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pb-[0.75px] w-full whitespace-pre-wrap">
            {s.problem_statement || "No problem statement returned."}
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
          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] w-full whitespace-pre-wrap">
            {s.methodology || "No methodology returned."}
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
            <div className="content-stretch flex flex-wrap gap-[8px] items-stretch relative shrink-0 w-full">
              {results.map((r, i) => (
                <div
                  key={`${r.label}-${i}`}
                  className="bg-[#12151e] border border-[#252b3d] border-solid content-stretch flex flex-1 flex-col items-start justify-between min-w-[200px] p-[13px] relative rounded-[8px]"
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
                      <p className="font-inter text-[13px] text-[#94a3b8] leading-[18px] w-full">{r.description}</p>
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
          <div className="font-inter text-[14px] text-[#cbd5e1] leading-[22.75px] pb-[0.875px] w-full whitespace-pre-wrap">
            {s.conclusion || "No conclusion returned."}
          </div>
        )}
      </div>

      {cites.length > 0 && (
        <>
          <div className="bg-[rgba(42,48,68,0.6)] h-px relative shrink-0 w-full" />
          <div className="content-stretch flex flex-wrap gap-[8px] items-center relative shrink-0 w-full pt-[9px]">
            <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase leading-[14px] pr-[4px]">
              Evidence from paper:
            </span>
            {cites.map((c, i) => (
              <button
                key={`${c.section}-${i}`}
                type="button"
                className="bg-[rgba(30,27,75,0.7)] border border-[rgba(67,56,202,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[9px] py-[5px] relative rounded-full shrink-0 cursor-pointer hover:border-[#6366f1] transition-colors"
              >
                <img alt="" src={`${A}/chat-doc.svg`} className="shrink-0 size-[11px]" />
                <span className="font-inter font-semibold text-[#a5b4fc] text-[11px] text-center tracking-[0.33px] leading-[14px] whitespace-nowrap">
                  {citeLabel(c)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceRow({ citations }) {
  const list = citations || [];
  if (!list.length) return null;
  return (
    <div className="content-stretch flex flex-wrap gap-[8px] items-center relative shrink-0 w-full pt-[9px]">
      <span className="font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase leading-[14px] pr-[4px]">
        Evidence:
      </span>
      {list.map((c, i) => {
        const isWeb = c.type === "web";
        const label = isWeb
          ? c.title || hostOf(c.url || "")
          : [c.section && `§${c.section}`, c.page != null && `p. ${c.page}`].filter(Boolean).join(" ");
        return (
          <button
            key={`${c.url || c.section || c.page}-${i}`}
            type="button"
            className="bg-[rgba(30,27,75,0.7)] border border-[rgba(67,56,202,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[9px] py-[5px] relative rounded-full shrink-0 cursor-pointer hover:border-[#6366f1] transition-colors"
          >
            <img
              alt=""
              src={isWeb ? `${A}/chat-globe.svg` : `${A}/chat-doc.svg`}
              className="shrink-0 size-[11px]"
            />
            <span className="font-inter font-semibold text-[#a5b4fc] text-[11px] text-center tracking-[0.33px] leading-[14px] whitespace-nowrap">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MessageView({ msg }) {
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
          <div className="bg-[#4f46e5] content-stretch flex flex-col items-start max-w-[493px] pl-[16px] pr-[45.53px] py-[12px] relative rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[2px] shrink-0 shadow-[0px_4px_6px_-1px_rgba(30,27,75,0.4),0px_2px_4px_-2px_rgba(30,27,75,0.4)]">
            <p className="font-inter text-[14px] text-white leading-[22.75px] whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-stretch flex flex-col items-start pr-[48px] relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
        <div className="content-stretch flex items-center px-[4px] relative shrink-0 w-full">
          <span className="font-inter font-semibold text-[#64748b] text-[11px] tracking-[0.33px] leading-[14px]">
            {msg.time}
          </span>
        </div>
        {msg.kind === "summary" ? (
          <SummaryCard sections={msg.sections} />
        ) : (
          <div
            className={`relative bg-[#161922] border content-stretch flex flex-col gap-[12px] items-start p-[17px] rounded-[12px] shrink-0 w-full shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] ${
              msg.error ? "border-[#7f1d1d]" : "border-[#2a3044]"
            }`}
          >
            <p
              className={`font-inter text-[14px] leading-[22.75px] w-full whitespace-pre-wrap ${
                msg.error ? "text-[#fecaca]" : "text-[#cbd5e1]"
              }`}
            >
              {msg.content}
            </p>
            {!msg.error && msg.citations && <EvidenceRow citations={msg.citations} />}
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
  const [webSearch, setWebSearch] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("idle");
  const [status, setStatus] = useState("");
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

  const addMsg = (m) => setMessages((prev) => [...prev, m]);
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

  const runTurn = async (userMsg, docId) => {
    const alreadySummarized = messagesRef.current.some((m) => m.kind === "summary");
    if (!alreadySummarized) {
      setBusy("analyzing");
      try {
        const summary = await analyzePaper({ documentId: docId });
        addSummary(summary);
      } catch (err) {
        addError("Structured summary failed", err);
      }
    }
    setBusy("answering");
    const history = alreadySummarized
      ? toHistory([...messagesRef.current, userMsg])
      : [{ role: "user", content: userMsg.content }];
    try {
      const res = await chatMessage({
        documentId: docId,
        messages: history,
        webSearch: webSearchRef.current,
      });
      addAssistant(res.text, res.citations);
      if (res.web_search === false) {
        setStatus("Web search isn't available on the free Gemini tier — this answer used the paper only.");
      }
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
    if (prompt) {
      const userMsg = { id: uid(), role: "user", kind: "text", content: prompt, pdfName: name, time: nowLabel() };
      setMessages([userMsg]);
      runTurn(userMsg, docId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSend = !busy;

  const handleSend = async () => {
    const q = query.trim();
    if (!canSend) return;
    if (!q) {
      if (file) setStatus("Type a message or attach a PDF to start.");
      return;
    }
    if (!documentId) {
      if (!file) {
        setStatus("Attach a PDF to start a conversation.");
        return;
      }
      clearPdf();
      setQuery("");
      try {
        const uploaded = await uploadPdf(file);
        const name = uploaded.filename || file.name;
        sessionStorage.setItem("researchlab.pdfName", name);
        sessionStorage.setItem("researchlab.uploadId", uploaded.id);
        sessionStorage.setItem("researchlab.prompt", q);
        setDocumentId(uploaded.id);
        setPdfName(name);
        const userMsg = { id: uid(), role: "user", kind: "text", content: q, pdfName: name, time: nowLabel() };
        setMessages([userMsg]);
        runTurn(userMsg, uploaded.id);
      } catch (err) {
        setStatus(err.message || "Upload failed");
      }
      return;
    }

    const userMsg = { id: uid(), role: "user", kind: "text", content: q, pdfName, time: nowLabel() };
    addMsg(userMsg);
    setQuery("");
    clearPdf();
    runTurn(userMsg, documentId);
  };

  const sources = useMemo(() => {
    const list = [];
    if (pdfName) {
      list.push({
        key: "pdf",
        icon: `${A}/chat-doc.svg`,
        title: pdfName,
        badge: "PDF",
        meta: "Uploaded document • primary source",
      });
    }
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
  }, [messages, pdfName]);

  return (
    <div
      className={`content-stretch flex flex-col items-start relative size-full h-screen overflow-hidden ${
        collapsed ? "px-[130px]" : "pl-[260px]"
      }`}
    >
      <div className="bg-[#0b0d13] content-stretch flex flex-col items-start pt-[64px] px-[24px] relative shrink-0 w-full min-h-0 flex-1">
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
              className="bg-[#1a1e2b] border border-[#2a3044] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[6px] items-center px-[13px] py-[7px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#20263a]"
            >
              <img alt="" src={`${A}/chat-undock.svg`} className="relative shrink-0 size-[13.5px]" />
              <span className="font-inter font-medium text-[#a5b4fc] text-[13px] text-center tracking-[0.13px] leading-[16px] whitespace-nowrap">
                Undock Sources
              </span>
            </button>
          </div>
        </div>

        {/* Primary working grid */}
        <div className="content-stretch flex flex-1 min-h-0 items-stretch relative shrink-0 w-full z-[1]">
          <div className="content-stretch flex flex-1 flex-col items-center min-w-px px-[12px] relative overflow-y-auto overflow-x-hidden">
            <div className="content-stretch flex flex-col gap-[16px] items-start max-w-[760px] pt-[16px] pb-[168px] relative shrink-0 w-full">
              {messages.length === 0 && <EmptyState pdfName={documentId ? pdfName : ""} />}
              {messages.map((m) => (
                <MessageView key={m.id} msg={m} />
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

          {/* Docked sources panel */}
          <aside className="bg-[#11141d] border-[#1e2230] border-l border-solid content-stretch flex flex-col items-start relative shrink-0 w-[320px] self-stretch shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]">
            <div className="flex-1 min-h-px relative w-full">
              <div className="bg-clip-padding content-stretch flex flex-col items-start relative size-full">
                <div className="border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between pb-[17px] pt-[16px] px-[16px] relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                    <img alt="" src={`${A}/chat-sources.svg`} className="h-[15.875px] w-[15px] shrink-0" />
                    <span className="font-inter font-semibold text-[#f1f5f9] text-[14px] leading-[22px]">
                      Sources
                    </span>
                  </div>
                  <button
                    type="button"
                    className="content-stretch flex items-center justify-center pb-[10px] pt-[4px] px-[4px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#161922]"
                  >
                    <img alt="" src={`${A}/chat-panel-close.svg`} className="relative shrink-0 size-[10.5px]" />
                  </button>
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

                <div className="flex-1 min-h-0 overflow-y-auto relative w-full">
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

      {/* Persistent floating query console */}
      <div className="absolute bottom-0 content-stretch flex flex-col items-center left-[89px] p-[16px] right-[171px] z-10">
        <div className="backdrop-blur-[12px] bg-[rgba(22,25,34,0.95)] border border-[#2a3044] border-solid content-stretch flex flex-col max-w-[760px] relative rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-[760px]">
          {(file || error || status) && (
            <div className="flex flex-wrap items-center gap-[6px] px-[13px] pt-[10px]">
              {file && <PdfChip file={file} onRemove={clearPdf} />}
              {error && <span className="font-inter text-[12px] text-[#f87171]">{error}</span>}
              {!error && status && <span className="font-inter text-[12px] text-[#94a3b8]">{status}</span>}
            </div>
          )}
          <div className="content-stretch flex gap-[8px] items-center pl-[13px] pr-[5px] py-[5px]">
            <button
              type="button"
              onClick={openPdf}
              aria-label="Attach a PDF"
              className="content-stretch flex flex-col items-center justify-center pb-[10px] pt-[4px] px-[4px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#1b202e]"
            >
              <img alt="" src={`${A}/chat-attach.svg`} className="h-[16.667px] w-[10.417px] shrink-0" />
            </button>
            <PdfFileInput inputRef={inputRef} onChange={onPdfChange} />
            <div className="flex-1 min-w-px relative">
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
  );
}