import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createColor, selectColor, type Color, type ColorDeterminedAppState } from "../appState";
import { saveAppState } from "../appStorage";
import { ColorCard, ConfirmButton, InfoButton, InfoPopup, Logo, ResetButton } from "../components";
import { designTokens } from "../designSystem/tokens";
import "../designSystem/styles.css";
import "./ColorSelectionPage.css";

export type ColorSelectionOption = {
  color: Color;
  label: string;
};

export type PickColorOption = (
  currentColor: ColorSelectionOption | null,
  options: readonly ColorSelectionOption[],
) => ColorSelectionOption;

export type ColorSelectionPageProps = {
  initialColor?: ColorSelectionOption;
  onColorConfirmed?: (state: ColorDeterminedAppState) => void;
  pickColorOption?: PickColorOption;
  saveConfirmedState?: (state: ColorDeterminedAppState) => Promise<void> | void;
};

export const COLOR_SELECTION_OPTIONS: readonly ColorSelectionOption[] = [
  createColorOption("PINK", designTokens.color.colorCard.pink),
  createColorOption("PURPLE", designTokens.color.colorCard.purple),
  createColorOption("NAVY", designTokens.color.colorCard.navy),
  createColorOption("BLUE", designTokens.color.colorCard.blue),
  createColorOption("GREEN", designTokens.color.colorCard.green),
  createColorOption("YELLOW", designTokens.color.colorCard.yellow),
  createColorOption("ORANGE", designTokens.color.colorCard.orange),
  createColorOption("RED", designTokens.color.colorCard.red),
];

export function ColorSelectionPage({
  initialColor,
  onColorConfirmed,
  pickColorOption = pickRandomColorOption,
  saveConfirmedState = saveAppState,
}: ColorSelectionPageProps) {
  const [selectedColor, setSelectedColor] = useState<ColorSelectionOption>(
    () => initialColor ?? pickColorOption(null, COLOR_SELECTION_OPTIONS),
  );
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const confirmTextColor = useMemo(
    () => getReadableTextColor(selectedColor.color.hex),
    [selectedColor.color.hex],
  );
  const confirmButtonStyle = useMemo<CSSProperties>(
    () => ({ color: confirmTextColor }),
    [confirmTextColor],
  );
  const pageStyle = useMemo<ColorSelectionPageStyle>(
    () => ({
      "--color-selection-action-gap": designTokens.component.colorSelection.actionGap,
      "--color-selection-content-gap": designTokens.component.colorSelection.contentGap,
      "--color-selection-content-top-gap": designTokens.component.colorSelection.contentTopGap,
      "--color-selection-copy-font-size": designTokens.component.colorSelection.copyFontSize,
      "--color-selection-copy-line-height": designTokens.component.colorSelection.copyLineHeight,
      "--color-selection-info-button-right": designTokens.component.colorSelection.infoButtonRight,
      "--color-selection-info-button-top": designTokens.component.colorSelection.infoButtonTop,
      "--color-selection-logo-height": designTokens.component.colorSelection.logoHeight,
      "--color-selection-logo-width": designTokens.component.colorSelection.logoWidth,
      "--color-selection-panel-min-height": designTokens.component.colorSelection.panelMinHeight,
      "--color-selection-panel-padding-bottom":
        designTokens.component.colorSelection.panelPaddingBottom,
      "--color-selection-panel-padding-top": designTokens.component.colorSelection.panelPaddingTop,
      "--color-selection-panel-padding-x": designTokens.component.colorSelection.panelPaddingX,
      "--color-selection-panel-width": designTokens.component.colorSelection.panelWidth,
    }),
    [],
  );

  const resetColor = useCallback(() => {
    setSaveError(null);
    setSelectedColor((currentColor) => pickColorOption(currentColor, COLOR_SELECTION_OPTIONS));
  }, [pickColorOption]);

  const confirmColor = useCallback(async () => {
    const confirmedState = selectColor(selectedColor.color);

    setIsConfirming(true);
    setSaveError(null);

    try {
      await saveConfirmedState(confirmedState);
      onColorConfirmed?.(confirmedState);
    } catch {
      setSaveError("색상을 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsConfirming(false);
    }
  }, [onColorConfirmed, saveConfirmedState, selectedColor.color]);

  return (
    <main
      aria-labelledby="color-selection-title"
      className="color-selection-page"
      style={pageStyle}
    >
      <section className="color-selection-panel">
        <header className="color-selection-header">
          <Logo className="color-selection-logo" />
          <InfoButton
            className="color-selection-info-button"
            label="컬러헌팅 정보 열기"
            onClick={() => setIsInfoOpen(true)}
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
              exit={{ opacity: 0, rotateY: -90 }}
              initial={{ opacity: 0, rotateY: 90 }}
              transition={{
                duration: designTokens.component.colorSelection.cardFlipDurationSeconds,
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

      <InfoPopup
        closeLabel="컬러헌팅 정보 닫기"
        onClose={() => setIsInfoOpen(false)}
        open={isInfoOpen}
        title="컬러헌팅(Color Hunting)"
      >
        <div className="color-selection-info-content">
          <p>
            특정한 색상을 정해 일상이나 자연 속에서 보물찾기하듯 찾고, 사진으로 기록하며 주변 환경을
            새롭게 관찰하는 활동입니다.
          </p>
          <p>사진은 외부로 업로드되지 않고 사용 중인 기기 안에서만 저장됩니다. 삭제하지 마세요!</p>
          <dl className="color-selection-credits">
            <div>
              <dt>Design by</dt>
              <dd>BOYOUNG</dd>
            </div>
            <div>
              <dt>Developed by</dt>
              <dd>@moreal</dd>
            </div>
          </dl>
        </div>
      </InfoPopup>
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
  "--color-selection-logo-height": string;
  "--color-selection-logo-width": string;
  "--color-selection-panel-min-height": string;
  "--color-selection-panel-padding-bottom": string;
  "--color-selection-panel-padding-top": string;
  "--color-selection-panel-padding-x": string;
  "--color-selection-panel-width": string;
};

export function pickRandomColorOption(
  currentColor: ColorSelectionOption | null,
  options: readonly ColorSelectionOption[] = COLOR_SELECTION_OPTIONS,
): ColorSelectionOption {
  const selectableOptions =
    currentColor === null
      ? options
      : options.filter((option) => option.color.hex !== currentColor.color.hex);
  const fallbackOptions = selectableOptions.length > 0 ? selectableOptions : options;
  const randomIndex = Math.floor(Math.random() * fallbackOptions.length);

  return fallbackOptions[randomIndex] ?? COLOR_SELECTION_OPTIONS[0];
}

function createColorOption(label: string, hex: string): ColorSelectionOption {
  const color = createColor(hex);

  if (color === null) {
    throw new Error(`Invalid color option: ${label}`);
  }

  return { color, label };
}

function getReadableTextColor(hex: string): "#050608" | "#ffffff" {
  const normalizedHex = hex.replace("#", "");
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.68 ? "#050608" : "#ffffff";
}
