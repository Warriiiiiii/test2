import { STRINGS } from '../../data/strings';
import { PLAYER_SPRITE } from '../../data/sprites';
import { useGameStore } from '../../store/gameStore';
import Bar from '../components/Bar';
import ElementBadge from '../components/ElementBadge';
import SpriteFrame from '../components/SpriteFrame';

/** Milestone 3 stand-in: meditation restores HP. Idle cultivation arrives in milestone 5. */
export default function CultivateScreen() {
  const run = useGameStore((s) => s.run);
  const meditate = useGameStore((s) => s.meditate);
  if (!run) return null;
  const full = run.hp >= run.stats.vitality;

  return (
    <main className="screen cultivate-screen">
      <h1 className="display">{STRINGS.cultivate.title}</h1>
      <div className="meditation-figure">
        <SpriteFrame def={PLAYER_SPRITE} anim="idle" scale={5} />
      </div>
      <div className="row">
        <ElementBadge element={run.element} withName />
        <span className="muted">{STRINGS.realms[run.realm]}</span>
      </div>
      <Bar kind="hp" value={run.hp} max={run.stats.vitality} label={STRINGS.stats.vitality} />
      <p className="muted">{full ? STRINGS.cultivate.healed : STRINGS.cultivate.hint}</p>
      <button className="btn btn-primary btn-wide" onClick={meditate} disabled={full}>
        {STRINGS.cultivate.meditate}
      </button>
      <ul className="stat-grid">
        {(Object.keys(run.stats) as (keyof typeof run.stats)[]).map((stat) => (
          <li key={stat}>
            <span className="muted">{STRINGS.stats[stat]}</span>
            <strong>{run.stats[stat]}</strong>
          </li>
        ))}
      </ul>
      <p className="muted small">{STRINGS.cultivate.asleep}</p>
    </main>
  );
}
