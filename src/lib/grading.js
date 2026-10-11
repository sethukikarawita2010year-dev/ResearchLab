export const GRADING_RUBRIC = [
  { key: "title_abstract_intro", name: "Title, abstract and introduction", max: 10 },
  { key: "literature_review", name: "Literature review", max: 10 },
  { key: "methodology", name: "Methodology", max: 20 },
  { key: "results_analysis", name: "Results and analysis", max: 20 },
  { key: "discussion_conclusion", name: "Discussion and conclusion", max: 10 },
  { key: "writing_structure", name: "Writing, structure and formatting", max: 10 },
  { key: "referencing_citations", name: "Referencing and citations", max: 10 },
  { key: "plagiarism", name: "Plagiarism / originality", max: 10 },
];

export const GRADING_MAX_TOTAL = GRADING_RUBRIC.reduce((sum, item) => sum + item.max, 0);

const GRADE_RE =
  /\b(grade|grading|mark my|marks for|score my|assess my|assessment of|rate my|evaluate my)\b[^.!?\n]{0,40}\b(paper|essay|report|thesis|dissertation|document|it|this)\b|\b(grade|grading)\s+(system|the paper|my paper|this paper)\b|\bhow\s+(would|do)\s+you\s+grade\b/i;

const PLAGIARISM_RE = /\b(plagiar\w*|originality|similarity|turnitin|copy(?:ing|ied)?|duplicat\w*|match(?:es|ing)?)\b/i;

const UPLOADS_RE =
  /\b(only|just|compare\s+against|against|from)\b[^.!?\n]{0,30}\b(my\s+)?(other\s+)?(uploaded|uploads|files|papers|documents|library)\b|\buploaded\s+(files|papers|documents)\b/i;

const WEB_RE =
  /\b(web|internet|online|google|search)\b[^.!?\n]{0,20}\b(compare|check|search|against|sources?|matching)?\b|\b(compare|check)\b[^.!?\n]{0,20}\b(web|internet|online)\b/i;

const BOTH_RE = /\bboth\b/i;

const ASPECT_HINTS = [
  { key: "plagiarism", re: PLAGIARISM_RE },
  {
    key: "literature_review",
    re: /\b(literature\s+review|lit\s+review|related\s+work|background\s+review)\b/i,
  },
  { key: "methodology", re: /\b(method(?:ology|s)?|approach|experimental\s+design)\b/i },
  { key: "results_analysis", re: /\b(results?|analysis|findings|data)\b/i },
  {
    key: "discussion_conclusion",
    re: /\b(discussion|conclusion|conclusions|takeaways?)\b/i,
  },
  {
    key: "writing_structure",
    re: /\b(writing|structure|formatting|grammar|clarity|language)\b/i,
  },
  {
    key: "referencing_citations",
    re: /\b(referencing|references?|citations?|bibliograph\w*)\b/i,
  },
  {
    key: "title_abstract_intro",
    re: /\b(title|abstract|introduction|intro)\b/i,
  },
];

function words(text) {
  return String(text || "").toLowerCase();
}

export function detectGradeRequest(text) {
  return GRADE_RE.test(words(text));
}

export function detectPlagiarismRequested(text) {
  return PLAGIARISM_RE.test(words(text));
}

export function detectGradeAspects(text) {
  const t = words(text);
  if (!t.trim()) return null;
  const keys = new Set();
  for (const { key, re } of ASPECT_HINTS) {
    if (re.test(t)) keys.add(key);
  }
  if (keys.size === 0) return null;
  return GRADING_RUBRIC.filter((item) => keys.has(item.key)).map((item) => item.key);
}

export function detectGradeSourceIntent(text) {
  const t = words(text);
  if (BOTH_RE.test(t)) return "both";
  const uploads = UPLOADS_RE.test(t);
  const web = WEB_RE.test(t);
  if (uploads && web) return "both";
  if (uploads) return "uploads";
  if (web) return "web";
  return null;
}

export function stripCitationMarkers(text) {
  return String(text || "")
    .replace(/\[[^\[\]]+\]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function gradeToText(grade) {
  if (!grade) return "";
  const lines = ["Grade report", ""];
  for (const aspect of grade.aspects || []) {
    const marks = aspect.notAssessed ? "Not assessed" : `${aspect.marks}/${aspect.max}`;
    lines.push(`${aspect.name}: ${marks}`);
    if (aspect.reasoning) lines.push(stripCitationMarkers(aspect.reasoning));
    lines.push("");
  }
  lines.push(`Total: ${grade.total}/${grade.totalMax}`);
  lines.push("");
  lines.push("AI-generated estimate, not an official grade.");
  return lines.join("\n");
}
