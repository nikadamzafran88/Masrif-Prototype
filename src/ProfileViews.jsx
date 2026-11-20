import { useState } from 'react'
import { Button, Icon } from './ui'
import { profileLinks } from './routes'
import { ChangeDemoPin, DemoLegal, PersonalDetails, SupportDesk } from './ProfileWorkflows'
import { demoContactKey, lockKey, nameInitials, signedOutKey } from './demoAuth'
import { alertsKey, addDemoAlert, biometricKey, setMarketingPreference } from './profileDemo'
import { readDemo } from './demoStorage'
import { ConfirmDialog } from './ConfirmDialog'
import { DeleteDemoAccount } from './PrivacyPages'

const appearanceLabels = {System:'Use device settings',Light:'Light',Dark:'Dark'}
const notices = [
  ['payment','Payments','Payment successful','RM 150.00 to Ahmad Rahman','10:12'],
  ['device','Security','New device added','Was this you?','Yesterday'],
  ['pintar','Updates','Pintar update','Your application is under review','Mon'],
  ['zakat','Payments','Zakat receipt ready','MUIP, RM 300.00','12 Mar'],
  ['welcome','Updates','Welcome to Masrif','Your fictional demo account is ready to explore.','19 Nov'],
]
const faq = [
 ['How do I link my Atlas account?','Open the welcome screen and choose Link existing ATLAS account to try the demo.'],
 ['How do I pay zakat?','Open Zakat in Features to preview the payment steps.'],
 ['How do I register my child for Pintar?','Open Pintar in Features and select Register to preview the application.'],
 ['What if I lose my phone?','Use Report fraud or lost phone in Help and support to preview the options.'],
 ['How do I report a payment I don’t recognise?','Open Report fraud or lost phone, choose an unfamiliar payment, then link the transaction to your demo support ticket.'],
 ['How do I track a support request?','Open Contact support and select a ticket under My support tickets to see its status, replies and activity.'],
 ['How do I change my PIN?','Open Security and choose Change PIN. Enter your current demo PIN and confirm a new six-digit PIN.'],
 ['How do I update my email or mobile number?','Open Personal details, edit your contact details and verify the changes with the demo code.'],
 ['How do I change the app theme?','Open App settings and choose Appearance. Use the device setting or choose Light or Dark.'],
]

const reports = {
 lost: { title:'I lost my phone', detail:'Lock your account and review your devices.' },
 payment: { title:'A payment I did not make', detail:'Link the transaction to a support ticket.' },
 pin: { title:'I shared my PIN or a code', detail:'Change your PIN and report the incident.' },
}

function ProfileRow({title,detail,onClick,trailing}) {
 const content=<><span><strong>{title}</strong>{detail&&<small>{detail}</small>}</span>{trailing??(onClick&&<Icon name="arrow" size={16}/>)}</>
 return onClick?<button className="module-row profile-row" onClick={onClick}>{content}</button>:<div className="module-row profile-row">{content}</div>
}

export function ProfileMenu({go}) {
 const [confirmLogout,setConfirmLogout] = useState(false)
 const name = readDemo(demoContactKey,{})?.name || 'Farah Amin'
 return <section className="stack profile-menu" aria-label="Profile options">
   <div className="profile-card"><span className="avatar" aria-hidden="true">{nameInitials(name)}</span><div><h2>{name}</h2><p>Atlas ••4812</p></div></div>
   {profileLinks.map(([label,slug])=><ProfileRow title={label} key={slug} onClick={()=>go('/profile/'+slug)}/>)}
   <button className="button logout-row" onClick={()=>setConfirmLogout(true)}>Log out</button>
   {confirmLogout&&<ConfirmDialog title="Log out of Masrif?" action="Log out" onConfirm={()=>{sessionStorage.setItem(signedOutKey,'true');go('/login',true)}} onCancel={()=>setConfirmLogout(false)}><p>You’ll need to sign in again to continue.</p></ConfirmDialog>}
 </section>
}

