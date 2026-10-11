import { useMemo, useSyncExternalStore } from "react";

import {
  createFolderApi,
  deleteFolderApi,
  listFolders,
  renameFolderApi,
} from "./api";
import {
  getSessions,
  reassignFolder,
  removeFolderSessions,
  subscribeSessions,
} from "./sessionStore";

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
      { name: trimmed, count: "0", icon: `${A}/ws-folder-muted.svg`, muted: true },
    ]);
  }
  emit();
}

export function incrementAllPapers() {
  incrementFolderCount("All Papers");
}

function applyServerFolders(list) {
  if (Array.isArray(list) && list.length) {
    folders = sortFolders(list.map(decorate));
  }
}

export async function renameFolder(oldName, newName) {
  const old = (oldName || "").trim();
  const next = (newName || "").trim();
  if (!old || !next || old === next || old === "All Papers") return false;
  try {
    const list = await renameFolderApi(old, next);
    applyServerFolders(list);
    reassignFolder(old, next);
    emit();
    return true;
  } catch {
    hydrateFolders();
    return false;
  }
}

export async function deleteFolder(name, deleteChats) {
  const target = (name || "").trim();
  if (!target || target === "All Papers") return false;
  try {
    const list = await deleteFolderApi(target, Boolean(deleteChats));
    if (deleteChats) {
      removeFolderSessions(target);
    } else {
      reassignFolder(target, "All Papers");
    }
    if (Array.isArray(list) && list.length) {
      folders = sortFolders(list.map(decorate));
    } else {
      folders = folders.filter((f) => f.name !== target);
    }
    emit();
    return true;
  } catch {
    hydrateFolders();
    return false;
  }
}

const isRealChat = (s) =>
  Boolean(s.uploadId) || (Array.isArray(s.messages) && s.messages.length > 0);

export function useFolders() {
  const list = useSyncExternalStore(subscribeFolders, getFolders);
  const sessions = useSyncExternalStore(subscribeSessions, getSessions);
  return useMemo(() => {
    const chats = sessions.filter(isRealChat);
    const counts = new Map();
    chats.forEach((s) => {
      const f = s.folder || "All Papers";
      counts.set(f, (counts.get(f) || 0) + 1);
    });
    const byName = new Map(list.map((f) => [f.name, f]));
    counts.forEach((_, name) => {
      if (!byName.has(name)) {
        byName.set(name, { name, count: "0", muted: true, icon: `${A}/ws-folder-muted.svg` });
      }
    });
    return [...byName.values()]
      .map((f) => {
        const count = f.name === "All Papers" ? chats.length : counts.get(f.name) || 0;
        return {
          ...f,
          count: String(count),
          icon: f.muted ? `${A}/ws-folder-muted.svg` : `${A}/ws-folder-active.svg`,
        };
      })
      .sort((a, b) => Number(b.count) - Number(a.count));
  }, [list, sessions]);
}
