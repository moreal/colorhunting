import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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

type DragPhase = "dragging" | "returning" | "settling";

type DragState = {
  dropIndex: number | null;
  image: Image;
  imageId: string;
  isOverRemoveTarget: boolean;
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

  const beginDrag = useCallback(
    (slotIndex: number, pointerId: number, pointer: Point) => {
      const image = boardSlotsRef.current[slotIndex];
      const slotRects = getCurrentSlotRects(boardElementRef.current);

      if (image === null || slotRects === null) {
        return;
      }

      const originRect = slotRects[slotIndex];

      if (originRect === undefined) {
        return;
      }

      const nextDragState: DragState = {
        dropIndex: slotIndex,
        image,
        imageId: image.id,
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
    },
    [setNextDragState],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, slotIndex: number) => {
      if (
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

      event.preventDefault();
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
    [beginDrag, canDragImages, disabled],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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

      if (canRemoveImages && isPointInRemoveDropTarget(point, getRemoveDropTargetRect)) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({
          ...state,
          dropIndex: null,
          isOverRemoveTarget: true,
          pointer: point,
        });
        return;
      }

      if (!canReorder) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({
          ...state,
          dropIndex: null,
          isOverRemoveTarget: false,
          pointer: point,
        });
        return;
      }

      const dropIndex = getSlotIndexAtPoint(point, state.slotRects);

      if (dropIndex === null) {
        setPreviewSlots(boardSlotsRef.current);
        setNextDragState({ ...state, dropIndex, isOverRemoveTarget: false, pointer: point });
        return;
      }

      if (dropIndex === state.dropIndex && !state.isOverRemoveTarget) {
        setNextDragState({ ...state, pointer: point });
        return;
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
        return;
      }

      setPreviewSlots(nextSlots);
      setNextDragState({
        ...state,
        dropIndex,
        isOverRemoveTarget: false,
        pointer: point,
      });
    },
    [canRemoveImages, canReorder, getRemoveDropTargetRect, setNextDragState],
  );

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

      const point = getEventPoint(event);

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
        return;
      }

      if (!canReorder) {
        returnDragToOrigin(state);
        return;
      }

      if (state.dropIndex === null || state.dropIndex === state.originIndex) {
        returnDragToOrigin(state);
        return;
      }

      const targetRect = state.slotRects[state.dropIndex];

      if (targetRect === undefined) {
        returnDragToOrigin(state);
        return;
      }

      setNextDragState({
        ...state,
        phase: "settling",
        pointer: getPointForSlot(targetRect, state.pointerOffset),
      });

      void commitReorder(state, onReorderImages, returnDragToOrigin, clearDragAfterSettle);
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
