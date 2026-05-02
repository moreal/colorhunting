import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { BOARD_SLOT_COUNT, moveBoardSlot, type BoardSlot, type Image } from "../domain/appState";

export type ReorderImages = (
  fromIndex: number,
  toIndex: number,
) => boolean | Promise<boolean> | Promise<void> | void;
export type RemoveImage = (slotIndex: number) => boolean | Promise<boolean> | Promise<void> | void;
export type ImageBoardDragStatus = {
  active: boolean;
  overRemoveTarget: boolean;
};
export type ImageBoardRemoveDropTargetRect = Pick<
  DOMRect,
  "bottom" | "height" | "left" | "right" | "top" | "width"
>;

type UseImageBoardReorderOptions = {
  disabled: boolean;
  getRemoveDropTargetRect?: () => ImageBoardRemoveDropTargetRect | null;
  images: readonly BoardSlot[];
  onDragStatusChange?: (status: ImageBoardDragStatus) => void;
  onRemoveImage?: RemoveImage;
  onReorderImages?: ReorderImages;
  shouldReduceMotion: boolean | null;
};

type Point = {
  x: number;
  y: number;
};

type Rect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type DragInput = "pointer" | "touch";
type DragPhase = "dragging" | "returning" | "settling";

type DragState = {
  dropIndex: number | null;
  image: Image;
  imageId: string;
  input: DragInput;
  isOverRemoveTarget: boolean;
  originIndex: number;
  phase: DragPhase;
  pointer: Point;
  pointerId: number;
  pointerOffset: Point;
  slotRects: Rect[];
};

type PressCandidate = {
  element: HTMLElement | null;
  input: DragInput;
  pointerId: number;
  startPoint: Point;
  timerId: number;
};

type TrackedTouch = {
  readonly clientX: number;
  readonly clientY: number;
  readonly identifier: number;
};

type TouchCollection = {
  readonly length: number;
  item?: (index: number) => TrackedTouch | null;
  readonly [index: number]: TrackedTouch | undefined;
};

const LONG_PRESS_REORDER_DELAY_MS = 260;
const POINTER_MOVE_CANCEL_DISTANCE = 14;
const REORDER_SETTLE_DURATION_MS = 180;

