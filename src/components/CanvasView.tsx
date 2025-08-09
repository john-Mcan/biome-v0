import { useEffect, useRef } from 'react'
import { useSimStore } from '../state/simStore'
import type { World, Plant, Herbivore, Carnivore, TraitSet } from '../sim/types'
import { defaultCarnivoreTraits, defaultHerbivoreTraits, energyCostPerSecond, genotypeId, mutateTraits } from '../sim/traits'
import { clamp, distanceSq, randRange, normalize, randomDirection } from '../sim/utils'

const EAT_RADIUS_PLANT_SQ = 4 * 4
const EAT_RADIUS_PREY_SQ = 5 * 5
const BOUNDS_PADDING = 2

// Paletas de colores por variantes (genotipos)
const COOL_PALETTE = ['#40a2ff', '#5cc8ff', '#74b9ff', '#81ecec', '#55efc4', '#2ecc71', '#1abc9c', '#a29bfe']
const WARM_PALETTE = ['#ff5a5a', '#ff7f50', '#ffa726', '#ff7043', '#e67e22', '#e74c3c', '#ff8a80', '#ffb74d']

function getVariantColor(
  map: Map<string, string>,
  nextIndexRef: { current: number },
  palette: string[],
  key: string,
): string {
  const existing = map.get(key)
  if (existing) return existing
  const color = palette[nextIndexRef.current % palette.length]
  map.set(key, color)
  nextIndexRef.current += 1
  return color
}

export default function CanvasView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const settings = useSimStore((s) => s.settings)
  const pushStats = useSimStore((s) => s.pushStats)

  const worldRef = useRef<World | null>(null)
  const lastEpochRef = useRef<number>(-1)
  const herbColorMapRef = useRef<Map<string, string>>(new Map())
  const carnColorMapRef = useRef<Map<string, string>>(new Map())
  const herbColorIdxRef = useRef<number>(0)
  const carnColorIdxRef = useRef<number>(0)

  // Inicializa o reinicia mundo cuando cambie resetEpoch
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    // Asegurar que el canvas ocupe el viewport y se adapte a DPR
    const width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth
    const height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const initWorld = (): World => ({
      width,
      height,
      plants: [],
      herbivores: [],
      carnivores: [],
      time: 0,
      lastStatsAt: 0,
      nextEntityId: 1,
    })

    const spawnPlant = (world: World) => {
      if (world.plants.length >= settings.maxPlants) return
      const p: Plant = {
        id: world.nextEntityId++,
        x: randRange(BOUNDS_PADDING, world.width - BOUNDS_PADDING),
        y: randRange(BOUNDS_PADDING, world.height - BOUNDS_PADDING),
      }
      world.plants.push(p)
    }

    const spawnHerbivore = (world: World, traits?: TraitSet) => {
      const t = traits ?? defaultHerbivoreTraits()
      const h: Herbivore = {
        id: world.nextEntityId++,
        type: 'herbivore',
        x: randRange(0, world.width),
        y: randRange(0, world.height),
        vx: 0,
        vy: 0,
        energy: t.reproductionEnergy * 0.5,
        age: 0,
        traits: t,
        genotypeId: genotypeId(t, false),
      }
      world.herbivores.push(h)
    }

    const spawnCarnivore = (world: World, traits?: TraitSet) => {
      const t = traits ?? defaultCarnivoreTraits()
      const c: Carnivore = {
        id: world.nextEntityId++,
        type: 'carnivore',
        x: randRange(0, world.width),
        y: randRange(0, world.height),
        vx: 0,
        vy: 0,
        energy: t.reproductionEnergy * 0.5,
        age: 0,
        traits: t,
        genotypeId: genotypeId(t, true),
      }
      world.carnivores.push(c)
    }

    const resetWorld = () => {
      const w = initWorld()
      for (let i = 0; i < settings.initialPlants; i++) spawnPlant(w)
      for (let i = 0; i < settings.initialHerbivores; i++) spawnHerbivore(w)
      for (let i = 0; i < settings.initialCarnivores; i++) spawnCarnivore(w)
      worldRef.current = w
    }

    if (lastEpochRef.current !== settings.resetEpoch) {
      resetWorld()
      lastEpochRef.current = settings.resetEpoch
    } else if (!worldRef.current) {
      resetWorld()
    }

    let rafId = 0
    let lastTs = performance.now()
    let accumulator = 0
    let plantAccumulator = 0
    const loop = (ts: number) => {
      rafId = requestAnimationFrame(loop)
      const dtMs = ts - lastTs
      lastTs = ts
      const world = worldRef.current!
      const dtScaled = Math.min((dtMs / 1000) * (settings.speedFactor || 1), 0.25)

      if (!settings.paused) {
        // Integración paso fijo para suavizar
        const step = 1 / 60
        accumulator += dtScaled
        let steps = 0
        const maxSteps = 5
        while (accumulator >= step && steps < maxSteps) {
          updateWorld(world, step)
          plantAccumulator += step
          accumulator -= step
          steps++
        }

        // Reposición de plantas por segundo
        const toSpawn = Math.floor(plantAccumulator * settings.plantRegenPerSecond)
        if (toSpawn > 0) {
          for (let i = 0; i < toSpawn; i++) spawnPlant(world)
          plantAccumulator -= toSpawn / settings.plantRegenPerSecond
        }

        // Las estadísticas se manejan por separado para evitar bloquear la animación
      }

      draw(
        world,
        ctx,
        settings.showVision,
        herbColorMapRef.current,
        carnColorMapRef.current,
        herbColorIdxRef,
        carnColorIdxRef,
      )
    }

    rafId = requestAnimationFrame(loop)

    // Timer separado para estadísticas (desacoplado del loop de animación)
    const statsInterval = setInterval(() => {
      if (!settings.paused && worldRef.current) {
        const world = worldRef.current
        const herbG: Record<string, number> = {}
        for (const h of world.herbivores) herbG[h.genotypeId] = (herbG[h.genotypeId] ?? 0) + 1
        const carnG: Record<string, number> = {}
        for (const c of world.carnivores) carnG[c.genotypeId] = (carnG[c.genotypeId] ?? 0) + 1
        pushStats({
          t: world.time,
          plants: world.plants.length,
          herbivores: world.herbivores.length,
          carnivores: world.carnivores.length,
          herbivoresByGenotype: herbG,
          carnivoresByGenotype: carnG,
        })
      }
    }, 1000) // 1 segundo

    // Recalcular tamaño on resize para evitar saltos por layout
    const onResize = () => {
      const dpr2 = window.devicePixelRatio || 1
      const w = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth
      const h = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight
      canvas.width = Math.floor(w * dpr2)
      canvas.height = Math.floor(h * dpr2)
      ctx.setTransform(dpr2, 0, 0, dpr2, 0, 0)
      if (worldRef.current) {
        worldRef.current.width = w
        worldRef.current.height = h
      }
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(statsInterval)
      window.removeEventListener('resize', onResize)
    }
  }, [settings.resetEpoch, settings.maxPlants, settings.initialPlants, settings.initialHerbivores, settings.initialCarnivores, settings.speedFactor, settings.paused, settings.plantRegenPerSecond, settings.showVision, pushStats])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', background: '#0b0e14' }} />
}

