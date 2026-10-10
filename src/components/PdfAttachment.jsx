import { useRef, useState } from "react";

const A = "/assets";

export function usePdfAttachment() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const open = () => inputRef.current?.click();

  const clear = () => {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const attach = (picked) => {
    if (!picked) return;
    setError("");
    setFile(picked);
  };

  const onChange = (e) => {
    const picked = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!picked) return;

    const isPdf = picked.type === "application/pdf" || /\.pdf$/i.test(picked.name);
    if (!isPdf) {
      setError("Only PDF files are allowed.");
      return;
    }
    attach(picked);
  };

  return { file, error, inputRef, open, onChange, clear, attach };
}

export function PdfFileInput({ inputRef, onChange }) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="hidden"
      onChange={onChange}
    />
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfChip({ file, onRemove }) {
  if (!file) return null;
  return (
    <div className="bg-[#1b202e] border border-[#2a3044] border-solid flex items-center gap-[9px] px-[8px] py-[5px] rounded-[8px] max-w-full">
      <img alt="" className="h-[12px] w-[9.5px] shrink-0" src={`${A}/pc-doc.svg`} />
      <span className="font-inter text-[13px] text-[#e2e8f0] truncate max-w-[320px]">
        {file.name}
      </span>
      <span className="font-mono text-[11px] text-[#64748b] shrink-0">{formatBytes(file.size)}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attached PDF"
        className="flex items-center justify-center shrink-0 size-[16px] rounded-[4px] cursor-pointer hover:bg-[#2a3044]"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 1L9 9M9 1L1 9" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
