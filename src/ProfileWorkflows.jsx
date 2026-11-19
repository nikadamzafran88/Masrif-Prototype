import { useState } from 'react'
import { Button } from './ui'
import { Dropdown } from './Dropdown'
import { consentKey, demoCode, demoContactKey, demoMobile, savedPinKey, storedDemoPin } from './demoAuth'
import { FlowDetails, FlowRow, FlowStep } from './FeatureFlow'
import { readDemo } from './demoStorage'
import { money } from './demo'
import { addDemoAlert, marketingHistoryKey } from './profileDemo'

const contactKey = demoContactKey
const ticketsKey = 'masrif-demo-support-tickets'
const sampleContact = {mobile:'+60 10 000 0000',email:'farah@example.test'}
const topics = ['Account access','Payments','Report fraud or lost phone','App feedback','Other']

export function PersonalDetails() {
  const [saved,setSaved] = useState(()=>readDemo(contactKey,sampleContact))
  const [draft,setDraft] = useState(saved)
  const [page,setPage] = useState('view')
  const [code,setCode] = useState('')
  const [notice,setNotice] = useState('')
  const mobileChanged = draft.mobile.trim()!==saved.mobile
  const emailChanged = draft.email.trim()!==saved.email

  function save() {
    const next = {...saved,mobile:draft.mobile.trim(),email:draft.email.trim()}
    localStorage.setItem(contactKey,JSON.stringify(next))
    setSaved(next)
    setPage('view')
    setNotice('Demo contact details updated.')
    addDemoAlert('Security','Contact details updated','Your demo contact information was changed.')
  }
  if (page==='code') return <FlowStep title="Verify your contact details" back={()=>setPage('edit')}>
    <p>Use demo code {demoCode} to verify {[mobileChanged&&draft.mobile,emailChanged&&draft.email].filter(Boolean).join(' and ')}.</p>
    <label>Verification code<input inputMode="numeric" maxLength={6} value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))}/></label>
    <Button disabled={code!==demoCode} onClick={()=>mobileChanged?setPage('identity'):save()}>Verify demo code</Button>
  </FlowStep>
  if (page==='identity') return <FlowStep title="Confirm your identity" back={()=>setPage('code')}>
    <p>Confirm the simulated identity check before saving a new mobile number.</p>
    <Button onClick={save}>Confirm and save</Button>
  </FlowStep>
  if (page==='edit') return <FlowStep title="Edit contact details" back={()=>setPage('view')} backLabel="Discard changes">
    <form className="stack" onSubmit={event=>{
      event.preventDefault()
      if (!demoMobile(draft.mobile)) return
      if (mobileChanged||emailChanged) {setCode('');setPage('code')}
    }}>
      <p>Use fictional contact details.</p>
      <label>Mobile number<input type="tel" required value={draft.mobile} onChange={event=>setDraft({...draft,mobile:event.target.value})}/></label>
      <label>Email address<input type="email" required value={draft.email} onChange={event=>setDraft({...draft,email:event.target.value})}/></label>
      <Button type="submit" disabled={!demoMobile(draft.mobile)||!draft.email.trim()||(!mobileChanged&&!emailChanged)}>Verify changes</Button>
    </form>
  </FlowStep>
  return <div className="stack profile-details">
    <FlowDetails rows={[[ 'Full name',saved.name||'Farah Amin' ],['MyKad number','••••••-••-••••'],['Mobile number',saved.mobile],['Email address',saved.email]]}/>
    <p className="notice">Your verified name and MyKad are locked. Contact changes require a demo verification code. An identity check is also required for mobile changes.</p>
    <Button onClick={()=>{setDraft(saved);setNotice('');setPage('edit')}}>Edit contact details</Button>
    {notice&&<p className="notice" role="status">{notice}</p>}
  </div>
}

