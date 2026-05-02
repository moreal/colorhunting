import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  APP_BROWSER_CHROME_BACKGROUND_PROPERTY,
  useBrowserChromeTheme,
} from "./useBrowserChromeTheme";

describe("useBrowserChromeTheme", () => {
  afterEach(() => {
    cleanup();
    document.head.querySelector('meta[name="theme-color"]')?.remove();
    document.documentElement.style.removeProperty(APP_BROWSER_CHROME_BACKGROUND_PROPERTY);
  });

  it("updates the browser chrome theme color and document background", () => {
    const meta = document.createElement("meta");

    meta.name = "theme-color";
    meta.content = "#242526";
    document.head.append(meta);

    const { rerender, unmount } = render(<ThemeProbe color="#ef4b4b" />);

    expect(meta).toHaveAttribute("content", "#ef4b4b");
    expect(
      document.documentElement.style.getPropertyValue(APP_BROWSER_CHROME_BACKGROUND_PROPERTY),
    ).toBe("#ef4b4b");

    rerender(<ThemeProbe color="#34c759" />);

    expect(meta).toHaveAttribute("content", "#34c759");
    expect(
      document.documentElement.style.getPropertyValue(APP_BROWSER_CHROME_BACKGROUND_PROPERTY),
    ).toBe("#34c759");

    unmount();

    expect(meta).toHaveAttribute("content", "#242526");
    expect(
      document.documentElement.style.getPropertyValue(APP_BROWSER_CHROME_BACKGROUND_PROPERTY),
    ).toBe("");
  });

  it("creates a theme-color meta tag when the document does not provide one", () => {
    const { unmount } = render(<ThemeProbe color="#76d1ff" />);
    const meta = document.head.querySelector('meta[name="theme-color"]');

    expect(meta).toHaveAttribute("content", "#76d1ff");

    unmount();

    expect(document.head.querySelector('meta[name="theme-color"]')).not.toBeInTheDocument();
  });

  it("does not touch browser chrome settings without a color", () => {
    render(<ThemeProbe color={null} />);

    expect(document.head.querySelector('meta[name="theme-color"]')).not.toBeInTheDocument();
    expect(
      document.documentElement.style.getPropertyValue(APP_BROWSER_CHROME_BACKGROUND_PROPERTY),
    ).toBe("");
  });
});

function ThemeProbe({ color }: { color: string | null }) {
  useBrowserChromeTheme(color);

  return null;
}
