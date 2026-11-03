import { STRINGS } from '../../data/strings';
import { useGameStore } from '../../store/gameStore';

export default function TitleScreen() {
  const newGame = useGameStore((s) => s.newGame);
  return (
    <main className="screen title-screen">
      <div className="title-art" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="96" height="96">
          <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M32 8 L22 18 H42 Z" fill="currentColor" />
            <path d="M18 24 H46" /><path d="M20 32 H44" /><path d="M18 40 H46" /><path d="M16 48 H48" /><path d="M14 56 H50" />
          </g>
        </svg>
      </div>
      <h1 className="display">{STRINGS.title}</h1>
      <p className="tagline">{STRINGS.tagline}</p>
      <div className="stack">
        <button className="btn btn-primary" onClick={newGame}>{STRINGS.ui.newGame}</button>
        <button className="btn" disabled title={STRINGS.ui.noSaveYet}>{STRINGS.ui.continueGame}</button>
      </div>
    </main>
  );
}
