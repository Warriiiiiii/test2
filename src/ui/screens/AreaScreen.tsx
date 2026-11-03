import { useEffect, useRef } from 'react';
import { STRINGS } from '../../data/strings';
import { canOpenBossGate, findArea, progressOf } from '../../engine/area';
import { useGameStore } from '../../store/gameStore';
import Bar from '../components/Bar';

/** Mounts the Phaser area scene full screen, with a React HUD on top. */
export default function AreaScreen() {
  const areaId = useGameStore((s) => s.areaId);
  const screen = useGameStore((s) => s.screen);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!areaId || !host.current) return;
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | undefined;

    // Phaser is loaded on demand so menus and combat stay light.
    Promise.all([import('phaser'), import('../../scenes/AreaScene')]).then(([{ default: Phaser }, { AreaScene }]) => {
      if (cancelled || !host.current) return;
      const created = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host.current,
        pixelArt: true,
        backgroundColor: '#121110',
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
        input: { activePointers: 1 },
        audio: { noAudio: true },
      });
      created.scene.add('area', AreaScene, true, { areaId, seed: Date.now() });
      game = created;
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [areaId]);

  return (
    <div className="area-screen">
      <div ref={host} className="area-canvas" />
      {screen === 'area' && <AreaHud />}
    </div>
  );
}

function AreaHud() {
  const run = useGameStore((s) => s.run);
  const areaId = useGameStore((s) => s.areaId);
  const leaveArea = useGameStore((s) => s.leaveArea);
  if (!run || !areaId) return null;
  const area = findArea(areaId);
  const progress = progressOf(run, areaId);
  const gateOpen = canOpenBossGate(area, run);

  return (
    <div className="area-hud">
      <div className="area-hud-top">
        <div className="area-hud-left">
          <strong className="display area-hud-title">{area.name}</strong>
          {area.kind === 'field' && (
            <span className="muted">{STRINGS.hud.wins(Math.min(progress.wins, area.winsToClear), area.winsToClear)}</span>
          )}
        </div>
        <button className="btn btn-ghost" onClick={leaveArea}>{STRINGS.hud.leave}</button>
      </div>
      <div className="area-hud-hp">
        <Bar kind="hp" value={run.hp} max={run.stats.vitality} label={STRINGS.stats.vitality} />
      </div>
      <p className="area-hud-hint muted">
        {area.kind === 'hub' ? STRINGS.hud.hubHint : area.boss ? (gateOpen ? STRINGS.hud.gateOpen : STRINGS.hud.gateSealed) : STRINGS.hud.tapToMove}
      </p>
    </div>
  );
}
