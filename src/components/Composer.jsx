import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePdfAttachment, PdfFileInput, PdfChip } from "./PdfAttachment";
import { uploadPdf } from "../lib/api";
import { useSidebar } from "./sidebarContext";
import { createSessionRecord } from "../lib/sessionStore";

const A = "/assets";

export default function Composer({
  placeholder = "Upload paper to begin...",
  showDestination = true,
  destination = "ML Papers",
  disabled = false,
  sessionTitle = "",
}) {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [showPdfWarning, setShowPdfWarning] = useState(false);
  const { file, error, inputRef, open, onChange, clear } = usePdfAttachment();

  useEffect(() => {
    if (!showPdfWarning) return undefined;
    const timer = setTimeout(() => setShowPdfWarning(false), 3000);
    return () => clearTimeout(timer);
  }, [showPdfWarning]);

  useEffect(() => {
    if (file) setShowPdfWarning(false);
  }, [file]);

  const handleSend = async () => {
    if (disabled || sending) return;
    if (!file) {
      setShowPdfWarning(true);
      return;
    }

    const attached = file;
    const prompt = text.trim();
    setSending(true);
    setStatus("");
    try {
      const uploaded = await uploadPdf(attached);
      const pdfName = uploaded.filename || attached.name;
      const trimmedTitle = (sessionTitle || "").trim();
      const title =
        trimmedTitle && trimmedTitle !== "New research session" ? trimmedTitle : pdfName;
      createSessionRecord({
        id: uploaded.id,
        title,
        folder: destination,
        pdfName,
        prompt,
        uploadId: uploaded.id,
        messages: [],
        extraDocs: [],
        webSources: [],
      });
      sessionStorage.setItem("researchlab.pdfName", pdfName);
      sessionStorage.setItem("researchlab.uploadId", uploaded.id);
      sessionStorage.setItem("researchlab.prompt", prompt);
      clear();
      navigate("/chat", {
        state: { sessionId: uploaded.id, prompt, uploadId: uploaded.id, pdfName, title },
      });
    } catch (err) {
      setStatus(err.message || "Upload failed");
    } finally {
      setText("");
      setSending(false);
    }
  };

  return (
    <div className={`absolute bg-gradient-to-t bottom-0 content-stretch flex flex-col from-[#0b0d13] items-start px-[90px] transition-[left,right] duration-200 ease-out pt-[16px] pb-[20px] to-[rgba(11,13,19,0)] via-50% via-[rgba(11,13,19,0.95)] z-10 ${collapsed ? "left-[130px] right-[130px]" : "left-[260px] right-0"}`}>
      <div className="backdrop-blur-[12px] bg-[rgba(22,25,34,0.95)] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[4px] items-start p-[9px] relative rounded-[12px] shrink-0 w-full">
        <div className="absolute bg-[rgba(255,255,255,0)] inset-[-1px_-1px_-1.33px_-1px] rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-none" />

        {showDestination && (
          <div className="border-[#2a3044] border-b border-solid relative shrink-0 w-full">
            <div className="flex items-center pb-[10px] pt-[2px] px-[8px] relative size-full">
              <div className="relative shrink-0">
                <div className="flex gap-[4px] items-center relative size-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px] whitespace-nowrap">
                      <p className="leading-[23px]">Destination folder:</p>
                    </div>
                  </div>
                  <div className="bg-[#1b202e] content-stretch flex gap-[7px] items-center px-[7px] py-[3px] relative rounded-[4px] shrink-0">
                    <div className="h-[9.333px] relative shrink-0 w-[11.667px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-dest-folder.svg`} />
                    </div>
                    <div className="relative shrink-0">
                      <div className="flex flex-col font-inter font justify-center relative shrink-0 text-[#f8fafc] text-[13px] whitespace-nowrap">
                        <p className="leading-[18px]">{destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(file || error || status) && (
          <div className="relative shrink-0 w-full">
            <div className="flex flex-wrap items-center gap-[6px] px-[5px] pb-[2px] pt-[6px]">
              {file && <PdfChip file={file} onRemove={clear} />}
              {error && <span className="font-inter text-[12px] text-[#f87171]">{error}</span>}
              {!error && status && <span className="font-inter text-[12px] text-[#94a3b8]">{status}</span>}
            </div>
          </div>
        )}

        <div className="relative shrink-0 w-full">
          {showPdfWarning && (
            <div
              role="alert"
              className="absolute -top-[38px] right-[4px] bg-[#2a1b1b] border border-[#7f1d1d] border-solid flex items-center gap-[8px] px-[12px] py-[7px] rounded-[8px] shadow-[0px_10px_24px_-6px_rgba(0,0,0,0.5)] z-20 animate-[folder-popup-in_180ms_ease-out]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
                <path d="M7 1.5L13 12H1L7 1.5Z" stroke="#f87171" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M7 5.5V8.5" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="7" cy="10.3" r="0.7" fill="#f87171" />
              </svg>
              <span className="font-inter text-[13px] text-[#fca5a5] whitespace-nowrap">
                attach a PDF before starting!
              </span>
            </div>
          )}
          <div className="flex gap-[4px] items-center px-[4px] relative size-full">
            <button
              type="button"
              onClick={open}
              aria-label="Attach a PDF"
              className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#1b202e] transition-colors"
            >
              <div className="h-[16.667px] relative shrink-0 w-[10.417px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-attach.svg`} />
              </div>
            </button>
            <PdfFileInput inputRef={inputRef} onChange={onChange} />
            <div className="content-stretch flex flex-1 flex-col items-start min-w-px overflow-clip pb-[11px] pt-[10px] px-[12px] relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={placeholder}
                disabled={disabled}
                className="bg-transparent w-full font-inter font-normal text-[14px] text-[#f8fafc] placeholder:text-[#64748b] outline-none border-0 p-0"
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              className={`bg-[#4f46e5] relative rounded-[12px] shrink-0 size-[40px] cursor-pointer shadow-[0px_4px_6px_-1px_rgba(49,46,129,0.4),0px_2px_4px_-2px_rgba(49,46,129,0.4)] ${
                disabled || sending ? "opacity-40" : ""
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
