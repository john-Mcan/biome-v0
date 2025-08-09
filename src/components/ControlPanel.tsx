import { useState } from 'react'
import { useSimStore } from '../state/simStore'

export default function ControlPanel() {
  const { settings, setPaused, updateSettings, requestReset } = useSimStore()
  const [open, setOpen] = useState(true)

  return (
    <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 10, width: open ? 320 : 120 }}>
      <div style={{ background: 'rgba(20,24,33,0.9)', border: '1px solid #2a2f3a', borderRadius: 8, padding: 12, color: '#dde3ea', backdropFilter: 'blur(6px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Controles</strong>
          <button onClick={() => setOpen(!open)} style={{ background: '#1f2633', color: '#c9d4e3', border: '1px solid #2a2f3a', padding: '4px 8px', borderRadius: 6 }}> {open ? 'Ocultar' : 'Mostrar'} </button>
        </div>
        {open && (
          <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPaused(!settings.paused)} style={{ background: settings.paused ? '#355' : '#253248', color: '#e6eef7', border: '1px solid #2a2f3a', padding: '6px 10px', borderRadius: 6 }}>{settings.paused ? 'Reanudar' : 'Pausar'}</button>
              <button onClick={() => { requestReset() }} style={{ background: '#2b3446', color: '#e6eef7', border: '1px solid #2a2f3a', padding: '6px 10px', borderRadius: 6 }}>Reiniciar</button>
            </div>

            <Labeled label={`Velocidad x${settings.speedFactor.toFixed(2)}`}>
              <input type="range" min={0.1} max={3} step={0.1} value={settings.speedFactor}
                onChange={(e) => updateSettings({ speedFactor: Number(e.target.value) })} />
            </Labeled>

            <Labeled label={`Mutación ${(settings.mutationRate * 100).toFixed(0)}%`}>
              <input type="range" min={0} max={0.3} step={0.01} value={settings.mutationRate}
                onChange={(e) => { const v = Number(e.target.value); (window as any).__simMutationRate = v; updateSettings({ mutationRate: v }) }} />
            </Labeled>

            <Labeled label={`Plantas máx: ${settings.maxPlants}`}>
              <input type="range" min={100} max={2000} step={50} value={settings.maxPlants}
                onChange={(e) => updateSettings({ maxPlants: Number(e.target.value) })} />
            </Labeled>

            <Labeled label={`Regen plantas/s: ${settings.plantRegenPerSecond}`}>
              <input type="range" min={0} max={50} step={1} value={settings.plantRegenPerSecond}
                onChange={(e) => updateSettings({ plantRegenPerSecond: Number(e.target.value) })} />
            </Labeled>

            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={settings.showVision} onChange={(e) => updateSettings({ showVision: e.target.checked })} />
                Radios de visión
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <SmallNumber label="Plantas iniciales" value={settings.initialPlants} min={0} max={settings.maxPlants}
                onChange={(v) => updateSettings({ initialPlants: v })} />
              <SmallNumber label="Herbívoros iniciales" value={settings.initialHerbivores} min={0} max={500}
                onChange={(v) => updateSettings({ initialHerbivores: v })} />
              <SmallNumber label="Carnívoros iniciales" value={settings.initialCarnivores} min={0} max={500}
                onChange={(v) => updateSettings({ initialCarnivores: v })} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Labeled(props: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#aeb7c3' }}>{props.label}</span>
      {props.children}
    </label>
  )
}

function SmallNumber(props: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#aeb7c3' }}>{props.label}</span>
      <input type="number" min={props.min} max={props.max} value={props.value} onChange={(e) => props.onChange(Number(e.target.value))}
        style={{ background: '#121723', color: '#e6eef7', border: '1px solid #2a2f3a', borderRadius: 6, padding: '6px 8px' }} />
    </label>
  )
}


