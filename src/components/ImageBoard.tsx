import { BOARD_SLOT_COUNT, type BoardSlot } from "../appState";
import { classNames } from "./classNames";
import { ImageSlot } from "./ImageSlot";

export type ImageBoardProps = {
  className?: string;
  disabled?: boolean;
  images: readonly BoardSlot[];
  onImageSelect?: (slotIndex: number, file: File) => void;
  onRemoveImage?: (slotIndex: number) => void;
};

export function ImageBoard({
  className,
  disabled = false,
  images,
  onImageSelect,
  onRemoveImage,
}: ImageBoardProps) {
  const slots = createBoardSlots(images);
  const filledSlotCount = slots.filter(Boolean).length;

  return (
    <div
      aria-label={`Image board, ${filledSlotCount} of ${BOARD_SLOT_COUNT} slots filled`}
      className={classNames("ds-image-board", className)}
      role="group"
    >
      {slots.map((image, slotIndex) => (
        <ImageSlot
          disabled={disabled}
          image={image}
          key={image?.id ?? `empty-${slotIndex}`}
          onImageSelect={onImageSelect}
          onRemoveImage={onRemoveImage}
          slotIndex={slotIndex}
        />
      ))}
    </div>
  );
}

function createBoardSlots(images: readonly BoardSlot[]): BoardSlot[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => images[index] ?? null);
}
