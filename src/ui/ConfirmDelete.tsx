import { useEffect, useState } from 'preact/hooks';
import { strings } from '../strings';

interface ConfirmDeleteProps {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
}

/** Delete in two taps. The second tap must come within 5 seconds. We do not use `confirm()`. */
export function ConfirmDelete({
  onConfirm,
  label = strings.common.delete,
  confirmLabel = strings.common.deleteConfirm,
}: ConfirmDeleteProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      class={armed ? 'btn btn--danger btn--danger-armed' : 'btn btn--danger'}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
