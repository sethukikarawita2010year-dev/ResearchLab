const A = "/assets";

export default function TopNav() {
  return (
    <div className="absolute backdrop-blur-[12px] bg-[rgba(11,13,19,0.85)] border-[#1e2230] border-b border-solid flex flex-col h-[65px] items-start left-[260px] pb-px right-0 top-0 z-20">
      <div className="h-[64px] relative shrink-0 w-full">
        <div className="flex items-center justify-between px-[24px] relative size-full">
          <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex gap-[4px] items-center p-[5px] relative rounded-[12px] shrink-0">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="bg-[#6366f1] relative rounded-[8px] shrink-0"
            >
              <div className="flex flex-col items-start px-[12px] py-[4px] relative size-full">
                <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[13px] text-white whitespace-nowrap">
                  <p className="leading-[18px]">Workspace</p>
                </div>
              </div>
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="relative shrink-0"
            >
              <div className="flex flex-col items-start px-[12px] py-[4px] relative size-full">
                <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#cbd5e1] text-[13px] whitespace-nowrap">
                  <p className="leading-[18px]">PDF Converter</p>
                </div>
              </div>
            </a>
          </div>

          <div className="content-stretch flex isolate items-center relative shrink-0">
            <div className="h-[13.5px] mr-[-14px] relative shrink-0 w-[21.5px] z-[2]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-bell.svg`} />
            </div>
            <div className="bg-[#6366f1] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[32px] z-[1]">
              <div className="relative shrink-0 size-[12px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-avatar-user.svg`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
