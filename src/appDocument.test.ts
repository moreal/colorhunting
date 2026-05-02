import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";

describe("document shell", () => {
  it("opts into safe-area painting before React mounts", () => {
    const documentShell = new DOMParser().parseFromString(indexHtml, "text/html");
    const viewport = documentShell.querySelector('meta[name="viewport"]');
    const themeColor = documentShell.querySelector('meta[name="theme-color"]');

    expect(viewport?.getAttribute("content")).toBe(
      "width=device-width, initial-scale=1, viewport-fit=cover",
    );
    expect(themeColor?.getAttribute("content")).toBe("#242526");
  });
});
