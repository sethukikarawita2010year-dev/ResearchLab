const pending = new Map();

export function setPendingAttachment(sessionId, file) {
  if (!sessionId || !file) return;
  pending.set(sessionId, file);
}

export function takePendingAttachment(sessionId) {
  if (!sessionId) return null;
  const file = pending.get(sessionId) || null;
  if (file) pending.delete(sessionId);
  return file;
}
