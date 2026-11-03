// Seeded random numbers so fights can be replayed and tested.
// mulberry32: tiny, fast, good enough for a game. The state is a single 32-bit number.

/** Turn any integer into a usable RNG state. */
export function seedRng(seed: number): number {
  return (seed >>> 0) || 0x9e3779b9;
}

/** Returns [value in [0, 1), next state]. Never mutates the input. */
export function nextFloat(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

/** Returns [integer in [0, max), next state]. */
export function nextInt(state: number, max: number): [number, number] {
  const [f, next] = nextFloat(state);
  return [Math.floor(f * max), next];
}

/** Returns [true with probability `chance`, next state]. */
export function roll(state: number, chance: number): [boolean, number] {
  if (chance <= 0) return [false, state];
  if (chance >= 1) return [true, state];
  const [f, next] = nextFloat(state);
  return [f < chance, next];
}
