import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { resetToNoColor, type AppState, type ColorDeterminedAppState } from "./domain/appState";
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
  const shouldReduceMotion = useReducedMotion();
  const [loadState, setLoadState] = useState<AppLoadState>({ status: "loading" });

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

  const pageTransition = useMemo(
    () => ({
      duration: shouldReduceMotion ? 0 : 0.18,
      ease: [0.2, 0, 0, 1] as const,
    }),
    [shouldReduceMotion],
  );

  const saveColorDeterminedState = useCallback(
    async (nextState: ColorDeterminedAppState) => {
      await storage.saveAppState(nextState);
    },
    [storage],
  );

  const handleColorConfirmed = useCallback((nextState: ColorDeterminedAppState) => {
    setLoadState({ appState: nextState, message: null, status: "ready" });
  }, []);

  const handleBoardChange = useCallback((nextState: ColorDeterminedAppState) => {
    setLoadState({ appState: nextState, message: null, status: "ready" });
  }, []);

  const resetFlow = useCallback(async () => {
    try {
      await storage.clearAppState();
      setLoadState({ appState: resetToNoColor(), message: null, status: "ready" });
    } catch {
      setLoadState((currentState) =>
        currentState.status === "ready"
          ? {
              ...currentState,
              message: "저장된 보드를 지우지 못했어요. 다시 시도해주세요.",
            }
          : currentState,
      );
    }
  }, [storage]);

  if (loadState.status === "loading") {
    return (
      <main aria-busy="true" aria-live="polite" className="app-loading">
        Colorhunting 불러오는 중
      </main>
    );
  }

  const { appState, message } = loadState;
  const isColorSelection = appState.state === "NO_COLOR";
  const pageYOffset = shouldReduceMotion ? 0 : isColorSelection ? 12 : -12;

  return (
    <>
      {message ? (
        <p className="app-status-message" role="alert">
          {message}
        </p>
      ) : null}
      <AnimatePresence mode="wait">
        <motion.div
          key={appState.state}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -pageYOffset }}
          initial={{ opacity: 0, y: pageYOffset }}
          transition={pageTransition}
        >
          {isColorSelection ? (
            <ColorSelectionPage
              onColorConfirmed={handleColorConfirmed}
              saveConfirmedState={saveColorDeterminedState}
            />
          ) : (
            <ImageBoardPage
              onBoardChange={handleBoardChange}
              onResetFlow={() => void resetFlow()}
              saveBoardState={saveColorDeterminedState}
              state={appState}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
