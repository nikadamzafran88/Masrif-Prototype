import { useEffect, useRef, useState } from 'react'
import { extraRecipients, money, parseAmount, savedRecipients } from './demo'
import { Button, Icon } from './ui'
import { BankLogo } from './BankLogo'
import { Dropdown } from './Dropdown'
import { QrScanner } from './QrScanner'
import { cashierCode, receiveCode, usePaymentCode } from './paymentCodes'

import { demoCode, storedDemoPin } from './demoAuth'
import { biometricKey } from './profileDemo'
import { ConfirmDialog } from './ConfirmDialog'
import { Skeleton } from './Skeleton'

const payActions = [['Scan to pay','scan'],['Receive money','receive'],['Show payment code','code'],['Transfer','transfer'],['Saved recipients','recipients']]
const merchant='Campus Bookshop'

export function PayViews({path,go,balance,newTransfer,onPayment,dark=false}) {
 if(path==='/pay') return <div className="stack pay-actions">
  {payActions.map(([label,target],index)=><button className="mode" style={{'--pay-action-order':index}} key={target} onClick={target==='transfer'?newTransfer:()=>go('/pay/'+target)}>
    <span className="pay-action-icon"><img src={'/masrif/'+target+'.svg'} width="24" height="24" alt=""/></span>
    <strong>{label}</strong><Icon name="arrow" size={16}/>
  </button>)}
 </div>
 if(path==='/pay/scan') return <ScanPayment balance={balance} go={go} onPayment={onPayment}/>
 if(path==='/pay/receive') return <ReceiveMoney dark={dark}/>
 if(path==='/pay/code') return <CashierCode onPayment={onPayment}/>
 if(path==="/pay/recipients") return <Recipients newTransfer={newTransfer}/>
 return <div className="stack"><p className="notice">This Pay screen is unavailable.</p><Button onClick={()=>go('/pay')}>Return to Pay</Button></div>
}

export function PaymentAmount({value,change,balance}) {
 return <div className="stack payment-amount">
  <label className="payment-amount-entry"><span>Amount</span><span className="amount-value"><b aria-hidden="true">RM</b><input aria-label="Amount in MYR" inputMode="decimal" value={value} onChange={event=>{const next=event.target.value;if(/^\d{0,8}(\.\d{0,2})?$/.test(next)) change(next.startsWith(".")?"0"+next:next)}} placeholder="0.00"/></span></label>
  {balance!==undefined&&<div className="scan-available"><span>Available balance</span><strong>{money(balance)}</strong></div>}
  <div className="keypad" aria-label="Amount keypad">{['1','2','3','4','5','6','7','8','9','.','0','Del'].map(key=><button type="button" key={key} aria-label={key==='Del'?'Delete digit':key} onClick={()=>{
    if(key==='Del'){change(value.slice(0,-1));return}
    const next=key==='.'&&!value?'0.':value+key
    if(/^\d{1,8}(\.\d{0,2})?$/.test(next)) change(next)
  }}>{key}</button>)}</div>
 </div>
}

