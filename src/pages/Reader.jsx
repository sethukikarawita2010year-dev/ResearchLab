import { useState } from "react";

const A = "/assets";
const imgContainer = "/assets/rv-imgContainer.svg";
const imgContainer1 = "/assets/rv-imgContainer1.svg";
const imgContainer2 = "/assets/rv-imgContainer2.svg";
const imgContainer3 = "/assets/rv-imgContainer3.svg";
const imgContainer4 = "/assets/rv-imgContainer4.svg";
const imgContainer5 = "/assets/rv-imgContainer5.svg";
const imgContainer6 = "/assets/rv-imgContainer6.svg";
const imgContainer7 = "/assets/rv-imgContainer7.svg";
const imgContainer8 = "/assets/rv-imgContainer8.svg";
const imgContainer9 = "/assets/rv-imgContainer9.svg";
const imgContainer10 = "/assets/rv-imgContainer10.svg";
const imgContainer11 = "/assets/rv-imgContainer11.svg";
const imgContainer12 = "/assets/rv-imgContainer12.svg";
const imgContainer13 = "/assets/rv-imgContainer13.svg";
const imgContainer14 = "/assets/rv-imgContainer14.svg";
const imgSvg = "/assets/rv-imgSvg.svg";
const imgContainer15 = "/assets/rv-imgContainer15.svg";
const imgContainer16 = "/assets/rv-imgContainer16.svg";
const imgButton = "/assets/rv-imgButton.svg";
const imgContainer17 = "/assets/rv-imgContainer17.svg";
const imgContainer18 = "/assets/rv-imgContainer18.svg";
const imgContainer19 = "/assets/rv-imgContainer19.svg";

