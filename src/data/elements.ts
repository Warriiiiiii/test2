// The five elements and the counter cycle: water > fire > metal > wood > earth > water.
import type { Element } from '../engine/types';

export const ELEMENTS: Element[] = ['fire', 'water', 'metal', 'wood', 'earth'];

/** Which element each one beats. 'none' beats nothing and is beaten by nothing. */
export const ELEMENT_BEATS: Record<Element, Element | null> = {
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
  wood: 'earth',
  earth: 'water',
  none: null,
};

/** UI colours per element (ink-wash palette). */
export const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#d9633b',
  water: '#4f8fc0',
  metal: '#b8bcc4',
  wood: '#6aa66d',
  earth: '#c49a4a',
  none: '#9a948a',
};
