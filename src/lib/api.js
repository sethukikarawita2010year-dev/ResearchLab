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

async function jsonFetch(path, { method = "GET", body, ...rest } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    ...rest,
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

// --- Chat sessions (DB-backed, per user) -----------------------------------

export async function createSession(title) {
  return jsonFetch("/sessions", { method: "POST", body: { title } });
}

export function renameSession(sessionId, title) {
  return jsonFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: { title },
  });
}

export async function listSessions() {
  const data = await jsonFetch("/sessions");
  return Array.isArray(data.sessions) ? data.sessions : [];
}

export function saveSession(record) {
  return jsonFetch("/sessions", { method: "POST", body: record });
}

export function patchSession(sessionId, patch) {
  return jsonFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function deleteSessionApi(sessionId) {
  return jsonFetch(`/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

// --- Folders (DB-backed, per user) -----------------------------------------

export async function listFolders() {
  const data = await jsonFetch("/folders");
  return Array.isArray(data.folders) ? data.folders : [];
}

export function createFolderApi(name) {
  return jsonFetch("/folders", { method: "POST", body: { name } });
}

export function incrementFolderApi(name) {
  return jsonFetch(`/folders/${encodeURIComponent(name)}/increment`, { method: "POST" });
}

// --- Uploads / conversions -------------------------------------------------

export async function uploadPdf(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function listUploads() {
  const data = await jsonFetch("/uploads");
  return Array.isArray(data.uploads) ? data.uploads : [];
}

export async function convertFile(file, folder) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder || "All Papers");
  const res = await fetch(`${API_BASE}/convert`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function listConversions() {
  const data = await jsonFetch("/conversions");
  return Array.isArray(data.conversions) ? data.conversions : [];
}

export function analyzePaper({ documentId, language = "auto" }) {
  return jsonFetch("/analyze", {
    method: "POST",
    body: { document_id: documentId, language },
  });
}

export function chatMessage({
  documentId,
  documentIds = [],
  chatId,
  messages,
  webSearch = true,
  language = "auto",
  annotations = [],
}) {
  return jsonFetch("/chat", {
    method: "POST",
    body: {
      document_id: documentId,
      document_ids: documentIds,
      chat_id: chatId || null,
      messages,
      web_search: webSearch,
      language,
      annotations,
    },
  });
}

export function resolveSource({ url }) {
  return jsonFetch("/resolve-source", { method: "POST", body: { url } });
}

export function fetchSourceContent(url) {
  return jsonFetch("/source-content", { method: "POST", body: { url } });
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