export default function Reader() {
  const [page, setPage] = useState(4);
  const [zoom, setZoom] = useState(100);
  const [splitView, setSplitView] = useState(true);

  const totalPages = 15;

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 10));

  return (
    <div
      className="content-stretch flex flex-col items-start pl-[260px] relative size-full min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(11, 13, 19) 0%, rgb(11, 13, 19) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="bg-[#0b0d13] content-stretch flex flex-col items-start pt-[64px] px-[24px] relative shrink-0 w-full min-h-screen">
        <div className="content-stretch flex flex-col h-[960px] items-start overflow-clip relative shrink-0 w-full">
          <div className="bg-[#11141d] border-[#1e2230] border-b border-solid content-stretch flex items-center justify-between pb-[5px] pt-[4px] px-[12px] relative shrink-0 w-full">
            <div className="relative shrink-0">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0">
                  <div className="[word-break:break-word] flex flex-col font-inter font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[11px] tracking-[0.33px] whitespace-nowrap">
                    <p className="leading-[14px]">|</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0">
                  <div className="[word-break:break-word] flex flex-col font-mono font-normal justify-center leading-[0] relative shrink-0 text-[#cbd5e1] text-[13px] whitespace-nowrap">
                    <p className="leading-[20px]">Vaswani_et_al_2017.pdf</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="bg-[#161922] border border-[#262c3e] border-solid relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#1a1e2b]"
              onClick={() => setSplitView(!splitView)}
            >
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[2px] items-center px-[9px] py-[5px] relative size-full">
                <div className="relative shrink-0 size-[13.333px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer} />
                </div>
                <div className="relative shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
                    <div className="[word-break:break-word] flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                      <p className="leading-[16px]">Close Split View</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex-[1_0_0] min-h-px relative w-full">
            {splitView && (
              <div className="absolute bg-[#0f1117] bottom-0 content-stretch flex flex-col items-start left-0 min-w-[380px] overflow-clip right-1/2 top-0">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-h-px overflow-auto p-[12px] relative w-full">
                  <div className="bg-[#161922] border border-[#202535] border-solid content-stretch flex flex-col gap-[3.2px] items-start overflow-clip p-[13px] relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full">
                    <div className="relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-between relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <div className="relative shrink-0 size-[16.5px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer1} />
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0">
                            <div className="[word-break:break-word] flex flex-col font-inter font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#f1f5f9] text-[18px] tracking-[-0.18px] whitespace-nowrap">
                              <p className="leading-[26px]">Document Synthesis Brief</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#202535] content-stretch flex flex-col items-start px-[4px] py-[2px] relative rounded-[9999px] shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] whitespace-nowrap">
                            <p className="leading-[24px]">Synthesized 2m ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                        <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[13px] w-full">
                          <p className="mb-0">
                            <span className="leading-[21.13px]">{`Foundational architecture proposing the `}</span>
                            <span className="[word-break:break-word] font-inter font-medium leading-[21.13px] not-italic text-[#f1f5f9]">Transformer</span>
                            <span className="leading-[21.13px]">{` based entirely on`}</span>
                          </p>
                          <p className="leading-[21.13px] mb-0">attention mechanisms, discarding recurrent and convolutional</p>
                          <p className="leading-[21.13px] mb-0">recurrence. Key focus: Scaled Dot-Product, Multi-Head Attention, and</p>
                          <p className="leading-[21.13px]">constant $O(1)$ sequential operations.</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center pt-[4.8px] relative size-full">
                        <div className="bg-[rgba(30,27,75,0.6)] border border-[rgba(67,56,202,0.5)] border-solid content-stretch flex flex-col items-start pl-[5px] pr-[46.5px] py-[5px] relative rounded-[4px] shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#a5b4fc] text-[16px] whitespace-nowrap">
                            <p className="leading-[24px] mb-0">§ 3.2</p>
                            <p className="leading-[24px]">Attention</p>
                          </div>
                        </div>
                        <div className="bg-[#202535] content-stretch flex flex-col items-start pl-[4px] pr-[60.24px] py-[4px] relative rounded-[4px] shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] whitespace-nowrap">
                            <p className="leading-[24px] mb-0">Table 1 · BLEU</p>
                            <p className="leading-[24px]">Scores</p>
                          </div>
                        </div>
                        <div className="bg-[#202535] content-stretch flex flex-col items-start pl-[4px] pr-[45.47px] py-[4px] relative rounded-[4px] shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[16px] whitespace-nowrap">
                            <p className="leading-[24px] mb-0">§ 5.4</p>
                            <p className="leading-[24px]">Complexity</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-start justify-end pb-[4px] relative shrink-0 w-full">
                    <div className="bg-[#4f46e5] content-stretch flex flex-col gap-[4px] items-start max-w-[392.70001220703125px] px-[12px] py-[8px] relative rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] self-stretch shrink-0">
                      <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0.34px_0_0] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" />
                      <div className="[word-break:break-word] font-normal leading-[0] relative shrink-0 w-full">
                        <div className="-translate-y-1/2 absolute flex flex-col font-inter justify-center left-0 not-italic text-[14px] text-white top-[10.5px]">
                          <p className="leading-[22px]">{`Why does Transformer scale the dot product by `}</p>
                        </div>
                        <div className="absolute bg-[rgba(55,48,163,0.6)] font-mono h-[43px] left-0 rounded-[4px] text-[#e0e7ff] text-[13px] top-px w-[339.86px]">
                          <div className="-translate-y-1/2 absolute flex flex-col justify-center left-[324.25px] top-[10.5px]">
                            <p className="leading-[20px]">1/</p>
                          </div>
                          <div className="-translate-y-1/2 absolute flex flex-col justify-center left-0 top-[32.5px]">
                            <p className="leading-[20px]">√d_k</p>
                          </div>
                        </div>
                        <div className="-translate-y-1/2 absolute flex flex-col font-inter justify-center left-[34.55px] not-italic text-[14px] text-white top-[32.5px]">
                          <p className="leading-[22px]">{` instead of using regular dot product attention?`}</p>
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0 w-full mt-[44px]">
                        <div className="content-stretch flex flex-col items-start relative shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#c7d2fe] text-[16px] whitespace-nowrap">
                            <p className="leading-[24px]">Today 11:24 AM</p>
                          </div>
                        </div>
                        <div className="h-[6.514px] relative shrink-0 w-[11.863px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer2} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#161922] border border-[#222738] border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-[8px] items-start p-[13px] relative rounded-bl-[12px] rounded-br-[12px] rounded-tr-[12px] shrink-0 w-full">
                    <div className="h-[68.25px] relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                        <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-inter font-normal justify-center leading-[0] left-0 not-italic text-[#e2e8f0] text-[14px] top-[10.5px] whitespace-nowrap">
                          <p className="leading-[22.75px]">{`Vaswani et al. explain that while for small values of `}</p>
                        </div>
                        <div className="absolute bg-[#1f2434] content-stretch flex items-start left-[338.73px] px-[4px] py-[0.5px] rounded-[4px] top-px">
                          <div className="[word-break:break-word] flex flex-col font-mono font-normal justify-center leading-[0] relative shrink-0 text-[#a5b4fc] text-[13px] whitespace-nowrap">
                            <p className="leading-[20px]">d_k</p>
                          </div>
                        </div>
                        <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-inter font-normal justify-center leading-[0] left-[370.14px] not-italic text-[#e2e8f0] text-[14px] top-[10.5px] whitespace-nowrap">
                          <p className="leading-[22.75px]">{` additive`}</p>
                        </div>
                        <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-inter font-normal justify-center leading-[0] left-0 not-italic text-[#e2e8f0] text-[14px] top-[44.63px] whitespace-nowrap">
                          <p className="leading-[22.75px] mb-0">and dot-product attention perform similarly, standard dot-product</p>
                          <p className="leading-[22.75px]">attention degrades significantly as the dimension scales up.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#11141d] border border-[#202536] border-solid relative rounded-[8px] shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[9px] relative size-full">
                        <div className="relative shrink-0 w-full">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                            <div className="[word-break:break-word] flex flex-col font-inter font-normal italic justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[13px] w-full">
                              <p className="leading-[18px] mb-0">{`"We suspect that for large values of d_k, the dot products grow`}</p>
                              <p className="leading-[18px] mb-0">large in magnitude, pushing the softmax function into regions where</p>
                              <p className="leading-[18px]">{`it has extremely small gradients."`}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[rgba(30,27,75,0.4)] border border-[rgba(99,102,241,0.3)] border-solid relative rounded-[8px] shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between p-[5px] relative size-full">
                        <div className="relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
                            <div className="bg-[#4f46e5] content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start px-[4px] py-[2px] relative rounded-[9999px] shrink-0">
                              <div className="[word-break:break-word] flex flex-col font-inter font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">
                                <p className="leading-[24px]">1</p>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0">
                              <div className="[word-break:break-word] flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#e2e8f0] text-[13px] whitespace-nowrap">
                                <p className="leading-[18px]">Scaled Dot-Product Attention · p. 4</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative shrink-0">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[2px] items-center relative size-full">
                            <div className="content-stretch flex flex-col items-start relative shrink-0">
                              <div className="[word-break:break-word] flex flex-col font-inter font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#818cf8] text-[16px] whitespace-nowrap">
                                <p className="leading-[24px]">Active in Viewer</p>
                              </div>
                            </div>
                            <div className="relative shrink-0 size-[9.333px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer3} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#161922] border-[#1e2230] border-solid border-t content-stretch flex flex-col items-start pb-[12px] pt-[9px] px-[8px] relative shrink-0 w-full">
                  <div className="bg-[#10131a] border border-[#232839] border-solid relative rounded-[12px] shrink-0 w-full">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center px-[9px] py-[7px] relative size-full">
                      <div className="relative rounded-[8px] shrink-0 cursor-pointer">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[10px] pt-[4px] px-[4px] relative size-full">
                          <div className="h-[16.667px] relative shrink-0 w-[10.417px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer4} />
                          </div>
                        </div>
                      </div>
                      <div className="border-0 border-[#6b7280] border-solid flex-[1_0_0] min-w-px relative">
                        <input
                          type="text"
                          placeholder="Ask about this citation or paper..."
                          className="bg-transparent w-full font-inter text-[13px] text-[#f8fafc] placeholder:text-[#64748b] outline-none border-0 py-[9px] px-[12px]"
                        />
                      </div>
                      <div className="bg-[#4f46e5] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0 size-[32px] cursor-pointer">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
                          <div className="relative shrink-0 size-[12px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className={`absolute bg-[#0b0d13] content-stretch flex flex-col ${splitView ? "inset-[0_0_0_494px]" : "inset-0"} items-start min-w-[420px] overflow-clip`}>
              <div className="bg-[#161922] border-[#2a3044] border-b border-solid content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex h-[48px] items-center justify-between pb-px pl-[12px] pr-[4.26px] relative shrink-0 w-full">
                <div className="bg-[#1f2434] border border-[#2c3347] border-solid relative rounded-[6px] shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pl-[9px] pr-[17px] py-[5px] relative size-full">
                    <div className="max-w-[180px] relative shrink-0">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start max-w-[inherit] overflow-clip relative rounded-[inherit] size-full">
                        <div className="[word-break:break-word] flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#e2e8f0] text-[13px] whitespace-nowrap">
                          <p className="leading-[18px]">Attention_Vaswani_2017.pdf</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#11141d] border border-[#222738] border-solid relative rounded-[8px] shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center px-[5px] py-[3px] relative size-full">
                    <button type="button" className="relative rounded-[4px] shrink-0 cursor-pointer hover:bg-[#161922]" onClick={handlePrev}>
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[10px] pt-[4px] px-[4px] relative size-full">
                        <div className="h-[9px] relative shrink-0 w-[5.55px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer6} />
                        </div>
                      </div>
                    </button>
                    <div className="relative shrink-0">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[4px] relative size-full">
                        <div className="content-stretch flex flex-col items-start relative shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#818cf8] text-[13px] tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">{page}</p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start px-[4px] relative shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[13px] tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">/</p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0">
                          <div className="[word-break:break-word] flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[13px] tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">{totalPages}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="relative rounded-[4px] shrink-0 cursor-pointer hover:bg-[#161922]" onClick={handleNext}>
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[10px] pt-[4px] px-[4px] relative size-full">
                        <div className="h-[9px] relative shrink-0 w-[5.55px]">
                          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer7} />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">
                    <div className="bg-[#11141d] border border-[#222738] border-solid content-stretch flex items-center p-[3px] relative rounded-[8px] shrink-0">
                      <button type="button" className="relative rounded-[4px] shrink-0 cursor-pointer hover:bg-[#161922]" onClick={handleZoomOut}>
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[10px] pt-[6px] px-[4px] relative size-full">
                          <div className="h-[1.333px] relative shrink-0 w-[9.333px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer8} />
                          </div>
                        </div>
                      </button>
                      <div className="relative shrink-0">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[6px] relative size-full">
                          <div className="[word-break:break-word] flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#e2e8f0] text-[11px] tracking-[0.33px] whitespace-nowrap">
                            <p className="leading-[14px]">{zoom}%</p>
                          </div>
                        </div>
                      </div>
                      <button type="button" className="relative rounded-[4px] shrink-0 cursor-pointer hover:bg-[#161922]" onClick={handleZoomIn}>
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[10px] pt-[6px] px-[4px] relative size-full">
                          <div className="relative shrink-0 size-[9.333px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer9} />
                          </div>
                        </div>
                      </button>
                    </div>
                    <div className="content-stretch flex flex-col items-center justify-center pb-[12px] pt-[6px] px-[6px] relative rounded-[8px] shrink-0 cursor-pointer hover:bg-[#161922]">
                      <div className="h-[12px] relative shrink-0 w-[15px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer10} />
                      </div>
                    </div>
                    <div className="relative rounded-[8px] shrink-0 size-[12px] cursor-pointer hover:bg-[#161922]" />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-[1_0_0] items-start min-h-px overflow-clip relative w-full">
                <div className="bg-[#0b0d13] content-stretch flex flex-[1_0_0] h-full items-start justify-center min-w-px p-[16px] relative">
                  <div
                    className="bg-[#181b26] border border-[#2a3044] border-solid flex-[1_0_0] h-[960px] max-w-[720px] min-h-[960px] min-w-px relative rounded-[6px]"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                  >
                    <div className="absolute bg-[rgba(255,255,255,0)] inset-[-1px] rounded-[6px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" />
                    <div className="absolute border-[#2a3044] border-b border-solid content-stretch flex items-center justify-between left-[32px] pb-[9px] right-[32px] top-[32px]">
                      <div className="relative shrink-0">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                          <div className="[word-break:break-word] flex flex-col font-serif-lib justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.5px] uppercase whitespace-nowrap">
                            <p className="leading-[15px]">ATTENTION IS ALL YOU NEED</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative shrink-0">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                          <div className="[word-break:break-word] flex flex-col font-serif-lib justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.5px] uppercase whitespace-nowrap">
                            <p className="leading-[15px]">PAGE {page}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {page === 4 && (
                      <div className="absolute content-stretch flex flex-col gap-[3.375px] items-start left-[32px] right-[32px] top-[72px]">
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="[word-break:break-word] flex flex-col font-inter font-bold justify-center leading-[0] not-italic relative shrink-0 text-[22px] text-white tracking-[-0.55px] w-full">
                            <p className="leading-[30px]">3.2 Attention</p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[13px] w-full">
                            <p className="leading-[21.13px] mb-0">An attention function can be described as mapping</p>
                            <p className="leading-[21.13px] mb-0">a query and a set of key-value pairs to an output,</p>
                            <p className="leading-[21.13px] mb-0">where the query, keys, values, and output are all</p>
                            <p className="leading-[21.13px] mb-0">vectors. The output is computed as a weighted sum</p>
                            <p className="leading-[21.13px] mb-0">of the values, where the weight assigned to each</p>
                            <p className="leading-[21.13px] mb-0">value is computed by a compatibility function of the</p>
                            <p className="leading-[21.13px]">query with the corresponding key.</p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col gap-[4px] items-start w-full mt-[40px]">
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                            <div className="[word-break:break-word] flex flex-col font-inter font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white tracking-[-0.18px] w-full">
                              <p className="leading-[26px]">3.2.1 Scaled Dot-Product Attention</p>
                            </div>
                          </div>
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[13px] w-full mt-[8px]">
                            <p className="leading-[21.13px] mb-0">We call our particular attention "Scaled Dot-Product</p>
                            <p className="leading-[21.13px] mb-0">Attention" (Figure 2). The input consists of queries</p>
                            <p className="leading-[21.13px] mb-0">and keys of dimension <span className="font-mono text-[#a5b4fc]">d_k</span>, and values of</p>
                            <p className="leading-[21.13px] mb-0">dimension <span className="font-mono text-[#a5b4fc]">d_v</span>. We compute the dot products of</p>
                            <p className="leading-[21.13px] mb-0">the query with all keys, divide each by <span className="font-mono text-[#a5b4fc]">√d_k</span>, and</p>
                            <p className="leading-[21.13px]">apply a softmax function to obtain the weights on</p>
                            <p className="leading-[21.13px]">the values.</p>
                          </div>
                        </div>
                        <div className="bg-[#11141e] border border-[#262c3e] border-solid content-stretch flex flex-col items-center justify-center left-[32px] px-[17px] py-[13px] right-[32px] rounded-[8px] mt-[20px]">
                          <div className="h-[85px] relative shrink-0 w-[290px]">
                            <div className="font-serif-lib text-[#f1f5f9] text-[17px] leading-[25.5px] tracking-[0.425px] text-center">
                              <p>Attention(Q,K,V) = softmax( (QK<sup>T</sup>)/√d<sub>k</sub> ) V</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {page !== 4 && (
                      <div className="absolute content-stretch flex flex-col items-start left-[32px] right-[32px] top-[72px]">
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="[word-break:break-word] flex flex-col font-inter font-bold justify-center leading-[0] not-italic relative shrink-0 text-[22px] text-white tracking-[-0.55px] w-full">
                            <p className="leading-[30px]">Attention Is All You Need - Page {page}</p>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full mt-[12px]">
                          <div className="[word-break:break-word] flex flex-col font-inter font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[13px] w-full">
                            <p className="leading-[21.13px] mb-0">This is a preview of page {page}. The full content</p>
                            <p className="leading-[21.13px]">would be displayed here in the actual PDF viewer.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-[24px] content-stretch flex flex-col items-center left-[48px] right-[48px]">
                      <div className="[word-break:break-word] flex flex-col font-serif-lib justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] text-center whitespace-nowrap">
                        <p className="leading-[15px] mb-0">4 • 31st Conference on Neural Information Processing Systems (NIPS</p>
                        <p className="leading-[15px]">2017), Long Beach, CA, USA.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#11141d] border-[#1e2230] border-l border-solid h-full overflow-auto relative shrink-0 w-[56px]">
                  <div className="absolute content-stretch flex flex-col items-start left-[9.95px] pb-[4px] top-[8px]">
                    <div className="[word-break:break-word] flex flex-col font-inter font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[10px] tracking-[0.5px] uppercase whitespace-nowrap">
                      <p className="leading-[15px]">PAGES</p>
                    </div>
                  </div>
                  {[1,2,3,4,5,6].map((p) => (
                    <div key={p} className="absolute content-stretch flex flex-col items-start left-[9.5px] pt-[8px]" style={{ top: p === 1 ? 27 : p === 2 ? 100 : p === 3 ? 173 : p === 4 ? 246 : p === 5 ? 319 : 392 }}>
                      <div className="content-stretch flex flex-col items-center relative shrink-0">
                        <button
                          type="button"
                          className={`bg-[#181b26] border border-[#2a3044] border-solid content-stretch flex flex-col h-[48px] items-start overflow-clip p-[5px] relative rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-[36px] cursor-pointer ${p === page ? "bg-[#1e2233] border-[#6366f1] shadow-[0px_0px_0px_2px_rgba(99,102,241,0.7),0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" : ""}`}
                          onClick={() => setPage(p)}
                        >
                          <div className="h-[4px] relative shrink-0 w-full mb-[2px]">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[2px] relative size-full">
                              <div className={`${p === page ? "bg-[#64748b]" : "bg-[#334155]"} h-[2px] relative rounded-[2px] shrink-0 w-full`} />
                            </div>
                          </div>
                          <div className="h-[10px] relative shrink-0 w-full mb-[2px]">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[2px] relative size-full">
                              <div className={`${p === 4 && page === 4 ? "bg-[rgba(99,102,241,0.4)]" : p === page ? "bg-[#475569]" : "bg-[#334155]"} h-[8px] relative rounded-[2px] shrink-0 w-full`} />
                            </div>
                          </div>
                          <div className="h-[4px] relative shrink-0 w-[19.5px] mb-[2px]">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[2px] relative size-full">
                              <div className={`${p === page ? "bg-[#475569]" : "bg-[#334155]"} h-[2px] relative rounded-[2px] shrink-0 w-full`} />
                            </div>
                          </div>
                        </button>
                        <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0">
                          <div className={`[word-break:break-word] flex flex-col font-inter ${p === page ? "font-bold text-[#818cf8]" : "font-normal text-[#94a3b8]"} justify-center leading-[0] not-italic relative shrink-0 text-[10px] whitespace-nowrap`}>
                            <p className="leading-[15px]">{p}</p>
                          </div>
                        </div>
                        {p === 4 && page === 4 && (
                          <div className="absolute bg-[#6366f1] content-stretch flex items-center justify-center pb-[1.5px] right-[-4px] rounded-[9999px] size-[10px] top-[-4px]">
                            <div className="[word-break:break-word] flex flex-col font-inter font-bold justify-center leading-[0] not-italic relative shrink-0 text-[7px] text-center text-white whitespace-nowrap">
                              <p className="leading-[10.5px]">1</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute bg-[#11141d] border-[#1e2230] border-l border-r border-solid bottom-0 content-stretch flex items-center justify-center left-[486px] px-px top-0 w-[8px]">
              <div className="bg-[#475569] h-[32px] relative rounded-[9999px] shrink-0 w-[4px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}