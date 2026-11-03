import type { MoveCategory } from '../format';

/** Line icons, one per move category. Drawn in the current text colour. */
const PATHS: Record<MoveCategory, string> = {
  attack: 'M4 20 L18 6 M15 4 L20 9 M6 14 L10 18',
  multi: 'M3 15 L12 6 M7 20 L16 11 M12 21 L21 12',
  dot: 'M12 3 C9 8 7 10 7 14 a5 5 0 0 0 10 0 c0-3-2-5-2-8 c-1 2-2 3-3 3 Z',
  shield: 'M12 3 L19 6 V12 C19 16 16 19 12 21 C8 19 5 16 5 12 V6 Z',
  heal: 'M12 5 V19 M5 12 H19',
  qi: 'M12 4 a8 8 0 1 0 0.01 0 M12 8 a4 4 0 1 1 0 8',
  buff: 'M12 19 V5 M6 11 L12 5 L18 11',
  debuff: 'M12 5 V19 M6 13 L12 19 L18 13',
  special: 'M12 12 m-1 0 a1 1 0 1 0 2 0 a4 4 0 1 1 -8 0 a7 7 0 1 0 14 0',
};

interface Props {
  category: MoveCategory;
  size?: number;
}

export default function MoveIcon({ category, size = 20 }: Props) {
  return (
    <svg className="move-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[category]} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
