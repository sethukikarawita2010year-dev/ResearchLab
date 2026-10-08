import { Link, useNavigate } from "react-router-dom";

const A = "/assets";

const historyGroups = [
  {
    label: "Today",
    items: [
      { title: "Attention Is All You Need (Cross-Attn)", to: "/chat", active: true },
      { title: "Scaling Laws for Neural Language Models", to: "/chat" },
    ],
  },
  {
    label: "Yesterday",
    items: [
      { title: "LoRA: Low-Rank Adaptation", to: "/chat" },
      { title: "Constitutional AI: Harmlessness from AI Feedback", to: "/chat" },
    ],
  },
  {
    label: "Previous 7 days",
    items: [
      { title: "FlashAttention: Fast & Memory-Efficient", to: "/chat" },
      { title: "Chain-of-Thought Prompting Elicits Reasoning", to: "/chat" },
      { title: "Retrieval-Augmented Generation Benchmark", to: "/chat" },
    ],
  },
];

export const folders = [
  { name: "All Papers", count: "14", icon: `${A}/ws-folder-active.svg`, muted: false },
  { name: "Thesis", count: "4", icon: `${A}/ws-folder-muted.svg`, muted: true },
  { name: "ML Papers", count: "8", icon: `${A}/ws-folder-muted.svg`, muted: true },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="absolute bg-[#11141d] border-[#1e2230] border-r border-solid flex flex-col items-start left-0 overflow-clip pr-px top-0 bottom-0 w-[260px]">
      <div className="flex-1 min-h-px relative w-full">
        <div className="flex flex-col items-start relative size-full">
          <div className="border-[rgba(30,34,48,0.5)] border-b border-solid flex items-center justify-between pb-[17px] pt-[16px] px-[16px] relative shrink-0 w-full">
            <Link to="/library" className="relative shrink-0">
              <div className="flex gap-[8px] items-center relative size-full">
                <div className="bg-[#6366f1] drop-shadow-[0px_1px_1px_rgba(99,102,241,0.2)] flex items-center justify-center relative rounded-[8px] shrink-0 size-[28px]">
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-logo.svg`} />
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-start relative shrink-0">
                  <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#f8fafc] text-[14px] tracking-[-0.35px] whitespace-nowrap">
                    <p className="leading-[22px]">ResearchLab</p>
                  </div>
                </div>
              </div>
            </Link>
            <button type="button" className="relative rounded-[4px] shrink-0 cursor-pointer">
              <div className="flex flex-col items-center justify-center pb-[8px] pt-[2px] px-[2px] relative size-full">
                <div className="relative shrink-0 size-[13.5px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-collapse.svg`} />
                </div>
              </div>
            </button>
          </div>

          <div className="content-stretch flex flex-col items-start px-[16px] py-[12px] relative shrink-0 w-full">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="bg-[#6366f1] drop-shadow-[0px_1px_1px_rgba(99,102,241,0.25)] flex gap-[8px] items-center justify-center px-[12px] py-[8px] relative rounded-[8px] shrink-0 w-full cursor-pointer"
            >
              <div className="relative shrink-0 size-[10.5px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-new-chat.svg`} />
              </div>
              <div className="content-stretch flex flex-col items-center relative shrink-0">
                <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
                  <p className="leading-[24px]">New chat</p>
                </div>
              </div>
            </button>
          </div>

          <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-start px-[16px] relative shrink-0 w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0">
                  <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase whitespace-nowrap">
                    <p className="leading-[16.5px]">Corpus &amp; Folders</p>
                  </div>
                </div>
                <button type="button" className="h-[10.667px] relative shrink-0 w-[13.333px] cursor-pointer">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-plus.svg`} />
                </button>
              </div>
              <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
                {folders.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    className="content-stretch flex items-center justify-between px-[8px] py-[4px] relative rounded-[8px] shrink-0 w-full cursor-pointer hover:bg-[#161922]"
                  >
                    <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0">
                      <div className="h-[10.667px] relative shrink-0 w-[13.333px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={f.icon} />
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
                ))}
              </div>
            </div>
          </div>

          <div className="content-stretch flex flex-1 flex-col gap-[12px] items-start min-h-px overflow-auto px-[16px] relative w-full">
            {historyGroups.map((group) => (
              <div
                key={group.label}
                className="content-stretch flex flex-col gap-[2px] items-start pt-[5.5px] relative shrink-0 w-full"
              >
                <div className="flex flex-col font-inter font-extrabold justify-center relative shrink-0 text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase whitespace-nowrap">
                  <p className="leading-[16.5px]">{group.label}</p>
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.title}
                    to={item.to}
                    className={`content-stretch flex flex-col items-start overflow-clip px-[8px] py-[4px] relative rounded-[8px] shrink-0 w-full hover:bg-[#161922] ${
                      item.active ? "text-[#cbd5e1]" : ""
                    }`}
                  >
                    <div
                      className={`flex flex-col font-inter font-normal justify-center relative shrink-0 text-[13px] overflow-hidden relative shrink-0 text-ellipsis w-full ${
                        item.active ? "text-[#cbd5e1]" : "text-[#94a3b8]"
                      }`}
                    >
                      <p className="leading-[18px]">{item.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#11141d] border-[#1e2230] border-solid border-t relative shrink-0 w-full">
        <div className="flex flex-col items-start pb-[12px] pt-[13px] px-[12px] relative size-full">
          <div className="bg-[#161922] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0 w-full">
            <div className="flex items-center justify-between p-[5px] relative size-full">
              <div className="relative shrink-0">
                <div className="flex gap-[8px] items-center relative size-full">
                  <div className="bg-[#6366f1] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[32px]">
                    <div className="relative shrink-0 size-[12px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-avatar-user.svg`} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full">
                      <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#f8fafc] text-[13px] tracking-[0.13px] whitespace-nowrap">
                        <p className="leading-[16px]">Dr. Sarah Jenkins</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full">
                      <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#94a3b8] text-[11px] tracking-[0.33px] whitespace-nowrap">
                        <p className="leading-[14px]">Senior Fellow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative shrink-0">
                <div className="flex items-center relative size-full">
                  <Link
                    to="/login"
                    className="content-stretch flex flex-col items-center justify-center pb-[8px] pt-[4px] px-[2px] relative rounded-[4px] shrink-0"
                  >
                    <div className="h-[13.333px] relative shrink-0 w-[13.4px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-settings.svg`} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
