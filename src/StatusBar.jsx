// iPhone-style status bar: time on the left, signal, Wi-Fi and battery on the right.
// `fixed` stays pinned over the screen while content scrolls; `spacer` is the
// invisible in-flow copy that keeps each screen's layout unchanged.
export function StatusBar({fixed, spacer}) {
  return <div className={'screen-status'+(fixed?' status-fixed':'')+(spacer?' status-spacer':'')} aria-hidden="true">
    <span className="status-time">9:41</span>
    <span className="status-icons">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/>
        <rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/>
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M1.5 4.2a10 10 0 0 1 14 0"/><path d="M4 6.8a6.4 6.4 0 0 1 9 0"/><path d="M6.5 9.3a2.8 2.8 0 0 1 4 0"/>
        <circle cx="8.5" cy="11.2" r=".6" fill="currentColor" strokeWidth="1"/>
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x=".5" y=".5" width="22" height="12" rx="3.800" stroke="currentColor" opacity=".4"/>
        <rect x="2" y="2" width="19" height="9" rx="2.400" fill="currentColor"/>
        <path d="M24 4.500v4c.8-.3 1.500-1.100 1.500-2s-.7-1.700-1.500-2z" fill="currentColor" opacity=".45"/>
      </svg>
    </span>
  </div>
}
