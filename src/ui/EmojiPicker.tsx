import { CAT_EMOJIS, type CatEmoji } from '../types';
import { Chip } from './Chip';

/** Choose the emoji that stands for a cat. */
export function EmojiPicker({
  value,
  onChange,
}: {
  value: CatEmoji;
  onChange: (emoji: CatEmoji) => void;
}) {
  return (
    <div class="chips">
      {CAT_EMOJIS.map((e) => (
        <Chip key={e} selected={value === e} onClick={() => onChange(e)}>
          {e}
        </Chip>
      ))}
    </div>
  );
}
