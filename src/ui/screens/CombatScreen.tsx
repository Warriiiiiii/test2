import { useEffect, useRef, useState } from 'react';
import type { Side } from '../../engine/types';
import { getEnemyIntent, playerMoves, turnOrder } from '../../engine/combat';
import { STRINGS } from '../../data/strings';
import { canRewind, useGameStore } from '../../store/gameStore';
import Bar from '../components/Bar';
import CombatLog from '../components/CombatLog';
import ElementBadge from '../components/ElementBadge';
import InkFigure from '../components/InkFigure';
import MoveIcon from '../components/MoveIcon';
import StatusChips from '../components/StatusChips';
import { describeMove, moveCategory, qiCostLabel } from '../format';

interface Floater {
  id: string;
  side: Side;
  text: string;
  kind: 'hit' | 'crit' | 'miss' | 'heal';
  index: number;
}

const FLOAT_MS = 1000;

/** The fight. Enemy on top, log in the middle, player bars and actions at the bottom. */
export default function CombatScreen() {
  const combat = useGameStore((s) => s.combat);
  const run = useGameStore((s) => s.run);
  const act = useGameStore((s) => s.act);
  const rewind = useGameStore((s) => s.rewind);
  const rewindUsed = useGameStore((s) => s.rewindUsed);
  const previousCombat = useGameStore((s) => s.previousCombat);
  const continueAfterFight = useGameStore((s) => s.continueAfterFight);

  const [floaters, setFloaters] = useState<Floater[]>([]);
  const seen = useRef(0);

  // Turn new log lines into floating numbers over whoever took the hit.
  const logLength = combat?.log.length ?? 0;
  useEffect(() => {
    if (!combat) return;
    const fresh = combat.log.slice(seen.current);
    seen.current = combat.log.length;
    const perSide: Record<Side, number> = { player: 0, enemy: 0 };
    const added: Floater[] = [];
    fresh.forEach((line, i) => {
      if (!line.target) return;
      const id = `${combat.turn}-${seen.current}-${i}`;
      const index = perSide[line.target]++;
      if (line.dodged) added.push({ id, side: line.target, text: STRINGS.combat.miss, kind: 'miss', index });
      else if (line.damage) added.push({ id, side: line.target, text: `${line.damage}`, kind: line.crit ? 'crit' : 'hit', index });
      else if (line.heal) added.push({ id, side: line.target, text: `+${line.heal}`, kind: 'heal', index });
    });
    if (added.length === 0) return;
    setFloaters((f) => [...f, ...added]);
    const timer = setTimeout(() => setFloaters((f) => f.filter((x) => !added.includes(x))), FLOAT_MS);
    return () => clearTimeout(timer);
  }, [combat, logLength]);

  if (!combat || !run) return null;

  const { player, enemy } = combat;
  const intent = getEnemyIntent(combat, { hasMemory: false });
  const enemyFirst = turnOrder(combat)[0] === 'enemy';
  const over = combat.result !== 'ongoing';
  const showRewind = (run.lawLevels.time ?? 0) >= 6;
  const rewindable = canRewind({ combat, previousCombat, rewindUsed, run });
  const hitSide = (side: Side) => (floaters.some((f) => f.side === side && f.kind !== 'heal') ? 'hit' : '');

  return (
    <main className="screen combat-screen">
      <header className="combat-header muted">
        <span>{STRINGS.ui.floor(run.floor)} · {STRINGS.ui.fight(run.fightIndex + 1, run.floorEnemies.length)}</span>
        <span>{STRINGS.ui.turn(combat.turn)}</span>
      </header>

      <section className={`panel enemy-panel ${hitSide('enemy')}`} aria-label={enemy.name}>
        <div className="enemy-figure">
          <InkFigure element={enemy.element} vigor={enemy.hp / enemy.maxHp} />
          <Floaters list={floaters.filter((f) => f.side === 'enemy')} />
        </div>
        <div className="enemy-info">
          <h2 className="display">
            {enemy.name} <ElementBadge element={enemy.element} />
          </h2>
          <Bar kind="hp" value={enemy.hp} max={enemy.maxHp} label={STRINGS.stats.vitality} />
          <div className="intent">
            <span className="muted">{STRINGS.ui.intent}:</span>{' '}
            {intent.known && intent.moves[0] ? (
              <span className="intent-move">
                <MoveIcon category={moveCategory(intent.moves[0])} size={16} /> {intent.moves[0].name}
              </span>
            ) : intent.telegraphed ? (
              <span className="intent-move intent-telegraph">
                <MoveIcon category={moveCategory(intent.telegraphed.move)} size={16} />{' '}
                {STRINGS.ui.telegraph(intent.telegraphed.move.name, intent.telegraphed.inTurns)}
              </span>
            ) : (
              <span className="intent-unknown">{STRINGS.combat.unknownIntent}</span>
            )}
            {enemyFirst && !over && <span className="chip chip-warn">{STRINGS.ui.enemyFaster}</span>}
          </div>
          <StatusChips statuses={enemy.statuses} turn={combat.turn} />
        </div>
      </section>

      <CombatLog entries={combat.log} placeholder={STRINGS.log.appears(enemy.name)} />

      <section className={`panel player-panel ${hitSide('player')}`} aria-label={STRINGS.ui.you}>
        <Floaters list={floaters.filter((f) => f.side === 'player')} />
        <div className="row player-title">
          <ElementBadge element={player.element} withName />
          <StatusChips statuses={player.statuses} turn={combat.turn} />
        </div>
        <Bar kind="hp" value={player.hp} max={player.maxHp} label={STRINGS.stats.vitality} />
        <Bar kind="qi" value={player.qi} max={player.maxQi} label={STRINGS.stats.qi} />

        <div className="actions">
          {playerMoves(combat).map((move) => {
            const affordable = player.qi >= move.qiCost;
            const element = move.element && move.element !== 'none' ? move.element : undefined;
            return (
              <button
                key={move.id}
                className={`btn action${element ? ` action-${element}` : ''}`}
                disabled={over || !affordable}
                onClick={() => act(move.id)}
                title={describeMove(move).join(' · ')}
              >
                <MoveIcon category={moveCategory(move)} />
                <span className="action-name">{move.name}</span>
                <small className="action-meta">{[qiCostLabel(move), ...describeMove(move)].join(' · ')}</small>
              </button>
            );
          })}
        </div>

        {showRewind && (
          <button className="btn btn-ghost btn-wide" disabled={!rewindable} onClick={rewind}>
            {rewindUsed ? STRINGS.ui.rewindUsed : STRINGS.combat.rewind}
          </button>
        )}
      </section>

      {over && (
        <div className={`overlay overlay-${combat.result}`} role="dialog" aria-modal="true">
          <h2 className="display">{combat.result === 'won' ? STRINGS.combat.victory : STRINGS.combat.defeat}</h2>
          <button className="btn btn-primary" onClick={continueAfterFight} autoFocus>
            {combat.result === 'lost'
              ? STRINGS.awakening.wakeUp
              : run.fightIndex + 1 < run.floorEnemies.length
                ? STRINGS.ui.nextFight
                : STRINGS.ui.returnToFloor}
          </button>
        </div>
      )}
    </main>
  );
}

function Floaters({ list }: { list: Floater[] }) {
  if (list.length === 0) return null;
  return (
    <div className="floaters" aria-hidden="true">
      {list.map((f) => (
        <span key={f.id} className={`floater floater-${f.kind}`} style={{ '--i': f.index } as React.CSSProperties}>
          {f.text}
        </span>
      ))}
    </div>
  );
}
