import { useMemo, useState, memo } from 'react'
import { useSimStore } from '../state/simStore'
import { PopulationChart, GenotypeChart } from './SimpleCharts'

export default memo(function StatsPanel() {
  const stats = useSimStore((s) => s.stats)
  const [open, setOpen] = useState(true)

  const latest = stats[stats.length - 1]
  const topHerbKeys = useMemo(() => (latest ? Object.entries(latest.herbivoresByGenotype).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k) : []), [latest])
  const topCarnKeys = useMemo(() => (latest ? Object.entries(latest.carnivoresByGenotype).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k) : []), [latest])

  return (
    <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10, width: open ? 420 : 140 }}>
      <div style={{ background: 'rgba(20,24,33,0.9)', border: '1px solid #2a2f3a', borderRadius: 8, padding: 12, color: '#dde3ea', backdropFilter: 'blur(6px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Gráficos</strong>
          <button onClick={() => setOpen(!open)} style={{ background: '#1f2633', color: '#c9d4e3', border: '1px solid #2a2f3a', padding: '4px 8px', borderRadius: 6 }}> {open ? 'Ocultar' : 'Mostrar'} </button>
        </div>
        {open && stats.length > 1 && (
          <div style={{ marginTop: 8, display: 'grid', gap: 12 }}>
            <PopulationChart stats={stats} width={400} height={180} />

            {topHerbKeys.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#aeb7c3', marginBottom: 4 }}>Herbívoros por genotipo (top {topHerbKeys.length})</div>
                <GenotypeChart stats={stats} width={400} height={140} type="herbivores" topKeys={topHerbKeys} />
              </div>
            )}

            {topCarnKeys.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#aeb7c3', marginBottom: 4 }}>Carnívoros por genotipo (top {topCarnKeys.length})</div>
                <GenotypeChart stats={stats} width={400} height={140} type="carnivores" topKeys={topCarnKeys} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})


