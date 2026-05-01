import { useCallback, useEffect, useMemo, useState } from "react";
import { resetToNoColor, type AppState, type ColorDeterminedAppState } from "./domain/appState";
import { findColorSelectionOption, type ColorSelectionOption } from "./domain/colorSelection";
import { createAppStateStorage, type AppStateStorage } from "./appStorage";
import { ColorSelectionPage, ImageBoardPage } from "./pages";
import "./App.css";

export type AppProps = {
  storage?: AppStateStorage;
};

type AppLoadState =
  | { status: "loading" }
  | { appState: AppState; message: string | null; status: "ready" };

export default function App({ storage: providedStorage }: AppProps) {
  const storage = useMemo(() => providedStorage ?? createAppStateStorage(), [providedStorage]);
  const [loadState, setLoadState] = useState<AppLoadState>({ status: "loading" });
  const [initialSelectionColor, setInitialSelectionColor] = useState<
    ColorSelectionOption | undefined
  >();

  useEffect(() => {
    let isActive = true;

    async function loadStoredState() {
      try {
        const appState = await storage.loadAppState();

        if (isActive) {
          setLoadState({ appState, message: null, status: "ready" });
        }
      } catch {
        if (isActive) {
          setLoadState({
            appState: resetToNoColor(),
            message: "저장된 상태를 불러오지 못해 새로 시작합니다.",
            status: "ready",
          });
        }
      }
    }

    void loadStoredState();

    return () => {
      isActive = false;
    };
  }, [storage]);

  const saveColorDeterminedState = useCallback(
    async (nextState: ColorDeterminedAppState) => {
      await storage.saveAppState(nextState);
    },
    [storage],
  );

  const handleColorConfirmed = useCallback((nextState: ColorDeterminedAppState) => {
    setInitialSelectionColor(undefined);
    setLoadState({ appState: nextState, message: null, status: "ready" });
  }, []);

  const handleBoardChange = useCallback((nextState: ColorDeterminedAppState) => {
    setLoadState({ appState: nextState, message: null, status: "ready" });
  }, []);

  const resetFlow = useCallback(
    async (currentState: ColorDeterminedAppState) => {
      try {
        await storage.clearAppState();
        setInitialSelectionColor(findColorSelectionOption(currentState.color) ?? undefined);
        setLoadState({ appState: resetToNoColor(), message: null, status: "ready" });
      } catch {
        setLoadState((state) =>
          state.status === "ready"
            ? {
                ...state,
                message: "저장된 보드를 지우지 못했어요. 다시 시도해주세요.",
              }
            : state,
        );
      }
    },
    [storage],
  );

  if (loadState.status === "loading") {
    return (
      <main aria-busy="true" aria-live="polite" className="app-loading">
        Colorhunting 불러오는 중
      </main>
    );
  }

  const { appState, message } = loadState;
  const isColorSelection = appState.state === "NO_COLOR";

  return (
    <>
      {message ? (
        <p className="app-status-message" role="alert">
          {message}
        </p>
      ) : null}
      {isColorSelection ? (
        <ColorSelectionPage
          initialColor={initialSelectionColor}
          onColorConfirmed={handleColorConfirmed}
          saveConfirmedState={saveColorDeterminedState}
        />
      ) : (
        <ImageBoardPage
          onBoardChange={handleBoardChange}
          onResetFlow={(state) => void resetFlow(state)}
          saveBoardState={saveColorDeterminedState}
          state={appState}
        />
      )}
    </>
  );
}
