import { useEffect, useRef } from 'react'
import type { StatsEntry } from '../state/simStore'

type SimpleChartsProps = {
  stats: StatsEntry[]
  width: number
  height: number
}

export function SimpleChart({ stats, width, height, title, lines }: {
  stats: StatsEntry[]
  width: number
  height: number
  title: string
  lines: Array<{ key: string; color: string; label: string }>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || stats.length < 2) return

    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Limpiar
    ctx.fillStyle = '#0f1523'
    ctx.fillRect(0, 0, width, height)

    // Márgenes
    const margin = { top: 20, right: 10, bottom: 30, left: 40 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    if (chartWidth <= 0 || chartHeight <= 0) return

    // Encontrar rangos
    const timeRange = [stats[0].t, stats[stats.length - 1].t]
    const allValues = stats.flatMap(s => lines.map(line => (s as any)[line.key] || 0))
    const valueRange = [0, Math.max(...allValues, 1)]

    // Escalas
    const scaleX = (t: number) => margin.left + ((t - timeRange[0]) / (timeRange[1] - timeRange[0])) * chartWidth
    const scaleY = (v: number) => margin.top + chartHeight - ((v - valueRange[0]) / (valueRange[1] - valueRange[0])) * chartHeight

    // Grid
    ctx.strokeStyle = '#273142'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    for (let i = 0; i <= 4; i++) {
      const y = margin.top + (i / 4) * chartHeight
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + chartWidth, y)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // Ejes
    ctx.strokeStyle = '#8ea2b5'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + chartHeight)
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight)
    ctx.stroke()

    // Líneas de datos
    lines.forEach(line => {
      ctx.strokeStyle = line.color
      ctx.lineWidth = 2
      ctx.beginPath()
      
      let first = true
      stats.forEach(s => {
        const x = scaleX(s.t)
        const y = scaleY((s as any)[line.key] || 0)
        if (first) {
          ctx.moveTo(x, y)
          first = false
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
    })

    // Título
    ctx.fillStyle = '#dde3ea'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText(title, margin.left, 15)

    // Leyenda
    let legendX = margin.left
    const legendY = height - 10
    lines.forEach((line, i) => {
      ctx.fillStyle = line.color
      ctx.fillRect(legendX, legendY - 8, 8, 8)
      ctx.fillStyle = '#aeb7c3'
      ctx.font = '10px Inter, sans-serif'
      ctx.fillText(line.label, legendX + 12, legendY - 1)
      legendX += ctx.measureText(line.label).width + 25
    })

  }, [stats, width, height, title, lines])

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width, height, display: 'block' }}
    />
  )
}

export function PopulationChart({ stats, width, height }: SimpleChartsProps) {
  return (
    <SimpleChart
      stats={stats}
      width={width}
      height={height}
      title="Poblaciones"
      lines={[
        { key: 'plants', color: '#47d16a', label: 'Plantas' },
        { key: 'herbivores', color: '#40a2ff', label: 'Herbívoros' },
        { key: 'carnivores', color: '#ff5a5a', label: 'Carnívoros' },
      ]}
    />
  )
}

export function GenotypeChart({ stats, width, height, type, topKeys }: SimpleChartsProps & {
  type: 'herbivores' | 'carnivores'
  topKeys: string[]
}) {
  const colors = type === 'herbivores' 
    ? ['#40a2ff', '#5cc8ff', '#74b9ff', '#81ecec']
    : ['#ff5a5a', '#ff7f50', '#ffa726', '#ff7043']

  const lines = topKeys.slice(0, 4).map((key, i) => ({
    key: `${type}ByGenotype.${key}`,
    color: colors[i],
    label: key,
  }))

  // Transformar datos para acceso anidado
  const transformedStats = stats.map(s => ({
    ...s,
    [`${type}ByGenotype`]: type === 'herbivores' ? s.herbivoresByGenotype : s.carnivoresByGenotype,
  }))

  return (
    <SimpleChart
      stats={transformedStats.map(s => ({
        ...s,
        ...Object.fromEntries(
          lines.map(line => [
            line.key,
            (s as any)[type + 'ByGenotype'][line.key.split('.')[1]] || 0
          ])
        )
      }))}
      width={width}
      height={height}
      title={`${type === 'herbivores' ? 'Herbívoros' : 'Carnívoros'} por genotipo`}
      lines={lines}
    />
  )
}