export function ChangeDemoPin({onDone}) {
  const [values,setValues] = useState({current:'',next:'',confirm:''})
  const [notice,setNotice] = useState('')
  const [done,setDone] = useState(false)
  const edit = (key,value)=>{setValues({...values,[key]:value.replace(/\D/g,'').slice(0,6)});setNotice('')}
  function save(event) {
    event.preventDefault()
    if (values.current!==storedDemoPin()) return setNotice('The current demo PIN is incorrect.')
    if (values.next!==values.confirm) return setNotice('The new PINs don’t match.')
    if (values.next===values.current) return setNotice('Choose a different demo PIN.')
    if (values.next.length!==6) return
    sessionStorage.setItem(savedPinKey,values.next)
    addDemoAlert('Security','PIN changed','Your demo sign-in PIN was changed.')
    setDone(true)
  }
  if (done) return <div className="stack">
    <div className="result-card" role="status"><h2>Demo PIN changed</h2><p>Use your new PIN the next time you sign in during this browser session.</p></div>
    <Button onClick={onDone}>Back to security</Button>
  </div>
  return <form className="stack" onSubmit={save}>
    <p>Use a fictional PIN for this browser session.</p>
    {[['current','Current demo PIN'],['next','New demo PIN'],['confirm','Confirm new demo PIN']].map(([id,label])=><label key={id}>{label}
      <input type="password" autoComplete="off" inputMode="numeric" value={values[id]} maxLength={6} onChange={event=>edit(id,event.target.value)}/>
    </label>)}
    {notice&&<p className="notice" role="alert">{notice}</p>}
    <Button type="submit" disabled={Object.values(values).some(value=>value.length!==6)}>Change demo PIN</Button>
    <Button type="button" kind="secondary" onClick={onDone}>Cancel</Button>
  </form>
}

const ticketStages = ['Open','In review','Resolved']
const formatDate = date => new Date(date).toLocaleString('en-MY')
const incidents = {
  lost: {title:'Lost phone', instructions:'Lock your demo account and review your bound devices.'},
  payment: {title:'Unfamiliar payment', instructions:'Select the transaction you want to report. You can also report a payment that is missing from your history.'},
  pin: {title:'Shared PIN or verification code', instructions:'Change your demo PIN if you can still sign in. Lock your account if you suspect someone has access.'},
}

export function SupportDesk({records=[]}) {
  const [tickets,setTickets] = useState(()=>readDemo(ticketsKey,[]))
  const params = new URLSearchParams(location.search)
  const incident = Object.hasOwn(incidents,params.get('incident')) ? incidents[params.get('incident')] : null
  const [topic,setTopic] = useState(incident ? 'Report fraud or lost phone' : '')
  const [message,setMessage] = useState('')
  const [reference,setReference] = useState('')
  const [reply,setReply] = useState('')
  const [page,setPage] = useState('form')
  const [selectedId,setSelectedId] = useState('')
  const transaction = records.find(item=>item.id===reference)
  const selected = tickets.find(ticket=>ticket.id===selectedId)
  const canLink = topic==='Payments'||incident===incidents.payment
  const transactionOptions = [{value:'',label:'No transaction selected'},...records.map(item=>({
    value:item.id,label:item.name+' · '+money(Math.abs(item.amount))+' · '+item.date,
  }))]
  const status = selected?.status || 'Open'

  function save(next) {
    localStorage.setItem(ticketsKey,JSON.stringify(next))
    setTickets(next)
  }
  function updateTicket(changes,event) {
    const timeline = selected.timeline || [{text:'Ticket opened',date:selected.created}]
    save(tickets.map(ticket=>ticket.id===selectedId?{...ticket,...changes,timeline:[...timeline,{text:event,date:new Date().toISOString()}]}:ticket))
  }
  function submit() {
    if (!topic||!message.trim()) return
    const date = new Date().toISOString()
    const ticket = {id:'MSR-'+crypto.randomUUID().slice(0,8).toUpperCase(),topic,message:message.trim(),created:date,
      incident:incident?.title,transaction:canLink&&transaction?{id:transaction.id,name:transaction.name,amount:transaction.amount}:null,
      status:'Open',timeline:[{text:'Ticket opened',date}]}
    save([ticket,...tickets])
    setSelectedId(ticket.id)
    setPage('ticket')
    addDemoAlert('Updates','Support ticket opened',ticket.id+' · '+topic)
  }
  if (page==='review') return <FlowStep title="Review support request" back={()=>setPage('form')}>
    <FlowDetails rows={[[ 'Category',topic ],...(incident?[['Incident',incident.title]]:[]),
      ...(canLink&&transaction?[['Transaction',transaction.name+' · '+money(Math.abs(transaction.amount))]]:[]),['Message',message.trim()]]}/>
    <Button onClick={submit}>Save demo ticket</Button>
  </FlowStep>
  if (page==='ticket'&&selected) return <FlowStep title="Support ticket" back={()=>{setMessage('');setReference('');setReply('');setPage('form')}} backLabel="Back to support">
    <FlowDetails rows={[[ 'Ticket',selected.id ],['Category',selected.topic],['Status',status],['Opened',formatDate(selected.created)],
      ...(selected.incident?[['Incident',selected.incident]]:[]),
      ...(selected.transaction?[['Transaction',selected.transaction.name+' · '+money(Math.abs(selected.transaction.amount))],['Reference',selected.transaction.id]]:[]),
      ['Message',selected.message]]}/>
    <section className="stack" aria-label="Ticket activity">
      <h3>Ticket activity</h3>
      {(selected.timeline||[{text:'Ticket opened',date:selected.created}]).map(({text,date},index)=>
        <FlowRow key={index} title={text} detail={formatDate(date)}/>)}
    </section>
    {status!=='Resolved'&&<>
      <label>Add a reply<textarea maxLength={500} rows={3} value={reply} onChange={event=>setReply(event.target.value)}/></label>
      <Button kind="secondary" disabled={!reply.trim()} onClick={()=>{updateTicket({},'Your reply: '+reply.trim());setReply('')}}>Save demo reply</Button>
      <Button onClick={()=>{
        const next=ticketStages[ticketStages.indexOf(status)+1]
        updateTicket({status:next},next==='In review'?'Demo support is reviewing this request.':'Demo support marked this request resolved.')
        addDemoAlert('Updates','Support ticket updated',selected.id+' · '+next)
      }}>{status==='Open'?'Simulate support review':'Simulate resolution'}</Button>
    </>}
    <p className="notice">Ticket activity is stored on this device for the demo.</p>
  </FlowStep>
  return <div className="stack">
    <section className="module-panel"><h2>{incident?.title||'How can we help?'}</h2><p>{incident?.instructions||'Describe a fictional issue to try the support flow.'}</p></section>
    {incident ? <FlowDetails rows={[[ 'Category',topic ]]}/> : <Dropdown label="Issue category" value={topic} options={topics} onChange={value=>{setTopic(value);setReference('')}}/>}
    {canLink&&<Dropdown label="Related transaction" value={reference} options={transactionOptions} onChange={setReference}/>}
    <label>Describe your issue<textarea rows={5} maxLength={500} value={message} onChange={event=>setMessage(event.target.value)}/></label>
    <Button disabled={!topic||!message.trim()} onClick={()=>setPage('review')}>Review request</Button>
    <section className="stack"><h3>My support tickets</h3>
      {tickets.length ? tickets.map(ticket=><FlowRow key={ticket.id} title={ticket.incident||ticket.topic} detail={ticket.id+' · '+(ticket.status||'Open')} onClick={()=>{setSelectedId(ticket.id);setPage('ticket')}}/>)
        : <p>No tickets yet.</p>}
    </section>
    <a className="text-button" href="https://atlasmuamalat.com.my/faqs/" target="_blank" rel="noreferrer">Visit the Atlas help centre</a>
  </div>
}

