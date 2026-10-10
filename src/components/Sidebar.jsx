import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createFolder, useFolders } from "../lib/folderStore";
import { useSessions, updateSession, deleteSession } from "../lib/sessionStore";
import { useSidebar } from "./sidebarContext";

const A = "/assets";

const historyGroups = [
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

export default function Sidebar() {
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState("All Papers");
  const [selectedChat, setSelectedChat] = useState("");
  const folderList = useFolders();
  const sessions = useSessions();
  const [isFolderPopupOpen, setIsFolderPopupOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingChatId, setEditingChatId] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [renamedTitles, setRenamedTitles] = useState({});
  const [hiddenTitles, setHiddenTitles] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { collapsed, toggle } = useSidebar();
  const folderHighlightRef = useRef(null);
  const folderRowsRef = useRef(null);
  const folderRowRefs = useRef({});
  const folderNameInputRef = useRef(null);

  const handleAddFolder = () => {
    createFolder(newFolderName);
    setNewFolderName("");
    setIsFolderPopupOpen(false);
  };

  const commitRename = (item) => {
    const next = editDraft.trim();
    if (item.sessionId) {
      updateSession(item.sessionId, { title: next || item.title });
    } else {
      setRenamedTitles((prev) => {
        const copy = { ...prev };
        if (next) copy[item.originalTitle] = next;
        else delete copy[item.originalTitle];
        return copy;
      });
    }
    setEditingChatId("");
  };

  const confirmDelete = () => {
    const item = deleteTarget;
    if (!item) return;
    if (item.sessionId) {
      deleteSession(item.sessionId);
    } else {
      setHiddenTitles((prev) => ({ ...prev, [item.originalTitle]: true }));
    }
    setDeleteTarget(null);
  };

  const todays = sessions.filter(
    (s) => selectedFolder === "All Papers" || s.folder === selectedFolder,
  );
  const groups = [
    {
      label: "Today",
      items: todays.map((s) => ({
        key: `s-${s.id}`,
        sessionId: s.id,
        title: s.title || s.pdfName || "Untitled",
        pdfName: s.pdfName,
        folder: s.folder,
        to: "/chat",
      })),
    },
    ...historyGroups.map((g) => ({
      label: g.label,
      items: g.items
        .filter((it) => !hiddenTitles[it.title])
        .map((it) => ({
          key: it.title,
          originalTitle: it.title,
          title: it.title,
          to: it.to,
        })),
    })),
  ].filter((g) => g.items.length > 0);

  useLayoutEffect(() => {
    if (isFolderPopupOpen && folderNameInputRef.current) {
      folderNameInputRef.current.focus();
    }
  }, [isFolderPopupOpen]);

  useLayoutEffect(() => {
    const highlight = folderHighlightRef.current;
    const row = folderRowRefs.current[selectedFolder];
    if (highlight && row) {
      highlight.style.height = `${row.offsetHeight}px`;
      highlight.style.transform = `translateY(${row.offsetTop}px)`;
    }

    const rowsWrap = folderRowsRef.current;
    if (rowsWrap && folderList.length > 5) {
      const firstRow = folderRowRefs.current[folderList[0].name];
      const fifthRow = folderRowRefs.current[folderList[4].name];
      if (firstRow && fifthRow) {
        rowsWrap.style.maxHeight = `${fifthRow.offsetTop + fifthRow.offsetHeight - firstRow.offsetTop}px`;
      }
    } else if (rowsWrap) {
      rowsWrap.style.maxHeight = "";
    }
  }, [selectedFolder, folderList]);

  return (
    <aside
      className={`absolute flex flex-col items-start left-0 overflow-clip pr-px top-0 transition-[height,background-color] duration-200 ease-out w-[260px] ${
        collapsed
          ? "backdrop-blur-[12px] bg-[rgba(11,13,19,0.85)]"
          : "bg-[#11141d] border-[#1e2230] border-r border-solid"
      }`}
      style={{ height: collapsed ? "65px" : "100%" }}
    >
      <div className="border-[#1e2230] border-b border-solid flex items-center justify-between h-[65px] px-[16px] relative shrink-0 w-full">
        <Link to="/library" className="relative shrink-0">
          <div className="flex gap-[8px] items-center relative size-full">
            <div className="bg-[#6366f1] drop-shadow-[0px_1px_1px_rgba(99,102,241,0.2)] flex items-center justify-center relative rounded-[10px] shrink-0 size-[35px]">
              <div className="relative shrink-0 size-[20px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-logo.svg`} />
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0">
              <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#f8fafc] text-[17.5px] tracking-[-0.35px] whitespace-nowrap">
                <p className="leading-[28px]">ResearchLab</p>
              </div>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Minimise sidebar"}
          className="relative rounded-[4px] shrink-0 cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center p-[2px] relative size-full">
            <div className="relative shrink-0 size-[17.55px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-collapse.svg`} />
            </div>
          </div>
        </button>
      </div>

      <div
        className={`flex flex-1 flex-col min-h-px origin-top transition-[opacity,transform] duration-200 ease-out w-full ${
          collapsed
            ? "opacity-0 pointer-events-none [transform:scaleY(0.7)]"
            : "opacity-100 [transform:scaleY(1)]"
        }`}
      >
        <div className="flex-1 min-h-px relative w-full">
          <div className="flex flex-col items-start relative size-full">
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
                  <div className="flex flex-col font-inter font-extrabold justify-center relative shrink-0 text-[#c1cee0] text-[14.6px] tracking-[0.55px] uppercase whitespace-nowrap">
                    <p className="leading-[20.8px]">Corpus &amp; Folders</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-expanded={isFolderPopupOpen}
                  onClick={() => setIsFolderPopupOpen((v) => !v)}
                  className="h-[13.867px] relative shrink-0 w-[17.333px] cursor-pointer"
                >
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-plus.svg`} />
                </button>
                <div
                  aria-hidden={!isFolderPopupOpen}
                  className={`absolute backdrop-blur-[12px] bg-[rgba(22,25,34,0.95)] border border-[#2a3044] border-solid left-0 mt-[6px] origin-top p-[4px] right-0 rounded-[8px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] top-full transition-[opacity,transform] duration-200 ease-out z-50 ${
                    isFolderPopupOpen
                      ? "animate-[folder-popup-in_180ms_ease-out] opacity-100 pointer-events-auto [transform:translateY(0)_scaleY(1)]"
                      : "opacity-0 pointer-events-none [transform:translateY(-6px)_scaleY(0.65)]"
                  }`}
                >
                  <div className="content-stretch flex items-center gap-[7px] px-[8px] py-[4px] relative w-full">
                    <img alt="" className="h-[10.667px] relative shrink-0 w-[13.333px]" src={`${A}/ws-folder-white.svg`} />
                    <input
                      ref={folderNameInputRef}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddFolder();
                      }}
                      maxLength={150}
                      placeholder="Folder name"
                      className="bg-transparent border-0 flex-1 font-inter font-normal min-w-px outline-none p-0 text-[13px] text-white placeholder:text-[#64748b]"
                    />
                    <button
                      type="button"
                      onClick={handleAddFolder}
                      className="bg-[#4f46e5] flex items-center justify-center px-[12px] py-[5px] relative rounded-[8px] shrink-0 cursor-pointer shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.2),0px_4px_6px_-4px_rgba(79,70,229,0.2)]"
                    >
                      <p className="font-inter font-medium leading-[16px] text-[13px] text-center text-white tracking-[0.13px] whitespace-nowrap">
                        Done
                      </p>
                    </button>
                  </div>
                </div>
              </div>
              <div
                ref={folderRowsRef}
                className="content-stretch flex flex-col gap-[2px] items-start no-scrollbar overflow-y-auto relative shrink-0 w-full"
              >
                <div
                  ref={folderHighlightRef}
                  aria-hidden="true"
                  className="absolute bg-[#1b202e] left-0 right-0 rounded-[8px] top-0 pointer-events-none transition-[transform,height] duration-200 ease-out"
                />
                {folderList.map((f) => {
                  const isSelected = f.name === selectedFolder;
                  return (
                    <button
                      key={f.name}
                      ref={(el) => {
                        folderRowRefs.current[f.name] = el;
                      }}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedFolder(f.name)}
                      className={`content-stretch flex items-center justify-between px-[8px] py-[4px] relative rounded-[8px] shrink-0 w-full cursor-pointer ${
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
                              isSelected ? "text-white" : "text-[#94a3b8]"
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

          <div className="content-stretch flex flex-1 flex-col gap-[12px] items-start min-h-px overflow-auto no-scrollbar px-[16px] relative w-full">
            {groups.map((group) => (
              <div
                key={group.label}
                className="content-stretch flex flex-col gap-[2px] items-start pt-[5.5px] relative shrink-0 w-full"
              >
                <div className="flex flex-col font-inter font-extrabold justify-center relative shrink-0 text-[#c1cee0] text-[14.6px] tracking-[0.55px] uppercase whitespace-nowrap">
                  <p className="leading-[19.8px]">{group.label}</p>
                </div>
                {group.items.map((item) => {
                  const isSelected = item.key === selectedChat;
                  const displayTitle = item.sessionId
                    ? item.title
                    : renamedTitles[item.originalTitle] || item.title;
                  const isEditing = editingChatId === item.key;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      state={
                        item.sessionId
                          ? {
                              sessionId: item.sessionId,
                              uploadId: item.sessionId,
                              pdfName: item.pdfName,
                              title: item.title,
                            }
                          : undefined
                      }
                      onClick={() => setSelectedChat(item.key)}
                      className={`group content-stretch flex flex-col items-start overflow-clip px-[8px] py-[4px] relative rounded-[8px] shrink-0 w-full transition-colors ${
                        isSelected ? "bg-[#1b202e]" : "hover:bg-[#161922]"
                      }`}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitRename(item);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingChatId("");
                            }
                          }}
                          maxLength={150}
                          className="bg-[#12151e] border border-[#2a3044] border-solid flex-1 font-inter font-normal min-w-px outline-none px-[6px] py-[1px] rounded-[4px] text-[13px] w-full text-[#f8fafc] focus:border-[#6366f1]"
                        />
                      ) : (
                        <div className="content-stretch flex items-center gap-[8px] overflow-clip relative shrink-0 w-full">
                          <div
                            className={`flex flex-col font-inter font-normal justify-center relative shrink-0 text-[13px] overflow-hidden relative shrink-0 text-ellipsis flex-1 min-w-px ${
                              isSelected ? "text-[#cbd5e1]" : "text-[#94a3b8]"
                            }`}
                          >
                            <p className="leading-[18px]">{displayTitle}</p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Rename ${displayTitle}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingChatId(item.key);
                              setEditDraft(displayTitle);
                            }}
                            className="flex items-center justify-center opacity-0 group-hover:opacity-100 p-[2px] relative rounded-[4px] shrink-0 cursor-pointer text-[#94a3b8] hover:text-[#e2e8f0] transition-opacity"
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${displayTitle}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget(item);
                            }}
                            className="flex items-center justify-center opacity-0 group-hover:opacity-100 p-[2px] relative rounded-[4px] shrink-0 cursor-pointer text-[#94a3b8] hover:text-[#f87171] transition-opacity"
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </Link>
                  );
                })}
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
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col gap-[16px] items-start max-w-[360px] w-[calc(100%-48px)] p-[24px] rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex gap-[10px] items-center">
              <div className="bg-[rgba(69,26,26,0.6)] border border-[rgba(153,27,27,0.4)] border-solid flex items-center justify-center rounded-[8px] shrink-0 size-[34px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                </svg>
              </div>
              <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[16px] text-white tracking-[-0.16px]">
                <p className="leading-[24px]">Delete this chat?</p>
              </div>
            </div>
            <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px]">
              <p className="leading-[20px]">
                This deletes “{deleteTarget.title}” and its notes. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-[8px] w-full">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-[#1a1e2b] border border-[#2a3044] border-solid rounded-[8px] flex-1 py-[8px] font-inter font-medium text-[13px] text-[#cbd5e1] cursor-pointer hover:bg-[#20263a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="bg-[#dc2626] border border-[#dc2626] border-solid rounded-[8px] flex-1 py-[8px] font-inter font-medium text-[13px] text-white cursor-pointer hover:bg-[#b91c1c] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
