import { useRef, useState } from 'react'
import { searchBanks } from './bankCatalogue'
import { money, parseAmount } from './demo'
import { PaymentAmount } from './PayViews'
import { Button, Icon } from './ui'
import { BankLogo } from './BankLogo'

const demoDuitNowNumber='000000004812'

export function AddMoney({go,onAdd}) {
 const [stage,setStage]=useState('options')
 const [value,setValue]=useState('')
 const [bank,setBank]=useState('')
 const [query,setQuery]=useState('')
 const [feedback,setFeedback]=useState('')
 const [completed,setCompleted]=useState(null)
 const submitted=useRef(false)
 const amount=parseAmount(value)
 const matches=stage==='bank'?searchBanks(query):[]

 async function copy() {
   try {
     await navigator.clipboard.writeText(demoDuitNowNumber)
     setFeedback('Demo DuitNow number copied.')
   } catch {
     setFeedback('Copy is unavailable. Select the number to copy it manually.')
   }
 }

 function approve() {
   if(submitted.current||!amount||!bank) return
   submitted.current=true
   const receipt=onAdd(amount,bank)
   setCompleted(receipt)
   setStage('done')
 }

 if(stage==='options') return <section className="stack add-money">
   <div className="module-panel funding-destination"><span className="tile-icon"><Icon name="account"/></span><div><small>Adding to</small><h2>ATLAS Savings Account-i</h2><small>Account •••• 4812</small></div></div>
   <section className="module-panel funding-number" aria-labelledby="duitnow-funding-heading">
     <div className="funding-number-row">
       <span className="duitnow-mark"><img src="/masrif/duitnow.png" alt="DuitNow"/></span>
       <div><h2 id="duitnow-funding-heading">DuitNow account number</h2><strong>{demoDuitNowNumber.match(/.{4}/g).join(' ')}</strong></div>
       <button className="button secondary funding-copy" onClick={copy}>Copy</button>
     </div>
     <small>Demo number · No real transfers</small>
     {feedback&&<p role="status">{feedback}</p>}
   </section>
   <Button onClick={()=>setStage('amount')}>Set amount</Button>
 </section>

 if(stage==='amount') return <form className="stack add-money" onSubmit={event=>{event.preventDefault();if(amount)setStage('bank')}}>
   <h2>How much would you like to add?</h2>
   <PaymentAmount value={value} change={setValue}/>
   <Button disabled={!amount}>Select bank</Button>
   <Button type="button" kind="secondary" onClick={()=>setStage('options')}>Back to funding options</Button>
 </form>

 if(stage==='bank') return <section className="stack add-money">
   <div className="row"><div><small>Amount to add</small><h2>{money(amount)}</h2></div><button className="text-button" onClick={()=>setStage('amount')}>Edit amount</button></div>
   <h2>Select your bank</h2>
   <input aria-label="Search banks" type="search" placeholder="Search banks, e.g. Maybank or BSN" value={query} onChange={event=>setQuery(event.target.value)}/>
   {matches.map(name=><button className="module-row transfer-bank" key={name} onClick={()=>{setBank(name);setStage('review')}}><BankLogo bank={name}/><strong>{name}</strong><Icon name="arrow" size={18}/></button>)}
   {!matches.length&&<p className="notice" role="status">No banks match your search.</p>}
 </section>

 if(stage==='review') return <section className="stack add-money">
   <div className="payment-summary"><small>Review top-up</small><strong className="payment-total">{money(amount)}</strong><span className="funding-bank-summary"><BankLogo bank={bank}/>From {bank}</span></div>
   <dl className="details"><dt>From</dt><dd>{bank}</dd><dt>To</dt><dd>ATLAS ••4812</dd><dt>Demo fee</dt><dd>{money(0)}</dd><dt>Total added</dt><dd>{money(amount)}</dd></dl>
   <p className="notice">This previews bank approval. No bank app will open and no real money will move.</p>
   <Button onClick={approve}>Simulate bank approval</Button>
   <Button kind="secondary" onClick={()=>setStage('bank')}>Change bank</Button>
   <button className="text-button" onClick={()=>setStage('options')}>Cancel top-up</button>
 </section>

 return <section className="stack add-money">
   <div className="result-card payment-result-card" data-status="Successful"><div className="payment-result-symbol" aria-hidden="true">✓</div><h2>Demo top-up successful</h2><strong>{money(amount)}</strong><p>From {bank} to ATLAS ••4812</p></div>
   <Button onClick={()=>go('/receipts/'+completed)}>View receipt</Button>
   <Button kind="secondary" onClick={()=>go('/account')}>Done</Button>
 </section>
}

