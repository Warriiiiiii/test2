import type { Status } from '../../engine/types';
import { describeStatus } from '../format';

interface Props {
  statuses: Status[];
  turn: number;
}

/** Small chips listing a combatant's active statuses. */
export default function StatusChips({ statuses, turn }: Props) {
  if (statuses.length === 0) return null;
  return (
    <ul className="status-chips" aria-label="Status effects">
      {statuses.map((st, i) => (
        <li key={`${st.kind}-${i}`} className={`chip chip-${st.kind}`}>
          {describeStatus(st, turn)}
        </li>
      ))}
    </ul>
  );
}