function updateWorld(world: World, dt: number) {
  world.time += dt

  // Herbívoros
  const plants = world.plants
  const herbivores = world.herbivores
  for (let i = herbivores.length - 1; i >= 0; i--) {
    const h = herbivores[i]
    h.age += dt
    const speed = h.traits.speed
    const visionSq = h.traits.vision * h.traits.vision

    // Buscar planta cercana
    let targetIdx = -1
    let bestDist = Infinity
    for (let pIdx = 0; pIdx < plants.length; pIdx++) {
      const p = plants[pIdx]
      const d2 = distanceSq(h.x, h.y, p.x, p.y)
      if (d2 < bestDist && d2 <= visionSq) {
        bestDist = d2
        targetIdx = pIdx
      }
    }

    let dirx = 0
    let diry = 0
    if (targetIdx >= 0) {
      const p = plants[targetIdx]
      dirx = p.x - h.x
      diry = p.y - h.y
    } else {
      const rv = randomDirection()
      dirx = rv.x
      diry = rv.y
    }
    const n = normalize(dirx, diry)
    // Suavizado de velocidad para evitar cambios bruscos
    const targetVx = n.x * speed
    const targetVy = n.y * speed
    const blend = 1 - Math.exp(-8 * dt)
    h.vx = h.vx + (targetVx - h.vx) * blend
    h.vy = h.vy + (targetVy - h.vy) * blend

    h.x = clamp(h.x + h.vx * dt, BOUNDS_PADDING, world.width - BOUNDS_PADDING)
    h.y = clamp(h.y + h.vy * dt, BOUNDS_PADDING, world.height - BOUNDS_PADDING)

    // Comer planta si está cerca
    if (targetIdx >= 0) {
      const p = plants[targetIdx]
      if (distanceSq(h.x, h.y, p.x, p.y) <= EAT_RADIUS_PLANT_SQ) {
        // Ganancia de energía al comer
        h.energy += 20
        plants.splice(targetIdx, 1)
      }
    }

    // Coste energético
    h.energy -= energyCostPerSecond(h.traits, false) * dt

    // Reproducción
    if (h.energy >= h.traits.reproductionEnergy) {
      h.energy *= 0.5
      const childTraits = mutateTraits(h.traits, (window as any).__simMutationRate ?? 0.08, false)
      const child: Herbivore = {
        id: world.nextEntityId++,
        type: 'herbivore',
        x: clamp(h.x + randRange(-5, 5), BOUNDS_PADDING, world.width - BOUNDS_PADDING),
        y: clamp(h.y + randRange(-5, 5), BOUNDS_PADDING, world.height - BOUNDS_PADDING),
        vx: 0,
        vy: 0,
        energy: childTraits.reproductionEnergy * 0.35,
        age: 0,
        traits: childTraits,
        genotypeId: genotypeId(childTraits, false),
      }
      world.herbivores.push(child)
    }

    // Muerte por energía
    if (h.energy <= 0) {
      herbivores.splice(i, 1)
    }
  }

  // Carnívoros
  const carnivores = world.carnivores
  for (let i = carnivores.length - 1; i >= 0; i--) {
    const c = carnivores[i]
    c.age += dt
    const speed = c.traits.speed
    const visionSq = c.traits.vision * c.traits.vision

    // Buscar presa cercana (herbívoro) ajustado por stealth
    let preyIdx = -1
    let bestDist = Infinity
    for (let hIdx = 0; hIdx < herbivores.length; hIdx++) {
      const h = herbivores[hIdx]
      const effectiveVisionSq = visionSq * (1 - h.traits.stealth * 0.5)
      const d2 = distanceSq(c.x, c.y, h.x, h.y)
      if (d2 < bestDist && d2 <= effectiveVisionSq) {
        bestDist = d2
        preyIdx = hIdx
      }
    }

    let dirx = 0
    let diry = 0
    if (preyIdx >= 0) {
      const h = herbivores[preyIdx]
      dirx = h.x - c.x
      diry = h.y - c.y
    } else {
      const rv = randomDirection()
      dirx = rv.x
      diry = rv.y
    }
    const n = normalize(dirx, diry)
    const targetVxC = n.x * speed
    const targetVyC = n.y * speed
    const blendC = 1 - Math.exp(-8 * dt)
    c.vx = c.vx + (targetVxC - c.vx) * blendC
    c.vy = c.vy + (targetVyC - c.vy) * blendC

    c.x = clamp(c.x + c.vx * dt, BOUNDS_PADDING, world.width - BOUNDS_PADDING)
    c.y = clamp(c.y + c.vy * dt, BOUNDS_PADDING, world.height - BOUNDS_PADDING)

    // Cazar si cerca
    if (preyIdx >= 0) {
      const h = herbivores[preyIdx]
      if (distanceSq(c.x, c.y, h.x, h.y) <= EAT_RADIUS_PREY_SQ) {
        // Ganancia de energía depende de fuerza
        c.energy += 35 + c.traits.strength * 10
        herbivores.splice(preyIdx, 1)
      }
    }

    // Coste energético (más alto si es carnívoro)
    c.energy -= energyCostPerSecond(c.traits, true) * dt

    // Reproducción
    if (c.energy >= c.traits.reproductionEnergy) {
      c.energy *= 0.5
      const childTraits = mutateTraits(c.traits, (window as any).__simMutationRate ?? 0.08, true)
      const child: Carnivore = {
        id: world.nextEntityId++,
        type: 'carnivore',
        x: clamp(c.x + randRange(-5, 5), BOUNDS_PADDING, world.width - BOUNDS_PADDING),
        y: clamp(c.y + randRange(-5, 5), BOUNDS_PADDING, world.height - BOUNDS_PADDING),
        vx: 0,
        vy: 0,
        energy: childTraits.reproductionEnergy * 0.35,
        age: 0,
        traits: childTraits,
        genotypeId: genotypeId(childTraits, true),
      }
      world.carnivores.push(child)
    }

    if (c.energy <= 0) carnivores.splice(i, 1)
  }
}

function draw(
  world: World,
  ctx: CanvasRenderingContext2D,
  showVision: boolean,
  herbColorMap: Map<string, string>,
  carnColorMap: Map<string, string>,
  herbColorIdxRef: { current: number },
  carnColorIdxRef: { current: number },
) {
  ctx.clearRect(0, 0, world.width, world.height)
  // Plantas
  ctx.fillStyle = '#47d16a'
  for (const p of world.plants) {
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
  }
  // Herbívoros
  for (const h of world.herbivores) {
    if (showVision) {
      ctx.beginPath()
      ctx.arc(h.x, h.y, h.traits.vision, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(64,162,255,0.08)'
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(h.x, h.y, 2.2, 0, Math.PI * 2)
    ctx.fillStyle = getVariantColor(herbColorMap, herbColorIdxRef, COOL_PALETTE, h.genotypeId)
    ctx.fill()
  }
  // Carnívoros
  for (const c of world.carnivores) {
    if (showVision) {
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.traits.vision, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,90,90,0.08)'
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(c.x, c.y, 2.6, 0, Math.PI * 2)
    ctx.fillStyle = getVariantColor(carnColorMap, carnColorIdxRef, WARM_PALETTE, c.genotypeId)
    ctx.fill()
  }
}


