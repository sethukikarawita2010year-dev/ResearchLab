const API_BASE = import.meta.env.VITE_API_URL || "/api";

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch {
    throw new AuthError("Could not reach the server.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }

  if (!res.ok) {
    const detail =
      data && typeof data.detail === "string"
        ? data.detail
        : `Request failed (${res.status})`;
    throw new AuthError(detail, res.status);
  }
  return data;
}

export function signup(payload) {
  return request("/auth/signup", { method: "POST", body: payload });
}

export function login(payload) {
  return request("/auth/login", { method: "POST", body: payload });
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

export async function me() {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  } catch {
    return null;
  }
  if (res.status === 401) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }
  if (!res.ok) return null;
  return data ? data.user : null;
}

export function getProfile() {
  return request("/auth/profile");
}

export function updateProfile(patch) {
  return request("/auth/profile", { method: "PATCH", body: patch });
}

export function verifyPassword(password) {
  return request("/auth/verify-password", { method: "POST", body: { password } });
}

export function changePassword(payload) {
  return request("/auth/change-password", { method: "POST", body: payload });
}

export function deleteAccount() {
  return request("/auth/account", { method: "DELETE" });
}

export async function uploadProfilePicture(file) {
  const form = new FormData();
  form.append("file", file);
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/profile/picture`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
  } catch {
    throw new AuthError("Could not reach the server.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }

  if (!res.ok) {
    const detail =
      data && typeof data.detail === "string"
        ? data.detail
        : `Request failed (${res.status})`;
    throw new AuthError(detail, res.status);
  }
  return data;
}
