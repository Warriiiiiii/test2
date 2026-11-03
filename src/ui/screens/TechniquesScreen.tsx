import { STRINGS } from '../../data/strings';
import { COMBAT } from '../../data/stats';
import { getTechnique } from '../../data/techniques';
import { useGameStore } from '../../store/gameStore';
import ElementBadge from '../components/ElementBadge';
import MoveIcon from '../components/MoveIcon';
import { describeMove, moveCategory, qiCostLabel } from '../format';

/** Equip slots and the learned list. Tap to equip or unequip. */
export default function TechniquesScreen() {
  const run = useGameStore((s) => s.run);
  const toggleEquip = useGameStore((s) => s.toggleEquip);
  if (!run) return null;

  const slots = Array.from({ length: COMBAT.equipSlots }, (_, i) => run.equipped[i]);

  return (
    <main className="screen techniques-screen">
      <h1 className="display">{STRINGS.techniques.title}</h1>
      <p className="muted">{STRINGS.techniques.equipped(run.equipped.length, COMBAT.equipSlots)}</p>
      <ul className="slot-list">
        {slots.map((id, i) => (
          <li key={i} className={`slot${id ? ' slot-filled' : ''}`}>
            {id ? <TechniqueRow id={id} equipped onTap={() => toggleEquip(id)} /> : <span className="muted">{STRINGS.techniques.emptySlot}</span>}
          </li>
        ))}
      </ul>

      <h2 className="display">{STRINGS.techniques.learned}</h2>
      <p className="muted">{STRINGS.techniques.hint}</p>
      <ul className="technique-list">
        {run.learned.map((id) => (
          <li key={id}>
            <TechniqueRow id={id} equipped={run.equipped.includes(id)} onTap={() => toggleEquip(id)} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function TechniqueRow({ id, equipped, onTap }: { id: string; equipped: boolean; onTap: () => void }) {
  const t = getTechnique(id);
  return (
    <button className={`technique-row${equipped ? ' technique-equipped' : ''}`} onClick={onTap}>
      <MoveIcon category={moveCategory(t)} />
      <span className="technique-text">
        <strong>
          {t.name} <ElementBadge element={t.element} size={14} />
        </strong>
        <small className="muted">{[qiCostLabel(t), ...describeMove(t)].join(' · ')}</small>
      </span>
      {equipped && <span className="chip">{STRINGS.techniques.equippedTag}</span>}
    </button>
  );
}
