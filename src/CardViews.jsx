import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'

const cardholder = 'AISYAH BINTI AHMAD'
const selectedCardKey = 'masrif-selected-card'
const addedCardsKey = 'masrif-added-cards'
const initialCards = [
  {id:'physical', label:'Physical debit card', last:'4521', expiry:'09/29', freezeKey:'masrif-card-frozen'},
  {id:'virtual', label:'Virtual debit card', last:'8064', expiry:'11/30', freezeKey:'masrif-virtual-card-frozen'},
]
const demoPin = '123456'
const displayTime = 30000

function readCards() {
  try {
    const added = JSON.parse(localStorage.getItem(addedCardsKey))
    return Array.isArray(added) ? [...initialCards,...added] : initialCards
  } catch {
    return initialCards
  }
}

const isVirtual = card => card.type === 'virtual' || card.id === 'virtual'

function cardScrollLeft(panel, slot) {
  return slot.offsetLeft - (panel.clientWidth - slot.offsetWidth) / 2
}

export function CardViews({details, openDetails, done}) {
  const [cards] = useState(readCards)
  const [initialIndex] = useState(()=>Math.max(0,cards.findIndex(card=>card.id===sessionStorage.getItem(selectedCardKey))))
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [frozenCards, setFrozenCards] = useState(()=>Object.fromEntries(cards.map(card=>[card.id,localStorage.getItem(card.freezeKey)==='true'])))
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const dialog = useRef(null)
  const timer = useRef(null)
  const carousel = useRef(null)
  const card = cards[selectedIndex]
  const frozen = frozenCards[card.id]

  useLayoutEffect(()=>{
    const panel = carousel.current
    if (!panel) return
    panel.scrollLeft = cardScrollLeft(panel,panel.children[initialIndex])
  },[initialIndex])

  function pageTo(index) {
    const panel = carousel.current
    panel.scrollTo({
      left:cardScrollLeft(panel,panel.children[index]),
      behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  function trackCard(event) {
    const panel = event.currentTarget
    const distances = [...panel.children].map(slot=>Math.abs(cardScrollLeft(panel,slot)-panel.scrollLeft))
    const index = distances.indexOf(Math.min(...distances))
    if (index === selectedIndex) return
    setSelectedIndex(index)
    sessionStorage.setItem(selectedCardKey,cards[index].id)
  }

  useEffect(()=>{
    if (!details || !verified) return
    function hide() {
      clearTimeout(timer.current)
      setVerified(false)
      setShowCvv(false)
    }
    timer.current = setTimeout(hide, displayTime)
    function onVisibility() { if (document.hidden) hide() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', hide)
    return ()=>{
      clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', hide)
    }
  },[details, verified])

  function verify(event) {
    event.preventDefault()
    if (pin !== demoPin) {
      setError('That PIN does not match. Use the demo PIN shown below.')
      return
    }
    setPin('')
    setError('')
    setVerified(true)
  }

  function changeFreeze() {
    localStorage.setItem(card.freezeKey,String(!frozen))
    setFrozenCards(previous=>({...previous,[card.id]:!frozen}))
    dialog.current.close()
  }

  if (details) return <div className="stack card-details-view">
    {verified ? <>
      <p className="notice card-verified" role="status">Verified with your demo PIN.</p>
      <dl className="details card-detail-fields">
        <dt>Card</dt><dd>{card.label}</dd>
        <dt>Card number</dt><dd>0000 0000 0000 {card.last}</dd>
        <dt>Expiry</dt><dd>{card.expiry}</dd>
        <dt>CVV</dt><dd className="card-cvv"><span>{showCvv ? '000' : '•••'}</span>
          <button className="text-button" type="button" aria-label={showCvv ? 'Hide CVV' : 'Show CVV'} onClick={()=>setShowCvv(!showCvv)}>{showCvv ? 'Hide' : 'Show'}</button>
        </dd>
        <dt>Name</dt><dd>{card.holder ?? cardholder}</dd>
      </dl>
      <small className="card-privacy-note">Demo details hide automatically after 30 seconds.</small>
    </> : <form className="stack" onSubmit={verify}>
      <div className="module-panel"><h2>Verify to view card details</h2><p>{card.label} · {card.last}</p><p>Use the fictional PIN 123456.</p></div>
      <label>Demo PIN<input type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin}
        aria-invalid={Boolean(error)} aria-describedby={error ? 'card-pin-error' : undefined}
        onChange={event=>{setPin(event.target.value.replace(/\D/g,''));setError('')}}/></label>
      {error&&<p className="notice" id="card-pin-error" role="alert">{error}</p>}
      <Button type="submit" disabled={pin.length!==6}>Verify demo PIN</Button>
    </form>}
    <Button kind={verified ? 'primary' : 'secondary'} onClick={done}>{verified ? 'Done' : 'Back to Card'}</Button>
  </div>

  return <div className="stack card-overview">
    <div className="card-picker">
      <div className="card-carousel" ref={carousel} role="region" aria-label="Debit cards. Swipe left or right to switch cards."
        tabIndex={0} onScroll={trackCard} onKeyDown={event=>{
          if (event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return
          event.preventDefault()
          pageTo(event.key==='ArrowRight' ? Math.min(cards.length-1,selectedIndex+1) : Math.max(0,selectedIndex-1))
        }}>
      {cards.map(item=><div className="card-slide" key={item.id}>
        <article className="atlas-debit-card" data-card={isVirtual(item) ? 'virtual' : 'physical'} aria-label={item.label+' ending '+item.last}>
          <img className="card-face-logo" src="/masrif/access-logo-light.svg" alt="Masrif"/>
          <div className="card-face-chip" aria-hidden="true"/>
          <div className="card-face-brand"><strong>ATLAS</strong><small>Bank Muamalat</small></div>
          <div className="card-face-footer"><small>{item.holder ?? cardholder}</small><span className="card-face-number">•••• {item.last}</span></div>
        </article>
      </div>)}
      </div>
      <div className="card-page-controls" role="group" aria-label="Switch cards">
        {cards.map((item,index)=><button key={item.id} type="button" aria-label={'Select '+item.label.toLowerCase()+' ending '+item.last}
          aria-pressed={selectedIndex===index} onClick={()=>pageTo(index)}><span aria-hidden="true"/></button>)}
      </div>
      <strong className="card-picker-summary" aria-live="polite">{card.label} · {card.last}</strong>
    </div>
    <div className="row card-status"><span>Status</span><strong className={frozen ? 'card-status-frozen' : ''}>{frozen ? 'Frozen' : 'Active'}</strong></div>
    <button className="module-row card-freeze" type="button" role="switch" aria-label="Freeze card" aria-checked={frozen}
      aria-haspopup="dialog" onClick={()=>dialog.current.showModal()}>
      <span><strong>Freeze card</strong><small>Confirm before each change</small></span><span className="card-switch" aria-hidden="true"/>
    </button>
    <Button kind="secondary" onClick={openDetails}>View card details</Button>
    <dialog ref={dialog} className="sheet" aria-labelledby="card-freeze-title" onClick={event=>{if(event.target===dialog.current)dialog.current.close()}}>
      <div className="sheet-body stack">
        <div className="handle"/>
        <div className="row"><h2 id="card-freeze-title">{frozen ? 'Unfreeze card?' : 'Freeze card?'}</h2>
          <button className="icon-button" type="button" aria-label="Close confirmation" onClick={()=>dialog.current.close()}><Icon name="close"/></button>
        </div>
        <p>This changes the status of your demo Atlas debit card.</p>
        <Button onClick={changeFreeze}>{frozen ? 'Unfreeze demo card' : 'Freeze demo card'}</Button>
        <Button kind="secondary" onClick={()=>dialog.current.close()}>Cancel</Button>
      </div>
    </dialog>
  </div>
}

const cardTypes = [
  {value:'virtual', label:'Virtual debit card'},
  {value:'physical', label:'Physical debit card'},
]
const demoHolder = 'Farah Amin'
const demoAddress = '12 Jalan Contoh, 50480 Kuala Lumpur'

export function AddCard({onDone, onCancel}) {
  const [type,setType] = useState('')
  const [review,setReview] = useState(false)
  const [pin,setPin] = useState('')
  const [error,setError] = useState('')
  const submitted = useRef(false)
  const label = cardTypes.find(option=>option.value===type)?.label
  const physical = type === 'physical'

  function confirm(event) {
    event.preventDefault()
    if (!label || submitted.current) return
    if (pin !== demoPin) {
      setError('Use the demo PIN 123456 to confirm.')
      return
    }
    const existing = readCards()
    const used = new Set(existing.map(card=>card.last))
    const serial = Array.from({length:10000},(_,index)=>String((9000+index)%10000).padStart(4,'0')).find(last=>!used.has(last))
    if (!serial) {
      setError('There are no more demo card numbers available.')
      return
    }
    const id = crypto.randomUUID()
    const expires = new Date()
    const expiry = String(expires.getMonth()+1).padStart(2,'0')+'/'+String(expires.getFullYear()+3).slice(-2)
    const card = {id,type,label,last:serial,expiry,holder:demoHolder.toUpperCase(),freezeKey:'masrif-card-frozen-'+id}
    try {
      localStorage.setItem(addedCardsKey,JSON.stringify([...existing.slice(initialCards.length),card]))
    } catch {
      setError('The demo card could not be saved on this device.')
      return
    }
    submitted.current = true
    sessionStorage.setItem(selectedCardKey,id)
    onDone()
  }

  return <form className="stack" onSubmit={review ? confirm : event=>{event.preventDefault();if(label)setReview(true)}}>
    {!review&&<Dropdown label="Card type" options={cardTypes} value={type} onChange={setType} placeholder="Choose a card type"/>}
    <section className="module-panel">
      <h2>{review ? 'Review your demo card' : 'Card setup'}</h2>
      <dl className="details">
        {review&&<><dt>Card type</dt><dd>{label}</dd></>}
        <dt>Cardholder</dt><dd>{demoHolder}</dd>
        <dt>Linked account</dt><dd>Atlas Savings •••• 4812</dd>
        {physical&&<><dt>Demo delivery address</dt><dd>{demoAddress}</dd></>}
      </dl>
      <p>Demo setup. No real card will be issued.</p>
    </section>
    {review&&<>
      <label>Demo PIN<input type="password" inputMode="numeric" maxLength={6} value={pin}
        aria-describedby="add-card-pin-help" aria-invalid={Boolean(error)}
        onChange={event=>{setPin(event.target.value.replace(/\D/g,''));setError('')}}/></label>
      <small id="add-card-pin-help">Use the fictional PIN 123456.</small>
      {error&&<p className="notice" role="alert">{error}</p>}
    </>}
    <Button type="submit" disabled={review ? pin.length!==6 : !label}>{review ? 'Confirm demo card' : 'Review card'}</Button>
    <Button type="button" kind="secondary" onClick={review ? ()=>{setReview(false);setPin('');setError('')} : onCancel}>
      {review ? 'Back to setup' : 'Cancel'}
    </Button>
  </form>
}
