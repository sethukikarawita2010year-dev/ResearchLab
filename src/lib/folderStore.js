import { useSyncExternalStore } from "react";

const A = "/assets";

export const defaultFolders = [
  { name: "All Papers", count: "14", icon: `${A}/ws-folder-active.svg`, muted: false },
  { name: "Thesis", count: "4", icon: `${A}/ws-folder-muted.svg`, muted: true },
  { name: "ML Papers", count: "8", icon: `${A}/ws-folder-muted.svg`, muted: true },
];

const byCountDesc = (a, b) => Number(b.count) - Number(a.count);

let folders = [...defaultFolders].sort(byCountDesc);

const listeners = new Set();

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
  listeners.forEach((fn) => fn());
  return true;
}

export function useFolders() {
  return useSyncExternalStore(subscribeFolders, getFolders);
}