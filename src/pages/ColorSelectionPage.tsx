import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ColorDeterminedAppState } from "../domain/appState";
import {
  pickRandomColorOption,
  type ColorSelectionOption,
  type PickColorOption,
} from "../domain/colorSelection";
import { ColorCard, ConfirmButton, InfoButton, PageLogo, ResetButton } from "../components";
import { designTokens } from "../designSystem/tokens";
import { useColorSelectionController } from "../hooks/useColorSelectionController";
import {
  DEFAULT_BROWSER_CHROME_COLOR,
  useBrowserChromeTheme,
} from "../hooks/useBrowserChromeTheme";
import { ColorHuntingInfoPopup } from "./ColorHuntingInfoPopup";
import "../designSystem/styles.css";
import "./ColorSelectionPage.css";

export {
  COLOR_SELECTION_OPTIONS,
  pickRandomColorOption,
  type ColorSelectionOption,
  type PickColorOption,
} from "../domain/colorSelection";

export type ColorSelectionPageProps = {
  initialColor?: ColorSelectionOption;
  onColorConfirmed?: (state: ColorDeterminedAppState) => void;
  pickColorOption?: PickColorOption;
  saveConfirmedState?: (state: ColorDeterminedAppState) => Promise<void> | void;
};

export function ColorSelectionPage({
  initialColor,
  onColorConfirmed,
  pickColorOption = pickRandomColorOption,
  saveConfirmedState,
}: ColorSelectionPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    closeInfo,
    confirmButtonStyle,
    confirmColor,
    isConfirming,
    isInfoOpen,
    openInfo,
    resetColor,
    saveError,
    selectedColor,
  } = useColorSelectionController({
    initialColor,
    onColorConfirmed,
    pickColorOption,
    saveConfirmedState,
  });
  useBrowserChromeTheme(DEFAULT_BROWSER_CHROME_COLOR);

  return (
    <main
      aria-labelledby="color-selection-title"
      className="ds-mobile-app-page color-selection-page"
      style={COLOR_SELECTION_PAGE_STYLE}
    >
      <section className="ds-mobile-app-frame color-selection-panel">
        <header className="color-selection-header">
          <PageLogo className="color-selection-logo" inert />
          <InfoButton
            className="color-selection-info-button"
            label="컬러헌팅 정보 열기"
            onClick={openInfo}
          />
        </header>

        <div className="color-selection-content">
          <h1 className="ds-visually-hidden" id="color-selection-title">
            Colorhunting color selection
          </h1>
          <p className="color-selection-copy">
            오늘의 컬러를 발견하고
            <br />
            사진으로 기록해보세요!
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedColor.color.hex}
              animate={{ opacity: 1, rotateY: 0 }}
              className="color-selection-card-motion"
              exit={{ opacity: 0, rotateY: shouldReduceMotion ? 0 : -90 }}
              initial={{ opacity: 0, rotateY: shouldReduceMotion ? 0 : 90 }}
              transition={{
                duration: shouldReduceMotion
                  ? 0
                  : designTokens.component.colorSelection.cardFlipDurationSeconds,
                ease: [0.2, 0, 0, 1],
              }}
            >
              <ColorCard color={selectedColor.color} title={selectedColor.label} />
            </motion.div>
          </AnimatePresence>

          <div className="color-selection-actions">
            <ResetButton disabled={isConfirming} label="Reset" onClick={resetColor} />
            <ConfirmButton
              className="color-selection-confirm"
              color={selectedColor.color.hex}
              disabled={isConfirming}
              label={isConfirming ? "Saving" : "Confirm"}
              onClick={() => void confirmColor()}
              style={confirmButtonStyle}
            />
          </div>

          {saveError ? (
            <p className="color-selection-error" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>
      </section>

      <ColorHuntingInfoPopup onClose={closeInfo} open={isInfoOpen} />
    </main>
  );
}

type ColorSelectionPageStyle = CSSProperties & {
  "--color-selection-action-gap": string;
  "--color-selection-content-gap": string;
  "--color-selection-content-top-gap": string;
  "--color-selection-copy-font-size": string;
  "--color-selection-copy-line-height": string;
  "--color-selection-info-button-right": string;
  "--color-selection-info-button-top": string;
  "--color-selection-panel-min-height": string;
  "--color-selection-panel-padding-bottom": string;
  "--color-selection-panel-padding-top": string;
  "--color-selection-panel-padding-x": string;
  "--color-selection-panel-width": string;
  "--ds-mobile-app-page-background": string;
  "--ds-page-logo-height": string;
  "--ds-page-logo-width": string;
};

const COLOR_SELECTION_PAGE_STYLE: ColorSelectionPageStyle = {
  "--color-selection-action-gap": designTokens.component.colorSelection.actionGap,
  "--color-selection-content-gap": designTokens.component.colorSelection.contentGap,
  "--color-selection-content-top-gap": designTokens.component.colorSelection.contentTopGap,
  "--color-selection-copy-font-size": designTokens.component.colorSelection.copyFontSize,
  "--color-selection-copy-line-height": designTokens.component.colorSelection.copyLineHeight,
  "--color-selection-info-button-right": designTokens.component.colorSelection.infoButtonRight,
  "--color-selection-info-button-top": designTokens.component.colorSelection.infoButtonTop,
  "--color-selection-panel-min-height": designTokens.component.colorSelection.panelMinHeight,
  "--color-selection-panel-padding-bottom":
    designTokens.component.colorSelection.panelPaddingBottom,
  "--color-selection-panel-padding-top": designTokens.component.colorSelection.panelPaddingTop,
  "--color-selection-panel-padding-x": designTokens.component.colorSelection.panelPaddingX,
  "--color-selection-panel-width": designTokens.component.colorSelection.panelWidth,
  "--ds-mobile-app-page-background": DEFAULT_BROWSER_CHROME_COLOR,
  "--ds-page-logo-height": designTokens.component.pageLogo.height,
  "--ds-page-logo-width": designTokens.component.pageLogo.width,
};
