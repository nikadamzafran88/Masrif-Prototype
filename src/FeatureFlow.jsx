import { useEffect, useState } from 'react'
import { Button, Icon } from './ui'

export function FlowRow({title,detail,onClick,trailing}) {
  const content = <><span><strong>{title}</strong>{detail&&<small>{detail}</small>}</span>{trailing??(onClick&&<Icon name="arrow" size={16}/>)}</>
  return onClick ? <button className="module-row flow-row" type="button" onClick={onClick}>{content}</button> :
    <div className="module-row flow-row">{content}</div>
}

export function FlowDetails({rows}) {
  return <dl className="details">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

export function FlowStep({title,children,back,backLabel='Back'}) {
  return <section className="stack feature-flow-step">
    <h2>{title}</h2>
    {children}
    {back&&<Button kind="secondary" onClick={back}>{backLabel}</Button>}
  </section>
}

export function DemoDocument({label,onComplete,onCancel}) {
  const [phase,setPhase] = useState('choose')
  const fileName = 'skeb-pro-sample-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.pdf'
  useEffect(()=>{
    if (phase!=='sending') return
    const timer=setTimeout(()=>setPhase('done'),650)
    return ()=>clearTimeout(timer)
  },[phase])
  return <FlowStep title={phase==='done'?'Document attached':'Upload '+label.toLowerCase()} back={onCancel} backLabel="Cancel">
    <div className="module-panel">
      <h3>{phase==='choose'?'Choose a sample document':fileName}</h3>
      <p>Only the sample file name is used in this demo.</p>
      {phase==='sending'&&<progress aria-label="Simulated upload progress"/>}
      {phase==='error'&&<p role="alert">The sample upload failed. You can try again.</p>}
    </div>
    {phase==='choose'&&<Button onClick={()=>setPhase('review')}>Choose sample PDF</Button>}
    {(phase==='review'||phase==='error')&&<Button onClick={()=>setPhase('sending')}>{phase==='error'?'Retry upload':'Upload sample document'}</Button>}
    {phase==='review'&&<Button kind="secondary" onClick={()=>setPhase('error')}>Preview upload failure</Button>}
    {phase==='done'&&<Button onClick={()=>onComplete(fileName)}>Done</Button>}
  </FlowStep>
}
