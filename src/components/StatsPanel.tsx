import { useMemo, useState } from 'react'
import { useSimStore } from '../state/simStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function StatsPanel() {
  const stats = useSimStore((s) => s.stats)
  const [open, setOpen] = useState(true)

  const seriesTotals = useMemo(() => stats.map((s, i) => ({ i, plants: s.plants, herb: s.herbivores, carn: s.carnivores })), [stats])

  const latest = stats[stats.length - 1]
  const topHerbKeys = useMemo(() => (latest ? Object.entries(latest.herbivoresByGenotype).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k) : []), [latest])
  const topCarnKeys = useMemo(() => (latest ? Object.entries(latest.carnivoresByGenotype).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k) : []), [latest])

  const seriesHerb = useMemo(() => stats.map((s, i) => ({ i, ...topHerbKeys.reduce((acc, k) => ({ ...acc, [k]: s.herbivoresByGenotype[k] ?? 0 }), {}) })), [stats, topHerbKeys])
  const seriesCarn = useMemo(() => stats.map((s, i) => ({ i, ...topCarnKeys.reduce((acc, k) => ({ ...acc, [k]: s.carnivoresByGenotype[k] ?? 0 }), {}) })), [stats, topCarnKeys])

  return (
    <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10, width: open ? 420 : 140 }}>
      <div style={{ background: 'rgba(20,24,33,0.9)', border: '1px solid #2a2f3a', borderRadius: 8, padding: 12, color: '#dde3ea', backdropFilter: 'blur(6px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Gráficos</strong>
          <button onClick={() => setOpen(!open)} style={{ background: '#1f2633', color: '#c9d4e3', border: '1px solid #2a2f3a', padding: '4px 8px', borderRadius: 6 }}> {open ? 'Ocultar' : 'Mostrar'} </button>
        </div>
        {open && (
          <div style={{ marginTop: 8, display: 'grid', gap: 12 }}>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriesTotals} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#273142" />
                  <XAxis dataKey="i" stroke="#8ea2b5" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8ea2b5" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #2a2f3a' }} />
                  <Legend />
                  <Line type="monotone" dataKey="plants" stroke="#47d16a" dot={false} name="Plantas" />
                  <Line type="monotone" dataKey="herb" stroke="#40a2ff" dot={false} name="Herbívoros" />
                  <Line type="monotone" dataKey="carn" stroke="#ff5a5a" dot={false} name="Carnívoros" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {topHerbKeys.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#aeb7c3', marginBottom: 4 }}>Herbívoros por genotipo (top {topHerbKeys.length})</div>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={seriesHerb} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#273142" />
                      <XAxis dataKey="i" stroke="#8ea2b5" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#8ea2b5" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #2a2f3a' }} />
                      {topHerbKeys.map((k, idx) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={palette[idx % palette.length]} dot={false} name={k} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {topCarnKeys.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#aeb7c3', marginBottom: 4 }}>Carnívoros por genotipo (top {topCarnKeys.length})</div>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={seriesCarn} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#273142" />
                      <XAxis dataKey="i" stroke="#8ea2b5" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#8ea2b5" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0f1523', border: '1px solid #2a2f3a' }} />
                      {topCarnKeys.map((k, idx) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={palette[(idx + 4) % palette.length]} dot={false} name={k} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const palette = ['#40a2ff', '#9b59b6', '#f1c40f', '#e67e22', '#2ecc71', '#1abc9c', '#e84393', '#fd79a8']


