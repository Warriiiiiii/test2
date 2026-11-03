import { useEffect, useRef } from 'react';
import type { LogEntry } from '../../engine/types';
import { STRINGS } from '../../data/strings';

interface Props {
  entries: LogEntry[];
  /** Shown while the log is still empty. */
  placeholder?: string;
  /** Only the newest lines are shown. */
  limit?: number;
}

export default function CombatLog({ entries, placeholder, limit = 8 }: Props) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [entries.length]);

  const shown = entries.slice(-limit);
  const offset = entries.length - shown.length;
  let lastTurn = -1;

  return (
    <ol className="combat-log" ref={ref} aria-live="polite">
      {shown.length === 0 && placeholder && <li className="log-line log-placeholder">{placeholder}</li>}
      {shown.map((e, i) => {
        const showTurn = e.turn !== lastTurn;
        lastTurn = e.turn;
        const cls = ['log-line', e.side ? `log-${e.side}` : '', e.crit ? 'log-crit' : '', e.dodged ? 'log-dodge' : ''].join(' ');
        return (
          <li key={offset + i} className={cls}>
            {showTurn && <span className="log-turn">{STRINGS.ui.turn(e.turn)}</span>}
            <span>{e.text}</span>
          </li>
        );
      })}
    </ol>
  );
}
