import type { Element } from '../../engine/types';
import { ELEMENT_COLORS } from '../../data/elements';
import { STRINGS } from '../../data/strings';

/** Simple brush-like glyph per element. */
const GLYPHS: Record<Element, string> = {
  fire: 'M12 2 C9 7 6 9 6 14 a6 6 0 0 0 12 0 c0-3-2-4-3-7 c0 3-1 4-2 4 c-1-1-1-3 0-9 Z',
  water: 'M3 10 q3-4 6 0 t6 0 t6 0 M3 15 q3-4 6 0 t6 0 t6 0',
  metal: 'M12 3 L20 12 L12 21 L4 12 Z',
  wood: 'M5 19 C5 9 12 4 19 4 C19 12 13 19 5 19 Z M5 19 L14 9',
  earth: 'M2 20 L8 8 L12 14 L15 6 L22 20 Z',
  none: 'M12 5 a7 7 0 1 0 0.01 0',
};

interface Props {
  element: Element;
  /** Show the element name next to the glyph. */
  withName?: boolean;
  size?: number;
}

export default function ElementBadge({ element, withName = false, size = 18 }: Props) {
  const color = ELEMENT_COLORS[element];
  const outlineOnly = element === 'water' || element === 'none';
  return (
    <span className="element-badge" style={{ color }} title={STRINGS.elements[element]}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d={GLYPHS[element]} fill={outlineOnly ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth={outlineOnly ? 2 : 1} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withName && <span className="element-name">{STRINGS.elements[element]}</span>}
    </span>
  );
}
