import { useLayoutEffect } from "react";

export const APP_BROWSER_CHROME_BACKGROUND_PROPERTY = "--app-browser-chrome-background";
export const DEFAULT_BROWSER_CHROME_COLOR = "#242526";

const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]';

export function useBrowserChromeTheme(color: string | null) {
  useLayoutEffect(() => {
    if (color === null) {
      return;
    }

    const { created, meta } = getThemeColorMeta();
    const previousThemeColor = meta.getAttribute("content");
    const previousBackground = document.documentElement.style.getPropertyValue(
      APP_BROWSER_CHROME_BACKGROUND_PROPERTY,
    );
    const previousBackgroundPriority = document.documentElement.style.getPropertyPriority(
      APP_BROWSER_CHROME_BACKGROUND_PROPERTY,
    );

    meta.setAttribute("content", color);
    document.documentElement.style.setProperty(APP_BROWSER_CHROME_BACKGROUND_PROPERTY, color);

    return () => {
      if (created) {
        meta.remove();
      } else if (previousThemeColor === null) {
        meta.removeAttribute("content");
      } else {
        meta.setAttribute("content", previousThemeColor);
      }

      if (previousBackground === "") {
        document.documentElement.style.removeProperty(APP_BROWSER_CHROME_BACKGROUND_PROPERTY);
      } else {
        document.documentElement.style.setProperty(
          APP_BROWSER_CHROME_BACKGROUND_PROPERTY,
          previousBackground,
          previousBackgroundPriority,
        );
      }
    };
  }, [color]);
}

function getThemeColorMeta(): { created: boolean; meta: HTMLMetaElement } {
  const existingMeta = document.head.querySelector<HTMLMetaElement>(THEME_COLOR_META_SELECTOR);

  if (existingMeta !== null) {
    return { created: false, meta: existingMeta };
  }

  const meta = document.createElement("meta");

  meta.name = "theme-color";
  document.head.append(meta);

  return { created: true, meta };
}
