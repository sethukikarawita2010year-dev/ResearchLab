import { useSyncExternalStore } from "react";

import {
  deleteSessionApi,
  listSessions,
  saveSession,
} from "./api";

let sessions = [];
const listeners = new Set();
const timers = new Map();

function emit() {
  listeners.forEach((fn) => fn());
}

function schedulePersist(id, delay = 400) {
  if (!id) return;
  if (timers.has(id)) clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id);
      const rec = getSession(id);
      if (rec) saveSession(rec).catch(() => {});
    }, delay),
  );
}

export function getSessions() {
  return sessions;
}

export function getSession(id) {
  if (!id) return null;
  return sessions.find((s) => s.id === id) || null;
}

export async function hydrateSessions() {
  try {
    sessions = await listSessions();
    emit();
  } catch {
    /* keep whatever is cached */
  }
}

export function clearSessions() {
  sessions = [];
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  emit();
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
    annotations: [],
    webSearch: true,
    ...record,
  };
  sessions = [full, ...sessions];
  emit();
  schedulePersist(full.id, 0);
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
  emit();
  schedulePersist(id);
}

export function deleteSession(id) {
  if (!id) return;
  sessions = sessions.filter((s) => s.id !== id);
  emit();
  deleteSessionApi(id).catch(() => {});
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
