import { useRef, useState } from 'react'
import App from './App.jsx'
import { Overview } from './Overview.jsx'
import { isEmbed } from './embed.js'
import './overview.css'

const startView = () => new URLSearchParams(location.search).get('view') === 'overview' ? 'overview' : 'prototype'
const views = [
  ['prototype', 'Prototype', 'Interactive phone view, as a user would see it.'],
  ['overview', 'All screens', 'Every page side by side, grouped by flow.'],
]

export default function Root() {
  const [view, setView] = useState(startView)
  const [run, setRun] = useState(0)
  const [preview,setPreview] = useState(false)
  const dialog = useRef(null)
  const gear = useRef(null)
  if (isEmbed) return <App/>

  function show(next) {
    dialog.current.close()
    if (next === view) return
    history.replaceState(null, '', next === 'overview' ? '/?view=overview' : '/')
    setPreview(false)
    setView(next)
  }
  // Open one screen in the live prototype (remounts App at that path).
  function openScreen(path) {
    history.replaceState(null, '', path + '?seed=1')
    setPreview(true)
    setRun(value => value + 1)
    setView('prototype')
  }

  return <>
    <button ref={gear} className="view-gear" aria-label="View settings" aria-haspopup="dialog" onClick={()=>dialog.current.showModal()}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
    <dialog ref={dialog} className="view-modal" aria-labelledby="view-modal-title"
      onClose={()=>gear.current?.focus()} onClick={event=>{if(event.target===dialog.current) dialog.current.close()}}>
      <div className="view-modal-body">
        <div className="view-modal-head">
          <h2 id="view-modal-title">View settings</h2>
          <button className="view-modal-close" aria-label="Close" onClick={()=>dialog.current.close()}>×</button>
        </div>
        <p>Choose how the prototype is shown.</p>
        <div className="view-options" role="radiogroup" aria-label="View">
          {views.map(([id, label, detail])=><button key={id} role="radio" aria-checked={view===id} className="view-option" onClick={()=>show(id)}>
            <span className="view-radio" aria-hidden="true"/>
            <span><strong>{label}</strong><small>{detail}</small></span>
          </button>)}
        </div>
      </div>
    </dialog>
    {view === 'overview' ? <Overview open={openScreen}/> : <App key={run} preview={preview}/>}
  </>
}
