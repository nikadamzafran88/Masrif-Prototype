import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.jsx'
import { isEmbed, embedScreen } from './embed.js'

// Each browser launch starts at the splash. In-app routing starts after mount.
// Overview frames (embed mode) instead start pinned to the requested screen.
if (isEmbed) {
  document.documentElement.classList.add('embed')
  history.replaceState(null, '', embedScreen || '/')
} else if (location.search === '?view=overview' || location.search === '?view=overview&') {
  // keep the overview view across refresh
} else if (location.pathname !== '/' || location.search || location.hash || history.state) {
  history.replaceState(null, '', '/')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
