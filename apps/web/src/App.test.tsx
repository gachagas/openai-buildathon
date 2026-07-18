import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

function startSwiping() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Partner/ }));
  fireEvent.click(screen.getByRole("button", { name: "Birthday" }));
  fireEvent.click(screen.getByRole("button", { name: /Start gift finder/ }));
}

const bagButton = () => screen.getByRole("button", { name: /Shopping bag/ });

describe("gift finder app", () => {
  it("shows budget chips on setup and reaches the swipe screen", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Under ₱1,000" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Friend/ }));
    fireEvent.click(screen.getByRole("button", { name: "Anniversary" }));
    fireEvent.click(screen.getByRole("button", { name: /Start gift finder/ }));

    expect(screen.getByRole("heading", { name: "Would they love this?" })).toBeVisible();
  });

  it("adds a gift to the bag from the swipe screen and updates the badge", () => {
    startSwiping();
    expect(bagButton()).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(bagButton()).toHaveTextContent("1");
  });

  it("opens the bag, lists the item with a total, and checkout only toasts", () => {
    startSwiping();
    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    fireEvent.click(bagButton());

    expect(screen.getByRole("heading", { name: "Your bag" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Go to checkout/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Checkout — coming soon");
  });

  it("disables undo until a choice is made", () => {
    startSwiping();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });
});