export function DemoLegal({section}) {
  const [consent] = useState(()=>readDemo(consentKey,null))
  const [marketingHistory] = useState(()=>readDemo(marketingHistoryKey,[]))
  if (section==='legal/consent') return <div className="stack">
    {consent ? <FlowDetails rows={[[ 'Recorded',new Date(consent.date).toLocaleString('en-MY') ],['Demo Terms of Use','Accepted'],
      ['Demo data processing','Accepted'],['Marketing at registration',consent.marketing?'Opted in':'Opted out']]}/>
      : <div className="module-panel"><h3>No registration consent recorded</h3><p>Demo registration consent will appear here.</p></div>}
    <section className="stack"><h3>Marketing changes</h3>{marketingHistory.length ? marketingHistory.map(({enabled,date},index)=><FlowRow key={index} title={enabled?"Opted in":"Opted out"} detail={formatDate(date)}/>) : <p>No changes recorded.</p>}</section>
  </div>
  const privacy = section==='legal/privacy'
  return <article className="stack demo-legal">
    <p className="notice">Masrif prototype notice</p>
    {privacy ? <>
      <section><h3>What stays on this device</h3><p>Demo transactions, settings, contact details and application records can be saved in browser storage.</p></section>
      <section><h3>Device permissions</h3><p>Some screens can use your camera or approximate location when you allow access. QR images are decoded in the browser.</p></section>
      <section><h3>Online content</h3><p>Worship tools request public content and schedules. The demo banking and support screens do not send applications, payments or messages.</p></section>
      <section><h3>Clear demo data</h3><p>Use Reset demo account in App settings or clear this site’s data in your browser.</p></section>
    </> : <>
      <section><h3>Using the demo</h3><p>Explore the screens with fictional details. Account balances, payment results and application statuses are for demonstration.</p></section>
      <section><h3>Payments and applications</h3><p>Demo actions do not transfer funds, issue cards, submit official documents or enter into a contract.</p></section>
      <section><h3>Official services</h3><p>Use the relevant provider’s official service for live transactions, applications and published terms.</p></section>
    </>}
  </article>
}
