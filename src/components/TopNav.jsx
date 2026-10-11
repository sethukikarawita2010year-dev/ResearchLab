import { forwardRef, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePdfSlide } from "./PdfSlide";
import { useSidebar } from "./sidebarContext";
import { useAuth } from "./AuthProvider";
import Avatar from "./Avatar";

const A = "/assets";

const Tab = forwardRef(function Tab({ label, active, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="relative z-[1] shrink-0 cursor-pointer rounded-[8px]"
    >
      <div className="flex flex-col items-start px-[12px] py-[4px] relative size-full">
        <div
          className={`flex flex-col font-inter justify-center relative shrink-0 text-[13px] whitespace-nowrap ${
            active ? "font-medium text-white" : "font-normal text-[#cbd5e1]"
          }`}
        >
          <p className="leading-[18px]">{label}</p>
        </div>
      </div>
    </button>
  );
});

export default function TopNav() {
  const { isOpen, open, close } = usePdfSlide();
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tabsRef = useRef(null);
  const pillRef = useRef(null);
  const workspaceRef = useRef(null);
  const pdfRef = useRef(null);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    const target = isOpen ? pdfRef.current : workspaceRef.current;
    if (!pill || !target) return;
    pill.style.width = `${target.offsetWidth}px`;
    pill.style.transform = `translateX(${target.offsetLeft}px)`;
  }, [isOpen]);

  return (
    <div
      className={`absolute backdrop-blur-[12px] bg-[rgba(11,13,19,0.85)] border-[#1e2230] border-b border-solid flex flex-col h-[65px] items-start pb-px right-0 top-0 z-20 ${
        collapsed ? "left-[260px]" : "left-[260px]"
      }`}
    >
      <div className="h-[64px] relative shrink-0 w-full">
        <div className="flex items-center justify-between px-[24px] relative size-full">
          <div className="bg-[#161922] border border-[#2a3044] border-solid flex items-center p-[5px] relative rounded-[12px] shrink-0">
            <div ref={tabsRef} className="relative flex gap-[4px] items-center">
              <div
                ref={pillRef}
                aria-hidden="true"
                className="absolute bottom-0 left-0 top-0 bg-[#6366f1] rounded-[8px] drop-shadow-[0px_1px_1px_rgba(99,102,241,0.2)] transition-[transform,width] duration-200 ease-out"
              />
              <Tab
                ref={workspaceRef}
                label="Workspace"
                active={!isOpen}
                onClick={() => (isOpen ? close() : navigate("/library"))}
              />
              <Tab
                ref={pdfRef}
                label="PDF Converter"
                active={isOpen}
                onClick={() => (isOpen ? undefined : open())}
              />
            </div>
          </div>

          <div className="content-stretch flex isolate items-center relative shrink-0">
            <div className="h-[13.5px] mr-[-14px] relative shrink-0 w-[21.5px] z-[2]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-bell.svg`} />
            </div>
            <div className="z-[1]">
              <Avatar user={user} size={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
