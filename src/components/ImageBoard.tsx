import { motion, useReducedMotion } from "motion/react";
import { BOARD_SLOT_COUNT, type BoardSlot } from "../domain/appState";
import { classNames } from "./classNames";
import { ImageSlot } from "./ImageSlot";
import {
  useImageBoardReorder,
  type ImageBoardDragStatus,
  type ImageBoardRemoveDropTargetRect,
  type RemoveImage,
  type ReorderImages,
} from "./useImageBoardReorder";

export type { ImageBoardDragStatus, ImageBoardRemoveDropTargetRect };

export type ImageBoardProps = {
  accept?: string;
  className?: string;
  disabled?: boolean;
  getRemoveDropTargetRect?: () => ImageBoardRemoveDropTargetRect | null;
  images: readonly BoardSlot[];
  onDragStatusChange?: (status: ImageBoardDragStatus) => void;
  onImageSelect?: (slotIndex: number, file: File) => void;
  onRemoveImage?: RemoveImage;
  onReorderImages?: ReorderImages;
  variant?: "default" | "poster";
};

export function ImageBoard({
  accept,
  className,
  disabled = false,
  getRemoveDropTargetRect,
  images,
  onDragStatusChange,
  onImageSelect,
  onRemoveImage,
  onReorderImages,
  variant = "default",
}: ImageBoardProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    canDragImages,
    canReorder,
    dragOverlay,
    dragPhase,
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
  } = useImageBoardReorder({
    disabled,
    getRemoveDropTargetRect,
    images,
    onDragStatusChange,
    onRemoveImage,
    onReorderImages,
    shouldReduceMotion,
  });
  const filledSlotCount = slots.filter(Boolean).length;

  return (
    <div
      aria-label={`Image board, ${filledSlotCount} of ${BOARD_SLOT_COUNT} slots filled`}
      className={classNames("ds-image-board", className)}
      data-reordering={dragPhase}
      data-variant={variant}
      ref={setBoardElement}
      role="group"
    >
      {renderedSlots.map((image, slotIndex) => {
        const slotDragState = getSlotDragState(image);

        return (
          <motion.div
            animate={getSlotAnimation(image)}
            className="ds-image-board-reorder-slot"
            data-drag-state={slotDragState}
            data-draggable={image !== null && canDragImages ? "true" : undefined}
            data-slot-index={slotIndex}
            initial={false}
            key={getBoardSlotKey(image, slotIndex)}
            layout
            onDragStart={(event) => event.preventDefault()}
            onPointerCancel={handlePointerCancel}
            onPointerDown={(event) => handlePointerDown(event, slotIndex)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            transition={reorderTransition}
          >
            {image === null || !canReorder ? null : (
              <div className="ds-image-board-keyboard-actions">
                <button
                  aria-label={`Move image in slot ${slotIndex + 1} backward`}
                  className="ds-image-board-keyboard-action"
                  disabled={slotIndex === 0}
                  onClick={() => moveImageWithKeyboard(slotIndex, slotIndex - 1)}
                  type="button"
                >
                  <span aria-hidden="true">{"<"}</span>
                </button>
                <button
                  aria-label={`Move image in slot ${slotIndex + 1} forward`}
                  className="ds-image-board-keyboard-action"
                  disabled={slotIndex === BOARD_SLOT_COUNT - 1}
                  onClick={() => moveImageWithKeyboard(slotIndex, slotIndex + 1)}
                  type="button"
                >
                  <span aria-hidden="true">{">"}</span>
                </button>
              </div>
            )}
            <ImageSlot
              accept={accept}
              disabled={disabled}
              image={image}
              onImageSelect={onImageSelect}
              slotIndex={slotIndex}
            />
          </motion.div>
        );
      })}
      {dragPhase === undefined ? null : (
        <span aria-live="polite" className="ds-visually-hidden">
          Moving image
        </span>
      )}
      {dragOverlay === null ? null : (
        <motion.div
          animate={dragOverlay.animation}
          aria-hidden="true"
          className="ds-image-board-drag-overlay"
          initial={false}
          style={{
            height: dragOverlay.height,
            width: dragOverlay.width,
          }}
          transition={reorderTransition}
        >
          <ImageSlot disabled image={dragOverlay.image} slotIndex={dragOverlay.slotIndex} />
        </motion.div>
      )}
    </div>
  );
}

function getBoardSlotKey(image: BoardSlot, slotIndex: number): string {
  return image === null ? `empty-${slotIndex}` : `image-${image.id}`;
}
