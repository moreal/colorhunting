import { useId, type ChangeEvent } from "react";
import { motion } from "motion/react";
import type { Image } from "../appState";
import { classNames } from "./classNames";
import { RemoveButton } from "./RemoveButton";

export type ImageSlotProps = {
  accept?: string;
  className?: string;
  disabled?: boolean;
  image: Image | null;
  onImageSelect?: (slotIndex: number, file: File) => void;
  onRemoveImage?: (slotIndex: number) => void;
  slotIndex: number;
};

const DEFAULT_ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

export function ImageSlot({
  accept = DEFAULT_ACCEPTED_IMAGE_TYPES,
  className,
  disabled = false,
  image,
  onImageSelect,
  onRemoveImage,
  slotIndex,
}: ImageSlotProps) {
  const inputId = useId();
  const slotNumber = slotIndex + 1;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (file) {
      onImageSelect?.(slotIndex, file);
    }

    event.currentTarget.value = "";
  }

  if (image) {
    return (
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        aria-label={`Image slot ${slotNumber}: ${image.name}`}
        className={classNames("ds-image-slot", className)}
        data-state="filled"
        initial={{ opacity: 0.86, scale: 0.98 }}
        role="group"
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      >
        <img alt={image.altText} className="ds-image-slot-media" src={image.dataUrl} />
        <div className="ds-image-slot-overlay">
          <span className="ds-image-slot-name">{image.name}</span>
          <RemoveButton
            disabled={disabled}
            label={`Remove image from slot ${slotNumber}`}
            onClick={() => onRemoveImage?.(slotIndex)}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: disabled ? 0.64 : 1 }}
      aria-label={`Add image to slot ${slotNumber}`}
      className={classNames("ds-image-slot", className)}
      data-state="empty"
      initial={false}
      role="group"
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
    >
      <input
        accept={accept}
        aria-label={`Upload image to slot ${slotNumber}`}
        className="ds-image-slot-input"
        disabled={disabled}
        id={inputId}
        onChange={handleFileChange}
        type="file"
      />
      <label className="ds-image-slot-empty" htmlFor={inputId}>
        <strong>Slot {slotNumber}</strong>
        <span>Add image</span>
      </label>
    </motion.div>
  );
}
