import { STRINGS } from '../../data/strings';
import { TABS, useGameStore, type Tab } from '../../store/gameStore';

const ICONS: Record<Tab, string> = {
  cultivate: 'M12 4 a8 8 0 1 0 0.01 0 M12 8 a4 4 0 1 1 0 8',
  world: 'M12 3 L21 20 H3 Z M12 9 L17 20 M12 9 L7 20',
  techniques: 'M4 20 L18 6 M15 4 L20 9 M6 14 L10 18',
  laws: 'M5 4 H19 V20 H5 Z M9 9 H15 M9 13 H15',
  soul: 'M12 21 C7 16 4 13 4 9 a4 4 0 0 1 8-2 a4 4 0 0 1 8 2 c0 4-3 7-8 12 Z',
};

/** Bottom tab bar on non-map screens. */
export default function TabBar() {
  const screen = useGameStore((s) => s.screen);
  const goToTab = useGameStore((s) => s.goToTab);
  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map((tab) => (
        <button key={tab} className={`tab${screen === tab ? ' tab-active' : ''}`} onClick={() => goToTab(tab)} aria-current={screen === tab ? 'page' : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d={ICONS[tab]} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{STRINGS.tabs[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
