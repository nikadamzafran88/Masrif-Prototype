import { useState } from 'react'
import { PaymentAmount, PaymentApproval, PaymentSummary } from './PayViews'
import { confirmedTransferRecipient, demoRecipientFor, matchingPendingTransfer, money, parseAmount, sampleRecipientFor } from './demo'
import { searchBanks } from './bankCatalogue'
import { Button, Icon } from './ui'
import { BankLogo } from './BankLogo'
import { steps } from './routes'
import { ConfirmDialog } from './ConfirmDialog'

export function Transfer({step, draft, setDraft, go, balance, records, submit}) {
 const [lookupError,setLookupError] = useState('')
 const [bankQuery,setBankQuery] = useState('')
 const [checkPending,setCheckPending] = useState(false)
 const matchingBanks=step==='bank'?searchBanks(bankQuery):[]
 const index = steps.indexOf(step)
 const next = target => go('/transfer/'+target)
 const amount = parseAmount(draft.amount || '')
 const validAccount = /^\d{8,16}$/.test(draft.account || '')
 const recipient = demoRecipientFor(draft.bank,draft.account)
 const confirmed = confirmedTransferRecipient(draft)
 const pending = matchingPendingTransfer(records,confirmed,amount)
 const amountReady = amount>0 && amount<=balance
 const patch = values => setDraft({...draft,...values})
 const changeAccount = account => {
   setLookupError('')
   patch({account,confirmedAccount:undefined,confirmedBank:undefined})
 }
 const recoveryStep = !draft.bank?'bank':index>=2&&!recipient?'recipient':index>=3&&!confirmed?'verify':index>=4&&!amountReady?'amount':null
 if (index<0 || (index>0&&recoveryStep)) return <div className="stack">
   <p className="notice">Complete the previous step before continuing.</p>
   <Button onClick={()=>next(recoveryStep||'bank')}>Continue transfer</Button>
 </div>
 return <div className="stack transfer-layout">
   {step==='bank' && <>
     <div className="payment-recipient transfer-source"><span className="tile-icon"><Icon name="account" size={20}/></span><span><small>Sending from</small><strong>ATLAS Savings Account-i</strong><small>Account ending 4812</small></span></div>
     <Button kind="secondary" onClick={()=>go('/pay/recipients')}>Choose a saved recipient</Button>
     <h2>Select recipient bank</h2>
     <input type="search" aria-label="Search banks" placeholder="Search banks, e.g. Maybank or BSN" value={bankQuery} onChange={event=>setBankQuery(event.target.value)}/>
     <p className="planning-note">{matchingBanks.length} demo bank {matchingBanks.length===1?'option':'options'}</p>
     {!matchingBanks.length&&<p className="notice" role="status">No banks match your search.</p>}
     {matchingBanks.map(bank=><button className="module-row transfer-bank" key={bank} onClick={()=>{if(draft.bank!==bank)setDraft({bank,origin:draft.origin});next('recipient')}}><BankLogo bank={bank}/><strong>{bank}</strong><Icon name="arrow" size={18}/></button>)}

   </>}
   {step==='recipient' && <form className="stack" onSubmit={event=>{
     event.preventDefault()
     if(!validAccount) return
     if(!recipient){setLookupError('Account not found in the demo directory. Check the bank and number, or use a sample account.');return}
     next('verify')
   }}>
     <h2>Enter account number</h2>
     <div className="row selected-bank"><span className="selected-bank-name"><BankLogo bank={draft.bank}/><strong>{draft.bank}</strong></span><button type="button" className="text-button" onClick={()=>next('bank')}>Change bank</button></div>
     <label>Account number<input inputMode="numeric" value={draft.account||''} maxLength={16} onChange={event=>changeAccount(event.target.value.replace(/\D/g,''))} placeholder="Enter a demo account number"/></label>
     <button type="button" className="text-button" onClick={()=>changeAccount(sampleRecipientFor(draft.bank)?.account||'')}>Use sample account</button>
     {lookupError?<p className="notice" role="alert">{lookupError}</p>:<small>Use a fictional account from the demo.</small>}
     <Button disabled={!validAccount}>Verify recipient</Button>
   </form>}
   {step==='verify' && <><h2>Check the recipient</h2><Summary recipient={recipient}/><p className="notice">Make sure the name, bank, and account number are the ones you intended.</p><Button onClick={()=>{patch({confirmedAccount:recipient.account,confirmedBank:recipient.bank});next('amount')}}>Confirm recipient</Button><Button kind="secondary" onClick={()=>next('recipient')}>Edit account details</Button></>}
   {step==='amount' && <form className="stack" onSubmit={event=>{event.preventDefault();if(amountReady)next('review')}}>
     <div className="payment-recipient"><span className="tile-icon"><Icon name="user"/></span><span><small>Sending to</small><strong>{recipient.name}</strong></span></div>
     <PaymentAmount value={draft.amount||''} change={value=>patch({amount:value})} balance={balance}/>
     {amount>balance&&<p className="notice" role="status">Amount exceeds your available demo balance.</p>}
     <label>Recipient reference (optional)<input maxLength={40} value={draft.reference||''} onChange={event=>patch({reference:event.target.value})} placeholder="e.g. Lunch"/></label>
     <Button disabled={!amountReady}>Review transfer</Button>
   </form>}
   {step==='review' && <><PaymentSummary label="Total to send" name={recipient.name} amount={amount}/><Summary recipient={recipient} mask amount={amount} reference={draft.reference}/><Button onClick={()=>pending?setCheckPending(true):next('authorise')}>Continue to approval</Button><Button kind="secondary" onClick={()=>next('amount')}>Edit amount or reference</Button><button className="text-button" onClick={()=>go(draft.origin||'/pay')}>Cancel transfer</button></>}
   {step==='authorise'&&!pending&&<PaymentApproval transfer name={recipient.name} amount={amount} onSubmit={status=>submit(draft,amount,status)} onCancel={()=>next('review')}/>}
   {pending&&(checkPending||step==='authorise')&&<ConfirmDialog title="Matching transfer still pending" action="View pending transfer" cancelLabel="Back to review"
     onConfirm={()=>go('/transfer/result/'+pending.id)} onCancel={()=>step==='authorise'?next('review'):setCheckPending(false)}>
     <p>A transfer of {money(amount)} to {pending.name} is still pending. Check its status before sending again.</p>
   </ConfirmDialog>}
 </div>
}

function Summary({recipient,mask,amount,reference}) {
 return <dl className="details transfer-details">
   <dt>Recipient</dt><dd>{recipient.name}</dd><dt>Bank</dt><dd>{recipient.bank}</dd><dt>Account number</dt><dd>{mask?'•••• '+recipient.account.slice(-4):recipient.account}</dd>
   {amount!==undefined && <><dt>From</dt><dd>ATLAS ••4812</dd><dt>Transfer amount</dt><dd>{money(amount)}</dd><dt>Demo fee</dt><dd>{money(0)}</dd><dt>Recipient reference</dt><dd>{reference?.trim()||'—'}</dd></>}
 </dl>
}



