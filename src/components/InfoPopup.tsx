import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

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
        return;
      }

      if (event.key === "Tab") {
        trapDialogFocus(event, dialogRef.current);
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
          transition={{
            duration: shouldReduceMotion ? 0 : 0.18,
            ease: [0.2, 0, 0, 1],
          }}
        >
          <motion.section
            animate={{ scale: 1, y: 0 }}
            aria-label={title}
            aria-modal="true"
            className={classNames("ds-dialog-surface", className)}
            exit={{
              scale: shouldReduceMotion ? 1 : 0.98,
              y: shouldReduceMotion ? 0 : 8,
            }}
            initial={{
              scale: shouldReduceMotion ? 1 : 0.98,
              y: shouldReduceMotion ? 0 : 8,
            }}
            ref={dialogRef}
            role="dialog"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: [0.2, 0, 0, 1],
            }}
          >
            <CloseButton
              className="ds-dialog-close-button"
              label={closeLabel}
              onClick={onClose}
              ref={closeButtonRef}
            />
            <div className="ds-dialog-content">{children}</div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function trapDialogFocus(event: KeyboardEvent, dialogElement: HTMLElement | null) {
  if (dialogElement === null) {
    return;
  }

  const focusableElements = Array.from(
    dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (firstElement === undefined || lastElement === undefined) {
    event.preventDefault();
    dialogElement.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