export function PaymentApproval({name,amount,onSubmit,onCancel,transfer=false}) {
 const [pin,setPin]=useState(transfer)
 const [digits,setDigits]=useState('')
 const [expectedPin]=useState(storedDemoPin)
 const [pinError,setPinError]=useState(false)
 const [confirmBiometric,setConfirmBiometric]=useState(false)
 const biometricEnabled=localStorage.getItem(biometricKey)==='true'
 const [status,setStatus]=useState('Successful')
 const [processing,setProcessing]=useState(false)
 const submitted=useRef(false)
 useEffect(()=>{
   if(!processing) return
   const timer=setTimeout(()=>onSubmit(status),800)
   return ()=>clearTimeout(timer)
 },[processing,onSubmit,status])
 function approve() {
   if(submitted.current) return
   submitted.current=true
   setProcessing(true)
 }
 function verifyPin(event) {
   event.preventDefault()
   if(digits!==expectedPin) {
     setPinError(true)
     return
   }
   approve()
 }
 if(processing) return <div className="result-card payment-processing" role="status">
   <Skeleton className="payment-result-skeleton"/>
   <Skeleton className="skeleton-line skeleton-title"/>
   <h2>{transfer?'Processing transfer':'Processing payment'}</h2>
   <p>Please do not close the app.</p>
 </div>
 return <section className="stack payment-approval">
   <PaymentSummary label={transfer?"Verify your transfer":"Approve payment"} name={name} amount={amount}/>
   {transfer&&<p>Verify your identity to send this transfer.</p>}
   <Dropdown className="payment-demo-choice" label="Demo outcome" value={status} onChange={setStatus}
     options={[{value:'Successful',label:'Preview success'},{value:'Pending',label:'Preview pending'},{value:'Failed',label:'Preview failure'}]}/>
   {pin?<form className="stack" onSubmit={verifyPin}>
     <label>Demo PIN<input inputMode="numeric" type="password" autoComplete="off" maxLength={6} aria-invalid={pinError} value={digits} onChange={event=>{setDigits(event.target.value.replace(/\D/g,''));setPinError(false)}}/></label>
     <small>{expectedPin===demoCode?'Use the fictional PIN 123456.':'Use the PIN you set for this session.'}</small>
     {pinError&&<p className="notice" role="alert">Incorrect demo PIN. Try again.</p>}
     <Button disabled={digits.length!==6}>Verify PIN</Button>
   </form>:<><Button onClick={approve}>Face ID or fingerprint · Demo</Button><Button kind="secondary" onClick={()=>setPin(true)}>Use PIN instead</Button></>}
   {transfer&&biometricEnabled&&<Button kind="secondary" onClick={()=>setConfirmBiometric(true)}>Use Face ID · Demo</Button>}
   <Button kind="secondary" onClick={onCancel}>Cancel</Button>
   {confirmBiometric&&<ConfirmDialog title="Verify with Face ID" action="Simulate Face ID" onCancel={()=>setConfirmBiometric(false)} onConfirm={()=>{if(biometricEnabled){setConfirmBiometric(false);approve()}}}>
     <p>Simulate verifying your identity to send {money(amount)} to {name}.</p>
   </ConfirmDialog>}
 </section>
}

function ScanPayment({balance,go,onPayment}) {
 const [stage,setStage]=useState('scan')
 const [value,setValue]=useState('')
 const [payee,setPayee]=useState(merchant)
 const id=useRef(null)
 const amount=parseAmount(value)
 const valid=amount>0&&amount<=balance
 if(stage==='scan') return <QrScanner merchant={merchant} onContinue={({name,amount:requested})=>{
  setPayee(name);setValue(requested?(requested/100).toFixed(2):'');setStage('amount')
 }}/>
 if(stage==='amount') return <form className="stack scan-amount" onSubmit={event=>{event.preventDefault();if(valid)setStage('review')}}>
  <div className="payment-recipient scan-recipient"><span className="tile-icon"><Icon name="account"/></span><div><small>Paying to</small><h2>{payee}</h2></div></div>
  <PaymentAmount value={value} change={setValue} balance={balance}/>
  {amount>balance&&<p className="notice">Amount exceeds the available demo balance.</p>}
  <Button disabled={!valid}>Review</Button><Button type="button" kind="secondary" onClick={()=>setStage('scan')}>Back to scan</Button>
 </form>
 if(stage==='review') return <div className="stack"><PaymentSummary label="Check the details" name={payee} amount={amount}/><dl className="details payment-breakdown"><dt>Fee</dt><dd>{money(0)}</dd><dt>From</dt><dd>Atlas ••4812</dd><dt>Date</dt><dd>Today · Demo</dd></dl>
  <Button onClick={()=>setStage('approve')}>Confirm and pay</Button><Button kind="secondary" onClick={()=>setStage('amount')}>Edit amount</Button><Button kind="secondary" onClick={()=>go('/pay')}>Cancel</Button>
 </div>
 return <PaymentApproval name={payee} amount={amount} onCancel={()=>setStage('review')} onSubmit={status=>{
  if(id.current) return
  id.current=crypto.randomUUID()
  onPayment(id.current,amount,status,payee)
 }}/>
}

