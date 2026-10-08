import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import Composer from "../components/Composer";

const A = "/assets";

const targetFolders = [
  { name: "All Papers", count: "14", active: false, gap: "gap-[40.9px]" },
  { name: "Thesis", count: "4", active: false, gap: "gap-[68.07px]" },
  { name: "ML Papers", count: "8", active: true, gap: "gap-[44.53px]" },
];

export default function Workspace() {
  return (
    <div
      className="content-stretch flex flex-col items-start pl-[260px] relative size-full min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(11, 13, 19) 0%, rgb(11, 13, 19) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="bg-[#0b0d13] content-stretch flex flex-col items-start pt-[64px] px-[24px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start pb-[128px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full">
            <div className="content-stretch flex items-center justify-between py-[12px] relative shrink-0 w-full">
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[16px] whitespace-nowrap">
                      <p className="leading-[24px]">Workspace</p>
                    </div>
                  </div>
                  <div className="h-[6.5px] relative shrink-0 w-[4.008px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-chevron.svg`} />
                  </div>
                  <button
                    type="button"
                    className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex gap-[2px] items-center px-[5px] py-[3px] relative rounded-[6px] shrink-0 cursor-pointer"
                  >
                    <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-folder.svg`} />
                    </div>
                    <div className="relative shrink-0">
                      <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#f8fafc] text-[16px] whitespace-nowrap">
                        <p className="leading-[24px]">ML Papers</p>
                      </div>
                    </div>
                    <div className="h-[2.917px] relative shrink-0 w-[5.833px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-caret.svg`} />
                    </div>
                  </button>
                  <div className="h-[6.5px] relative shrink-0 w-[4.008px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-chevron.svg`} />
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#f8fafc] text-[16px] whitespace-nowrap">
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

          <div className="content-stretch flex flex-col items-start min-h-[846px] px-[126px] relative shrink-0 w-full">
            <div className="content-stretch flex flex-col items-center justify-center max-w-[720px] min-h-[846px] py-[161px] relative shrink-0 w-full">
              <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full">
                <div className="h-[130px] relative shrink-0 w-full">
                  <div className="absolute content-stretch flex flex-col items-start left-[136.59px] pb-[4px] top-[68px]">
                    <div className="content-stretch flex flex-col items-center relative shrink-0">
                      <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#f8fafc] text-[28px] text-center tracking-[-0.7px] whitespace-nowrap">
                        <p className="leading-[36px]">Explore any research paper with AI</p>
                      </div>
                    </div>
                  </div>
                  <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%-0.01px)] px-[179.906px] top-[108px]">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#cbd5e1] text-[14px] text-center whitespace-nowrap">
                      <p className="leading-[22px]">Drop a paper (PDF) to generate a structured summary.</p>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col items-start left-[332px] pb-[12px] top-0">
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <div className="bg-[#1b202e] border border-[#2a3044] border-solid content-stretch flex items-center justify-center p-px relative rounded-[16px] shrink-0 size-[56px]">
                        <div className="absolute bg-[rgba(255,255,255,0)] left-[-1px] rounded-[16px] shadow-[0px_4px_6px_-1px_rgba(99,102,241,0.1),0px_2px_4px_-2px_rgba(99,102,241,0.1)] size-[56px] top-[-1px]" />
                        <div className="h-[24.375px] relative shrink-0 w-[27.5px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-hero-icon.svg`} />
                        </div>
                      </div>
                      <div className="absolute bg-[#6366f1] content-stretch flex items-center justify-center right-[-4px] rounded-[9999px] size-[20px] top-[-4px]">
                        <div className="h-[10.833px] relative shrink-0 w-[8.667px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-badge-spark.svg`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="content-stretch flex flex-col items-start pb-[32px] px-[20px] relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[12px] items-start max-w-[680px] relative shrink-0 w-full">
                  <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[4px] items-start p-[9px] relative rounded-[12px] shrink-0 w-full">
                    <div className="relative shrink-0 w-full">
                      <div className="flex items-center px-[4px] relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <div className="h-[12px] relative shrink-0 w-[15px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-save.svg`} />
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0">
                            <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#94a3b8] text-[16px] tracking-[0.8px] uppercase whitespace-nowrap">
                              <p className="leading-[24px]">Save research to folder</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-full">
                      <div className="flex gap-[4px] items-start relative size-full">
                        {targetFolders.map((f) => (
                          <button
                            key={f.name}
                            type="button"
                            className={`content-stretch flex items-center ${
                              f.gap
                            } items-center px-[9px] ${
                              f.active ? "py-[6px]" : "py-[5px]"
                            } relative rounded-[8px] shrink-0 cursor-pointer ${
                              f.active
                                ? "bg-[rgba(99,102,241,0.2)] border border-[#6366f1] border-solid shadow-[0px_1px_2px_0px_rgba(99,102,241,0.1)]"
                                : "bg-[#11141d] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="flex gap-[4px] items-center overflow-clip relative rounded-[inherit] size-full">
                                <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                                  <img
                                    alt=""
                                    className="absolute block inset-0 max-w-none size-full"
                                    src={f.active ? `${A}/ws-folder-active.svg` : `${A}/ws-folder-muted.svg`}
                                  />
                                </div>
                                <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0">
                                  <div
                                    className={`flex flex-col font-inter justify-center relative shrink-0 text-[13px] text-center tracking-[0.13px] whitespace-nowrap ${
                                      f.active ? "font-semibold text-white" : "font-medium text-[#cbd5e1]"
                                    }`}
                                  >
                                    <p className="leading-[16px]">{f.name}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`content-stretch flex flex-col items-center relative rounded-[4px] shrink-0 ${
                                f.active ? "bg-[#6366f1] p-[2px]" : "bg-[#1b202e] border border-[#2a3044] border-solid p-[3px]"
                              }`}
                            >
                              <div
                                className={`flex flex-col font-inter justify-center relative shrink-0 text-[13px] text-center whitespace-nowrap ${
                                  f.active ? "font-semibold text-white" : "font-normal text-[#94a3b8]"
                                }`}
                              >
                                <p className="leading-[18px]">{f.count}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="border border-[#2a3044] border-dashed content-stretch flex gap-[2px] items-center justify-center pl-[51.83px] pr-[51.84px] py-[9px] relative rounded-[8px] shrink-0 cursor-pointer"
                        >
                          <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-plus.svg`} />
                          </div>
                          <div className="relative shrink-0">
                            <div className="flex flex-col items-center relative size-full">
                              <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#94a3b8] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                                <p className="leading-[16px]">+ New</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col items-center justify-center p-[33px] relative rounded-[12px] shrink-0 w-full">
                    <div className="absolute bg-[rgba(255,255,255,0)] inset-[-1px] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] pointer-events-none" />
                    <div className="h-[76px] relative shrink-0 w-[64px]">
                      <div className="flex flex-col items-start pb-[12px] relative size-full">
                        <div className="border border-[#2a3044] border-solid content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[64px]">
                          <div aria-hidden className="absolute bg-[#1b202e] inset-0 pointer-events-none rounded-[9999px]" />
                          <div className="h-[21.333px] relative shrink-0 w-[29.333px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-upload-big.svg`} />
                          </div>
                          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <div className="flex flex-col items-start pb-[2px] relative size-full">
                        <div className="content-stretch flex flex-col items-center relative shrink-0">
                          <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#f8fafc] text-[18px] text-center tracking-[-0.18px] whitespace-nowrap">
                            <p className="leading-[26px]">Drag and drop your PDF here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <div className="flex flex-col items-start pb-[12px] relative size-full">
                        <div className="bg-[#11141d] border border-[#2a3044] border-solid content-stretch flex gap-[4px] items-center px-[9px] py-[3px] relative rounded-[9999px] shrink-0">
                          <div className="h-[9.333px] relative shrink-0 w-[11.667px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-target-folder.svg`} />
                          </div>
                          <div className="relative shrink-0">
                            <div className="flex flex-col items-center relative size-full">
                              <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#cbd5e1] text-[16px] text-center whitespace-nowrap">
                                <p className="leading-[24px]">
                                  Target folder:{" "}
                                  <span className="font-inter font-semibold leading-[24px] text-[#6366f1]">ML Papers</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="relative shrink-0">
                            <div className="flex flex-col items-center relative size-full">
                              <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#64748b] text-[16px] text-center whitespace-nowrap">
                                <p className="leading-[24px]">•</p>
                              </div>
                            </div>
                          </div>
                          <div className="relative shrink-0">
                            <div className="flex flex-col items-center relative size-full">
                              <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[16px] text-center whitespace-nowrap">
                                <p className="leading-[24px]">Supports single PDF up to 100MB</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bg-[#6366f1] relative rounded-[12px] shrink-0 cursor-pointer"
                    >
                      <div className="flex gap-[8px] items-center px-[24px] py-[8px] relative size-full">
                        <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0.38px_0_0] rounded-[12px] shadow-[0px_4px_6px_-1px_rgba(99,102,241,0.25),0px_2px_4px_-2px_rgba(99,102,241,0.25)]" />
                        <div className="h-[15px] relative shrink-0 w-[9.375px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-upload-arrow.svg`} />
                        </div>
                        <div className="content-stretch flex flex-col items-center relative shrink-0">
                          <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[13px] text-center text-white tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">Upload Document</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Composer />
      <TopNav />
      <Sidebar />
    </div>
  );
}
