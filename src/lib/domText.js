// Helpers that map a live DOM subtree to a flat character stream (its text
// nodes concatenated) so annotations can be anchored by character offsets and
// re-highlighted without ever mutating the rendered markup.

function textNodes(root) {
  if (!root) return [];
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) out.push(node);
  return out;
}

function offsetAtPoint(root, node, offset) {
  try {
    const range = document.createRange();
    range.setStart(root, 0);
    range.setEnd(node, offset);
    return range.toString().length;
  } catch {
    return null;
  }
}

export function selectionOffsets(root, selection) {
  const sel = selection || (typeof window !== "undefined" ? window.getSelection() : null);
  if (!root || !sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  if (!root.contains(range.commonAncestorContainer)) return null;
  const start = offsetAtPoint(root, range.startContainer, range.startOffset);
  const end = offsetAtPoint(root, range.endContainer, range.endOffset);
  if (start == null || end == null || end <= start) return null;
  const text = range.toString();
  if (!text.trim()) return null;
  return { start, end, text };
}

export function rangeFromOffsets(root, start, end, expected) {
  if (!root || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const total = (root.textContent || "").length;
  if (start < 0 || start >= total || end > total) return null;

  const nodes = textNodes(root);
  let acc = 0;
  let startNode = null;
  let startOff = 0;
  let endNode = null;
  let endOff = 0;
  for (const node of nodes) {
    const len = node.nodeValue.length;
    if (!startNode && start <= acc + len) {
      startNode = node;
      startOff = start - acc;
    }
    if (!endNode && end <= acc + len) {
      endNode = node;
      endOff = end - acc;
    }
    acc += len;
    if (startNode && endNode) break;
  }
  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, Math.max(0, Math.min(startOff, startNode.nodeValue.length)));
    range.setEnd(endNode, Math.max(0, Math.min(endOff, endNode.nodeValue.length)));
    if (expected) {
      const norm = (value) => value.replace(/\s+/g, " ").trim();
      if (norm(range.toString()) !== norm(expected)) {
        const idx = (root.textContent || "").indexOf(expected);
        if (idx < 0) return null;
        return rangeFromOffsets(root, idx, idx + expected.length, null);
      }
    }
    return range;
  } catch {
    return null;
  }
}

export function rangeRects(root, range) {
  if (!root || !range) return [];
  const base = root.getBoundingClientRect();
  const rects = [];
  for (const rect of range.getClientRects()) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    rects.push({
      left: rect.left - base.left,
      top: rect.top - base.top,
      width: rect.width,
      height: rect.height,
    });
  }
  return rects;
}

export function clearSelection() {
  try {
    window.getSelection()?.removeAllRanges();
  } catch {
    /* ignore */
  }
}

export function selectionRect(selection) {
  const sel = selection || (typeof window !== "undefined" ? window.getSelection() : null);
  try {
    if (!sel || sel.rangeCount === 0) return null;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  } catch {
    return null;
  }
}
