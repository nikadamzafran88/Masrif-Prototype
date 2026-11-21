import { useState } from 'react'
import { Button } from './ui'
import { Dropdown } from './Dropdown'
import { DemoDocument, FlowDetails, FlowRow, FlowStep } from './FeatureFlow'
import { readDemo } from './demoStorage'
import { addDemoAlert } from './profileDemo'

const key = 'masrif-demo-pintar-applications'
const programme = 'Pintar STEM programme'
const schoolYears = ['Year 4','Year 5','Year 6']
const blank = {year:'',role:'',guardian:'',email:'',learner:'',school:'',document:'',consent:false}
const programmeRows = [['Intake','November 2026 · Demo'],['School years','Year 4–6 · Demo'],['Programme fee','No charge in this demo']]

export function Pintar({dark}) {
  const [page,setPage] = useState('home')
  const [draft,setDraft] = useState(blank)
  const [items,setItems] = useState(()=>readDemo(key,[]))
  const [activeId,setActiveId] = useState('')
  const active = items.find(item=>item.id===activeId)
  const open = next => ()=>setPage(next)
  const edit = (field,value)=>setDraft(previous=>({...previous,[field]:value}))

  function save(next) {
    localStorage.setItem(key,JSON.stringify(next))
    setItems(next)
  }
  function submit() {
    if (!draft.document || !draft.learner.trim() || !draft.consent) return
    const id = 'PIN-'+crypto.randomUUID().slice(0,8).toUpperCase()
    save([{...draft,id,status:'Submitted'},...items])
    if (localStorage.getItem('masrif-demo-programmes')!=='false') addDemoAlert('Updates','Pintar application submitted',id)
    setActiveId(id)
    setPage('submitted')
  }
  function updateApplication(status,extra={}) {
    save(items.map(item=>item.id===activeId?{...item,...extra,status}:item))
    if (localStorage.getItem('masrif-demo-programmes')!=='false') addDemoAlert('Updates','Pintar application updated',activeId+' · '+status)
    setPage('tracker')
  }
  function saveSession() {
    const event = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SKEB-Pro//Pintar Demo//EN','BEGIN:VEVENT',
      'UID:pintar-demo-20261122@masrif.example','DTSTAMP:20261119T000000Z','DTSTART:20261122T010000Z',
      'DTEND:20261122T030000Z','SUMMARY:Pintar STEM session (demo)','END:VEVENT','END:VCALENDAR'].join('\r\n')
    const url = URL.createObjectURL(new Blob([event],{type:'text/calendar'}))
    const link=document.createElement('a')
    link.href=url
    link.download='pintar-demo-session.ics'
    link.click()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
    setPage('calendar')
  }

  if (page==='home') return <div className="module-flow pintar-demo">
    <section className="module-panel programme-banner">
      <img src={'/masrif/pintar-programme-'+(dark?'dark':'light')+'.svg'} width="62" height="62" alt=""/>
      <div><h2>{programme}</h2><p>Hands-on science and technology activities for primary school learners.</p></div>
    </section>
    <FlowDetails rows={programmeRows}/>
    <Button onClick={()=>{setDraft(blank);setPage('eligibility')}}>Register</Button>
    <FlowRow title="Track my application" detail={items.length?items.length+' demo applications':'Check application status'} onClick={open('applications')}/>
    <FlowRow title="Programme details" detail="Schedule and session information" onClick={open('programme')}/>
  </div>

  if (page==='eligibility') return <FlowStep title="Eligibility check" back={open('home')}>
    <p>Choose the learner’s school year for this sample intake.</p>
    <Dropdown label="School year" options={schoolYears} value={draft.year} onChange={value=>edit('year',value)}/>
    <Button disabled={!draft.year} onClick={open('applicant')}>Continue</Button>
  </FlowStep>
  if (page==='applicant') return <FlowStep title="Who is registering?" back={open('eligibility')}>
    {['Parent or guardian','Learner with guardian present'].map(role=><FlowRow key={role} title={role} onClick={()=>{edit('role',role);setPage('guardian')}}/>)}
    <p className="planning-note">The sample programme asks for guardian details for every learner.</p>
  </FlowStep>
  if (page==='guardian') return <FlowStep title="Guardian details" back={open('applicant')}>
    <form className="stack" onSubmit={event=>{event.preventDefault();setPage('learner')}}>
      <p>Use fictional details for this demo.</p>
      <label>Guardian name<input required maxLength={80} value={draft.guardian} onChange={event=>edit('guardian',event.target.value)}/></label>
      <label>Guardian email<input required type="email" maxLength={100} value={draft.email} onChange={event=>edit('email',event.target.value)}/></label>
      <Button type="button" kind="secondary" onClick={()=>setDraft(previous=>({...previous,guardian:'Farah Amin',email:'farah@example.test'}))}>Use sample guardian</Button>
      <Button type="submit" disabled={!draft.guardian.trim()||!draft.email.trim()}>Continue</Button>
    </form>
  </FlowStep>
  if (page==='learner') return <FlowStep title="Learner details" back={open('guardian')}>
    <label>Learner name<input maxLength={80} value={draft.learner} onChange={event=>edit('learner',event.target.value)}/></label>
    <label>School<input maxLength={100} value={draft.school} onChange={event=>edit('school',event.target.value)}/></label>
    <FlowDetails rows={[[ 'School year',draft.year ]]}/>
    <Button kind="secondary" onClick={()=>setDraft(previous=>({...previous,learner:'Aina Demo',school:'SK Contoh'}))}>Use sample learner</Button>
    <Button disabled={!draft.learner.trim()||!draft.school.trim()} onClick={open('documents')}>Continue</Button>
  </FlowStep>
  if (page==='documents') return <DemoDocument label="Supporting document" onCancel={open('learner')} onComplete={file=>{edit('document',file);setPage('consent')}}/>
  if (page==='consent') return <FlowStep title="Guardian consent" back={open('documents')}>
    <p>Review the application as the learner’s guardian. The sample details stay in this browser.</p>
    <label className="check"><input type="checkbox" checked={draft.consent} onChange={event=>edit('consent',event.target.checked)}/> I consent to submit this demo application.</label>
    <Button disabled={!draft.consent} onClick={open('review')}>Review application</Button>
  </FlowStep>
  if (page==='review') return <FlowStep title="Review your application" back={open('consent')}>
    <FlowDetails rows={[[ 'Programme',programme ],['Learner',draft.learner],['School',draft.school],['School year',draft.year],
      ['Registering as',draft.role],['Guardian',draft.guardian],['Email',draft.email],['Document',draft.document]]}/>
    <Button onClick={submit}>Submit demo application</Button>
  </FlowStep>
  if (page==='submitted'&&active) return <FlowStep title="Application submitted" back={open('home')} backLabel="Back to Pintar">
    <div className="result-card" role="status"><strong>{active.id}</strong><p>Track this demo application to see its progress.</p></div>
    <Button onClick={open('tracker')}>Track my application</Button>
  </FlowStep>
  if (page==='applications') return <FlowStep title="My applications" back={open('home')}>
    {items.length ? items.map(item=><FlowRow key={item.id} title={item.learner} detail={item.id+' · '+item.status}
      onClick={()=>{setActiveId(item.id);setPage('tracker')}}/>) : <div className="module-panel"><h3>No applications yet</h3><p>Registered applications will appear here.</p></div>}
  </FlowStep>
  if (page==='tracker'&&active) return <FlowStep title="Application status" back={open('applications')}>
    <FlowDetails rows={[[ 'Application',active.id ],['Learner',active.learner],['Status',active.status]]}/>
    {active.status==='More information requested'&&<Button onClick={open('more')}>Provide more information</Button>}
    {active.status==='Submitted'&&<Button kind="secondary" onClick={()=>updateApplication('Under review')}>Preview review</Button>}
    {active.status==='Under review'&&<>
      <Button onClick={()=>updateApplication('Accepted')}>Preview acceptance</Button>
      <Button kind="secondary" onClick={()=>updateApplication('More information requested')}>Preview information request</Button>
    </>}
    {active.status==='Accepted'&&<Button onClick={open('programme')}>View programme details</Button>}
  </FlowStep>
  if (page==='more') return <DemoDocument label="Additional information" onCancel={open('tracker')} onComplete={file=>updateApplication('Under review',{additionalDocument:file})}/>
  if (page==='calendar') return <FlowStep title="Calendar file downloaded" back={open('programme')}>
    <p>Open the downloaded file to add the sample event to your calendar.</p>
  </FlowStep>
  return <FlowStep title="Programme details" back={open('home')}>
    <FlowDetails rows={[[ 'Session',programme ],['Date','22 November 2026'],['Time','9:00–11:00 AM MYT'],['Venue','Programme venue · Demo']]}/>
    <Button onClick={saveSession}>Add to calendar</Button>
  </FlowStep>
}
