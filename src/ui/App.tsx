import { useGameStore } from '../store/gameStore';
import TitleScreen from './screens/TitleScreen';
import AwakeningScreen from './screens/AwakeningScreen';
import FloorScreen from './screens/FloorScreen';
import CombatScreen from './screens/CombatScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const run = useGameStore((s) => s.run);
  // Keying the fight by floor and index remounts the combat screen for each new fight.
  const fightKey = run ? `${run.floor}-${run.fightIndex}` : 'none';

  return (
    <div className="app">
      {screen === 'title' && <TitleScreen />}
      {screen === 'awakening' && <AwakeningScreen />}
      {screen === 'floor' && <FloorScreen />}
      {screen === 'combat' && <CombatScreen key={fightKey} />}
    </div>
  );
}
