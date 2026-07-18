export function shouldIgnoreShortcut(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const isEditable = target.isContentEditable
    || target.contentEditable === "true"
    || target.getAttribute("contenteditable") === "true";
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || isEditable;
}