export function useImageBoardReorder({
  disabled,
  getRemoveDropTargetRect,
  images,
  onDragStatusChange,
  onRemoveImage,
  onReorderImages,
  shouldReduceMotion,
}: UseImageBoardReorderOptions) {
  const slots = useMemo(() => createBoardSlots(images), [images]);
  const boardSlotsRef = useRef<BoardSlot[]>(slots);
  const boardElementRef = useRef<HTMLDivElement | null>(null);
  const dragStatusRef = useRef<ImageBoardDragStatus>({
    active: false,
    overRemoveTarget: false,
  });
  const dragStateRef = useRef<DragState | null>(null);
  const pressCandidateRef = useRef<PressCandidate | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewSlots, setPreviewSlots] = useState<BoardSlot[]>(() => slots);
  const setNextDragState = useCallback((nextState: DragState | null) => {
    dragStateRef.current = nextState;
    setDragState(nextState);
  }, []);
  const canRemoveImages =
    onRemoveImage !== undefined && getRemoveDropTargetRect !== undefined && !disabled;
  const canReorder = onReorderImages !== undefined && !disabled;
  const canDragImages = canReorder || canRemoveImages;
  const renderedSlots = dragState === null ? slots : previewSlots;
  const reorderTransition = {
    duration: shouldReduceMotion ? 0 : 0.18,
    ease: [0.2, 0, 0, 1] as const,
  };
  const dragOverlay = dragState === null ? null : createDragOverlay(dragState);

  useEffect(() => {
    boardSlotsRef.current = slots;

    if (dragStateRef.current === null) {
      setPreviewSlots(slots);
    }
  }, [slots]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    const isDragging = dragState?.phase === "dragging";
    const nextStatus = {
      active: isDragging,
      overRemoveTarget: isDragging && dragState !== null ? dragState.isOverRemoveTarget : false,
    };
    const previousStatus = dragStatusRef.current;

    if (
      previousStatus.active === nextStatus.active &&
      previousStatus.overRemoveTarget === nextStatus.overRemoveTarget
    ) {
      return;
    }

    dragStatusRef.current = nextStatus;
    onDragStatusChange?.(nextStatus);
  }, [dragState, onDragStatusChange]);

  useEffect(() => {
    return () => {
      clearPressCandidate(pressCandidateRef);
      clearReturnTimer(returnTimerRef);
    };
  }, []);

  const clearDragAfterSettle = useCallback(() => {
    clearReturnTimer(returnTimerRef);

    returnTimerRef.current = window.setTimeout(
      () => {
        setNextDragState(null);
      },
      shouldReduceMotion ? 0 : REORDER_SETTLE_DURATION_MS,
    );
  }, [setNextDragState, shouldReduceMotion]);

  const returnDragToOrigin = useCallback(
    (state: DragState) => {
      const originRect = state.slotRects[state.originIndex];

      if (originRect === undefined) {
        setNextDragState(null);
        return;
      }

      setPreviewSlots(boardSlotsRef.current);
      setNextDragState({
        ...state,
        dropIndex: state.originIndex,
        isOverRemoveTarget: false,
        phase: "returning",
        pointer: getPointForSlot(originRect, state.pointerOffset),
      });
      clearDragAfterSettle();
    },
    [clearDragAfterSettle, setNextDragState],
  );

  const moveActiveDrag = useCallback(
    (input: DragInput, pointerId: number, point: Point) => {
      const state = dragStateRef.current;

      if (
        state === null ||
        state.input !== input ||
        state.pointerId !== pointerId ||
        state.phase !== "dragging"
      ) {
        return false;
      }

      if (canRemoveImages && isPointInRemoveDropTarget(point, getRemoveDropTargetRect)) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({
          ...state,
          dropIndex: null,
          isOverRemoveTarget: true,
          pointer: point,
        });
        return true;
      }

      if (!canReorder) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({
          ...state,
          dropIndex: null,
          isOverRemoveTarget: false,
          pointer: point,
        });
        return true;
      }

      const dropIndex = getSlotIndexAtPoint(point, state.slotRects);

      if (dropIndex === null) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({ ...state, dropIndex, isOverRemoveTarget: false, pointer: point });
        return true;
      }

      if (dropIndex === state.dropIndex && !state.isOverRemoveTarget) {
        setNextDragState({ ...state, pointer: point });
        return true;
      }

      const nextSlots = moveBoardSlot(boardSlotsRef.current, state.originIndex, dropIndex);

      if (nextSlots === null) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({
          ...state,
          dropIndex: null,
          isOverRemoveTarget: false,
          pointer: point,
        });
        return true;
      }

      setPreviewSlots(nextSlots);
      setNextDragState({
        ...state,
        dropIndex,
        isOverRemoveTarget: false,
        pointer: point,
      });
      return true;
    },
    [canRemoveImages, canReorder, getRemoveDropTargetRect, setNextDragState],
  );

  const finishActiveDrag = useCallback(
    (input: DragInput, pointerId: number, point: Point) => {
      const state = dragStateRef.current;

      if (
        state === null ||
        state.input !== input ||
        state.pointerId !== pointerId ||
        state.phase !== "dragging"
      ) {
        return false;
      }

      if (canRemoveImages && isPointInRemoveDropTarget(point, getRemoveDropTargetRect)) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({
          ...state,
          dropIndex: null,
          isOverRemoveTarget: true,
          phase: "settling",
          pointer: point,
        });

        void commitRemove(state, onRemoveImage, returnDragToOrigin, clearDragAfterSettle);
        return true;
      }

      if (!canReorder) {
        returnDragToOrigin(state);
        return true;
      }

      if (state.dropIndex === null || state.dropIndex === state.originIndex) {
        returnDragToOrigin(state);
        return true;
      }

      const targetRect = state.slotRects[state.dropIndex];

      if (targetRect === undefined) {
        returnDragToOrigin(state);
        return true;
      }

      setNextDragState({
        ...state,
        phase: "settling",
        pointer: getPointForSlot(targetRect, state.pointerOffset),
      });

      void commitReorder(state, onReorderImages, returnDragToOrigin, clearDragAfterSettle);
      return true;
    },
    [
      canRemoveImages,
      canReorder,
      clearDragAfterSettle,
      getRemoveDropTargetRect,
      onRemoveImage,
      onReorderImages,
      returnDragToOrigin,
      setNextDragState,
    ],
  );

  const cancelActiveDrag = useCallback(
    (input: DragInput, pointerId: number) => {
      const state = dragStateRef.current;

      if (
        state === null ||
        state.input !== input ||
        state.pointerId !== pointerId ||
        state.phase !== "dragging"
      ) {
        return false;
      }

      returnDragToOrigin(state);
      return true;
    },
    [returnDragToOrigin],
  );

  const beginDrag = useCallback(
    (slotIndex: number, input: DragInput, pointerId: number, pointer: Point) => {
      const image = boardSlotsRef.current[slotIndex];
      const slotRects = getCurrentSlotRects(boardElementRef.current);

      if (image === null || slotRects === null) {
        return false;
      }

      const originRect = slotRects[slotIndex];

      if (originRect === undefined) {
        return false;
      }

      const nextDragState: DragState = {
        dropIndex: slotIndex,
        image,
        imageId: image.id,
        input,
        isOverRemoveTarget: false,
        originIndex: slotIndex,
        phase: "dragging",
        pointer,
        pointerId,
        pointerOffset: {
          x: pointer.x - originRect.left,
          y: pointer.y - originRect.top,
        },
        slotRects,
      };

      setPreviewSlots(boardSlotsRef.current);
      setNextDragState(nextDragState);
      return true;
    },
    [setNextDragState],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, slotIndex: number) => {
      if (
        event.pointerType === "touch" ||
        disabled ||
        !canDragImages ||
        event.button !== 0 ||
        isInteractiveElement(event.target) ||
        boardSlotsRef.current[slotIndex] === null
      ) {
        return;
      }

      clearPressCandidate(pressCandidateRef);
      clearReturnTimer(returnTimerRef);

      const startPoint = getEventPoint(event);
      const element = event.currentTarget;

      capturePointer(element, event.pointerId);
      pressCandidateRef.current = {
        element,
        input: "pointer",
        pointerId: event.pointerId,
        startPoint,
        timerId: window.setTimeout(() => {
          const candidate = pressCandidateRef.current;

          if (
            candidate === null ||
            candidate.input !== "pointer" ||
            candidate.pointerId !== event.pointerId
          ) {
            return;
          }

          pressCandidateRef.current = null;
          if (!beginDrag(slotIndex, "pointer", event.pointerId, startPoint)) {
            releasePointerCapture(element, event.pointerId);
          }
        }, LONG_PRESS_REORDER_DELAY_MS),
      };
    },
    [beginDrag, canDragImages, disabled],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = getEventPoint(event);
      const candidate = pressCandidateRef.current;

      if (
        candidate !== null &&
        candidate.input === "pointer" &&
        candidate.pointerId === event.pointerId &&
        getPointDistance(candidate.startPoint, point) > POINTER_MOVE_CANCEL_DISTANCE
      ) {
        clearPressCandidate(pressCandidateRef);
        return;
      }

      const state = dragStateRef.current;

      if (
        state === null ||
        state.input !== "pointer" ||
        state.pointerId !== event.pointerId ||
        state.phase !== "dragging"
      ) {
        return;
      }

      event.preventDefault();
      moveActiveDrag("pointer", event.pointerId, point);
    },
    [moveActiveDrag],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (
        candidate !== null &&
        candidate.input === "pointer" &&
        candidate.pointerId === event.pointerId
      ) {
        clearPressCandidate(pressCandidateRef);
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.input !== "pointer" || state.pointerId !== event.pointerId) {
        return;
      }

      releasePointerCapture(event.currentTarget, event.pointerId);
      finishActiveDrag("pointer", event.pointerId, getEventPoint(event));
    },
    [finishActiveDrag],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (
        candidate !== null &&
        candidate.input === "pointer" &&
        candidate.pointerId === event.pointerId
      ) {
        clearPressCandidate(pressCandidateRef);
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.input !== "pointer" || state.pointerId !== event.pointerId) {
        return;
      }

      releasePointerCapture(event.currentTarget, event.pointerId);
      cancelActiveDrag("pointer", event.pointerId);
    },
    [cancelActiveDrag],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>, slotIndex: number) => {
      const touch = getFirstTouch(event.changedTouches);

      if (
        touch === null ||
        event.touches.length !== 1 ||
        disabled ||
        !canDragImages ||
        isInteractiveElement(event.target) ||
        boardSlotsRef.current[slotIndex] === null
      ) {
        return;
      }

      clearPressCandidate(pressCandidateRef);
      clearReturnTimer(returnTimerRef);

      const pointerId = touch.identifier;
      const startPoint = getTouchPoint(touch);

      pressCandidateRef.current = {
        element: event.currentTarget,
        input: "touch",
        pointerId,
        startPoint,
        timerId: window.setTimeout(() => {
          const candidate = pressCandidateRef.current;

          if (
            candidate === null ||
            candidate.input !== "touch" ||
            candidate.pointerId !== pointerId
          ) {
            return;
          }

          pressCandidateRef.current = null;
          beginDrag(slotIndex, "touch", pointerId, startPoint);
        }, LONG_PRESS_REORDER_DELAY_MS),
      };
    },
    [beginDrag, canDragImages, disabled],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (candidate !== null && candidate.input === "touch") {
        const touch = getTouchByIdentifier(event.changedTouches, candidate.pointerId);

        if (touch === null) {
          return;
        }

        if (
          event.touches.length !== 1 ||
          getPointDistance(candidate.startPoint, getTouchPoint(touch)) >
            POINTER_MOVE_CANCEL_DISTANCE
        ) {
          clearPressCandidate(pressCandidateRef);
        }
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.input !== "touch" || state.phase !== "dragging") {
        return;
      }

      const touch = getTouchByIdentifier(event.changedTouches, state.pointerId);

      if (touch === null) {
        return;
      }

      event.preventDefault();
      moveActiveDrag("touch", state.pointerId, getTouchPoint(touch));
    },
    [moveActiveDrag],
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (
        candidate !== null &&
        candidate.input === "touch" &&
        getTouchByIdentifier(event.changedTouches, candidate.pointerId) !== null
      ) {
        clearPressCandidate(pressCandidateRef);
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.input !== "touch") {
        return;
      }

      const touch = getTouchByIdentifier(event.changedTouches, state.pointerId);

      if (touch === null) {
        return;
      }

      event.preventDefault();
      finishActiveDrag("touch", state.pointerId, getTouchPoint(touch));
    },
    [finishActiveDrag],
  );

  const handleTouchCancel = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (
        candidate !== null &&
        candidate.input === "touch" &&
        getTouchByIdentifier(event.changedTouches, candidate.pointerId) !== null
      ) {
        clearPressCandidate(pressCandidateRef);
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.input !== "touch") {
        return;
      }

      if (getTouchByIdentifier(event.changedTouches, state.pointerId) === null) {
        return;
      }

      event.preventDefault();
      cancelActiveDrag("touch", state.pointerId);
    },
    [cancelActiveDrag],
  );

  useEffect(() => {
    if (dragState?.phase !== "dragging" || dragState.input !== "pointer") {
      return;
    }

    const pointerId = dragState.pointerId;

    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      if (moveActiveDrag("pointer", event.pointerId, getEventPoint(event))) {
        event.preventDefault();
      }
    };

    const handleWindowPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      if (finishActiveDrag("pointer", event.pointerId, getEventPoint(event))) {
        event.preventDefault();
      }
    };

    const handleWindowPointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      if (cancelActiveDrag("pointer", event.pointerId)) {
        event.preventDefault();
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerCancel);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };
  }, [
    cancelActiveDrag,
    dragState?.input,
    dragState?.phase,
    dragState?.pointerId,
    finishActiveDrag,
    moveActiveDrag,
  ]);

  useEffect(() => {
    if (dragState?.phase !== "dragging" || dragState.input !== "touch") {
      return;
    }

    const pointerId = dragState.pointerId;

    const handleWindowTouchMove = (event: TouchEvent) => {
      const touch = getTouchByIdentifier(event.changedTouches, pointerId);

      if (touch === null) {
        return;
      }

      if (moveActiveDrag("touch", pointerId, getTouchPoint(touch))) {
        event.preventDefault();
      }
    };

    const handleWindowTouchEnd = (event: TouchEvent) => {
      const touch = getTouchByIdentifier(event.changedTouches, pointerId);

      if (touch === null) {
        return;
      }

      if (finishActiveDrag("touch", pointerId, getTouchPoint(touch))) {
        event.preventDefault();
      }
    };

    const handleWindowTouchCancel = (event: TouchEvent) => {
      if (getTouchByIdentifier(event.changedTouches, pointerId) === null) {
        return;
      }

      if (cancelActiveDrag("touch", pointerId)) {
        event.preventDefault();
      }
    };

    window.addEventListener("touchmove", handleWindowTouchMove, { passive: false });
    window.addEventListener("touchend", handleWindowTouchEnd, { passive: false });
    window.addEventListener("touchcancel", handleWindowTouchCancel, { passive: false });

    return () => {
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowTouchEnd);
      window.removeEventListener("touchcancel", handleWindowTouchCancel);
    };
  }, [
    cancelActiveDrag,
    dragState?.input,
    dragState?.phase,
    dragState?.pointerId,
    finishActiveDrag,
    moveActiveDrag,
  ]);

  const moveImageWithKeyboard = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!canReorder || toIndex < 0 || toIndex >= BOARD_SLOT_COUNT) {
        return;
      }

      void onReorderImages?.(fromIndex, toIndex);
    },
    [canReorder, onReorderImages],
  );

  const getSlotAnimation = useCallback(
    (image: BoardSlot) => {
      const isDraggingSlot = image !== null && dragState?.imageId === image.id;

      return getGridSlotAnimation(isDraggingSlot);
    },
    [dragState],
  );

  const getSlotDragState = useCallback(
    (image: BoardSlot) => {
      return image !== null && dragState?.imageId === image.id ? dragState.phase : undefined;
    },
    [dragState],
  );

  const setBoardElement = useCallback((element: HTMLDivElement | null) => {
    boardElementRef.current = element;
  }, []);

  return {
    canReorder,
    canDragImages,
    dragOverlay,
    dragPhase: dragState?.phase,
    getSlotAnimation,
    getSlotDragState,
    handlePointerCancel,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    handleTouchCancel,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    moveImageWithKeyboard,
    renderedSlots,
    reorderTransition,
    setBoardElement,
    slots,
  };
}

