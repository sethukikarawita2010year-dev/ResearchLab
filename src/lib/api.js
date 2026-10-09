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

export function conversionDownloadUrl(downloadUrl) {
  if (!downloadUrl) return null;
  if (/^https?:\/\//.test(downloadUrl)) return downloadUrl;

  const base = API_BASE.replace(/\/$/, "");
  const path = downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;

  // Guard against a `download_url` that already includes the API prefix.
  if (base.endsWith("/api") && path.startsWith("/api/")) return path;

  return `${base}${path}`;
}
