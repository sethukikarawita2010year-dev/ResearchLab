const A = "/assets";

export default function Composer({
  placeholder = "Upload paper to begin...",
  showDestination = true,
  destination = "ML Papers",
  disabled = false,
}) {
  return (
    <div className="absolute bg-gradient-to-t bottom-0 content-stretch flex flex-col from-[#0b0d13] items-start left-[260px] px-[90px] pt-[16px] pb-[20px] right-0 to-[rgba(11,13,19,0)] via-50% via-[rgba(11,13,19,0.95)] z-10">
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

        <div className="relative shrink-0 w-full">
          <div className="flex gap-[4px] items-center px-[4px] relative size-full">
            <button
              type="button"
              className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer"
            >
              <div className="h-[16.667px] relative shrink-0 w-[10.417px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-attach.svg`} />
              </div>
            </button>
            <div className="content-stretch flex flex-1 flex-col items-start min-w-px overflow-clip pb-[11px] pt-[10px] px-[12px] relative">
              <input
                type="text"
                placeholder={placeholder}
                disabled={disabled}
                className="bg-transparent w-full font-inter font-normal text-[14px] text-[#f8fafc] placeholder:text-[#64748b] outline-none border-0 p-0"
              />
            </div>
            <button
              type="button"
              className={`bg-[#4f46e5] relative rounded-[12px] shrink-0 size-[40px] cursor-pointer shadow-[0px_4px_6px_-1px_rgba(49,46,129,0.4),0px_2px_4px_-2px_rgba(49,46,129,0.4)] ${
                disabled ? "opacity-40" : ""
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
