import { ExternalLink } from './ExternalLink'
import { useEffect, useId, useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { storedDemoPin } from './demoAuth'
import { Button, Icon } from './ui'

function PrivacyLink({href,icon,children,onClick}) {
  const Link = href==='/'?'a':ExternalLink
  return <Link className="module-row privacy-link" href={href} onClick={onClick}>
    <span className="tile-icon"><Icon name={icon} size={18}/></span>
    <strong>{children}</strong><Icon name="chevron" size={16}/>
  </Link>
}

export function AtlasSupport({privacy=false,closure=false}) {
  return <section className="module-panel stack">
    <h2>ATLAS by Bank Muamalat</h2>
    <p>{closure?'Contact ATLAS about closing a real account or requesting deletion of bank-held data. Customer care can explain the process and any retention requirements.':'Use these channels for help with a real ATLAS account.'}</p>
    <PrivacyLink href="tel:+60320215888" icon="phone">Call ATLAS customer care</PrivacyLink>
    <PrivacyLink href="mailto:ask@atlasmuamalat.com.my" icon="mail">Email ATLAS customer care</PrivacyLink>
    {privacy&&<PrivacyLink href="https://atlasmuamalat.com.my/data-privacy-policy/" icon="shield">Read the ATLAS Privacy Policy</PrivacyLink>}
  </section>
}

export function PrototypePrivacy() {
  return <article className="stack demo-legal privacy-content">
    <p className="notice">Masrif is an interactive prototype. Use fictional account and contact details.</p>
    <section className="module-panel stack"><h2>What this browser stores</h2><p>Masrif stores demo profile details, transactions, application drafts, support tickets, consent choices and preferences to let you try the journeys. Session data is kept in this tab. Other demo data stays in this browser until you delete it or clear the site’s storage.</p></section>
    <section className="module-panel stack"><h2>Permissions and online services</h2><p>The web app can use your camera for QR scanning and your location to suggest nearby services. You can revoke access in your browser settings. QR images are decoded locally. Online worship tools contact external services for content such as maps and prayer timetables.</p></section>
    <section className="module-panel stack"><h2>Your choices</h2><p>You can change your marketing choice under Profile → Notifications and review changes under Profile → Legal → Consent history.</p><PrivacyLink href="/account-deletion" icon="trash">Delete demo account data</PrivacyLink></section>
    <AtlasSupport privacy/>
  </article>
}

export function PrivacyNoticeButton({children='Privacy notice'}) {
  const dialog = useRef(null)
  const trigger = useRef(null)
  const title = useId()

  return <>
    <button type="button" className="text-button" ref={trigger} aria-haspopup="dialog" onClick={()=>dialog.current.showModal()}>{children}</button>
    <dialog ref={dialog} className="sheet privacy-notice-sheet" aria-labelledby={title} onClose={()=>trigger.current?.focus()}>
      <div className="privacy-notice-layout">
        <header className="privacy-notice-header">
          <h2 id={title}>Privacy Notice</h2>
          <button type="button" className="icon-button" aria-label="Close Privacy Notice" autoFocus onClick={()=>dialog.current.close()}><Icon name="close"/></button>
        </header>
        <div className="privacy-notice-scroll"><PrototypePrivacy/></div>
      </div>
    </dialog>
  </>
}

function DeletionComplete() {
  return <section className="stack privacy-content">
    <div className="result-card privacy-result" role="status">
      <span className="tile-icon"><Icon name="check"/></span>
      <h2>Demo data deleted</h2><p>Masrif’s saved demo data was cleared from this browser and tab.</p>
    </div>
    <PrivacyLink href="/" icon="home" onClick={()=>sessionStorage.removeItem('masrif-deletion-complete')}>Return to Masrif</PrivacyLink>
  </section>
}

function clearDemoStorage() {
  for (const storage of [localStorage,sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('masrif-')) storage.removeItem(key)
    }
  }
}

export function DeleteDemoAccount({inApp=false}) {
  const [confirm,setConfirm] = useState(false)
  const [pin,setPin] = useState('')
  const [error,setError] = useState('')
  const [deleted,setDeleted] = useState(false)
  function remove() {
    clearDemoStorage()
    setConfirm(false)
    setDeleted(true)
  }
  function request(event) {
    event.preventDefault()
    if (inApp&&pin!==storedDemoPin()) {
      setError('Incorrect demo PIN.')
      return
    }
    setConfirm(true)
  }
  if (deleted) return <DeletionComplete/>
  return <div className="stack privacy-content">
    <section className="module-panel stack">
      <h2>Delete demo data</h2>
      <p>Delete your demo profile, transactions, applications, support tickets and preferences stored in this browser.</p>
      <p className="notice privacy-warning">This action can’t be undone.</p>
    </section>
    <form className="module-panel stack" onSubmit={request}>
      {inApp&&<label>Current demo PIN<input type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={event=>{setPin(event.target.value.replace(/\D/g,''));setError('')}}/></label>}
      {error&&<p role="alert" className="notice">{error}</p>}
      <Button type="submit" disabled={inApp&&pin.length!==6}>Review demo deletion</Button>
    </form>
    {inApp&&<PrivacyLink href="/account-deletion" icon="trash">Open the public deletion page</PrivacyLink>}
    <AtlasSupport closure/>
    {confirm&&<ConfirmDialog destructive title="Delete your demo account?" action="Delete demo account" onCancel={()=>setConfirm(false)}
      onConfirm={()=>{if(inApp){clearDemoStorage();sessionStorage.setItem('masrif-deletion-complete','true');location.replace('/account-deletion')}else remove()}}>
      <p>Your saved Masrif demo data in this browser will be removed.</p>
    </ConfirmDialog>}
  </div>
}

export function PublicPrivacyPage({path}) {
  const [completed] = useState(()=>path==='/account-deletion'&&sessionStorage.getItem('masrif-deletion-complete')==='true')
  const appearance = localStorage.getItem('masrif-appearance') || 'Light'
  const [systemDark,setSystemDark] = useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(()=>{
    if (appearance!=='System') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = event => setSystemDark(event.matches)
    media.addEventListener('change',update)
    return ()=>media.removeEventListener('change',update)
  },[appearance])
  const dark = appearance==='Dark'||(appearance==='System'&&systemDark)
  const title = path==='/privacy'?'Privacy notice':path==='/support'?'Support':'Delete account'
  return <div className={'public-privacy app'+(dark?' dark':'')}>
    <header className="public-privacy-header">
      <a href="/" onClick={()=>sessionStorage.removeItem('masrif-deletion-complete')}><img src={'/masrif/access-logo-'+(dark?'dark':'light')+'.svg'} width="159" height="44" alt="Masrif home"/></a>
    </header>
    <main className="stack">
    <h1>{title}</h1>
    {path==='/privacy'?<PrototypePrivacy/>:path==='/support'?<AtlasSupport privacy/>:completed
      ?<DeletionComplete/>
      :<DeleteDemoAccount/>}
  </main></div>
}
