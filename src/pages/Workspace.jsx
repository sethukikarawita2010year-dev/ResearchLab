import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { folders } from "../components/Sidebar";
import Composer from "../components/Composer";

const A = "/assets";

export default function Workspace() {
  const [selectedFolder, setSelectedFolder] = useState("ML Papers");
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const folderTriggerRef = useRef(null);
  const folderPopupRef = useRef(null);
  const folderRowsRef = useRef(null);
  const folderHighlightRef = useRef(null);
  const folderRowRefs = useRef({});

  useEffect(() => {
    if (!isFolderOpen) return undefined;

    const handleMouseDown = (e) => {
      if (folderPopupRef.current && folderPopupRef.current.contains(e.target)) return;
      if (folderTriggerRef.current && folderTriggerRef.current.contains(e.target)) return;
      setIsFolderOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFolderOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFolderOpen]);

  useLayoutEffect(() => {
    const popup = folderPopupRef.current;
    const rowsWrap = folderRowsRef.current;
    const highlight = folderHighlightRef.current;
    if (!popup || !rowsWrap || !highlight) return;

    const selectedRow = folderRowRefs.current[selectedFolder];
    if (selectedRow) {
      highlight.style.height = `${selectedRow.offsetHeight}px`;
      highlight.style.transform = `translateY(${selectedRow.offsetTop}px)`;
    }

    if (folders.length > 5) {
      popup.style.width = "";
      rowsWrap.style.maxHeight = "";
      const naturalWidth = rowsWrap.offsetWidth;

      const firstRow = folderRowRefs.current[folders[0].name];
      const fifthRow = folderRowRefs.current[folders[4].name];
      if (firstRow && fifthRow) {
        rowsWrap.style.maxHeight = `${fifthRow.offsetTop + fifthRow.offsetHeight - firstRow.offsetTop}px`;
      }

      const scrollbar = rowsWrap.offsetWidth - rowsWrap.clientWidth;
      popup.style.width = `${naturalWidth + scrollbar + 10}px`;
    } else {
      popup.style.width = "";
      rowsWrap.style.maxHeight = "";
    }
  }, [selectedFolder, isFolderOpen]);

  return (
    <div
      className="content-stretch flex flex-col items-start pl-[260px] relative w-full h-screen overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(11, 13, 19) 0%, rgb(11, 13, 19) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="bg-[#0b0d13] content-stretch flex flex-col items-start pt-[64px] px-[24px] relative flex-1 min-h-0 w-full">
        <div className="content-stretch flex flex-col items-start pb-[128px] relative flex-1 min-h-0 w-full">
          <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full">
            <div className="content-stretch flex items-center justify-between py-[12px] relative shrink-0 w-full">
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[16px] whitespace-nowrap">
                      <p className="leading-[34px]">Workspace</p>
                    </div>
                  </div>
                  <div className="h-[6.5px] relative shrink-0 w-[4.008px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-chevron.svg`} />
                  </div>
                  <div className="relative shrink-0" ref={folderTriggerRef}>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isFolderOpen}
                      onClick={() => setIsFolderOpen((v) => !v)}
                      className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex gap-[7px] items-center px-[5px] py-[3px] relative rounded-[6px] shrink-0 cursor-pointer"
                    >
                      <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-folder.svg`} />
                      </div>
                      <div className="relative shrink-0">
                        <div className="flex flex-col font-inter font justify-center relative shrink-0 text-[#94a3b8] text-[13px] whitespace-nowrap">
                          <p className="leading-[24px]">{selectedFolder}</p>
                        </div>
                      </div>
                    </button>

                    <div
                      ref={folderPopupRef}
                      role="listbox"
                      aria-hidden={!isFolderOpen}
                      className={`absolute backdrop-blur-[12px] bg-[rgba(22,25,34,0.95)] border border-[#2a3044] border-solid flex flex-col items-start left-0 min-w-full mt-[6px] origin-top p-[4px] rounded-[8px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] top-full transition-[opacity,transform] duration-200 ease-out w-max z-50 ${
                        isFolderOpen
                          ? "animate-[folder-popup-in_180ms_ease-out] opacity-100 pointer-events-auto [transform:translateY(0)_scaleY(1)]"
                          : "opacity-0 pointer-events-none [transform:translateY(-6px)_scaleY(0.65)]"
                      }`}
                    >
                      <div
                        ref={folderRowsRef}
                        className="content-stretch flex flex-col gap-[2px] items-start overflow-y-auto relative w-full"
                      >
                        <div
                          ref={folderHighlightRef}
                          aria-hidden="true"
                          className="absolute bg-[#1b202e] left-0 pointer-events-none right-0 rounded-[8px] top-0 transition-[transform,height] duration-200 ease-out"
                        />
                        {folders.map((f) => {
                          const isSelected = f.name === selectedFolder;
                          return (
                            <button
                              key={f.name}
                              ref={(el) => {
                                folderRowRefs.current[f.name] = el;
                              }}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              disabled={!isFolderOpen}
                              onClick={() => setSelectedFolder(f.name)}
                              className={`content-stretch flex gap-[20px] items-center justify-between px-[8px] py-[4px] relative rounded-[8px] shrink-0 w-full cursor-pointer ${
                                isSelected ? "" : "hover:bg-[#161922]"
                              }`}
                            >
                              <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0">
                                <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                                  <img
                                    alt=""
                                    className="absolute block inset-0 max-w-none size-full"
                                    src={isSelected ? `${A}/ws-folder-active.svg` : `${A}/ws-folder-white.svg`}
                                  />
                                </div>
                                <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0">
                                  <div
                                    className={`flex flex-col font-inter font-normal justify-center relative shrink-0 text-[13px] text-center whitespace-nowrap ${
                                      f.muted ? "text-[#94a3b8]" : "text-[#cbd5e1]"
                                    }`}
                                  >
                                    <p className="leading-[18px]">{f.name}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-[#1b202e] border border-[#2a3044] border-solid content-stretch flex flex-col items-center px-[5px] py-[3px] relative rounded-[4px] shrink-0">
                                <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px] text-center whitespace-nowrap">
                                  <p className="leading-[18px]">{f.count}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="h-[6.5px] relative shrink-0 w-[4.008px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-chevron.svg`} />
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font justify-center relative shrink-0 text-[#94a3b8] text-[16px] whitespace-nowrap">
                      <p className="leading-[24px]">New research session</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="relative rounded-[8px] shrink-0 size-[8px]" />
                <div className="relative rounded-[8px] shrink-0 size-[8px]" />
              </div>
            </div>
          </div>

          <div className="content-stretch flex flex-col items-center justify-center flex-1 min-h-0 px-[126px] relative w-full">
            <div className="content-stretch flex flex-col items-center justify-center max-w-[720px] relative shrink-0 w-full scale-[0.8] origin-center">
              <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-col items-center relative shrink-0">
                  <div className="content-stretch flex flex-col items-center relative shrink-0 scale-[3] origin-center mb-[106px]">
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <div className="bg-[#1b202e] border border-[#2a3044] border-solid content-stretch flex items-center justify-center p-px relative rounded-[16px] shrink-0 size-[56px] shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_0_48px_8px_rgba(99,102,241,0.15)]">
                        <div className="absolute bg-[rgba(255,255,255,0)] left-[-1px] rounded-[16px] shadow-[0px_4px_6px_-1px_rgba(99,102,241,0.1),0px_2px_4px_-2px_rgba(99,102,241,0.1)] size-[56px] top-[-1px]" />
                        <div className="h-[24.375px] relative shrink-0 w-[27.5px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-hero-icon.svg`} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center relative shrink-0 mb-[4px]">
                    <div className="flex flex-col font-inter font-semibold justify-center relative scale-[1.1] shrink-0 text-[#f8fafc] text-[28px] text-center tracking-[-0.7px] whitespace-nowrap">
                      <p className="leading-[36px]">Explore any research paper with AI</p>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center relative shrink-0">
                    <div className="flex flex-col font-inter font-light justify-center relative scale-[1.1] shrink-0 text-[#cbd5e1] text-[16px] text-center whitespace-nowrap">
                      <p className="leading-[35px]">Drop a paper (PDF) to generate a structured summary.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Composer destination={selectedFolder} />
    </div>
  );
}