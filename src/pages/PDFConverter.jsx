import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { folders } from "../components/Sidebar";
import { convertFile, conversionDownloadUrl, listConversions } from "../lib/api";

const A = "/assets";

const formats = [".docx", ".csv", ".html", ".xlsx", ".txt", ".pptx", ".md"];

const fileTypeMeta = {
  ".docx": { icon: `${A}/pc-doc.svg`, boxIcon: "h-[24px] w-[19.2px]", listIcon: "size-[15px]" },
  ".csv": { icon: `${A}/pc-csv.svg`, boxIcon: "size-[22px]", listIcon: "size-[15px]" },
  ".html": { icon: `${A}/pc-html.svg`, boxIcon: "size-[22px]", listIcon: "size-[15px]" },
  ".xlsx": { icon: `${A}/pc-xlsx.svg`, boxIcon: "size-[22px]", listIcon: "size-[15px]" },
  ".txt": { icon: `${A}/pc-txt.svg`, boxIcon: "size-[22px]", listIcon: "size-[15px]" },
  ".pptx": { icon: `${A}/pc-pptx.svg`, boxIcon: "size-[22px]", listIcon: "size-[15px]" },
  ".md": { icon: `${A}/pc-md.svg`, boxIcon: "h-[14.4px] w-[24px]", listIcon: "h-[10px] w-[16.667px]" },
};

