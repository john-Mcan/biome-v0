import './App.css'
import CanvasView from './components/CanvasView'
import ControlPanel from './components/ControlPanel'
import StatsPanel from './components/StatsPanel'

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <CanvasView />
      <ControlPanel />
      <StatsPanel />
    </div>
  )
}
