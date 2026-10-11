import { useEffect } from "react";

const TONES = {
  error: {
    box: "bg-[rgba(42,27,27,0.96)] border-[#7f1d1d]",
    text: "text-[#fecaca]",
    stroke: "#f87171",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v5" />
        <path d="M12 16.5h.01" />
      </>
    ),
  },
  success: {
    box: "bg-[rgba(16,33,26,0.96)] border-[#166534]",
    text: "text-[#bbf7d0]",
    stroke: "#34d399",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </>
    ),
  },
};

export default function Toast({ message, type = "error", duration = 3000, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;
  const tone = TONES[type] || TONES.error;

  return (
    <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-[200] w-max max-w-[calc(100vw-48px)] pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`backdrop-blur-[12px] border border-solid flex items-center gap-[8px] px-[14px] py-[9px] rounded-[10px] shadow-[0px_10px_24px_-6px_rgba(0,0,0,0.5)] animate-[rl-toast-in_220ms_ease-out] ${tone.box}`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={tone.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {tone.path}
        </svg>
        <span className={`font-inter font-medium text-[13px] leading-[18px] whitespace-nowrap ${tone.text}`}>
          {message}
        </span>
      </div>
    </div>
  );
}
