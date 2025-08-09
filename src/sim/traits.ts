import type { TraitSet } from './types'

// Niveles discretos para mantener genotipos comparables
const SPEED_LEVELS = [20, 35, 50] // px/s
const VISION_LEVELS = [30, 60, 100] // px
const METAB_LEVELS = [0.6, 1.0, 1.6] // energía/s
const REPRO_LEVELS = [40, 65, 100] // umbral energía
const STEALTH_LEVELS = [0, 0.25, 0.5]
const STRENGTH_LEVELS = [0, 0.6, 1.2]

export const defaultHerbivoreTraits = (): TraitSet => ({
  speed: SPEED_LEVELS[1],
  vision: VISION_LEVELS[1],
  metabolism: METAB_LEVELS[1],
  reproductionEnergy: REPRO_LEVELS[1],
  stealth: STEALTH_LEVELS[1],
  strength: 0,
})

export const defaultCarnivoreTraits = (): TraitSet => ({
  speed: SPEED_LEVELS[1],
  vision: VISION_LEVELS[1],
  metabolism: METAB_LEVELS[2],
  reproductionEnergy: REPRO_LEVELS[2],
  stealth: STEALTH_LEVELS[0],
  strength: STRENGTH_LEVELS[1],
})

export function mutateTraits(base: TraitSet, mutationRate: number, isCarnivore: boolean): TraitSet {
  // Mutación discreta hacia arriba/abajo con probabilidad
  const pick = (levels: number[], value: number): number => {
    const idx = Math.max(0, Math.min(levels.length - 1, levels.findIndex((v) => v === value)))
    if (Math.random() > mutationRate) return levels[idx]
    const dir = Math.random() < 0.5 ? -1 : 1
    const nextIdx = Math.max(0, Math.min(levels.length - 1, idx + dir))
    return levels[nextIdx]
  }

  return {
    speed: pick(SPEED_LEVELS, base.speed),
    vision: pick(VISION_LEVELS, base.vision),
    metabolism: pick(METAB_LEVELS, base.metabolism),
    reproductionEnergy: pick(REPRO_LEVELS, base.reproductionEnergy),
    stealth: pick(STEALTH_LEVELS, base.stealth),
    strength: isCarnivore ? pick(STRENGTH_LEVELS, base.strength) : 0,
  }
}

export function energyCostPerSecond(traits: TraitSet, isCarnivore: boolean): number {
  // Coste metabólico base + penalizaciones por rasgos positivos
  const base = traits.metabolism
  const speedCost = (traits.speed - 20) * 0.015
  const visionCost = (traits.vision - 30) * 0.008
  const stealthCost = traits.stealth * 0.6
  const strengthCost = isCarnivore ? traits.strength * 0.7 : 0
  return base + speedCost + visionCost + stealthCost + strengthCost
}

export function genotypeId(traits: TraitSet, isCarnivore: boolean): string {
  // Serializa discretamente y aplica hash corto para agrupar
  const data = [traits.speed, traits.vision, traits.metabolism, traits.reproductionEnergy, traits.stealth, isCarnivore ? traits.strength : 0].join(',')
  let h = 2166136261 >>> 0
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (isCarnivore ? 'C' : 'H') + (h >>> 0).toString(36)
}


