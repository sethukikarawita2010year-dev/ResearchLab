import { Fragment } from "react";

const A = "/assets";

const TOKEN_RE = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|==([^=]+)==|\$([^$]+)\$|\[([^\[\]]+)\]/g;

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url || "";
  }
}

function CitationPill({ label, web }) {
  return (
    <span className="bg-[rgba(30,27,75,0.7)] border border-[rgba(67,56,202,0.5)] border-solid content-stretch inline-flex items-center gap-[6px] px-[9px] py-[2px] relative rounded-full align-middle mx-[2px] my-[1px]">
      <img
        alt=""
        src={web ? `${A}/chat-globe.svg` : `${A}/chat-doc.svg`}
        className="shrink-0 size-[11px]"
      />
      <span className="font-inter font-semibold text-[#a5b4fc] text-[11px] text-center tracking-[0.33px] leading-[14px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}

function CitationToken({ bracket, citations }) {
  const b = (bracket || "").trim();
  const pageMatch = b.match(/\b(\d+)\b/);
  const secMatch = b.match(
    /(?:\u00A7|Sect(?:ion)?\.?|section)\s*([0-9][0-9a-zA-Z.]*\b)/i,
  );
  const isPdf = /^p(?:ages?|p\.?)?\s?\.?\s*\d/i.test(b) || Boolean(secMatch);
  if (isPdf) {
    const label = [secMatch && `\u00A7${secMatch[1]}`, pageMatch && `p. ${pageMatch[1]}`]
      .filter(Boolean)
      .join(" ");
    if (label) return <CitationPill label={label} web={false} />;
    return <span>[{bracket}]</span>;
  }
  if (/^\d+$/.test(b)) {
    const n = Number(b);
    const webCitations = (citations || []).filter((c) => c && c.type === "web");
    const cited = webCitations.find((c) => c.marker === n) || webCitations[n - 1];
    if (cited) {
      const label = cited.title || hostOf(cited.url || "");
      if (label) return <CitationPill label={label} web />;
    }
    return <span>[{bracket}]</span>;
  }
  return <span>[{bracket}]</span>;
}

function Inline({ text, citations }) {
  const parts = [];
  let last = 0;
  let key = 0;
  let match;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [boldItalic, bold, italic, code, highlight, math, bracket] = [
      match[1],
      match[2],
      match[3],
      match[4],
      match[5],
      match[6],
      match[7],
    ];
    const content = boldItalic ?? bold ?? italic ?? code ?? highlight ?? math ?? "";

    let node;
    if (code != null) {
      node = (
        <code className="bg-[#12151e] border border-[#2a3044] border-solid font-mono px-[6px] py-[1px] rounded-[4px] text-[13px] text-[#a5b4fc]">
          {content}
        </code>
      );
    } else if (math != null) {
      node = (
        <code className="bg-[#0b0d13] border border-[rgba(42,48,68,0.6)] border-solid font-mono px-[6px] py-[1px] rounded-[4px] text-[13px] text-[#c7d2fe]">
          {content}
        </code>
      );
    } else if (highlight != null) {
      node = (
        <mark className="bg-[rgba(99,102,241,0.22)] px-[2px] rounded-[3px] text-[#c7d2fe]">
          {content}
        </mark>
      );
    } else if (boldItalic != null) {
      node = (
        <strong className="font-bold italic text-white">{content}</strong>
      );
    } else if (bold != null) {
      node = <strong className="font-bold text-white">{content}</strong>;
    } else if (italic != null) {
      node = <em className="italic">{content}</em>;
    } else if (bracket != null) {
      node = <CitationToken bracket={bracket} citations={citations} />;
    }

    parts.push(<Fragment key={key++}>{node}</Fragment>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Blocks({ text, citations }) {
  const lines = String(text).split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", text: heading[2] });
      i += 1;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      const items = [];
      while (i < lines.length) {
        const b = lines[i].match(/^\s*[-*]\s+(.+)$/);
        if (!b) break;
        items.push(b[1]);
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      const items = [];
      while (i < lines.length) {
        const o = lines[i].match(/^\s*\d+\.\s+(.+)$/);
        if (!o) break;
        items.push(o[1]);
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const para = [];
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) break;
      if (
        /^\s*[-*]\s+/.test(l) ||
        /^\s*\d+\.\s+/.test(l) ||
        /^(#{1,6})\s+/.test(l)
      ) {
        break;
      }
      para.push(l.trim());
      i += 1;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  if (!blocks.length) return <span>{text}</span>;

  return (
    <div className="flex flex-col gap-[6px] w-full">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4
              key={index}
              className="font-semibold text-[#f1f5f9] text-[15px] tracking-[-0.15px] leading-[24px] w-full"
            >
              <Inline text={block.text} citations={citations} />
            </h4>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="flex flex-col gap-[3px] list-disc pl-[22px] w-full">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-[2px]">
                  <Inline text={item} citations={citations} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="flex flex-col gap-[3px] list-decimal pl-[22px] w-full">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-[2px]">
                  <Inline text={item} citations={citations} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={index} className="w-full">
            <Inline text={block.text} citations={citations} />
          </p>
        );
      })}
    </div>
  );
}

export default function RichText({ text, citations }) {
  return <Blocks text={text} citations={citations} />;
}