const formatBytes = (bytes) => {
  if (typeof bytes !== "number") return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const filterOptions = [
  { key: "Newest", icon: `${A}/pc-filter.svg`, iconCls: "h-[8px] w-[12px]" },
  { key: "Oldest", icon: `${A}/pc-filter.svg`, iconCls: "h-[8px] w-[12px]" },
  { key: "MD", icon: `${A}/pc-md.svg`, iconCls: "h-[10px] w-[16.667px]" },
  { key: "XLSX", icon: `${A}/pc-xlsx.svg`, iconCls: "size-[15px]" },
  { key: "PPTX", icon: `${A}/pc-pptx.svg`, iconCls: "size-[15px]" },
  { key: "CSV", icon: `${A}/pc-csv.svg`, iconCls: "size-[15px]" },
  { key: "DOCX", icon: `${A}/pc-doc.svg`, iconCls: "h-[18px] w-[14.4px]" },
  { key: "HTML", icon: `${A}/pc-html.svg`, iconCls: "size-[15px]" },
  { key: "TXT", icon: `${A}/pc-txt.svg`, iconCls: "size-[15px]" },
];

const formatConversionDate = (iso) => {
  const t = Date.parse(iso);
  if (!t) return "Just now";
  const diff = Date.now() - t;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const rowFromRecord = (rec) => {
  const ext = (((rec.filename || "").match(/\.[^.]+$/) || [])[0] || "").toLowerCase();
  const meta = fileTypeMeta[ext] || fileTypeMeta[".docx"];
  return {
    id: `converted-${rec.id}`,
    name: rec.filename || "document.pdf",
    meta: "Converted to PDF",
    icon: meta.icon,
    iconCls: meta.listIcon,
    format: ext.replace(".", "").toUpperCase() || "PDF",
    size: formatBytes(rec.size),
    date: formatConversionDate(rec.created_at),
    ts: Date.parse(rec.created_at) || Date.now(),
    folder: rec.folder,
  };
};

const initialConversions = [
  {
    name: "Transformer_Attention_Notes.md",
    meta: "Markdown Schema · 3 MathJax Equations",
    icon: `${A}/pc-md.svg`,
    iconCls: "h-[10px] w-[16.667px]",
    format: "MD",
    size: "420 KB",
    date: "Today, 11:20 AM",
    folder: "Thesis",
    ts: Date.parse("2026-10-09T11:20:00"),
  },
  {
    name: "Model_Ablation_Study_Data.xlsx",
    meta: "Spreadsheet · 14 Tables Synthesized",
    icon: `${A}/pc-xlsx.svg`,
    iconCls: "size-[15px]",
    format: "XLSX",
    size: "1.2 MB",
    date: "Yesterday",
    folder: "ML Papers",
    ts: Date.parse("2026-10-08T12:00:00"),
  },
  {
    name: "NeurIPS_Presentation_Draft.pptx",
    meta: "Keynote Presentation · 42 Slides",
    icon: `${A}/pc-pptx.svg`,
    iconCls: "size-[15px]",
    format: "PPTX",
    size: "8.4 MB",
    date: "Oct 24, 2024",
    folder: "All Papers",
    ts: Date.parse("2024-10-24T00:00:00"),
  },
  {
    name: "Survey_Human_Evaluation.csv",
    meta: "Dataset Matrix · 2,800 Cohort Records",
    icon: `${A}/pc-csv.svg`,
    iconCls: "size-[15px]",
    format: "CSV",
    size: "310 KB",
    date: "Oct 22, 2024",
    folder: "Biomedical AI",
    ts: Date.parse("2024-10-22T00:00:00"),
  },
];

export default function PDFConverter() {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showFormatWarning, setShowFormatWarning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isConverted, setIsConverted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedPdf, setConvertedPdf] = useState(null);
  const [conversionError, setConversionError] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState("ML Papers");
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionSeconds, setConversionSeconds] = useState(null);
  const [conversionRows, setConversionRows] = useState(initialConversions);
  const [filterMode, setFilterMode] = useState("Newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const fileInputRef = useRef(null);
  const folderTriggerRef = useRef(null);
  const folderPopupRef = useRef(null);
  const folderRowsRef = useRef(null);
  const folderHighlightRef = useRef(null);
  const folderRowRefs = useRef({});
  const filterTriggerRef = useRef(null);
  const filterPopupRef = useRef(null);
  const filterRowsRef = useRef(null);
  const filterHighlightRef = useRef(null);
  const filterRowRefs = useRef({});
  const progressTimerRef = useRef(null);
  const downloadedRef = useRef(false);

  const handleSelectLocalFile = () => {
    if (!selectedFormat) {
      setShowFormatWarning(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setIsConverted(false);
    setConvertedPdf(null);
    setConversionError(null);
    setProgress(0);
    setConversionSeconds(null);
    downloadedRef.current = false;
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handleConvert = async () => {
    if (!uploadedFile || isConverting) return;
    setIsConverting(true);
    setConversionError(null);
    setProgress(0);
    setConversionSeconds(null);
    downloadedRef.current = false;

    const startedAt = performance.now();
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : Math.min(90, p + Math.max(0.4, (92 - p) * 0.06))));
    }, 300);

    try {
      const record = await convertFile(uploadedFile, selectedFolder);
      stopProgressTimer();
      setConversionSeconds((performance.now() - startedAt) / 1000);
      setProgress(100);
      setConvertedPdf(record);
      setIsConverted(true);
    } catch (err) {
      stopProgressTimer();
      setConversionError(err.message || "Conversion failed.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedPdf) return;
    try {
      const url = conversionDownloadUrl(convertedPdf.download_url);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed.");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = convertedPdf.pdf_filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      if (!downloadedRef.current) {
        downloadedRef.current = true;
        setConversionRows((prev) => [rowFromRecord(convertedPdf), ...prev]);
      }
    } catch (err) {
      setConversionError(err.message || "Download failed.");
    }
  };

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

  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const handleMouseDown = (e) => {
      if (filterPopupRef.current && filterPopupRef.current.contains(e.target)) return;
      if (filterTriggerRef.current && filterTriggerRef.current.contains(e.target)) return;
      setIsFilterOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFilterOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterOpen]);

  useLayoutEffect(() => {
    const popup = filterPopupRef.current;
    const rowsWrap = filterRowsRef.current;
    const highlight = filterHighlightRef.current;
    if (!popup || !rowsWrap || !highlight) return;

    const selectedRow = filterRowRefs.current[filterMode];
    if (selectedRow) {
      highlight.style.height = `${selectedRow.offsetHeight}px`;
      highlight.style.transform = `translateY(${selectedRow.offsetTop}px)`;
    }

    if (filterOptions.length > 5) {
      rowsWrap.style.maxHeight = "";
      const firstRow = filterRowRefs.current[filterOptions[0].key];
      const fifthRow = filterRowRefs.current[filterOptions[4].key];
      if (firstRow && fifthRow) {
        rowsWrap.style.maxHeight = `${fifthRow.offsetTop + fifthRow.offsetHeight - firstRow.offsetTop}px`;
      }
    } else {
      rowsWrap.style.maxHeight = "";
    }
  }, [filterMode, isFilterOpen]);

  useEffect(() => {
    let cancelled = false;
    listConversions()
      .then((recs) => {
        if (cancelled || !recs.length) return;
        setConversionRows((prev) => {
          const seeds = prev.filter((r) => !String(r.id || "").startsWith("converted-"));
          return [...recs.map(rowFromRecord), ...seeds];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => stopProgressTimer(), []);

  const uploadedFileExt = uploadedFile
    ? ((uploadedFile.name.match(/\.[^.]+$/) || [])[0] || "").toLowerCase()
    : "";
  const uploadedFileIcon =
    fileTypeMeta[uploadedFileExt] || fileTypeMeta[selectedFormat] || fileTypeMeta[".docx"];
  const uploadedFileTypeLabel = (uploadedFileExt || selectedFormat || "").toUpperCase();

  const visibleRows = (() => {
    const rows = [...conversionRows];
    if (filterMode === "Oldest") {
      return rows.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    }
    if (filterMode === "Newest") {
      return rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }
    return rows
      .filter((r) => r.format === filterMode)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  })();

  const filterCount = (key) =>
    key === "Newest" || key === "Oldest"
      ? conversionRows.length
      : conversionRows.filter((r) => r.format === key).length;

  return (
    <div
      className="relative size-full"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(11, 13, 19) 0%, rgb(11, 13, 19) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="bg-[#0b0d13] h-full w-full overflow-y-auto pt-[64px]">
        <div className="pl-[280px] px-[24px] w-full">
          <div className="flex flex-col items-start relative w-full">
            <div className="flex items-end justify-between py-[24px] relative shrink-0 w-full">
              <div className="flex flex-col gap-[2.9px] items-start max-w-[672px] relative shrink-0">
                <div className="flex flex-col items-start pt-[1.1px] relative shrink-0 w-full">
                  <h1 className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[28px] text-white tracking-[-0.7px] whitespace-nowrap">
                    <p className="leading-[36px]">PDF Converter</p>
                  </h1>
                </div>
                <div className="flex flex-col items-start pb-[0.625px] relative shrink-0 w-full">
                  <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[14px] whitespace-nowrap">
                    <p className="leading-[22.75px] mb-0">Convert raw research documents, datasets, presentation decks, and notes to clean, searchable research-ready PDFs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[24px] px-[110px] pb-[40px] relative shrink-0 w-full">
              <div className="flex flex-col gap-[24px] items-start self-start relative w-full">
                <div className="bg-[#161922] border-2 border-[#2a3044] border-dashed flex flex-col items-start overflow-clip p-[34px] px-[50px] relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-[calc(100%-200px)] mx-auto">
                  <div className="absolute bg-[rgba(99,102,241,0.1)] blur-[32px] right-[-64px] rounded-[9999px] size-[224px] top-[-64px]" />
                  <div className="relative shrink-0 w-full">
                    <div className="flex flex-col items-center px-[12px] py-[16px] relative w-full">
                      <div className="flex flex-col h-[80px] items-start pb-[16px] relative shrink-0 w-[64px]">
                        <div className="bg-[rgba(30,27,75,0.6)] border border-[rgba(67,56,202,0.4)] border-solid flex items-center justify-center p-px relative rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 size-[64px]">
                          <div className="h-[21.333px] relative shrink-0 w-[29.333px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-upload.svg`} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[22px] text-center text-white tracking-[-0.33px] whitespace-nowrap">
                        <p className="leading-[30px]">Drop a file to convert to PDF</p>
                      </div>
                      <div className="flex flex-col items-start max-w-[384px] pt-[4px] relative shrink-0">
                        <div className="flex flex-col items-center max-w-[384px] relative shrink-0">
                          <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px] text-center whitespace-nowrap">
                            <p className="leading-[18px]">Max file size: 100MB</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start pt-[16px] relative shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectLocalFile}
                          className={`border border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center px-[17px] py-[9px] relative rounded-[8px] shrink-0 cursor-pointer transition-colors ${
                            selectedFormat
                              ? "bg-[#4f46e5] border-[#4f46e5]"
                              : "bg-[#1e2230] border-[#2a3044]"
                          }`}
                        >
                          <div className="h-[12px] relative shrink-0 w-[16.125px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-file.svg`} />
                          </div>
                          <div className={`flex flex-col font-inter font-medium justify-center relative shrink-0 text-[13px] text-center tracking-[0.13px] whitespace-nowrap ${selectedFormat ? "text-white" : "text-[#f1f5f9]"}`}>
                            <p className="leading-[16px]">Select Local File</p>
                          </div>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={selectedFormat || undefined}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <div className="flex flex-col items-start pt-[32px] relative shrink-0">
                        <div className="content-center flex flex-wrap gap-[5px] items-center justify-center relative shrink-0">
                          {formats.map((f) => {
                            const isActive = f === selectedFormat;
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setSelectedFormat((prev) => (prev === f ? null : f))}
                                aria-pressed={isActive}
                                className={`bg-[#222738] border border-solid flex flex-col items-center px-[9px] py-[3px] relative rounded-[4px] shrink-0 cursor-pointer transition-colors ${
                                  isActive
                                    ? "border-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.55),0_0_2px_rgba(99,102,241,0.9)]"
                                    : "border-[#2a3044] hover:border-[#475069]"
                                }`}
                              >
                                <div className={`flex flex-col font-mono font-medium justify-center relative shrink-0 text-[13px] text-center whitespace-nowrap ${isActive ? "text-white" : "text-[#e2e8f0]"}`}>
                                  <p className="leading-[20px]">{f}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadedFile && (
                <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col items-start overflow-visible p-[25px] px-[50px] relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full">
                  <div className="absolute bg-[#6366f1] bottom-0 left-0 top-0 w-[6px]" />
                  <div className="relative shrink-0 w-full">
                    <div className="flex flex-col gap-[16px] items-start pl-[4px] relative w-full">
                      <div className="flex items-start justify-between relative shrink-0 w-full">
                        <div className="flex gap-[12px] items-center relative shrink-0">
                          <div className="bg-[rgba(30,27,75,0.6)] border border-[rgba(67,56,202,0.4)] border-solid flex items-center justify-center p-px relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 size-[48px]">
                            <div className={`relative shrink-0 ${uploadedFileIcon.boxIcon}`}>
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={uploadedFileIcon.icon} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-[2px] items-start relative shrink-0">
                            <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[18px] text-white tracking-[-0.18px] whitespace-nowrap">
                              <p className="leading-[26px]">{uploadedFile.name}</p>
                            </div>
                            <div className="flex flex-col font-mono font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px] whitespace-nowrap">
                              <p className="leading-[20px]">{formatBytes(uploadedFile.size)}</p>
                            </div>
                          </div>
                        </div>
                        {isConverted && (
                        <div className="bg-[rgba(30,27,75,0.5)] border border-[rgba(67,56,202,0.4)] border-solid flex gap-[6px] items-center px-[9px] py-[5px] relative rounded-[8px] shrink-0">
                          <div className="relative shrink-0 size-[15px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-check.svg`} />
                          </div>
                          <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#a5b4fc] text-[13px] tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">Conversion Complete</p>
                          </div>
                        </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                        <div className="flex items-center justify-between relative shrink-0 w-full">
                          <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase whitespace-nowrap">
                            <p className="leading-[14px]">EMBEDDING &amp; VECTORIZATION PIPELINE</p>
                          </div>
                          <div className="flex flex-col font-mono font-medium justify-center relative shrink-0 text-[#818cf8] text-[13px] whitespace-nowrap">
                            <p className="leading-[20px]">
                              {isConverted
                                ? `100% (Completed in ${(conversionSeconds ?? 0).toFixed(2)}s)`
                                : `${isConverting ? Math.round(progress) : 0}%`}
                            </p>
                          </div>
                        </div>
                        <div className={`flex flex-col h-[8px] items-start justify-center overflow-clip relative rounded-[9999px] shrink-0 w-full ${isConverted ? "bg-[#1e2230]" : "bg-[#11141d]"}`}>
                          <div
                            className="bg-[#6366f1] flex-1 min-h-px relative rounded-[9999px] shadow-[0px_0px_12px_0px_rgba(99,102,241,0.5)] transition-[width] duration-300 ease-out"
                            style={{ width: `${isConverted ? 100 : isConverting ? Math.round(progress) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-[8px] relative shrink-0 w-full">
                        <div className="bg-[#11141d] border border-[#1e2230] border-solid flex gap-[4px] items-center px-[13px] py-[5px] relative rounded-[8px] shrink-0">
                          {isConverted && (
                            <>
                              <div className="h-[12px] relative shrink-0 w-[15px]">
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-folder.svg`} />
                              </div>
                              <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[16px] whitespace-nowrap">
                                <p className="leading-[24px]">Add to folder:</p>
                              </div>
                            </>
                          )}
                          {!isConverted ? (
                            <div className="flex flex-col font-mono font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] whitespace-nowrap">
                              <p className="leading-[24px]">{uploadedFileTypeLabel} → .PDF</p>
                            </div>
                          ) : (
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
                          )}
                        </div>
                        <div className="flex gap-[8px] items-center relative shrink-0">
                          {!isConverted ? (
                            <button
                              type="button"
                              onClick={handleConvert}
                              disabled={isConverting}
                              className="bg-[#4f46e5] flex gap-[4px] items-center justify-center px-[16px] py-[10px] relative rounded-[8px] shrink-0 cursor-pointer shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.2),0px_4px_6px_-4px_rgba(79,70,229,0.2)] disabled:opacity-60 disabled:cursor-default"
                            >
                              <div className="flex flex-col items-center px-[6px] relative shrink-0">
                                <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[13px] text-center text-white tracking-[0.13px] whitespace-nowrap">
                                  <p className="leading-[16px]">{isConverting ? "Converting…" : "Convert"}</p>
                                </div>
                              </div>
                            </button>
                          ) : (
                            <>
                          <button type="button" onClick={handleDownload} className="bg-[#4f46e5] flex gap-[4px] items-center justify-center px-[16px] py-[10px] relative rounded-[8px] shrink-0 cursor-pointer shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.2),0px_4px_6px_-4px_rgba(79,70,229,0.2)]">
                            <div className="relative shrink-0 size-[12px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-download.svg`} />
                            </div>
                            <div className="flex flex-col items-center pl-[6px] pr-[6px] relative shrink-0">
                              <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[13px] text-center text-white tracking-[0.13px] whitespace-nowrap">
                                <p className="leading-[16px] mb-0">Download</p>
                                <p className="leading-[16px]">PDF</p>
                              </div>
                            </div>
                          </button>
                          <button type="button" className="bg-[#1e2230] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center justify-center px-[13px] py-[11px] relative rounded-[8px] shrink-0 cursor-pointer">
                            <div className="flex flex-col items-center pl-[3px] pr-[3px] relative shrink-0">
                              <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                                <p className="leading-[16px] mb-0">Open in Workspace</p>
                                <p className="leading-[16px]">Chat</p>
                              </div>
                            </div>
                            <div className="relative shrink-0 size-[10.667px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-arrow-right.svg`} />
                            </div>
                          </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[12px] items-start px-[110px] pb-[48px] relative shrink-0 w-full">
              <div className="flex items-center justify-between relative shrink-0 w-full">
                <div className="flex flex-col items-start relative shrink-0">
                  <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[22px] text-white tracking-[-0.33px] whitespace-nowrap">
                    <p className="leading-[30px]">Recent Conversions</p>
                  </div>
                </div>
                <div className="relative shrink-0" ref={filterTriggerRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((v) => !v)}
                    aria-label={isFilterOpen ? "Close filter" : "Open filter"}
                    aria-expanded={isFilterOpen}
                    className="bg-[#161922] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center px-[13px] py-[7px] relative rounded-[8px] shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
                  >
                    <div className="h-[8px] relative shrink-0 w-[12px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-filter.svg`} />
                    </div>
                    <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                      <p className="leading-[16px]">{filterMode === "Newest" ? "Filter" : filterMode}</p>
                    </div>
                  </button>
                  <div
                    aria-hidden={!isFilterOpen}
                    className={`absolute right-0 top-full mt-[6px] z-50 bg-[rgba(22,25,34,0.95)] backdrop-blur-[12px] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start p-[4px] rounded-[8px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] origin-top transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
                      isFilterOpen ? "translate-y-0 opacity-100" : "-translate-y-[8px] opacity-0 pointer-events-none"
                    }`}
                    ref={filterPopupRef}
                  >
                    <div
                      className="content-stretch flex flex-col gap-[2px] items-start overflow-y-auto relative w-full"
                      ref={filterRowsRef}
                    >
                      <div
                        ref={filterHighlightRef}
                        className="absolute bg-[#1b202e] left-0 right-0 top-0 rounded-[8px] transition-all duration-200 ease-out"
                        aria-hidden="true"
                      />
                      {filterOptions.map((opt) => {
                        const isSelected = opt.key === filterMode;
                        const count =
                          opt.key === "Newest" || opt.key === "Oldest"
                            ? conversionRows.length
                            : conversionRows.filter((r) => r.format === opt.key).length;
                        return (
                          <button
                            key={opt.key}
                            ref={(el) => {
                              filterRowRefs.current[opt.key] = el;
                            }}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            disabled={!isFilterOpen}
                            onClick={() => setFilterMode(opt.key)}
                            className={`content-stretch flex gap-[20px] items-center justify-between px-[8px] py-[4px] relative rounded-[8px] shrink-0 w-full cursor-pointer ${
                              isSelected ? "" : "hover:bg-[#161922]"
                            }`}
                          >
                            <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0">
                              <div className={`relative shrink-0 ${opt.iconCls}`}>
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={opt.icon} />
                              </div>
                              <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0">
                                <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#cbd5e1] text-[13px] text-center whitespace-nowrap">
                                  <p className="leading-[18px]">{opt.key}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-[#1b202e] border border-[#2a3044] border-solid content-stretch flex flex-col items-center px-[5px] py-[3px] relative rounded-[4px] shrink-0">
                              <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px] text-center whitespace-nowrap">
                                <p className="leading-[18px]">{count}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col items-start overflow-clip relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full">
                <div className="max-h-[456px] overflow-y-auto w-full">
                <table className="border-collapse w-full">
                  <colgroup>
                    <col style={{ width: "34%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "11%" }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#12151e] border-b border-[#2a3044] border-solid sticky top-0 z-10">
                      <th className="text-left px-[17px] py-[19px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px]">FILE NAME</p>
                        </div>
                      </th>
                      <th className="text-left px-[11px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">ORIGINAL</p>
                          <p className="leading-[14px]">FORMAT</p>
                        </div>
                      </th>
                      <th className="text-left px-[11px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">OUTPUT</p>
                          <p className="leading-[14px]">SIZE</p>
                        </div>
                      </th>
                      <th className="text-left px-[11px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">CONVERTED</p>
                          <p className="leading-[14px]">DATE</p>
                        </div>
                      </th>
                      <th className="text-left pl-[21px] pr-[11px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">FOLDER</p>
                          <p className="leading-[14px]">DESTINATION</p>
                        </div>
                      </th>
                      <th className="text-right px-[17px] py-[19px] align-middle">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px]">ACTIONS</p>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, i) => (
                      <tr
                        key={row.id || row.name}
                        className={`border-[#1e2230] ${
                          i === visibleRows.length - 1 ? "" : "border-b border-solid"
                        }`}
                      >
                        <td className="px-[17px] py-[20px]">
                          <div className="flex gap-[12px] items-center">
                            <div className="bg-[#222738] border border-[#2a3044] border-solid flex items-center justify-center p-px relative rounded-[8px] shrink-0 size-[36px]">
                              <div className={`relative shrink-0 ${row.iconCls}`}>
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={row.icon} />
                              </div>
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <div className="flex flex-col font-inter font-semibold text-[14px] text-white">
                                <p className="leading-[22px]">{row.name.replace(/\.[^.]+$/, "")}</p>
                              </div>
                              <div className="flex flex-col font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px]">
                                <p className="leading-[14px]">{row.meta}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-[11px] py-[20px]">
                          <div className="bg-[#222738] border border-[#2a3044] border-solid inline-flex items-start px-[9px] py-[1.5px] relative rounded-[4px]">
                            <div className="flex flex-col font-mono font-medium justify-center relative text-[#e2e8f0] text-[13px] whitespace-nowrap">
                              <p className="leading-[20px]">{row.format}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-[11px] py-[20px]">
                          <div className="flex flex-col font-mono font-normal justify-center relative text-[#94a3b8] text-[13px] whitespace-nowrap">
                            <p className="leading-[20px]">{row.size}</p>
                          </div>
                        </td>
                        <td className="px-[11px] py-[20px]">
                          <div className="flex flex-col font-inter font-normal justify-center relative text-[#94a3b8] text-[13px] whitespace-nowrap">
                            <p className="leading-[18px]">{row.date}</p>
                          </div>
                        </td>
                        <td className="pl-[21px] pr-[11px] py-[20px]">
                          <div className="bg-[#222738] border border-[#2a3044] border-solid inline-flex gap-[4px] items-center px-[9px] py-[5px] relative rounded-[9999px]">
                            <div className="h-[9.333px] relative shrink-0 w-[11.667px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-folder-small.svg`} />
                            </div>
                            <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[11px] tracking-[0.33px] whitespace-nowrap">
                              <p className="leading-[14px]">{row.folder}</p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle px-[17px] py-[20px]">
                          <div className="flex gap-[5px] items-center justify-end">
                            <button type="button" className="flex items-center justify-center p-[4px] relative rounded-[4px] shrink-0 cursor-pointer">
                              <div className="relative shrink-0 size-[15px]">
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-action.svg`} />
                              </div>
                            </button>
                            <button type="button" className="flex items-center justify-center p-[4px] relative rounded-[4px] shrink-0 cursor-pointer">
                              <div className="relative shrink-0 size-[15px]">
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-chat.svg`} />
                              </div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFormatWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col gap-[16px] items-start max-w-[360px] w-[calc(100%-48px)] p-[24px] rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between w-full">
              <div className="flex gap-[10px] items-center">
                <div className="bg-[rgba(30,27,75,0.6)] border border-[rgba(67,56,202,0.4)] border-solid flex items-center justify-center rounded-[8px] shrink-0 size-[34px]">
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-file.svg`} />
                  </div>
                </div>
                <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[16px] text-white tracking-[-0.16px]">
                  <p className="leading-[24px]">Select a file type first</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormatWarning(false)}
                aria-label="Close"
                className="flex items-center justify-center p-[4px] relative rounded-[6px] shrink-0 cursor-pointer hover:bg-[#1b202e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
              >
                <div className="relative shrink-0 size-[12px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/chat-panel-close.svg`} />
                </div>
              </button>
            </div>
            <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px]">
              <p className="leading-[20px]">Choose one of the supported file types above, then select your local file to convert.</p>
            </div>
          </div>
        </div>
      )}

      {conversionError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col gap-[16px] items-start max-w-[360px] w-[calc(100%-48px)] p-[24px] rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between w-full">
              <div className="flex gap-[10px] items-center">
                <div className="bg-[rgba(69,26,26,0.6)] border border-[rgba(153,27,27,0.4)] border-solid flex items-center justify-center rounded-[8px] shrink-0 size-[34px]">
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-upload.svg`} />
                  </div>
                </div>
                <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[16px] text-white tracking-[-0.16px]">
                  <p className="leading-[24px]">Conversion failed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConversionError(null)}
                aria-label="Close"
                className="flex items-center justify-center p-[4px] relative rounded-[6px] shrink-0 cursor-pointer hover:bg-[#1b202e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
              >
                <div className="relative shrink-0 size-[12px]">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/chat-panel-close.svg`} />
                </div>
              </button>
            </div>
            <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px]">
              <p className="leading-[20px]">{conversionError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