function ReceiveMoney({dark}) {
 const [view,setView]=useState('code')
 const [amount,setAmount]=useState(0)
 const [feedback,setFeedback]=useState('')
 const [custom,setCustom]=useState('')
 const generated=usePaymentCode(receiveCode(amount))
 function change(value) {setAmount(value);setView('code')}
 const card='Masrif demo receiving code\nFarah Amin · ATLAS •••• 4812\n'+(amount?money(amount):'Open amount')+'\nDemo only. No money will move.'
 async function share() {
   try {
     const bytes=Uint8Array.from(atob(generated.image.split(',')[1]),character=>character.charCodeAt(0))
     const file=new File([bytes],'masrif-demo-receive.png',{type:'image/png'})
     if(navigator.canShare?.({files:[file]})) await navigator.share({title:'Masrif demo receiving QR',text:card,files:[file]})
     else {
       await navigator.clipboard.writeText(card)
       setFeedback('Demo details copied. Use Save demo QR for the scannable image.')
     }
   } catch(error) {
     if(error.name!=='AbortError') setFeedback('Sharing is unavailable. You can save the demo QR instead.')
   }
 }
 const code=<div className="result-card demo-code receive-card">
  <div className="receive-brand-box"><img className="receive-brand-logo" src={'/masrif/access-logo-'+(dark?'dark':'light')+'.svg'} width="159" height="44" alt="Masrif"/></div>
  <div className="receive-account"><strong>Farah Amin</strong><small>{amount?'Requested amount · '+money(amount):'ATLAS account •••• 4812'}</small></div>
  <PaymentCodeDisplay result={generated} label="Masrif demo receiving QR code"/>
  <small>DEMO CODE · No money will move</small>
 </div>
 if(view==='amount') return <div className="stack pay-amount-presets"><h2>Set amount</h2>
  <div className="module-panel"><strong>Farah Amin</strong><small>ATLAS account •••• 4812</small></div>
  <h3>Select amount (MYR)</h3><div className="preset-options">{[1000,2500,5000].map(value=><Button kind="secondary" key={value} onClick={()=>change(value)}>{money(value)}</Button>)}</div>
  <form className="stack" onSubmit={event=>{event.preventDefault();if(parseAmount(custom))change(parseAmount(custom))}}>
    <label>Custom amount (MYR)<input inputMode="decimal" value={custom} onChange={event=>setCustom(event.target.value)} placeholder="0.00"/></label>
    <Button type="submit" disabled={!parseAmount(custom)}>Update QR amount</Button>
  </form>
  <Button kind="secondary" onClick={()=>change(0)}>Receive without an amount</Button><Button kind="secondary" onClick={()=>setView('code')}>Cancel</Button>
 </div>
 if(view==='share') return <div className="stack payment-code-layout"><h2>Share demo QR</h2>{code}
  <Button onClick={share} disabled={!generated?.image}>Share QR</Button>
  {generated?.image&&<a className="button secondary pay-download" href={generated.image} download="masrif-demo-receive.png">Save demo QR</a>}
  <Button kind="secondary" onClick={()=>setView('code')}>Back to Receive</Button>{feedback&&<p className="notice" role="status">{feedback}</p>}
 </div>
 return <div className="stack payment-code-layout"><p>Share your QR to receive money.</p>{code}<Button onClick={()=>amount?change(0):setView('amount')}>{amount?'Clear amount':'Set amount'}</Button><Button kind="secondary" onClick={()=>setView('share')}>Save / share preview</Button></div>
}

