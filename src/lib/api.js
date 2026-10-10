const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function readError(res) {
  try {
    const data = await res.json();
    if (data && typeof data.detail === "string") return data.detail;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function createSession(title) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function renameSession(sessionId, title) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function uploadPdf(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function convertFile(file, folder) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder || "All Papers");
  const res = await fetch(`${API_BASE}/convert`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function listConversions() {
  const res = await fetch(`${API_BASE}/conversions`);
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return Array.isArray(data.conversions) ? data.conversions : [];
}

export async function analyzePaper({ documentId, language = "auto" }) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, language }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function chatMessage({
  documentId,
  documentIds = [],
  chatId,
  messages,
  webSearch = true,
  language = "auto",
  annotations = [],
}) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_id: documentId,
      document_ids: documentIds,
      chat_id: chatId || null,
      messages,
      web_search: webSearch,
      language,
      annotations,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function resolveSource({ url }) {
  const res = await fetch(`${API_BASE}/resolve-source`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchSourceContent(url) {
  const res = await fetch(`${API_BASE}/source-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export function documentUrl(documentId) {
  if (!documentId) return null;
  return `${API_BASE.replace(/\/$/, "")}/document/${encodeURIComponent(documentId)}`;
}

export function conversionDownloadUrl(downloadUrl) {
  if (!downloadUrl) return null;
  if (/^https?:\/\//.test(downloadUrl)) return downloadUrl;

  const base = API_BASE.replace(/\/$/, "");
  const path = downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;

  // Guard against a `download_url` that already includes the API prefix.
  if (base.endsWith("/api") && path.startsWith("/api/")) return path;

  return `${base}${path}`;
}
