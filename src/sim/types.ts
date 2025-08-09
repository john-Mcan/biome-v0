export type Vector2 = { x: number; y: number }

export type TraitSet = {
  speed: number // unidades por segundo
  vision: number // radio de percepción en px
  metabolism: number // coste base de energía por segundo
  reproductionEnergy: number // umbral de energía para reproducir
  stealth: number // camuflaje/ sigilo (0-1)
  strength: number // fuerza (solo carnívoros la aprovechan)
}

export type Plant = {
  id: number
  x: number
  y: number
}

export type AnimalBase = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  energy: number
  age: number
  traits: TraitSet
  genotypeId: string
}

export type Herbivore = AnimalBase & { type: 'herbivore' }
export type Carnivore = AnimalBase & { type: 'carnivore' }

export type World = {
  width: number
  height: number
  plants: Plant[]
  herbivores: Herbivore[]
  carnivores: Carnivore[]
  time: number
  lastStatsAt: number
  nextEntityId: number
}


