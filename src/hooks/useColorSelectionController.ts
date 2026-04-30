import { useCallback, useMemo, useReducer, type CSSProperties } from "react";
import type { ColorDeterminedAppState } from "../domain/appState";
import {
  COLOR_SELECTION_OPTIONS,
  createConfirmedColorState,
  getColorSelectionConfirmTextColor,
  pickRandomColorOption,
  type ColorSelectionOption,
  type PickColorOption,
} from "../domain/colorSelection";

export type SaveConfirmedState = (state: ColorDeterminedAppState) => Promise<void> | void;

export type ColorSelectionControllerOptions = {
  initialColor?: ColorSelectionOption;
  onColorConfirmed?: (state: ColorDeterminedAppState) => void;
  pickColorOption?: PickColorOption;
  saveConfirmedState?: SaveConfirmedState;
};

type ColorSelectionInteractionState = {
  isConfirming: boolean;
  isInfoOpen: boolean;
  saveError: string | null;
  selectedColor: ColorSelectionOption;
};

type ColorSelectionAction =
  | { type: "colorReset"; selectedColor: ColorSelectionOption }
  | { type: "confirmFailed"; error: string }
  | { type: "confirmStarted" }
  | { type: "confirmSucceeded" }
  | { type: "infoClosed" }
  | { type: "infoOpened" };

const SAVE_CONFIRMED_STATE_ERROR = "색상을 저장하지 못했어요. 다시 시도해주세요.";

export function useColorSelectionController({
  initialColor,
  onColorConfirmed,
  pickColorOption = pickRandomColorOption,
  saveConfirmedState = noopSaveConfirmedState,
}: ColorSelectionControllerOptions) {
  const [state, dispatch] = useReducer(
    colorSelectionReducer,
    { initialColor, pickColorOption },
    createInitialColorSelectionState,
  );
  const confirmTextColor = useMemo(
    () => getColorSelectionConfirmTextColor(state.selectedColor),
    [state.selectedColor],
  );
  const confirmButtonStyle = useMemo<CSSProperties>(
    () => ({ color: confirmTextColor }),
    [confirmTextColor],
  );

  const openInfo = useCallback(() => {
    dispatch({ type: "infoOpened" });
  }, []);

  const closeInfo = useCallback(() => {
    dispatch({ type: "infoClosed" });
  }, []);

  const resetColor = useCallback(() => {
    dispatch({
      selectedColor: pickColorOption(state.selectedColor, COLOR_SELECTION_OPTIONS),
      type: "colorReset",
    });
  }, [pickColorOption, state.selectedColor]);

  const confirmColor = useCallback(async () => {
    if (state.isConfirming) {
      return;
    }

    const confirmedState = createConfirmedColorState(state.selectedColor);

    dispatch({ type: "confirmStarted" });

    try {
      await saveConfirmedState(confirmedState);
      dispatch({ type: "confirmSucceeded" });
      onColorConfirmed?.(confirmedState);
    } catch {
      dispatch({ error: SAVE_CONFIRMED_STATE_ERROR, type: "confirmFailed" });
    }
  }, [onColorConfirmed, saveConfirmedState, state.isConfirming, state.selectedColor]);

  return {
    closeInfo,
    confirmButtonStyle,
    confirmColor,
    isConfirming: state.isConfirming,
    isInfoOpen: state.isInfoOpen,
    openInfo,
    resetColor,
    saveError: state.saveError,
    selectedColor: state.selectedColor,
  };
}

function colorSelectionReducer(
  state: ColorSelectionInteractionState,
  action: ColorSelectionAction,
): ColorSelectionInteractionState {
  switch (action.type) {
    case "colorReset":
      return {
        ...state,
        saveError: null,
        selectedColor: action.selectedColor,
      };
    case "confirmFailed":
      return {
        ...state,
        isConfirming: false,
        saveError: action.error,
      };
    case "confirmStarted":
      return {
        ...state,
        isConfirming: true,
        saveError: null,
      };
    case "confirmSucceeded":
      return {
        ...state,
        isConfirming: false,
        saveError: null,
      };
    case "infoClosed":
      return {
        ...state,
        isInfoOpen: false,
      };
    case "infoOpened":
      return {
        ...state,
        isInfoOpen: true,
      };
  }
}

function createInitialColorSelectionState({
  initialColor,
  pickColorOption,
}: {
  initialColor?: ColorSelectionOption;
  pickColorOption: PickColorOption;
}): ColorSelectionInteractionState {
  return {
    isConfirming: false,
    isInfoOpen: false,
    saveError: null,
    selectedColor: initialColor ?? pickColorOption(null, COLOR_SELECTION_OPTIONS),
  };
}

async function noopSaveConfirmedState() {}
