import { act, fireEvent, screen, within } from "@testing-library/react";
import { vi } from "vitest";

export function getImageBoardSlotGroups(): HTMLElement[] {
  const board = screen.getByRole("group", { name: /Image board/ });

  return within(board).getAllByRole("group");
}

export function getImageBoardSlotFrames(): HTMLElement[] {
  return getImageBoardSlotGroups().map((slot) => {
    const frame = slot.parentElement;

    if (!(frame instanceof HTMLElement)) {
      throw new Error("Image slot must be rendered inside a frame.");
    }

    return frame;
  });
}

export function mockImageBoardSlotRects(slotFrames: readonly HTMLElement[]) {
  for (const [slotIndex, slot] of slotFrames.entries()) {
    const column = slotIndex % 3;
    const row = Math.floor(slotIndex / 3);

    vi.spyOn(slot, "getBoundingClientRect").mockReturnValue(
      createDomRect(column * 100, row * 100, 100, 100),
    );
  }
}

export function mockElementRect(
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
    createDomRect(left, top, width, height),
  );
}

export function beginLongPressSlotDrag(slotFrames: readonly HTMLElement[], fromIndex: number) {
  const point = getSlotCenterPoint(fromIndex);

  fireEvent.pointerDown(slotFrames[fromIndex], {
    button: 0,
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
  act(() => {
    vi.advanceTimersByTime(300);
  });
}

export async function beginLongPressSlotDragWithRealTimer(
  slotFrames: readonly HTMLElement[],
  fromIndex: number,
) {
  const point = getSlotCenterPoint(fromIndex);

  fireEvent.pointerDown(slotFrames[fromIndex], {
    button: 0,
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 300));
  });
}

export async function waitForSlotDragSettle() {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  });
}

export function startSlotPress(slotFrames: readonly HTMLElement[], fromIndex: number) {
  const point = getSlotCenterPoint(fromIndex);

  fireEvent.pointerDown(slotFrames[fromIndex], {
    button: 0,
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
}

export function movePressedSlotBy(
  slotFrames: readonly HTMLElement[],
  fromIndex: number,
  deltaX: number,
  deltaY: number,
) {
  const point = getSlotCenterPoint(fromIndex);

  fireEvent.pointerMove(slotFrames[fromIndex], {
    clientX: point.x + deltaX,
    clientY: point.y + deltaY,
    pointerId: 1,
  });
}

export function moveSlotDragTo(
  slotFrames: readonly HTMLElement[],
  fromIndex: number,
  toIndex: number,
) {
  const point = getSlotCenterPoint(toIndex);

  fireEvent.pointerMove(slotFrames[fromIndex], {
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
}

export function moveSlotDragOutside(slotFrames: readonly HTMLElement[], fromIndex: number) {
  fireEvent.pointerMove(slotFrames[fromIndex], {
    clientX: 360,
    clientY: 360,
    pointerId: 1,
  });
}

export function moveSlotDragToPoint(
  slotFrames: readonly HTMLElement[],
  fromIndex: number,
  point: { x: number; y: number },
) {
  fireEvent.pointerMove(slotFrames[fromIndex], {
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
}

export function dropSlotDragAt(
  slotFrames: readonly HTMLElement[],
  fromIndex: number,
  toIndex: number,
) {
  const point = getSlotCenterPoint(toIndex);

  fireEvent.pointerUp(slotFrames[fromIndex], {
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
}

export function dropSlotDragAtPoint(
  slotFrames: readonly HTMLElement[],
  fromIndex: number,
  point: { x: number; y: number },
) {
  fireEvent.pointerUp(slotFrames[fromIndex], {
    clientX: point.x,
    clientY: point.y,
    pointerId: 1,
  });
}

export function dropSlotDragOutside(slotFrames: readonly HTMLElement[], fromIndex: number) {
  fireEvent.pointerUp(slotFrames[fromIndex], {
    clientX: 360,
    clientY: 360,
    pointerId: 1,
  });
}

export function cancelSlotDrag(slotFrames: readonly HTMLElement[], fromIndex: number) {
  fireEvent.pointerCancel(slotFrames[fromIndex], {
    pointerId: 1,
  });
}

function getSlotCenterPoint(slotIndex: number) {
  const column = slotIndex % 3;
  const row = Math.floor(slotIndex / 3);

  return {
    x: column * 100 + 50,
    y: row * 100 + 50,
  };
}

function createDomRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  } as DOMRect;
}