export function ProfilePage({section,go,appearance,applyAppearance,records,reset}) {
 const [feedback,setFeedback]=useState('')
 const [query,setQuery]=useState('')
 const [choice,setChoice]=useState(appearance)
 const [confirmReset,setConfirmReset]=useState(false)
 const open=slug=>()=>go('/profile/'+slug)
 if(section==='personal') return <PersonalDetails/>
 if(section==='settings/delete-account') return <DeleteDemoAccount inApp/>
 if(section==='settings') return <section className="stack"><h2>Preferences</h2>
  <ProfileRow title={'Appearance · '+(appearanceLabels[choice]||appearanceLabels.System)} onClick={open('settings/appearance')}/>
  <ProfileRow title="Language · English" onClick={open('settings/language')}/>
  <ProfileRow title="Delete account" detail="Remove saved Masrif demo data" onClick={open('settings/delete-account')}/>
  <details className="profile-disclosure"><summary>Demo controls</summary><Button kind="secondary" onClick={()=>setConfirmReset(true)}>Reset demo account</Button></details>
  {confirmReset&&<ConfirmDialog title="Reset the demo account?" action="Reset demo account" onConfirm={reset} onCancel={()=>setConfirmReset(false)}><p>This clears demo transactions, applications, support tickets and preferences on this device.</p></ConfirmDialog>}
 </section>
 if(section==='settings/appearance') return <section className="stack">
  <p>Choose your preferred appearance.</p>
  {Object.entries(appearanceLabels).map(([key,label])=><label className="module-row profile-choice" key={key}><input type="radio" name="appearance" checked={choice===key} onChange={()=>setChoice(key)}/>{label}</label>)}
  <Button onClick={()=>{applyAppearance(choice);go('/profile/settings',true)}}>Save</Button>
  <Button kind="secondary" onClick={()=>go('/profile/settings',true)}>Cancel</Button>
  
 </section>
 if(section==='settings/language') return <section className="stack"><ProfileRow title="English" trailing={<small>Current</small>}/><small>English is available in this demo.</small></section>
 if(section==='security') return <section className="stack">
  <ProfileRow title="Change PIN" onClick={open('security/pin')}/>
  <Preference name="Biometric login" storageKey={biometricKey} onChange={enabled=>addDemoAlert("Security","Biometric sign-in updated",enabled?"Demo biometrics enabled.":"Demo biometrics disabled.")}/>
  <ProfileRow title="Bound devices" detail="Review devices linked to this demo" onClick={open('devices')}/>
  <ProfileRow title="Security alerts" trailing={<small>Always on</small>}/>
  <p className="notice">Demo security changes appear in your inbox.</p>
 </section>
 if(section==='security/pin') return <ChangeDemoPin onDone={open('security')}/>
 if(section==='devices') return <Devices/>
 if(section==='notifications') return <section className="stack">
  <ProfileRow title="Payment alerts" detail="Cannot be turned off" trailing={<small>Always on</small>}/>
  <ProfileRow title="Security alerts" detail="Cannot be turned off" trailing={<small>Always on</small>}/>
  <Preference name="Programme updates" storageKey="masrif-demo-programmes" defaultOn/>
  <Preference name="Offers and marketing" detail="Opt-in only" storageKey="masrif-demo-marketing" onChange={setMarketingPreference}/>
  <Button kind="secondary" onClick={()=>go('/inbox')}>Open inbox</Button>
 </section>
 if(section==='legal') return <section className="stack">
  <ProfileRow title="Terms of Use" detail="Version 1.0 · Demo" onClick={open('legal/terms')}/>
  <ProfileRow title="Privacy Notice" detail="Version 1.0 · Demo" onClick={open('legal/privacy')}/>
  <ProfileRow title="Consent history" detail="See what you agreed to and when" onClick={open('legal/consent')}/>
  <ProfileRow title="Open-source licences" onClick={open('legal/licences')}/>
 </section>
 if(section==='legal/licences') return <section className="stack"><ProfileRow title="React" detail="MIT licence"/><ProfileRow title="Vite" detail="MIT licence"/></section>
 if(section.startsWith('legal/')) return <DemoLegal section={section}/>
 if(section==='help') return <section className="stack">
  <form className="profile-search" role="search" onSubmit={event=>{event.preventDefault();go('/profile/help/faq',false,'?q='+encodeURIComponent(query.trim()))}}>
    <input type="search" aria-label="Search help" placeholder="Search help" value={query} onChange={event=>setQuery(event.target.value)}/>
    <button type="submit" className="icon-button" aria-label="Search"><Icon name="search" size={20}/></button>
  </form>
  <ProfileRow title="FAQ" detail="Common questions" onClick={open('help/faq')}/>
  <ProfileRow title="Contact support" detail="Create and review demo tickets" onClick={open('help/contact')}/>
  <ProfileRow title="Report fraud or lost phone" detail="Act quickly" onClick={open('help/report')}/>
  <ProfileRow title="Lock my account now" detail="Demo preview" onClick={open('help/lock')}/>
 </section>
 if(section==='help/faq') return <Faq/>
 if(section==='help/contact') return <SupportDesk records={records}/>
 if(section==='help/report') return <section className="stack">
  <p className="notice">If someone else may have access, lock your demo account before continuing.</p>
  <Button onClick={open('help/lock')}>Lock my account now</Button>
  <h2>What happened?</h2>
  {Object.entries(reports).map(([id,report])=><ProfileRow key={id} title={report.title} detail={report.detail} onClick={()=>setFeedback(id)}/>)}
  {feedback&&<section className="stack module-panel" aria-label="Next steps">
    <h3>{reports[feedback].title}</h3><p>{reports[feedback].detail}</p>
    {feedback==='lost'&&<Button kind="secondary" onClick={open('devices')}>Review bound devices</Button>}
    {feedback==='pin'&&<Button kind="secondary" onClick={open('security/pin')}>Change demo PIN</Button>}
    <Button onClick={()=>go('/profile/help/contact',false,'?incident='+feedback)}>{feedback==='payment'?'Choose a transaction':'Create demo support ticket'}</Button>
  </section>}
 </section>
 return <section className="stack">
  <div className="module-panel"><h2>Lock your demo account?</h2><p>You’ll need to complete the demo PIN recovery flow to sign in again.</p></div>
  <Button onClick={()=>{sessionStorage.setItem(lockKey,'true');sessionStorage.setItem(signedOutKey,'true');addDemoAlert('Security','Account locked','You locked your demo account.');go('/login/locked',true)}}>Confirm demo lock</Button>
  <Button kind="secondary" onClick={open('help/report')}>Cancel</Button>
 </section>
}

