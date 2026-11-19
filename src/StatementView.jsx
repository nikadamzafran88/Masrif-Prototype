import { useState } from 'react'
import { money } from './demo'
import { monthlyStatement, statementMonths } from './accountStatement'
import { Button } from './ui'
import { Dropdown } from './Dropdown'

const monthLabel = new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'})

export function StatementView({records,renderRows}) {
 const months=statementMonths(records)
 const [selection,setSelection]=useState(months[0])
 const [busy,setBusy]=useState(false)
 const [feedback,setFeedback]=useState('')
 const month=months.includes(selection)?selection:months[0]
 const statement=monthlyStatement(records,month)
 async function download() {
   setBusy(true)
   setFeedback('')
   try {
     const {downloadStatement}=await import('./statementPdf')
     await downloadStatement(statement)
     setFeedback('Statement PDF ready.')
   } catch {
     setFeedback('The statement PDF could not be generated. Try again.')
   } finally {
     setBusy(false)
   }
 }
 const format=value=>value===null?'Unavailable':money(value)
 return <section className="stack">
   <Dropdown label="Statement month" value={month} disabled={busy} onChange={value=>{setSelection(value);setFeedback('')}}
     options={months.map(value=>({value,label:monthLabel.format(new Date(value+'-01T00:00:00Z'))}))}/>
   <div className="module-panel"><h2>{statement.label}</h2><p>ATLAS Savings Account-i · •••• 4812</p><small>Demo statement · Posted transactions</small></div>
   <dl className="details"><dt>Opening balance</dt><dd>{format(statement.openingBalance)}</dd><dt>Money in</dt><dd>{money(statement.moneyIn)}</dd><dt>Money out</dt><dd>{money(statement.moneyOut)}</dd><dt>Closing balance</dt><dd>{format(statement.closingBalance)}</dd></dl>
   <Button disabled={busy} onClick={download}>{busy?'Preparing statement…':'Download monthly PDF'}</Button>
   {feedback&&<p className="notice" role="status">{feedback}</p>}
   <section><h2>Statement transactions</h2>{statement.transactions.length?renderRows(statement.transactions):<p className="notice">No posted demo transactions for this month.</p>}</section>
 </section>
}