function createBoardSlots(images: readonly BoardSlot[]): BoardSlot[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => images[index] ?? null);
}

async function commitReorder(
  state: DragState,
  onReorderImages: ReorderImages | undefined,
  returnDragToOrigin: (state: DragState) => void,
  clearDragAfterSettle: () => void,
) {
  let result: Awaited<ReturnType<ReorderImages>>;

  try {
    result = await onReorderImages?.(state.originIndex, state.dropIndex ?? state.originIndex);
  } catch {
    result = false;
  }

  if (result === false) {
    returnDragToOrigin(state);
    return;
  }

  clearDragAfterSettle();
}

async function commitRemove(
  state: DragState,
  onRemoveImage: RemoveImage | undefined,
  returnDragToOrigin: (state: DragState) => void,
  clearDragAfterSettle: () => void,
) {
  let result: Awaited<ReturnType<RemoveImage>>;

  try {
    result = await onRemoveImage?.(state.originIndex);
  } catch {
    result = false;
  }

  if (result === false) {
    returnDragToOrigin(state);
    return;
  }

  clearDragAfterSettle();
}

function createDragOverlay(dragState: DragState) {
  const originRect = dragState.slotRects[dragState.originIndex];

  return {
    animation: {
      scale: dragState.phase === "dragging" ? 1.03 : 1,
      x: dragState.pointer.x - dragState.pointerOffset.x,
      y: dragState.pointer.y - dragState.pointerOffset.y,
    },
    height: originRect?.height ?? 0,
    image: dragState.image,
    slotIndex: dragState.originIndex,
    width: originRect?.width ?? 0,
  };
}

