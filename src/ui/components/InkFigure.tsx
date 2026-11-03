import type { Element } from '../../engine/types';
import { ELEMENT_COLORS } from '../../data/elements';

interface Props {
  element: Element;
  size?: number;
  /** Lower when the enemy is hurt, so the ink fades. */
  vigor?: number;
}

/** An ink blot standing in for the enemy. No character art, just a brush shape tinted by element. */
export default function InkFigure({ element, size = 96, vigor = 1 }: Props) {
  const color = ELEMENT_COLORS[element];
  const id = `ink-${element}`;
  return (
    <svg className="ink-figure" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
          <stop offset="70%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </radialGradient>
      </defs>
      <path
        d="M50 8 C68 6 86 18 90 36 C94 54 88 74 72 86 C56 98 30 94 18 78 C6 62 8 40 20 24 C28 14 38 9 50 8 Z"
        fill={`url(#${id})`}
        opacity={0.35 + 0.65 * Math.max(0, Math.min(1, vigor))}
      />
      <path
        d="M30 30 C40 22 60 22 70 32"
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
}
