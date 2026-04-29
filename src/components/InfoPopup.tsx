import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { classNames } from "./classNames";
import { CloseButton } from "./CloseButton";

export type InfoPopupProps = {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function InfoPopup({
  children,
  className,
  closeLabel = "Close information",
  onClose,
  open,
  title,
}: InfoPopupProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="ds-dialog-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        >
          <motion.section
            animate={{ scale: 1, y: 0 }}
            aria-labelledby={titleId}
            aria-modal="true"
            className={classNames("ds-dialog-surface", className)}
            exit={{ scale: 0.98, y: 8 }}
            initial={{ scale: 0.98, y: 8 }}
            role="dialog"
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <div className="ds-dialog-header">
              <h2 className="ds-dialog-title" id={titleId}>
                {title}
              </h2>
              <CloseButton label={closeLabel} onClick={onClose} ref={closeButtonRef} />
            </div>
            <div className="ds-dialog-content">{children}</div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
