import { create } from 'zustand'

export type SimulationSettings = {
  worldWidth: number
  worldHeight: number
  paused: boolean
  speedFactor: number
  statsHistoryLength: number

  maxPlants: number
  initialPlants: number
  plantRegenPerSecond: number

  initialHerbivores: number
  initialCarnivores: number
  mutationRate: number

  showVision: boolean
  showVectors: boolean
  resetEpoch: number
}

export type GenotypeCounts = Record<string, number>

export type StatsEntry = {
  t: number
  plants: number
  herbivores: number
  carnivores: number
  herbivoresByGenotype: GenotypeCounts
  carnivoresByGenotype: GenotypeCounts
}

export type SimulationState = {
  settings: SimulationSettings
  stats: StatsEntry[]
  setPaused: (paused: boolean) => void
  updateSettings: (partial: Partial<SimulationSettings>) => void
  pushStats: (entry: StatsEntry) => void
  clearStats: () => void
  requestReset: () => void
}

const defaultSettings: SimulationSettings = {
  worldWidth: 1280,
  worldHeight: 720,
  paused: false,
  speedFactor: 1,
  statsHistoryLength: 600, // ~10 min si se registra cada segundo

  maxPlants: 600,
  initialPlants: 250,
  plantRegenPerSecond: 10,

  initialHerbivores: 50,
  initialCarnivores: 20,
  mutationRate: 0.08,

  showVision: false,
  showVectors: false,
  resetEpoch: 0,
}

export const useSimStore = create<SimulationState>((set) => ({
  settings: defaultSettings,
  stats: [],
  setPaused: (paused) => set((s) => ({ settings: { ...s.settings, paused } })),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  pushStats: (entry) =>
    set((s) => {
      const next = [...s.stats, entry]
      const overflow = next.length - s.settings.statsHistoryLength
      return { stats: overflow > 0 ? next.slice(overflow) : next }
    }),
  clearStats: () => set({ stats: [] }),
  requestReset: () => set((s) => ({ settings: { ...s.settings, resetEpoch: s.settings.resetEpoch + 1 } })),
}))

export type { StatsEntry as SimulationStats }


