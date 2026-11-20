const paths = {
 search:'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1.5 4.5L20 20',
 chevron:'m9 5 7 7-7 7',
 help:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM9 9a3 3 0 1 1 4 2.8c-1 .4-1 1-1 2.2m0 3h.01',
 face:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 9v2m8-2v2m-4-2v4h-1m-3 2a5 5 0 0 0 8 0',
 backspace:'M9 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-7-7zM11 9l6 6m0-6-6 6',
 phone:'M6 3H3v3a15 15 0 0 0 15 15h3v-3l-5-2-2 2a12 12 0 0 1-8-8l2-2z',
 mail:'M3 5h18v14H3zM3 6l9 7 9-7',
 shield:'M12 3l8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6zM9 12l2 2 4-4',
 check:'m5 12 4 4L19 6',
 trash:'M4 6h16M9 6V3h6v3m3 0-1 15H7L6 6m4 4v7m4-7v7',
 history:'M3 12a9 9 0 1 1 2.6 6.4M3 6v6h6m3-5v5l3 2',
 statement:'M5 3h10l4 4v14H5zM14 3v5h5M8 11h8m-8 4h8m-8 3h5',
 receipt:'M5 3l2.3 1.5L9.7 3 12 4.5 14.3 3l2.4 1.5L19 3v18l-2.3-1.5-2.4 1.5-2.3-1.5L9.7 21l-2.4-1.5L5 21zM8 9h8m-8 4h8m-8 4h4',
 card:'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM3 10h18M7 15h4',
 calculator:'M5 3h14v18H5zM8 6h8v3H8zM8 13h1m3 0h1m3 0h1M8 17h1m3 0h1m3 0h1',
 home:'M3 10l9-7 9 7v11h-6v-6H9v6H3z', account:'M3 8h18v13H3zM3 8l15-5v5M16 14h2', scan:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10', grid:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z', user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2', bell:'M5 17h14l-2-3V9A5 5 0 0 0 7 9v5zm5 4h4', eyeOff:'M3 3l18 18M9.8 6.3A11 11 0 0 1 12 6c6 0 10 6 10 6a18 18 0 0 1-3.1 3.4M6.1 7.7A18 18 0 0 0 2 12s4 6 10 6a10 10 0 0 0 4.2-.9M10 10a2.8 2.8 0 0 0 4 4', eye:'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', book:'M12 5v15M3 4c4 0 6 0 9 2 3-2 5-2 9-2v14c-4 0-6 0-9 2-3-2-5-2-9-2z', heart:'M12 20 4 12C-2 6 6 1 12 7c6-6 14-1 8 5z', compass:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-6-4-2 6-6 2 2-6z', pin:'M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Zm-5 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z', arrow:'M4 12h15m-6-6 6 6-6 6', back:'M20 12H5m6-6-6 6 6 6', plus:'M5 12h14m-7-7v14', transfer:'M4 7h15l-4-4m4 14H4l4 4', more:'M4 12h1m6 0h1m6 0h1', in:'M18 6 6 18m0-9v9h9', out:'M6 18 18 6m-9 0h9v9', close:'m6 6 12 12M18 6 6 18', spark:'M12 2v20M2 12h20M5 5l14 14M19 5 5 19'
}
export function Icon({name, size=22}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>
}
export function Button({children, kind='primary', ...props}) {
 return <button className={'button '+kind} {...props}>{children}</button>
}
export function Tile({icon, label, onClick, disabled}) {
 return <button className="tile" onClick={onClick} disabled={disabled}><span className="tile-icon"><Icon name={icon}/></span><span>{label}</span></button>
}

