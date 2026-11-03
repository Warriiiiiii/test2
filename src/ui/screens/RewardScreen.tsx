import { STRINGS } from '../../data/strings';
import { ITEM_SPRITES } from '../../data/sprites';
import { getTechnique } from '../../data/techniques';
import type { RewardCard } from '../../engine/rewards';
import { useGameStore } from '../../store/gameStore';
import { PixelIcon } from '../components/SpriteFrame';

/** Three cards after a won fight. Pick one. */
export default function RewardScreen() {
  const cards = useGameStore((s) => s.rewardCards);
  const pickReward = useGameStore((s) => s.pickReward);
  if (!cards) return null;

  return (
    <div className="overlay reward-overlay" role="dialog" aria-modal="true">
      <h2 className="display">{STRINGS.reward.title}</h2>
      <ul className="reward-cards">
        {cards.map((card, i) => {
          const { name, desc } = describeCard(card);
          return (
            <li key={i}>
              <button className={`reward-card reward-${card.kind}`} onClick={() => pickReward(i)}>
                <PixelIcon file={ITEM_SPRITES[card.kind]} size={48} />
                <strong>{name}</strong>
                <small>{desc}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function describeCard(card: RewardCard): { name: string; desc: string } {
  const r = STRINGS.reward;
  switch (card.kind) {
    case 'spiritHerb':
      return { name: r.spiritHerb, desc: r.spiritHerbDesc(STRINGS.stats[card.stat], card.amount) };
    case 'cultivationHerb':
      return { name: r.cultivationHerb, desc: r.cultivationHerbDesc(Math.round(card.bonus * 100), Math.round(card.durationSeconds / 60)) };
    case 'scroll':
      return { name: r.scroll, desc: r.scrollDesc(getTechnique(card.techniqueId).name) };
    case 'pill':
      return { name: r.pill, desc: r.pillDesc(Math.round(card.healFraction * 100)) };
  }
}
