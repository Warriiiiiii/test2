import { STRINGS } from '../data/strings';
import { useGameStore } from '../store/gameStore';
import TabBar from './components/TabBar';
import TitleScreen from './screens/TitleScreen';
import AwakeningScreen from './screens/AwakeningScreen';
import CultivateScreen from './screens/CultivateScreen';
import WorldScreen from './screens/WorldScreen';
import TechniquesScreen from './screens/TechniquesScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import AreaScreen from './screens/AreaScreen';
import CombatScreen from './screens/CombatScreen';
import RewardScreen from './screens/RewardScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const areaId = useGameStore((s) => s.areaId);
  const encounter = useGameStore((s) => s.encounter);

  // The map stays mounted (paused) behind a fight and its reward.
  const onMap = areaId !== null && (screen === 'area' || screen === 'combat' || screen === 'reward');
  const fightKey = encounter ? `${encounter.areaId}-${encounter.monsterId}` : 'none';

  return (
    <div className="app">
      {screen === 'title' && <TitleScreen />}
      {screen === 'awakening' && <AwakeningScreen />}
      {screen === 'cultivate' && <CultivateScreen />}
      {screen === 'world' && <WorldScreen />}
      {screen === 'techniques' && <TechniquesScreen />}
      {screen === 'laws' && <PlaceholderScreen title={STRINGS.lawsTab.title} text={STRINGS.lawsTab.asleep} />}
      {screen === 'soul' && <PlaceholderScreen title={STRINGS.soulTab.title} text={STRINGS.soulTab.asleep} />}
      {onMap && <AreaScreen />}
      {screen === 'combat' && <CombatScreen key={fightKey} />}
      {screen === 'reward' && <RewardScreen />}
      {(screen === 'cultivate' || screen === 'world' || screen === 'techniques' || screen === 'laws' || screen === 'soul') && <TabBar />}
    </div>
  );
}
