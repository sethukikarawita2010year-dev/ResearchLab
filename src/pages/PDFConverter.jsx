import { useState } from "react";

const A = "/assets";

const formats = [".docx", ".csv", ".html", ".xlsx", ".txt", ".pptx", ".md"];

const engineOptions = [
  {
    title: "Make text searchable",
    desc: "Run OCR so you can highlight, copy, and search words inside the PDF.",
  },
  {
    title: "Keep tables intact",
    desc: "Recognize spreadsheets and tables so rows and columns stay neat.",
  },
  {
    title: "Compress file size",
    desc: "Shrink the file so it's easy to share without losing image sharpness.",
  },
];

const conversions = [
  {
    name: "Transformer_Attention_Notes.md",
    meta: "Markdown Schema · 3 MathJax Equations",
    icon: `${A}/pc-md.svg`,
    iconCls: "h-[10px] w-[16.667px]",
    format: "MD",
    size: "420 KB",
    date: "Today, 11:20 AM",
    folder: "Thesis",
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
  },
];

function EngineOption({ option, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex gap-[12px] items-start p-[8px] relative rounded-[8px] shrink-0 w-full cursor-pointer text-left hover:bg-[#1b202e]"
    >
      <div className="h-[26px] relative shrink-0 w-[16px]">
        {checked ? (
          <span className="absolute bg-[#4f46e5] flex items-center justify-center left-[-1px] overflow-clip rounded-[4px] size-[18px] top-[6.63px]">
            <img alt="" className="relative size-[16px]" src={`${A}/pc-checkbox.svg`} />
          </span>
        ) : (
          <span className="absolute bg-[#11141d] border border-[#2a3044] border-solid left-[-1px] rounded-[4px] size-[16px] top-[7.63px]" />
        )}
      </div>
      <div className="flex flex-col items-start relative shrink-0">
        <div className="flex flex-col font-inter font-semibold text-[13px] text-white tracking-[0.13px] whitespace-nowrap">
          <p className="leading-[16px]">{option.title}</p>
        </div>
        <div className="flex flex-col pt-[2px] w-full">
          <div className="flex flex-col font-inter font-normal text-[#cbd5e1] text-[13px] w-full">
            <p className="leading-[16.25px]">{option.desc}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function PDFConverter() {
  const [checked, setChecked] = useState([true, true, false]);

  const toggle = (i) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div
      className="relative size-full"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(11, 13, 19) 0%, rgb(11, 13, 19) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="bg-[#0b0d13] h-full w-full overflow-y-auto pt-[64px]">
        <div className="pl-[260px] px-[24px] w-full">
          <div className="flex flex-col items-start relative w-full">
            <div className="flex items-end py-[24px] relative shrink-0 w-full">
              <div className="flex flex-col gap-[2.9px] items-start max-w-[672px] relative shrink-0">
                <div className="flex gap-[4px] items-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[13.333px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-sparkle.svg`} />
                  </div>
                  <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#818cf8] text-[16px] tracking-[0.8px] uppercase whitespace-nowrap">
                    <p className="leading-[24px]">VECTOR SYNTHESIS &amp; INGESTION ENGINE</p>
                  </div>
                </div>
                <div className="flex flex-col items-start pt-[1.1px] relative shrink-0 w-full">
                  <h1 className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[28px] text-white tracking-[-0.7px] whitespace-nowrap">
                    <p className="leading-[36px]">PDF Converter</p>
                  </h1>
                </div>
                <div className="flex flex-col items-start pb-[0.625px] relative shrink-0 w-full">
                  <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[14px] whitespace-nowrap">
                    <p className="leading-[22.75px] mb-0">Convert raw research documents, datasets, presentation decks, and notes to clean, searchable</p>
                    <p className="leading-[22.75px]">research-ready PDFs with automated OCR and vector embeddings.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-x-[24px] gap-y-[24px] grid-rows-[590px] pb-[32px] relative shrink-0 w-full">
              <div className="col-[1/span_8] flex flex-col gap-[24px] items-start self-start relative">
                <div className="bg-[#161922] border-2 border-[#2a3044] border-dashed flex flex-col items-start overflow-clip p-[34px] relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full">
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
                            <p className="leading-[18px]">or browse local drive (Max file size: 100MB)</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start pt-[16px] relative shrink-0">
                        <button type="button" className="bg-[#1e2230] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center px-[17px] py-[9px] relative rounded-[8px] shrink-0 cursor-pointer">
                          <div className="h-[12px] relative shrink-0 w-[16.125px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-file.svg`} />
                          </div>
                          <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#f1f5f9] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">Select Local File</p>
                          </div>
                        </button>
                      </div>
                      <div className="flex flex-col items-start pt-[32px] relative shrink-0">
                        <div className="content-center flex flex-wrap gap-[4px] items-center justify-center relative shrink-0">
                          {formats.map((f) => (
                            <div key={f} className="bg-[#222738] border border-[#2a3044] border-solid flex flex-col items-center px-[9px] py-[3px] relative rounded-[4px] shrink-0">
                              <div className="flex flex-col font-mono font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] text-center whitespace-nowrap">
                                <p className="leading-[20px]">{f}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col items-start overflow-clip p-[25px] relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full">
                  <div className="absolute bg-[#6366f1] bottom-0 left-0 top-0 w-[6px]" />
                  <div className="relative shrink-0 w-full">
                    <div className="flex flex-col gap-[16px] items-start pl-[4px] relative w-full">
                      <div className="flex items-start justify-between relative shrink-0 w-full">
                        <div className="flex gap-[12px] items-center relative shrink-0">
                          <div className="bg-[rgba(30,27,75,0.6)] border border-[rgba(67,56,202,0.4)] border-solid flex items-center justify-center p-px relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 size-[48px]">
                            <div className="h-[21.667px] relative shrink-0 w-[17.333px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-doc.svg`} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-[2px] items-start relative shrink-0">
                            <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[18px] text-white tracking-[-0.18px] whitespace-nowrap">
                              <p className="leading-[26px]">Q3_GenAI_Benchmark_Report.docx</p>
                            </div>
                            <div className="flex flex-col font-mono font-normal justify-center relative shrink-0 text-[#94a3b8] text-[13px] whitespace-nowrap">
                              <p className="leading-[20px]">4.8 MB · 28 pages</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[rgba(30,27,75,0.5)] border border-[rgba(67,56,202,0.4)] border-solid flex gap-[6px] items-center px-[9px] py-[5px] relative rounded-[8px] shrink-0">
                          <div className="relative shrink-0 size-[15px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-check.svg`} />
                          </div>
                          <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#a5b4fc] text-[13px] tracking-[0.13px] whitespace-nowrap">
                            <p className="leading-[16px]">Conversion Complete</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                        <div className="flex items-center justify-between relative shrink-0 w-full">
                          <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase whitespace-nowrap">
                            <p className="leading-[14px]">EMBEDDING &amp; VECTORIZATION PIPELINE</p>
                          </div>
                          <div className="flex flex-col font-mono font-medium justify-center relative shrink-0 text-[#818cf8] text-[13px] whitespace-nowrap">
                            <p className="leading-[20px]">100% (Completed in 1.14s)</p>
                          </div>
                        </div>
                        <div className="bg-[#1e2230] flex flex-col h-[8px] items-start justify-center overflow-clip relative rounded-[9999px] shrink-0 w-full">
                          <div className="bg-[#6366f1] flex-1 min-h-px relative rounded-[9999px] shadow-[0px_0px_12px_0px_rgba(99,102,241,0.5)] w-full" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-[8px] relative shrink-0 w-full">
                        <div className="bg-[#11141d] border border-[#1e2230] border-solid flex gap-[4px] items-center px-[13px] py-[5px] relative rounded-[8px] shrink-0">
                          <div className="h-[12px] relative shrink-0 w-[15px]">
                            <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-folder.svg`} />
                          </div>
                          <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#94a3b8] text-[16px] whitespace-nowrap">
                            <p className="leading-[24px]">Add to folder:</p>
                          </div>
                          <div className="border border-[#6b7280] border-solid flex items-center pl-[13px] pr-[5px] py-[9px] relative shrink-0">
                            <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] tracking-[0.13px] whitespace-nowrap">
                              <p className="leading-[16px]">ML Papers</p>
                            </div>
                            <div className="relative shrink-0 size-[19.5px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-caret.svg`} />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-[8px] items-center relative shrink-0">
                          <button type="button" className="bg-[#4f46e5] flex gap-[4px] items-center justify-center px-[16px] py-[10px] relative rounded-[8px] shrink-0 cursor-pointer shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.2),0px_4px_6px_-4px_rgba(79,70,229,0.2)]">
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-[9/span_4] flex flex-col items-start pb-[240px] self-start relative">
                <div className="bg-[#161922] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start p-[25px] relative rounded-[12px] shrink-0 w-full">
                  <div className="flex items-center justify-between relative w-full">
                    <div className="flex gap-[4px] items-center relative shrink-0">
                      <div className="relative shrink-0 size-[15px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-settings.svg`} />
                      </div>
                      <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[18px] text-white tracking-[-0.18px] whitespace-nowrap">
                        <p className="leading-[26px]">Engine Settings</p>
                      </div>
                      <div className="flex flex-col items-start pl-[4px] relative shrink-0">
                        <div className="bg-[#222738] border border-[#2a3044] border-solid flex flex-col items-start px-[5px] py-[3px] relative rounded-[9999px] shrink-0">
                          <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#cbd5e1] text-[11px] tracking-[0.33px] whitespace-nowrap">
                            <p className="leading-[14px]">3 options</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#11141d] border border-[#1e2230] border-solid flex items-center justify-center p-px relative rounded-[8px] shrink-0 size-[28px]">
                      <div className="h-[5.55px] relative shrink-0 w-[9px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-chevron.svg`} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[12px] items-start pt-[16px] relative w-full">
                    {engineOptions.map((option, i) => (
                      <EngineOption
                        key={option.title}
                        option={option}
                        checked={checked[i]}
                        onToggle={() => toggle(i)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[12px] items-start pb-[48px] relative shrink-0 w-full">
              <div className="flex items-center justify-between relative shrink-0 w-full">
                <div className="flex flex-col items-start relative shrink-0">
                  <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[22px] text-white tracking-[-0.33px] whitespace-nowrap">
                    <p className="leading-[30px]">Recent Conversions</p>
                  </div>
                </div>
                <div className="flex gap-[4px] items-center relative shrink-0">
                  <button type="button" className="bg-[#161922] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center px-[13px] py-[7px] relative rounded-[8px] shrink-0 cursor-pointer">
                    <div className="h-[8px] relative shrink-0 w-[12px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-filter.svg`} />
                    </div>
                    <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                      <p className="leading-[16px]">Filter</p>
                    </div>
                  </button>
                  <button type="button" className="bg-[#161922] border border-[#2a3044] border-solid drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] items-center px-[13px] py-[7px] relative rounded-[8px] shrink-0 cursor-pointer">
                    <div className="relative shrink-0 size-[12px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-clear.svg`} />
                    </div>
                    <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[13px] text-center tracking-[0.13px] whitespace-nowrap">
                      <p className="leading-[16px]">Clear Logs</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-[#161922] border border-[#2a3044] border-solid flex flex-col items-start overflow-clip relative rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full">
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
                    <tr className="bg-[#12151e] border-b border-[#2a3044] border-solid">
                      <th className="text-left px-[24px] py-[19px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px]">FILE NAME</p>
                        </div>
                      </th>
                      <th className="text-left px-[16px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">ORIGINAL</p>
                          <p className="leading-[14px]">FORMAT</p>
                        </div>
                      </th>
                      <th className="text-left px-[16px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">OUTPUT</p>
                          <p className="leading-[14px]">SIZE</p>
                        </div>
                      </th>
                      <th className="text-left px-[16px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">CONVERTED</p>
                          <p className="leading-[14px]">DATE</p>
                        </div>
                      </th>
                      <th className="text-left px-[16px] py-[12px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px] mb-0">FOLDER</p>
                          <p className="leading-[14px]">DESTINATION</p>
                        </div>
                      </th>
                      <th className="text-right px-[24px] py-[19px]">
                        <div className="flex flex-col font-inter font-bold justify-center text-[#94a3b8] text-[11px] tracking-[0.55px] uppercase">
                          <p className="leading-[14px]">ACTIONS</p>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.map((row, i) => (
                      <tr
                        key={row.name}
                        className={`border-[#1e2230] ${
                          i === conversions.length - 1 ? "" : "border-b border-solid"
                        }`}
                      >
                        <td className="px-[24px] py-[20px]">
                          <div className="flex gap-[12px] items-center">
                            <div className="bg-[#222738] border border-[#2a3044] border-solid flex items-center justify-center p-px relative rounded-[8px] shrink-0 size-[36px]">
                              <div className={`relative shrink-0 ${row.iconCls}`}>
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={row.icon} />
                              </div>
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <div className="flex flex-col font-inter font-semibold text-[14px] text-white">
                                <p className="leading-[22px]">{row.name}</p>
                              </div>
                              <div className="flex flex-col font-inter font-semibold text-[#94a3b8] text-[11px] tracking-[0.33px]">
                                <p className="leading-[14px]">{row.meta}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-[16px] py-[20px]">
                          <div className="bg-[#222738] border border-[#2a3044] border-solid inline-flex items-start px-[9px] py-[1.5px] relative rounded-[4px]">
                            <div className="flex flex-col font-mono font-medium justify-center relative text-[#e2e8f0] text-[13px] whitespace-nowrap">
                              <p className="leading-[20px]">{row.format}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-[16px] py-[20px]">
                          <div className="flex flex-col font-mono font-normal justify-center relative text-[#94a3b8] text-[13px] whitespace-nowrap">
                            <p className="leading-[20px]">{row.size}</p>
                          </div>
                        </td>
                        <td className="px-[16px] py-[20px]">
                          <div className="flex flex-col font-inter font-normal justify-center relative text-[#94a3b8] text-[13px] whitespace-nowrap">
                            <p className="leading-[18px]">{row.date}</p>
                          </div>
                        </td>
                        <td className="px-[16px] py-[20px]">
                          <div className="bg-[#222738] border border-[#2a3044] border-solid inline-flex gap-[4px] items-center px-[9px] py-[5px] relative rounded-[9999px]">
                            <div className="h-[9.333px] relative shrink-0 w-[11.667px]">
                              <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-folder-small.svg`} />
                            </div>
                            <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#e2e8f0] text-[11px] tracking-[0.33px] whitespace-nowrap">
                              <p className="leading-[14px]">{row.folder}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-[24px] py-[20px]">
                          <div className="flex gap-[4px] items-center justify-end">
                            <button type="button" className="flex flex-col items-center justify-center p-[4px] relative rounded-[4px] shrink-0 cursor-pointer">
                              <div className="relative shrink-0 size-[12px]">
                                <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/pc-action.svg`} />
                              </div>
                            </button>
                            <div className="relative rounded-[4px] shrink-0 size-[8px]" />
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
  );
}
