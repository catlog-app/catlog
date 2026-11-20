import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { strings } from '../strings';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}

/** Bottom sheet. It closes with the back area, the close button or the Escape key. */
export function Sheet({ title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    document.body.classList.add('no-scroll');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onClose]);

  return (
    <div class="sheet-wrap">
      <button
        type="button"
        class="sheet-backdrop"
        aria-label={strings.common.close}
        onClick={onClose}
      />
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div class="sheet__head">
          <h2 class="sheet__title">{title}</h2>
          <button type="button" class="btn btn--ghost" onClick={onClose}>
            {strings.common.close}
          </button>
        </div>
        <div class="sheet__body">{children}</div>
      </div>
    </div>
  );
}