function Devices() {
 const [removed,setRemoved] = useState(()=>localStorage.getItem('masrif-demo-device-removed')==='true')
 const [confirm,setConfirm] = useState(false)
 return <section className="stack">
  <ProfileRow title="This phone" detail="Current demo device" trailing={<small>Current</small>}/>
  {!removed&&<ProfileRow title="Old phone" detail="Android · Demo device" trailing={<button className="text-button" onClick={()=>setConfirm(true)}>Remove</button>}/>}
  {confirm&&<ConfirmDialog title="Remove old phone?" action="Remove device" onCancel={()=>setConfirm(false)}
   onConfirm={()=>{localStorage.setItem('masrif-demo-device-removed','true');setRemoved(true);setConfirm(false);addDemoAlert('Security','Device removed','Old phone was removed from your demo account.')}}>
   <p>Old phone will be disconnected from your demo account.</p>
  </ConfirmDialog>}
  {removed&&<p className="notice" role="status">The old demo device was removed.</p>}
 </section>
}

function Faq() {
 const [query,setQuery]=useState(()=>new URLSearchParams(window.location.search).get('q')||'')
 const terms=query.trim().toLowerCase().split(/\s+/)
 const matches=faq.filter(([question,answer])=>terms.every(term=>(question+' '+answer).toLowerCase().includes(term)))
 return <section className="stack"><input type="search" aria-label="Search FAQ" placeholder="Search FAQ" value={query} onChange={event=>setQuery(event.target.value)}/>
  {matches.map(([question,answer])=><details className="profile-disclosure" key={question}><summary>{question}</summary><p>{answer}</p></details>)}
  {!matches.length&&<p className="notice">No questions match your search.</p>}
 </section>
}

function Preference({name,detail,storageKey,defaultOn=false,onChange}) {
 const [enabled,setEnabled]=useState(()=>localStorage.getItem(storageKey)==null?defaultOn:localStorage.getItem(storageKey)==='true')
 return <label className="module-row profile-row"><span><strong>{name}</strong>{detail&&<small>{detail}</small>}</span><input type="checkbox" checked={enabled} onChange={event=>{setEnabled(event.target.checked);localStorage.setItem(storageKey,String(event.target.checked));onChange?.(event.target.checked)}}/></label>
}

export function Inbox({id,go}) {
 const [filter,setFilter]=useState('All')
 const [entries]=useState(()=>[...readDemo(alertsKey,[]),...notices.filter(([key])=>key!=='pintar'||localStorage.getItem('masrif-demo-programmes')!=='false')])
 if(id){
  const item=entries.find(row=>row[0]===id)
  return item?<article className="module-panel"><small>{item[1]} · {item[4]}</small><h2>{item[2]}</h2><p>{item[3]}</p></article>:<p className="notice">This notification is unavailable.</p>
 }
 return <section className="stack"><div className="segments" aria-label="Notification category">{['All','Security','Payments','Updates'].map(label=><button aria-pressed={filter===label} onClick={()=>setFilter(label)} key={label}>{label}</button>)}</div>
 {entries.filter(row=>filter==='All'||row[1]===filter).map(([key,,title,detail,time])=><ProfileRow key={key} title={title} detail={detail} trailing={<small>{time}</small>} onClick={()=>go('/inbox/'+key)}/>)}
 </section>
}
