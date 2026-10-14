import { useEffect, useRef, type ReactNode } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog (its heading). */
  labelledBy: string;
  closeLabel: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * A modal on the native <dialog>: showModal() puts it in the top layer, keeps
 * focus inside, makes the page behind it inert and closes on Esc, with focus
 * going back to the button that opened it. Clicking the backdrop closes it too
 * (closedby="any", with a click check for browsers that do not support it yet).
 */
export default function Modal({ open, onClose, labelledBy, closeLabel, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const dialog = ref.current;
    // Only a click on the dialog element itself can be the backdrop; then check it landed outside the box.
    if (!dialog || event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = rect.top <= event.clientY && event.clientY <= rect.bottom && rect.left <= event.clientX && event.clientX <= rect.right;
    if (!inside) dialog.close();
  };

  return (
    <dialog
      ref={ref}
      {...{ closedby: 'any' }}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={onBackdropClick}
      className={`modal-luxe ${size === 'lg' ? 'modal-luxe-lg' : ''}`}
    >
      {open && (
        <div className="relative p-6 md:p-7">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={closeLabel}
            className="absolute top-4 end-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <FiX size={18} />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
