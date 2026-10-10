import { useSyncExternalStore } from "react";

import { createFolderApi, incrementFolderApi, listFolders } from "./api";

const A = "/assets";

export const defaultFolders = [
  { name: "All Papers", count: "0", icon: `${A}/ws-folder-active.svg`, muted: false },
];

const byCountDesc = (a, b) => Number(b.count) - Number(a.count);

function decorate(folder) {
  const muted = Boolean(folder.muted);
  return {
    name: folder.name,
    count: String(folder.count ?? 0),
    muted,
    icon: `${A}/${muted ? "ws-folder-muted" : "ws-folder-active"}.svg`,
  };
}

function sortFolders(list) {
  return [...list].sort(byCountDesc);
}

let folders = sortFolders([...defaultFolders]);

const listeners = new Set();

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

export async function hydrateFolders() {
  try {
    const list = await listFolders();
    if (Array.isArray(list) && list.length) {
      folders = sortFolders(list.map(decorate));
      emit();
    }
  } catch {
    /* keep defaults */
  }
}

export function clearFolders() {
  folders = sortFolders([...defaultFolders]);
  emit();
}

export function createFolder(name) {
  const trimmed = (name || "").trim();
  if (!trimmed || folders.some((f) => f.name === trimmed)) return false;
  folders = sortFolders([
    ...folders,
    { name: trimmed, count: "0", icon: `${A}/ws-folder-muted.svg`, muted: true },
  ]);
  emit();
  createFolderApi(trimmed).catch(() => {});
  return true;
}

export function incrementFolderCount(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  const exists = folders.some((f) => f.name === trimmed);
  if (!exists) {
    folders = sortFolders([
      ...folders,
      { name: trimmed, count: "1", icon: `${A}/ws-folder-muted.svg`, muted: true },
    ]);
  } else {
    folders = folders.map((f) =>
      f.name === trimmed ? { ...f, count: String(Number(f.count || 0) + 1) } : f,
    );
  }
  emit();
  incrementFolderApi(trimmed).catch(() => {});
}

export function incrementAllPapers() {
  incrementFolderCount("All Papers");
}

export function useFolders() {
  return useSyncExternalStore(subscribeFolders, getFolders);
}
