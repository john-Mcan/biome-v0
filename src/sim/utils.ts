export const randRange = (min: number, max: number): number => Math.random() * (max - min) + min
export const clamp = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v)
export const distanceSq = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}
export const normalize = (x: number, y: number): { x: number; y: number } => {
  const m = Math.hypot(x, y) || 1
  return { x: x / m, y: y / m }
}
export function randomDirection(): { x: number; y: number } {
  const a = Math.random() * Math.PI * 2
  return { x: Math.cos(a), y: Math.sin(a) }
}