function getGridSlotAnimation(isDraggingSlot: boolean) {
  return {
    opacity: isDraggingSlot ? 0 : 1,
    scale: 1,
  };
}

function getEventPoint(event: { clientX: number; clientY: number }): Point {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function getTouchPoint(touch: TrackedTouch): Point {
  return {
    x: touch.clientX,
    y: touch.clientY,
  };
}

function getPointDistance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getPointForSlot(rect: Rect, offset: Point): Point {
  return {
    x: rect.left + offset.x,
    y: rect.top + offset.y,
  };
}

function getSlotIndexAtPoint(point: Point, slotRects: readonly Rect[]): number | null {
  const slotIndex = slotRects.findIndex(
    (rect) =>
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom,
  );

  return slotIndex === -1 ? null : slotIndex;
}

function isPointInRemoveDropTarget(
  point: Point,
  getRemoveDropTargetRect: (() => ImageBoardRemoveDropTargetRect | null) | undefined,
): boolean {
  const rect = getRemoveDropTargetRect?.();

  if (rect === undefined || rect === null) {
    return false;
  }

  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

function getCurrentSlotRects(boardElement: HTMLDivElement | null): Rect[] | null {
  if (boardElement === null) {
    return null;
  }

  const slotRects: Array<Rect | null> = Array.from({ length: BOARD_SLOT_COUNT }, () => null);

  for (const slotElement of boardElement.querySelectorAll<HTMLElement>(
    ".ds-image-board-reorder-slot[data-slot-index]",
  )) {
    const slotIndex = Number(slotElement.dataset.slotIndex);

    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= BOARD_SLOT_COUNT) {
      return null;
    }

    slotRects[slotIndex] = createRect(slotElement.getBoundingClientRect());
  }

  if (slotRects.some((rect) => rect === null)) {
    return null;
  }

  return slotRects as Rect[];
}

function createRect(rect: DOMRect): Rect {
  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  };
}

