import type { ComponentChildren } from 'preact';

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ComponentChildren;
}

/** A big tap target that works like a toggle. The state is also in `aria-pressed`, not only in color. */
export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button type="button" class="chip" aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}
