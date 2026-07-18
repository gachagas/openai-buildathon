import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { flowers } from "./data/products";
import { shouldIgnoreShortcut } from "./lib/keyboard";

// The deck walks the catalogue in order, so expected card names come from the
// data itself — the tests assert deck behaviour, not a frozen product list.
const deckName = (index: number) => flowers[index].name;

function startDiscovery() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Skip setup" }));
}

describe("discovery flow", () => {
  it("advances for like, skip, and favorite choices", () => {
    startDiscovery();
    expect(screen.getByRole("heading", { name: deckName(0) })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Like flower" }));
    expect(screen.getByRole("heading", { name: deckName(1) })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Skip flower" }));
    expect(screen.getByRole("heading", { name: deckName(2) })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Favorite flower" }));
    expect(screen.getByRole("heading", { name: deckName(3) })).toBeVisible();
    expect(screen.getByRole("button", { name: /Saved/ })).toHaveTextContent("1");
  });

  it("undo restores the previous flower and selection count", () => {
    startDiscovery();
    fireEvent.click(screen.getByRole("button", { name: "Like flower" }));
    expect(screen.getByText("1 liked")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Undo last choice" }));
    expect(screen.getByRole("heading", { name: deckName(0) })).toBeVisible();
    expect(screen.getByText("0 liked")).toBeVisible();
  });

  it("unlocks the flower style after four positive choices", () => {
    startDiscovery();
    const styleButton = screen.getByRole("button", { name: /Like 4 more to continue/ });
    expect(styleButton).toBeDisabled();

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Like flower" }));
    }

    const unlocked = screen.getByRole("button", { name: /See my flower style/ });
    expect(unlocked).toBeEnabled();
    fireEvent.click(unlocked);
    expect(screen.getByRole("heading", { name: "Recommended for you" })).toBeVisible();
  });

  it("supports the right-arrow keyboard shortcut", () => {
    startDiscovery();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: deckName(1) })).toBeVisible();
  });
});

describe("keyboard shortcut guard", () => {
  it("ignores form fields and content-editable elements", () => {
    expect(shouldIgnoreShortcut(document.createElement("input"))).toBe(true);
    expect(shouldIgnoreShortcut(document.createElement("textarea"))).toBe(true);
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    expect(shouldIgnoreShortcut(editable)).toBe(true);
    expect(shouldIgnoreShortcut(document.createElement("button"))).toBe(false);
  });
});
