import { useSyncExternalStore } from "react";

const A = "/assets";
const KEY = "researchlab.folders";

export const defaultFolders = [
  { name: "All Papers", count: "14", icon: `${A}/ws-folder-active.svg`, muted: false },
  { name: "Thesis", count: "4", icon: `${A}/ws-folder-muted.svg`, muted: true },
  { name: "ML Papers", count: "8", icon: `${A}/ws-folder-muted.svg`, muted: true },
];

const byCountDesc = (a, b) => Number(b.count) - Number(a.count);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!Array.isArray(raw) || !raw.length) return null;
    const folders = raw.filter((f) => f && typeof f.name === "string");
    return folders.length ? folders : null;
  } catch {
    return null;
  }
}

let folders = load() || [...defaultFolders].sort(byCountDesc);

const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(folders));
  } catch {
    /* storage full or unavailable */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getFolders() {
  return folders;
}

export function subscribeFolders(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function createFolder(name) {
  const trimmed = name.trim();
  if (!trimmed || folders.some((f) => f.name === trimmed)) return false;
  folders = [...folders, { name: trimmed, count: "0", icon: `${A}/ws-folder-muted.svg`, muted: true }].sort(byCountDesc);
  persist();
  emit();
  return true;
}

export function incrementFolderCount(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  const exists = folders.some((f) => f.name === trimmed);
  if (!exists) {
    folders = [
      ...folders,
      { name: trimmed, count: "1", icon: `${A}/ws-folder-muted.svg`, muted: true },
    ];
    persist();
    emit();
    return;
  }
  folders = folders.map((f) =>
    f.name === trimmed ? { ...f, count: String(Number(f.count || 0) + 1) } : f,
  );
  persist();
  emit();
}

export function incrementAllPapers() {
  incrementFolderCount("All Papers");
}

export function useFolders() {
  return useSyncExternalStore(subscribeFolders, getFolders);
}
