import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import Composer from "../components/Composer";

const A = "/assets";

export default function Workspace() {
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
                  <button
                    type="button"
                    className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex gap-[7px] items-center px-[5px] py-[3px] relative rounded-[6px] shrink-0 cursor-pointer"
                  >
                    <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-folder.svg`} />
                    </div>
                    <div className="relative shrink-0">
                      <div className="flex flex-col font-inter font justify-center relative shrink-0 text-[#94a3b8] text-[13px] whitespace-nowrap">
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

      <Composer />
      <TopNav />
      <Sidebar />
    </div>
  );
}