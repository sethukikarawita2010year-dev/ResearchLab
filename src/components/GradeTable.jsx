import { useState } from "react";
import RichText from "./RichText";

function markLabel(aspect) {
  if (aspect.notAssessed) return "Not assessed";
  return `${aspect.marks}/${aspect.max}`;
}

export function GradeCard({ grade, onCitation, openableFor }) {
  if (!grade) return null;
  const aspects = grade.aspects || [];
  return (
    <div className="relative bg-[#161922] border border-[#2a3044] content-stretch flex flex-col rounded-[12px] shrink-0 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between px-[17px] pt-[15px] pb-[10px] border-b border-[#2a3044]">
        <span className="font-inter font-semibold text-[#e2e8f0] text-[14px] tracking-[0.13px]">
          Paper grading
        </span>
        <span className="font-mono text-[#a5b4fc] text-[13px]">
          {grade.total}/{grade.totalMax}
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[#64748b]">
            <th className="text-left font-inter font-semibold text-[11px] tracking-[0.55px] uppercase px-[17px] py-[8px]">
              Aspect
            </th>
            <th className="text-right font-inter font-semibold text-[11px] tracking-[0.55px] uppercase px-[17px] py-[8px] w-[110px]">
              Marks
            </th>
          </tr>
        </thead>
        <tbody>
          {aspects.map((aspect) => (
            <AspectRows
              key={aspect.key}
              aspect={aspect}
              onCitation={onCitation}
              openableFor={openableFor}
            />
          ))}
          <tr className="border-t border-[#2a3044]">
            <td className="px-[17px] py-[12px] font-inter font-semibold text-[#e2e8f0] text-[13px]">
              Total
            </td>
            <td className="px-[17px] py-[12px] text-right font-mono font-semibold text-[#e2e8f0] text-[14px]">
              {grade.total}/{grade.totalMax}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="px-[17px] py-[10px] border-t border-[#2a3044]">
        <p className="font-inter text-[#64748b] text-[11px] italic">
          AI-generated estimate, not an official grade.
        </p>
      </div>
    </div>
  );
}

function AspectRows({ aspect, onCitation, openableFor }) {
  return (
    <>
      <tr className="align-top">
        <td className="px-[17px] pt-[12px] pb-[4px] font-inter text-[#cbd5e1] text-[13px]">
          {aspect.name}
          {aspect.similarity != null && (
            <span className="block font-mono text-[#94a3b8] text-[11px] mt-[2px]">
              Similarity: {aspect.similarity}%
            </span>
          )}
        </td>
        <td className="px-[17px] pt-[12px] pb-[4px] text-right font-mono text-[13px] text-[#cbd5e1] whitespace-nowrap">
          {markLabel(aspect)}
        </td>
      </tr>
      <tr>
        <td colSpan={2} className="px-[17px] pb-[12px]">
          <div className="font-inter text-[#94a3b8] text-[13px] leading-[20px]">
            <RichText
              text={aspect.reasoning || ""}
              citations={aspect.citations}
              onCitation={onCitation}
              openableFor={openableFor}
            />
          </div>
          {aspect.matches && aspect.matches.length > 0 && (
            <ul className="mt-[6px] flex flex-col gap-[4px]">
              {aspect.matches.map((match, index) => (
                <li
                  key={index}
                  className="font-inter text-[#64748b] text-[12px] leading-[18px] pl-[10px] border-l border-[#2a3044]"
                >
                  “{match.text}”
                  <span className="text-[#94a3b8]">
                    {" "}
                    — {match.source}
                    {match.page ? ` (p. ${match.page})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </td>
      </tr>
    </>
  );
}

export function GradePermissionCard({ options, onRun, busy }) {
  const [uploads, setUploads] = useState(Boolean(options?.allowUploads));
  const [web, setWeb] = useState(Boolean(options?.allowWeb));
  const canUploads = Boolean(options?.canCompareUploads);
  const webOn = Boolean(options?.webOn);
  const nothing = !canUploads && !webOn;

  return (
    <div className="relative bg-[#161922] border border-[#2a3044] content-stretch flex flex-col gap-[12px] items-start p-[17px] rounded-[12px] shrink-0 w-full">
      <span className="font-inter font-semibold text-[#e2e8f0] text-[14px]">
        Run plagiarism check?
      </span>
      <p className="font-inter text-[#94a3b8] text-[13px] leading-[20px]">
        Before the originality mark is graded, choose what the paper may be compared against.
        The rest of the rubric is graded from the paper itself.
      </p>
      <div className="flex flex-col gap-[8px] w-full">
        <label
          className={`flex items-center gap-[10px] ${
            canUploads ? "cursor-pointer" : "opacity-50"
          }`}
        >
          <input
            type="checkbox"
            checked={uploads && canUploads}
            disabled={!canUploads}
            onChange={(e) => setUploads(e.target.checked)}
            className="size-[15px] accent-[#4f46e5]"
          />
          <span className="font-inter text-[#cbd5e1] text-[13px]">
            Compare against my other uploaded files
            {!canUploads && (
              <span className="text-[#64748b] text-[12px]">
                {" "}
                — no other relevant files in the source tab
              </span>
            )}
          </span>
        </label>
        <label
          className={`flex items-center gap-[10px] ${webOn ? "cursor-pointer" : "opacity-50"}`}
        >
          <input
            type="checkbox"
            checked={web && webOn}
            disabled={!webOn}
            onChange={(e) => setWeb(e.target.checked)}
            className="size-[15px] accent-[#4f46e5]"
          />
          <span className="font-inter text-[#cbd5e1] text-[13px]">
            Compare against the web
            {!webOn && (
              <span className="text-[#64748b] text-[12px]"> — web search is off</span>
            )}
          </span>
        </label>
      </div>
      <button
        type="button"
        disabled={busy || nothing}
        onClick={() => onRun({ allowUploads: uploads && canUploads, allowWeb: web && webOn })}
        className="bg-[#4f46e5] flex items-center justify-center px-[16px] py-[9px] rounded-[8px] cursor-pointer disabled:opacity-60 disabled:cursor-default"
      >
        <span className="font-inter font-semibold text-white text-[13px]">
          {busy ? "Grading…" : "Run grading"}
        </span>
      </button>
    </div>
  );
}
