import { useState } from 'react'
import { Button } from './ui'
import { receiptBrand, receiptDetails, receiptLogo, receiptNotice } from './receiptData'

export function Receipt({item}) {
 const [busy,setBusy]=useState(false)
 const [feedback,setFeedback]=useState('')
 const {amount,rows}=receiptDetails(item)
 async function savePdf() {
   setBusy(true)
   setFeedback('')
   try {
     const {downloadReceipt}=await import('./receiptPdf')
     await downloadReceipt(item)
     setFeedback('Your receipt PDF is ready.')
   } catch {
     setFeedback('The receipt PDF could not be generated. Try again.')
   } finally {
     setBusy(false)
   }
 }
 return <div className="stack">
   <article className="branded-receipt" aria-label="Masrif transaction receipt">
     <header><img src={receiptLogo} width="159" height="44" alt="Masrif"/><small>{receiptBrand}</small><h2>Transaction receipt</h2></header>
     <div className="receipt-amount"><small>Total amount</small><strong>{amount}</strong></div>
     <dl>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
     <small className="receipt-notice">{receiptNotice}</small>
   </article>
   <Button onClick={savePdf} disabled={busy}>{busy?'Preparing PDF…':'Download PDF receipt'}</Button>
   {feedback&&<p className="notice" role="status">{feedback}</p>}
 </div>
}

