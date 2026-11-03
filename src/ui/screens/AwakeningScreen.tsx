import type { Element } from '../../engine/types';
import { ELEMENTS } from '../../data/elements';
import { STARTER_BY_ELEMENT, getTechnique } from '../../data/techniques';
import { STRINGS } from '../../data/strings';
import { useGameStore } from '../../store/gameStore';
import ElementBadge from '../components/ElementBadge';
import { describeMove, qiCostLabel } from '../format';

export default function AwakeningScreen() {
  const deaths = useGameStore((s) => s.deaths);
  const chooseElement = useGameStore((s) => s.chooseElement);

  return (
    <main className="screen awakening-screen">
      {deaths === 0 ? (
        <div className="intro">
          {STRINGS.awakening.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : (
        <h1 className="display death-count">{STRINGS.awakening.death(deaths)}</h1>
      )}

      <h2 className="display">{STRINGS.awakening.chooseElement}</h2>
      <ul className="element-list">
        {ELEMENTS.map((element) => {
          const starter = getTechnique(STARTER_BY_ELEMENT[element as keyof typeof STARTER_BY_ELEMENT]);
          return (
            <li key={element}>
              <button className={`element-card element-${element}`} onClick={() => chooseElement(element as Element)}>
                <ElementBadge element={element} withName size={28} />
                <span className="element-starter">
                  <strong>{starter.name}</strong>
                  <small>{[qiCostLabel(starter), ...describeMove(starter)].join(' · ')}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
