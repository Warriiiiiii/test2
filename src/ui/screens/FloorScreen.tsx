import { getEnemy } from '../../data/enemies';
import { realmOfFloor } from '../../data/pagoda';
import { STRINGS } from '../../data/strings';
import { isFloorCleared } from '../../engine/run';
import { useGameStore } from '../../store/gameStore';
import ElementBadge from '../components/ElementBadge';
import Bar from '../components/Bar';

export default function FloorScreen() {
  const run = useGameStore((s) => s.run);
  const startFight = useGameStore((s) => s.startFight);
  const climbAgain = useGameStore((s) => s.climbAgain);
  const backToTitle = useGameStore((s) => s.backToTitle);
  if (!run) return null;

  const cleared = isFloorCleared(run);

  return (
    <main className="screen floor-screen">
      <header className="screen-header">
        <button className="btn btn-ghost" onClick={backToTitle}>{STRINGS.ui.backToTitle}</button>
        <div>
          <h1 className="display">{STRINGS.ui.floor(run.floor)}</h1>
          <p className="muted">{STRINGS.realms[realmOfFloor(run.floor)]}</p>
        </div>
      </header>

      <ol className="fight-list">
        {run.floorEnemies.map((id, i) => {
          const enemy = getEnemy(id);
          const state = i < run.fightIndex ? 'cleared' : i === run.fightIndex ? 'current' : 'locked';
          return (
            <li key={`${id}-${i}`} className={`fight-card fight-${state}`}>
              <span className="fight-index">{STRINGS.ui.fightCard(i + 1)}</span>
              <span className="fight-name">
                <ElementBadge element={enemy.element} />
                {enemy.name}
                {enemy.boss && <em className="muted"> · {STRINGS.ui.boss}</em>}
              </span>
              <span className="fight-state muted">
                {state === 'cleared' && STRINGS.ui.cleared}
                {state === 'locked' && STRINGS.ui.locked}
              </span>
            </li>
          );
        })}
      </ol>

      <section className="player-summary">
        <div className="row">
          <ElementBadge element={run.element} withName />
        </div>
        <Bar kind="hp" value={run.hp} max={run.stats.vitality} label={STRINGS.stats.vitality} />
      </section>

      {cleared ? (
        <div className="floor-cleared">
          <h2 className="display">{STRINGS.ui.floorCleared(run.floor)}</h2>
          <p className="muted">{STRINGS.ui.floorClearedNote}</p>
          <button className="btn btn-primary" onClick={climbAgain}>{STRINGS.ui.climbAgain}</button>
        </div>
      ) : (
        <button className="btn btn-primary btn-wide" onClick={startFight}>
          {STRINGS.ui.startFight} · {STRINGS.ui.fight(run.fightIndex + 1, run.floorEnemies.length)}
        </button>
      )}
    </main>
  );
}
