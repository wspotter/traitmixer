export const MARKER_START = "<!-- traitmixer:start -->";
export const MARKER_END = "<!-- traitmixer:end -->";

export function injectManagedOverlay(existing: string, overlay: string): string {
  const block = `${MARKER_START}\n${overlay}\n${MARKER_END}`;
  const startIdx = existing.indexOf(MARKER_START);
  const endIdx = existing.indexOf(MARKER_END, startIdx + MARKER_START.length);

  if (startIdx !== -1 && endIdx !== -1) {
    return existing.slice(0, startIdx) + block + existing.slice(endIdx + MARKER_END.length);
  }

  return existing.trimEnd() + "\n\n" + block + "\n";
}

export function removeManagedOverlay(existing: string): {
  changed: boolean;
  content: string;
} {
  const startIdx = existing.indexOf(MARKER_START);
  if (startIdx === -1) {
    return { changed: false, content: existing };
  }

  const endIdx = existing.indexOf(MARKER_END, startIdx + MARKER_START.length);
  if (endIdx === -1) {
    return { changed: false, content: existing };
  }

  const before = existing.slice(0, startIdx).trimEnd();
  const after = existing.slice(endIdx + MARKER_END.length).trimStart();
  const content = [before, after].filter(Boolean).join("\n\n");

  return {
    changed: true,
    content: content ? `${content}\n` : "",
  };
}
