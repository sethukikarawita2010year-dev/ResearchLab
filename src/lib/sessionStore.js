import { useSyncExternalStore } from "react";

const KEY = "researchlab.sessions";

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((s) => s && typeof s.id === "string");
  } catch {
    return [];
  }
}

let sessions = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    /* storage full or unavailable */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getSessions() {
  return sessions;
}

export function getSession(id) {
  if (!id) return null;
  return sessions.find((s) => s.id === id) || null;
}

export function createSessionRecord(record) {
  if (!record || !record.id) return null;
  const existing = sessions.find((s) => s.id === record.id);
  if (existing) {
    updateSession(record.id, record);
    return getSession(record.id);
  }
  const full = {
    createdAt: Date.now(),
    messages: [],
    notepad: "",
    extraDocs: [],
    webSources: [],
    ...record,
  };
  sessions = [full, ...sessions];
  persist();
  emit();
  return full;
}

export function updateSession(id, patch) {
  if (!id) return;
  let found = false;
  sessions = sessions.map((s) => {
    if (s.id === id) {
      found = true;
      return { ...s, ...patch };
    }
    return s;
  });
  if (!found) {
    sessions = [
      { createdAt: Date.now(), messages: [], extraDocs: [], webSources: [], ...patch, id },
      ...sessions,
    ];
  }
  persist();
  emit();
}

export function deleteSession(id) {
  if (!id) return;
  sessions = sessions.filter((s) => s.id !== id);
  persist();
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSessions() {
  return useSyncExternalStore(subscribe, getSessions);
}
