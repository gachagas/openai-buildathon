import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { topMatches } from "./lib/match";
import { shouldIgnoreShortcut } from "./lib/keyboard";

// With no filters the deck is deterministic, so expected card names come from
// the engine itself — the tests assert flow behaviour, not a frozen product list.
const defaultDeck = topMatches({}, new Set());

function startDeck() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Skip, just browse/ }));
}

describe("gift finder flow", () => {
  it("shows the top-10 deck and advances on like and skip", () => {
    startDeck();
    expect(screen.getByRole("heading", { name: defaultDeck[0].name })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(screen.getByRole("heading", { name: defaultDeck[1].name })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: defaultDeck[2].name })).toBeVisible();
  });

  it("adds to cart from the deck and updates the cart badge", () => {
    startDeck();
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(screen.getByRole("button", { name: /Cart/ })).toHaveTextContent("1");
  });

  it("undo restores the previous card and liked count", () => {
    startDeck();
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(screen.getByText("1 liked")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Undo last choice" }));
    expect(screen.getByRole("heading", { name: defaultDeck[0].name })).toBeVisible();
    expect(screen.getByText("0 liked")).toBeVisible();
  });

  it("reaches the results screen after ten decisions", () => {
    startDeck();
    for (let index = 0; index < 10; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Like" }));
    }
    expect(screen.getByRole("heading", { name: "Your picks" })).toBeVisible();
  });

  it("supports the right-arrow keyboard shortcut", () => {
    startDeck();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: defaultDeck[1].name })).toBeVisible();
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
