// Turns data into short labels with emoji for the screens.

import { strings } from '../strings';
import type { CatEvent, TagKind } from '../types';

export const textureOf = (code: number | null) => strings.textures.find((t) => t.code === code);
export const waterOf = (code: number | null) => strings.waterLevels.find((w) => w.code === code);
const severityOf = (code: number | null) => strings.stressSeverity.find((s) => s.code === code);

function tagEmoji(kind: TagKind, text: string): string {
  return strings.tagPresets[kind].find((t) => t.text === text)?.emoji ?? '🏷️';
}

const tagLabel = (kind: TagKind, text: string) => `${tagEmoji(kind, text)} ${text}`;

interface EventLine {
  emoji: string;
  title: string;
  detail: string;
}

/** One line of text for lists. */
export function describeEvent(e: CatEvent): EventLine {
  const type = strings.types[e.type];
  switch (e.type) {
    case 'stool': {
      const texture = textureOf(e.texture);
      const extras = (['mucus', 'blood', 'smell'] as const)
        .filter((k) => e[k] > 0)
        .map(
          (k) =>
            `${strings.features[k].emoji} ${strings.features[k].label}: ${strings.scale[e[k]] ?? ''}`,
        );
      return {
        emoji: type.emoji,
        title: texture ? `${type.label} · ${texture.emoji} ${texture.label}` : type.label,
        detail: extras.join(' · '),
      };
    }
    case 'water': {
      const level = waterOf(e.water);
      return {
        emoji: type.emoji,
        title: `${type.label} · ${level?.emoji ?? ''} ${level?.label ?? ''}`,
        detail: '',
      };
    }
    case 'sleep':
    case 'vomit':
      return {
        emoji: type.emoji,
        title: type.label,
        detail: e.tags.map((t) => tagLabel(e.type, t)).join(' · '),
      };
    case 'stress': {
      const sev = severityOf(e.severity);
      return {
        emoji: type.emoji,
        title: sev ? `${type.label} · ${sev.emoji} ${sev.label}` : type.label,
        detail: e.tags.map((t) => tagLabel('stress', t)).join(' · '),
      };
    }
  }
}
