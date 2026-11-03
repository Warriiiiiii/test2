import { useEffect, useState, type CSSProperties } from 'react';
import { assetUrl, type SpriteSheetDef } from '../../data/sprites';

interface Props {
  def: SpriteSheetDef;
  /** Animation name from the sheet, or a static frame when it has none. */
  anim?: string;
  /** Integer zoom; sprites are drawn pixelated. */
  scale?: number;
  className?: string;
  style?: CSSProperties;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** One frame of a sprite sheet, played as a CSS background. Used by React screens; Phaser draws the map. */
export default function SpriteFrame({ def, anim = 'idle', scale = 3, className = '', style }: Props) {
  const sequence = def.anims[anim]?.frames ?? [def.idleFrame];
  const frameRate = def.anims[anim]?.frameRate ?? 1;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick(0);
    if (sequence.length < 2 || reducedMotion()) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000 / frameRate);
    return () => clearInterval(timer);
  }, [anim, def, frameRate, sequence.length]);

  const frame = sequence[tick % sequence.length] ?? def.idleFrame;
  const col = frame % def.columns;
  const row = Math.floor(frame / def.columns);
  const w = def.frameWidth * scale;
  const h = def.frameHeight * scale;

  return (
    <span
      className={`sprite ${className}`}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: w,
        height: h,
        backgroundImage: `url(${assetUrl(def.file)})`,
        backgroundPosition: `${-col * w}px ${-row * h}px`,
        backgroundSize: `${def.columns * w}px auto`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
}

/** A single-image pixel icon (items). */
export function PixelIcon({ file, size = 48, className = '' }: { file: string; size?: number; className?: string }) {
  return <img className={`pixel-icon ${className}`} src={assetUrl(file)} width={size} height={size} alt="" style={{ imageRendering: 'pixelated' }} />;
}