function CashierCode({onPayment}) {
 const [expiry,setExpiry]=useState(()=>Date.now()+60000)
 const [now,setNow]=useState(()=>Date.now())
 const previewed=useRef(false)
 const remaining=Math.max(0,Math.ceil((expiry-now)/1000))
 const generated=usePaymentCode(remaining ? cashierCode(expiry) : '', 'MD-'+expiry)
 useEffect(()=>{
   const timer=setInterval(()=>setNow(Date.now()),250)
   return ()=>clearInterval(timer)
 },[])
 if(!remaining) return <div className="stack"><div className="result-card"><h2>Your code has expired</h2><p>Generate a fresh code when you are ready to pay.</p></div><div className="module-panel"><h3>What happens next</h3><p>Ask the cashier to scan the new code.</p></div><Button onClick={()=>{const time=Date.now();setNow(time);setExpiry(time+60000)}}>Generate new code</Button></div>
 return <div className="stack payment-code-layout"><p>Let the cashier scan your payment code.</p><div className="result-card demo-code cashier-card"><span className="pay-code-label"><Icon name="scan" size={16}/> Cashier code</span><strong>ATLAS •••• 4812</strong><small>Show only when you are ready to pay</small><PaymentCodeDisplay result={generated} label="Demo cashier QR code"/><small>DEMO CODE · No money will move</small><div className="code-expiry"><small>Expires in {remaining}s</small><progress aria-label="Time left before code expiry" value={remaining} max={60}/></div></div>
  <Button onClick={()=>{if(previewed.current||Date.now()>=expiry)return;previewed.current=true;onPayment(crypto.randomUUID(),2500,'Successful')}}>Preview successful payment</Button>
  <Button kind="secondary" onClick={()=>setExpiry(0)}>Preview code expiry</Button>
 </div>
}

function PaymentCodeDisplay({result,label}) {
 return <div className="payment-code-frame code-outline generated-code">
  {result?.image ? <img className="generated-qr" src={result.image} width="200" height="200" alt={label}/> :
    result?.error ? <p role="status">Unable to generate a demo code.</p> : <div className="code-loading" role="status">
      <span className="loading-label">Preparing demo code</span>
      <Skeleton className="qr-skeleton"/>
    </div>}
  {result?.bars&&<img className="generated-barcode" src={result.bars} alt="Demo cashier barcode"/>}
 </div>
}

function Recipients({newTransfer}) {
 const [query,setQuery]=useState('')
 const [adding,setAdding]=useState(false)
 const [added,setAdded]=useState(()=>{
   try {
     const stored=JSON.parse(localStorage.getItem('masrif-demo-recipients'))
     return Array.isArray(stored)?extraRecipients.filter(item=>stored.some(row=>row?.account===item.account)):[]
   } catch {return []}
 })
 const matches=[...savedRecipients,...added].filter(item=>(item.name+' '+item.bank+' '+item.account.slice(-4)).toLowerCase().includes(query.trim().toLowerCase()))
 return <div className="stack">
  <input aria-label="Search recipients" type="search" placeholder="Search recipients" value={query} onChange={event=>setQuery(event.target.value)}/>
  {matches.map(item=><button className="module-row profile-row saved-recipient" key={item.account} onClick={()=>newTransfer(item)}><BankLogo bank={item.bank}/><span><strong>{item.name}</strong><small>{item.bank} ••{item.account.slice(-4)}</small></span><Icon name="arrow" size={18}/></button>)}
  {!matches.length&&<p role="status">No saved recipients match your search.</p>}
  {adding?<section className="stack"><h2>Choose a demo recipient</h2>{extraRecipients.filter(item=>!added.some(row=>row.account===item.account)).map(item=><Button kind="secondary" key={item.account} onClick={()=>{const next=[...added,item];setAdded(next);localStorage.setItem('masrif-demo-recipients',JSON.stringify(next));setAdding(false);setQuery('')}}><span className="selected-bank-name"><BankLogo bank={item.bank}/>{item.name} · {item.bank}</span></Button>)}<Button kind="secondary" onClick={()=>setAdding(false)}>Cancel</Button></section>:<Button onClick={()=>setAdding(true)} disabled={added.length>=extraRecipients.length}>Add recipient</Button>}
 </div>
}




export function PaymentSummary({label,name,amount}) {
 return <div className="payment-summary">
  <small>{label}</small>
  <strong className="payment-total">{money(amount)}</strong>
  <span>To {name}</span>
 </div>
}




