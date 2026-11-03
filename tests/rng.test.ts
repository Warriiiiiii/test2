import { describe, expect, it } from 'vitest';
import { nextFloat, nextInt, roll, seedRng } from '../src/engine/rng';

describe('seeded rng', () => {
  it('is deterministic for the same seed', () => {
    const a = seedRng(42);
    const b = seedRng(42);
    const [va, sa] = nextFloat(a);
    const [vb, sb] = nextFloat(b);
    expect(va).toBe(vb);
    expect(sa).toBe(sb);
  });

  it('produces different sequences for different seeds', () => {
    const [a] = nextFloat(seedRng(1));
    const [b] = nextFloat(seedRng(2));
    expect(a).not.toBe(b);
  });

  it('stays in [0, 1) and never mutates the input', () => {
    let state = seedRng(7);
    const first = state;
    for (let i = 0; i < 1000; i++) {
      const [v, next] = nextFloat(state);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(next).not.toBe(state);
      state = next;
    }
    expect(first).toBe(seedRng(7));
  });

  it('nextInt stays inside the range', () => {
    let state = seedRng(3);
    for (let i = 0; i < 200; i++) {
      const [v, next] = nextInt(state, 5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
      expect(Number.isInteger(v)).toBe(true);
      state = next;
    }
  });

  it('roll handles 0 and 1 without consuming randomness', () => {
    const state = seedRng(9);
    expect(roll(state, 0)).toEqual([false, state]);
    expect(roll(state, 1)).toEqual([true, state]);
  });

  it('roll hits roughly as often as asked', () => {
    let state = seedRng(123);
    let hits = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) {
      const [hit, next] = roll(state, 0.3);
      if (hit) hits++;
      state = next;
    }
    expect(hits / n).toBeGreaterThan(0.27);
    expect(hits / n).toBeLessThan(0.33);
  });
});
