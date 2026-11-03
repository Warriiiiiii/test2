import { STRINGS } from '../../data/strings';
import { getEnemy } from '../../data/enemies';
import { allRegions, isAreaCleared, isAreaUnlocked, isRegionUnlocked, progressOf } from '../../engine/area';
import { useGameStore } from '../../store/gameStore';
import ElementBadge from '../components/ElementBadge';

/** Regions and their areas, with lock state, progress and boss markers. */
export default function WorldScreen() {
  const run = useGameStore((s) => s.run);
  const enterArea = useGameStore((s) => s.enterArea);
  if (!run) return null;

  return (
    <main className="screen world-screen">
      <h1 className="display">{STRINGS.world.title}</h1>
      {allRegions().map((region) => {
        const open = isRegionUnlocked(region, run);
        return (
          <section key={region.id} className={`region${open ? '' : ' region-locked'}`}>
            <h2 className="display">{region.name}</h2>
            <p className="muted region-desc">{region.description}</p>
            <ul className="area-list">
              {region.areas.map((area) => {
                const unlocked = open && isAreaUnlocked(area, run);
                const cleared = area.kind === 'field' && isAreaCleared(area, run);
                const progress = progressOf(run, area.id);
                const boss = area.boss ? getEnemy(area.boss) : undefined;
                return (
                  <li key={area.id} className={`area-card${unlocked ? '' : ' area-locked'}${cleared ? ' area-cleared' : ''}`}>
                    <div className="area-main">
                      <span className="area-name">{area.name}</span>
                      <span className="muted area-meta">
                        {area.kind === 'hub' && STRINGS.world.home}
                        {area.kind === 'field' && !unlocked && STRINGS.world.sealed}
                        {area.kind === 'field' && unlocked && STRINGS.world.progress(Math.min(progress.wins, area.winsToClear), area.winsToClear)}
                        {boss && (
                          <span className="area-boss">
                            {' · '}
                            <ElementBadge element={boss.element} size={14} /> {progress.bossDefeated ? STRINGS.world.bossBeaten : `${STRINGS.world.boss}: ${boss.name}`}
                          </span>
                        )}
                      </span>
                    </div>
                    <button className="btn btn-primary" disabled={!unlocked} onClick={() => enterArea(area.id)}>
                      {STRINGS.world.enter}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