function clearPressCandidate(candidateRef: { current: PressCandidate | null }) {
  const candidate = candidateRef.current;

  if (candidate === null) {
    return;
  }

  window.clearTimeout(candidate.timerId);
  if (candidate.input === "pointer" && candidate.element !== null) {
    releasePointerCapture(candidate.element, candidate.pointerId);
  }
  candidateRef.current = null;
}

function clearReturnTimer(timerRef: { current: number | null }) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function getFirstTouch(touches: TouchCollection): TrackedTouch | null {
  return touches.item?.(0) ?? touches[0] ?? null;
}

function getTouchByIdentifier(touches: TouchCollection, identifier: number): TrackedTouch | null {
  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches.item?.(index) ?? touches[index];

    if (touch !== undefined && touch.identifier === identifier) {
      return touch;
    }
  }

  return null;
}

function capturePointer(element: HTMLElement, pointerId: number) {
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // Pointer capture can fail if the browser has already ended the pointer stream.
  }
}

function releasePointerCapture(element: HTMLElement, pointerId: number) {
  try {
    element.releasePointerCapture?.(pointerId);
  } catch {
    // Ignore stale pointer ids; cleanup should not alter the gesture outcome.
  }
}

function isInteractiveElement(target: EventTarget): boolean {
  return target instanceof Element && target.closest("button, input, label, a") !== null;
}
