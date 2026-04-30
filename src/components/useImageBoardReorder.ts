import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BOARD_SLOT_COUNT, moveBoardSlot, type BoardSlot } from "../domain/appState";

export type ReorderImages = (
  fromIndex: number,
  toIndex: number,
) => boolean | Promise<boolean> | Promise<void> | void;

type UseImageBoardReorderOptions = {
  disabled: boolean;
  images: readonly BoardSlot[];
  onReorderImages?: ReorderImages;
  shouldReduceMotion: boolean | null;
};

type Point = {
  x: number;
  y: number;
};

type Rect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type DragPhase = "dragging" | "returning" | "settling";

type DragState = {
  dropIndex: number | null;
  imageId: string;
  originIndex: number;
  phase: DragPhase;
  pointer: Point;
  pointerId: number;
  pointerOffset: Point;
  slotRects: Rect[];
};

type PressCandidate = {
  pointerId: number;
  startPoint: Point;
  timerId: number;
};

const LONG_PRESS_REORDER_DELAY_MS = 260;
const POINTER_MOVE_CANCEL_DISTANCE = 8;
const REORDER_SETTLE_DURATION_MS = 180;

export function useImageBoardReorder({
  disabled,
  images,
  onReorderImages,
  shouldReduceMotion,
}: UseImageBoardReorderOptions) {
  const slots = useMemo(() => createBoardSlots(images), [images]);
  const boardSlotsRef = useRef<BoardSlot[]>(slots);
  const dragStateRef = useRef<DragState | null>(null);
  const pressCandidateRef = useRef<PressCandidate | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewSlots, setPreviewSlots] = useState<BoardSlot[]>(() => slots);
  const canReorder = onReorderImages !== undefined && !disabled;
  const renderedSlots = dragState === null ? slots : previewSlots;
  const reorderTransition = {
    duration: shouldReduceMotion ? 0 : 0.18,
    ease: [0.2, 0, 0, 1] as const,
  };

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
    return () => {
      clearPressCandidate(pressCandidateRef);
      clearReturnTimer(returnTimerRef);
    };
  }, []);

  const clearDragAfterSettle = useCallback(() => {
    clearReturnTimer(returnTimerRef);

    returnTimerRef.current = window.setTimeout(
      () => {
        setDragState(null);
        dragStateRef.current = null;
      },
      shouldReduceMotion ? 0 : REORDER_SETTLE_DURATION_MS,
    );
  }, [shouldReduceMotion]);

  const returnDragToOrigin = useCallback(
    (state: DragState) => {
      const originRect = state.slotRects[state.originIndex];

      if (originRect === undefined) {
        setDragState(null);
        dragStateRef.current = null;
        return;
      }

      setPreviewSlots(boardSlotsRef.current);
      setDragState({
        ...state,
        dropIndex: state.originIndex,
        phase: "returning",
        pointer: getPointForSlot(originRect, state.pointerOffset),
      });
      clearDragAfterSettle();
    },
    [clearDragAfterSettle],
  );

  const beginDrag = useCallback((slotIndex: number, pointerId: number, pointer: Point) => {
    const image = boardSlotsRef.current[slotIndex];
    const slotRects = Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => {
      const slot = slotRefs.current[index];

      return slot === null || slot === undefined ? null : createRect(slot.getBoundingClientRect());
    });

    if (image === null || slotRects.some((rect) => rect === null)) {
      return;
    }

    const originRect = slotRects[slotIndex];

    if (originRect === null || originRect === undefined) {
      return;
    }

    const nextDragState: DragState = {
      dropIndex: slotIndex,
      imageId: image.id,
      originIndex: slotIndex,
      phase: "dragging",
      pointer,
      pointerId,
      pointerOffset: {
        x: pointer.x - originRect.left,
        y: pointer.y - originRect.top,
      },
      slotRects: slotRects as Rect[],
    };

    setPreviewSlots(boardSlotsRef.current);
    setDragState(nextDragState);
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, slotIndex: number) => {
      if (
        disabled ||
        !canReorder ||
        event.button !== 0 ||
        isInteractiveElement(event.target) ||
        boardSlotsRef.current[slotIndex] === null
      ) {
        return;
      }

      clearPressCandidate(pressCandidateRef);
      clearReturnTimer(returnTimerRef);

      const startPoint = getEventPoint(event);

      event.currentTarget.setPointerCapture?.(event.pointerId);
      pressCandidateRef.current = {
        pointerId: event.pointerId,
        startPoint,
        timerId: window.setTimeout(() => {
          const candidate = pressCandidateRef.current;

          if (candidate === null || candidate.pointerId !== event.pointerId) {
            return;
          }

          pressCandidateRef.current = null;
          beginDrag(slotIndex, event.pointerId, startPoint);
        }, LONG_PRESS_REORDER_DELAY_MS),
      };
    },
    [beginDrag, canReorder, disabled],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const point = getEventPoint(event);
    const candidate = pressCandidateRef.current;

    if (
      candidate !== null &&
      candidate.pointerId === event.pointerId &&
      getPointDistance(candidate.startPoint, point) > POINTER_MOVE_CANCEL_DISTANCE
    ) {
      clearPressCandidate(pressCandidateRef);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      return;
    }

    const state = dragStateRef.current;

    if (state === null || state.pointerId !== event.pointerId || state.phase !== "dragging") {
      return;
    }

    event.preventDefault();

    const dropIndex = getSlotIndexAtPoint(point, state.slotRects);

    if (dropIndex === null) {
      setDragState({ ...state, dropIndex, pointer: point });
      return;
    }

    if (dropIndex === state.dropIndex) {
      setDragState({ ...state, pointer: point });
      return;
    }

    const nextSlots = moveBoardSlot(boardSlotsRef.current, state.originIndex, dropIndex);

    if (nextSlots === null) {
      setDragState({ ...state, dropIndex: null, pointer: point });
      return;
    }

    setPreviewSlots(nextSlots);
    setDragState({
      ...state,
      dropIndex,
      pointer: point,
    });
  }, []);

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (candidate !== null && candidate.pointerId === event.pointerId) {
        clearPressCandidate(pressCandidateRef);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.pointerId !== event.pointerId) {
        return;
      }

      event.currentTarget.releasePointerCapture?.(event.pointerId);

      if (state.dropIndex === null || state.dropIndex === state.originIndex) {
        returnDragToOrigin(state);
        return;
      }

      const targetRect = state.slotRects[state.dropIndex];

      if (targetRect === undefined) {
        returnDragToOrigin(state);
        return;
      }

      setDragState({
        ...state,
        phase: "settling",
        pointer: getPointForSlot(targetRect, state.pointerOffset),
      });

      void commitReorder(state, onReorderImages, returnDragToOrigin, clearDragAfterSettle);
    },
    [clearDragAfterSettle, onReorderImages, returnDragToOrigin],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const candidate = pressCandidateRef.current;

      if (candidate !== null && candidate.pointerId === event.pointerId) {
        clearPressCandidate(pressCandidateRef);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        return;
      }

      const state = dragStateRef.current;

      if (state === null || state.pointerId !== event.pointerId) {
        return;
      }

      event.currentTarget.releasePointerCapture?.(event.pointerId);
      returnDragToOrigin(state);
    },
    [returnDragToOrigin],
  );

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
    (slotIndex: number, image: BoardSlot) => {
      const isDraggingSlot = image !== null && dragState?.imageId === image.id;

      return getDragSlotAnimation(slotIndex, dragState, isDraggingSlot);
    },
    [dragState],
  );

  const getSlotDragState = useCallback(
    (image: BoardSlot) => {
      return image !== null && dragState?.imageId === image.id ? dragState.phase : undefined;
    },
    [dragState],
  );

  const setSlotElement = useCallback((slotIndex: number, element: HTMLDivElement | null) => {
    slotRefs.current[slotIndex] = element;
  }, []);

  return {
    canReorder,
    dragPhase: dragState?.phase,
    getSlotAnimation,
    getSlotDragState,
    handlePointerCancel,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    moveImageWithKeyboard,
    renderedSlots,
    reorderTransition,
    setSlotElement,
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

function getDragSlotAnimation(
  slotIndex: number,
  dragState: DragState | null,
  isDraggingSlot: boolean,
) {
  if (dragState === null || !isDraggingSlot) {
    return { scale: 1, x: 0, y: 0 };
  }

  const slotRect = dragState.slotRects[slotIndex];

  if (slotRect === undefined) {
    return { scale: 1, x: 0, y: 0 };
  }

  return {
    scale: dragState.phase === "dragging" ? 1.03 : 1,
    x: dragState.pointer.x - dragState.pointerOffset.x - slotRect.left,
    y: dragState.pointer.y - dragState.pointerOffset.y - slotRect.top,
  };
}

function getEventPoint(event: ReactPointerEvent<HTMLDivElement>): Point {
  return {
    x: event.clientX,
    y: event.clientY,
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

function createRect(rect: DOMRect): Rect {
  return {
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    top: rect.top,
  };
}

function clearPressCandidate(candidateRef: { current: PressCandidate | null }) {
  if (candidateRef.current === null) {
    return;
  }

  window.clearTimeout(candidateRef.current.timerId);
  candidateRef.current = null;
}

function clearReturnTimer(timerRef: { current: number | null }) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function isInteractiveElement(target: EventTarget): boolean {
  return target instanceof Element && target.closest("button, input, label, a") !== null;
}
