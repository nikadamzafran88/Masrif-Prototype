import { screenGroups, screenImage } from './screens'

const FRAME_W = 195
const FRAME_H = 422

// Frames are pre-rendered screenshots (npm run screens). Selecting one opens
// the real, interactive screen.
function Frame({path, label, index, open}) {
  return <figure className="ov-card">
    <button className="ov-frame" onClick={()=>open(path)} aria-label={'Open '+label+' in the prototype'} style={{width:FRAME_W, height:FRAME_H}}>
      <img src={screenImage(path)} alt="" width={FRAME_W} height={FRAME_H} loading="lazy" decoding="async"/>
    </button>
    <figcaption><b>{index}</b> {label}<small>{path}</small></figcaption>
  </figure>
}

let total = 0
const groups = screenGroups.map(group => ({...group, start: (total += group.items.length) - group.items.length}))

export function Overview({open}) {
  return <div className="ov">
    <header className="ov-intro">
      <h1>All screens</h1>
      <p>Every page of the prototype laid out by flow. Scroll sideways within a flow, and select any screen to open it in the interactive prototype.</p>
    </header>
    {groups.map(({group, items, start})=><section className="ov-group" key={group} aria-label={group}>
      <h2>{group} <small>{items.length} screens</small></h2>
      <div className="ov-row" tabIndex={0}>
        {items.map(([path, label], i)=><Frame key={path} path={path} label={label} index={start + i + 1} open={open}/>)}
      </div>
    </section>)}
  </div>
}
