import { useState } from 'react'
import { Button } from './ui'
import { Dropdown } from './Dropdown'
import { money, parseAmount } from './demo'
import { DemoDocument, FlowDetails, FlowRow, FlowStep } from './FeatureFlow'
import { readDemo } from './demoStorage'

const storageKey = 'masrif-demo-procurement'
const tenders = [
  {id:'EP-26041',title:'Supply of STEM learning kits',buyer:'Sample Education Unit',category:'Supplies',close:'30 November 2026',fee:5000},
  {id:'EP-26042',title:'Community hall maintenance',buyer:'Sample Facilities Unit',category:'Services',close:'7 December 2026',fee:0},
  {id:'EP-26043',title:'Printing of programme materials',buyer:'Sample Programme Office',category:'Supplies',close:'10 December 2026',fee:2000},
]
const statuses = {
  draft:'Proposal in progress',submitted:'Submitted',review:'Under evaluation',awarded:'Awarded',unsuccessful:'Unsuccessful',
  contract:'Contract accepted',order:'Purchase order issued',delivery:'Delivery submitted',delivered:'Delivery accepted',
  invoiced:'Invoice submitted',approved:'Invoice approved',paid:'Paid',
}
const empty = {supplier:null,entries:{}}
const companyExample = {company:'Contoh Supplies Sdn. Bhd.',registration:'DEMO-00125',email:'supplier@example.test'}

export function Procurement({dark=false}) {
  const [data,setData] = useState(()=>readDemo(storageKey,empty))
  const [page,setPage] = useState('home')
  const [id,setId] = useState('')
  const [query,setQuery] = useState('')
  const [category,setCategory] = useState('All categories')
  const [supplier,setSupplier] = useState(data.supplier || {company:'',registration:'',email:''})
  const [agreement,setAgreement] = useState(false)
  const [input,setInput] = useState('')
  const open = next => ()=>{setAgreement(false);setPage(next)}
  const tender = tenders.find(item=>item.id===id)
  const entry = data.entries[id]

  function save(next) {
    localStorage.setItem(storageKey,JSON.stringify(next))
    setData(next)
  }
  function update(changes,next) {
    save({...data,entries:{...data.entries,[id]:{...entry,...changes}}})
    setPage(next)
  }
  function select(item,next) {
    setId(item.id)
    setAgreement(false)
    setPage(next)
  }
  function edit(next,value='') {
    setInput(value)
    setPage(next)
  }
  const workspace = open('workspace')
  const discover = open('discover')

  if (page==='home') return <div className="module-flow">
    <div className="module-panel eskeb-panel"><img className="eskeb-logo" src={'/brand/eskeb-'+(dark?'dark':'light')+'.png'} width="230" height="56" alt="e-SKEB"/><h2>e-procurement services</h2><p>Find opportunities, submit proposals and track delivery and payment.</p></div>
    <Button onClick={discover}>Discover tenders</Button>
    <FlowRow title="My tenders" detail={Object.keys(data.entries).length+' joined'} onClick={open('my-tenders')}/>
    <FlowRow title="Supplier registration" detail={data.supplier?.company || 'Register a demo company'} onClick={()=>{setId('');setPage('companies')}}/>
    <FlowRow title="Procurement history" detail="Completed and unsuccessful tenders" onClick={open('history')}/>
  </div>
  if (page==='discover') {
    const matches = tenders.filter(item=>(category==='All categories'||item.category===category)
      && [item.id,item.title,item.buyer].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
    return <FlowStep title="Discover tenders" back={open('home')}>
      <label>Search tenders<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Title, organisation or reference"/></label>
      <Dropdown label="Category" options={['All categories','Supplies','Services']} value={category} onChange={setCategory}/>
      {matches.map(item=><FlowRow key={item.id} title={item.title} detail={item.id+' · Closes '+item.close} onClick={()=>select(item,'tender')}/>)}
      {!matches.length&&<p className="notice">No sample tenders match your filters.</p>}
    </FlowStep>
  }
  if (page==='companies') return <FlowStep title="Select company" back={open(tender?'tender':'home')}>
    {data.supplier&&<FlowRow title={data.supplier.company} detail="Verified demo supplier" onClick={open(tender?'tender':'home')}/>}
    <Button onClick={open('supplier')}>{data.supplier?'Edit demo company':'Register supplier'}</Button>
  </FlowStep>
  if (page==='supplier') return <FlowStep title="Register supplier" back={open('companies')}>
    <form className="stack" onSubmit={event=>{event.preventDefault();if(supplier.company.trim()&&supplier.registration.trim())setPage('verify-company')}}>
      <label>Company name<input required maxLength={100} value={supplier.company} onChange={event=>setSupplier({...supplier,company:event.target.value})}/></label>
      <label>Registration number<input required maxLength={40} value={supplier.registration} onChange={event=>setSupplier({...supplier,registration:event.target.value})}/></label>
      <label>Contact email<input required type="email" maxLength={120} value={supplier.email} onChange={event=>setSupplier({...supplier,email:event.target.value})}/></label>
      <Button type="button" kind="secondary" onClick={()=>setSupplier(companyExample)}>Use sample company</Button>
      <Button type="submit">Review company</Button>
    </form>
  </FlowStep>
  if (page==='verify-company') return <FlowStep title="Company verification" back={open('supplier')}>
    <FlowDetails rows={[[ 'Company',supplier.company ],['Registration',supplier.registration],['Contact',supplier.email]]}/>
    <Button onClick={()=>{save({...data,supplier});setPage('verified-company')}}>Verify demo company</Button>
  </FlowStep>
  if (page==='verified-company') return <FlowStep title="Company verified">
    <div className="result-card" role="status"><strong>{data.supplier.company}</strong><p>The sample supplier is ready to join a tender.</p></div>
    <Button onClick={open(tender?'tender':'discover')}>{tender?'Return to tender':'Discover tenders'}</Button>
  </FlowStep>
  if (page==='my-tenders'||page==='history') {
    const history = page==='history'
    const list = tenders.filter(item=>{
      const itemEntry=data.entries[item.id]
      return itemEntry&&(history===['paid','unsuccessful'].includes(itemEntry.status))
    })
    return <FlowStep title={history?'Procurement history':'My tenders'} back={open('home')}>
      {list.length ? list.map(item=><FlowRow key={item.id} title={item.title} detail={statuses[data.entries[item.id].status]} onClick={()=>select(item,'workspace')}/>)
        : <p className="notice">{history?'Completed and unsuccessful demos will appear here.':'Join a tender to open its workspace.'}</p>}
      <Button onClick={discover}>Discover tenders</Button>
    </FlowStep>
  }
  if (!tender) return <FlowStep title="Choose a tender"><Button onClick={discover}>Discover tenders</Button></FlowStep>
  if (page==='tender') return <FlowStep title="Tender details" back={discover}>
    <div className="module-panel"><small>{tender.id} · Sample tender</small><h3>{tender.title}</h3><p>{tender.buyer}</p></div>
    <FlowDetails rows={[[ 'Category',tender.category ],['Closing date',tender.close],['Tender fee',tender.fee?money(tender.fee):'No fee']]}/>
    <Button onClick={open(entry?'workspace':'eligibility')}>{entry?'Open workspace':'Check eligibility'}</Button>
  </FlowStep>
  if (page==='eligibility') return <FlowStep title="Tender eligibility" back={open('tender')}>
    <p>{data.supplier ? data.supplier.company+' is verified for this sample tender.' : 'Register a demo supplier before joining this tender.'}</p>
    <Button onClick={open(data.supplier?'participation':'companies')}>{data.supplier?'Continue':'Register supplier'}</Button>
  </FlowStep>
  if (page==='participation') return <FlowStep title="Confirm participation" back={open('eligibility')}>
    <FlowDetails rows={[[ 'Tender',tender.id ],['Supplier',data.supplier.company],['Tender fee',money(tender.fee)]]}/>
    <label className="check"><input type="checkbox" checked={agreement} onChange={event=>setAgreement(event.target.checked)}/> Confirm participation in this demo tender.</label>
    <Button disabled={!agreement} onClick={()=>tender.fee ? setPage('fee') : update({status:'draft',feePaid:0},'workspace')}>{tender.fee?'Review fee':'Join tender'}</Button>
  </FlowStep>
  if (page==='fee') return <FlowStep title="Tender fee" back={open('participation')}>
    <FlowDetails rows={[[ 'Tender',tender.id ],['Fee',money(tender.fee)],['Payment','Simulation only']]}/>
    <Button onClick={()=>update({status:'draft',feePaid:tender.fee},'fee-result')}>Simulate fee payment</Button>
  </FlowStep>
  if (page==='fee-result') return <FlowStep title="Fee payment recorded">
    <div className="result-card" role="status"><strong>{money(entry.feePaid)}</strong><p>Demo fee recorded for {tender.id}.</p></div><Button onClick={workspace}>Open workspace</Button>
  </FlowStep>
  if (!entry) return <FlowStep title="Join the tender first" back={open('tender')}><Button onClick={open('eligibility')}>Check eligibility</Button></FlowStep>

  if (page==='workspace') return <FlowStep title="Tender workspace" back={open('my-tenders')}>
    <div className="module-panel"><small>{tender.id}</small><h3>{tender.title}</h3><p role="status">{statuses[entry.status]}</p></div>
    {entry.status==='draft' ? <>
      <FlowRow title="Technical proposal" detail={entry.technical?'Saved':'Add your approach'} onClick={()=>edit('technical',entry.technical)}/>
      <FlowRow title="Financial proposal" detail={entry.quote?money(entry.quote):'Enter your proposed amount'} onClick={()=>edit('financial',entry.quote?(entry.quote/100).toFixed(2):'')}/>
      <FlowRow title="Supporting documents" detail={entry.proposalFile||'Attach a sample document'} onClick={open('documents')}/>
      <Button disabled={!entry.technical||!entry.quote||!entry.proposalFile} onClick={open('proposal-review')}>Review proposal</Button>
    </> : <><FlowRow title="View submitted proposal" detail={money(entry.quote)} onClick={open('proposal-review')}/>
      <Button onClick={open('track')}>Track tender</Button></>}
  </FlowStep>
  if (page==='technical'||page==='financial') {
    const technical = page==='technical'
    return <FlowStep title={technical?'Technical proposal':'Financial proposal'} back={workspace}>
      <label>{technical?'Delivery approach':'Proposal total (MYR)'}{technical
        ? <textarea rows={4} maxLength={600} value={input} onChange={event=>setInput(event.target.value)}/>
        : <input inputMode="decimal" value={input} onChange={event=>setInput(event.target.value)}/>}</label>
      <Button disabled={technical?!input.trim():!parseAmount(input)} onClick={()=>update(technical?{technical:input.trim()}:{quote:parseAmount(input)},'workspace')}>Save proposal draft</Button>
    </FlowStep>
  }
  if (page==='documents') return <DemoDocument label="Proposal document" onCancel={workspace} onComplete={file=>update({proposalFile:file},'workspace')}/>
  if (page==='proposal-review') return <FlowStep title="Review proposal" back={workspace}>
    <FlowDetails rows={[[ 'Tender',tender.id ],['Technical proposal',entry.technical],['Quoted amount',money(entry.quote)],['Document',entry.proposalFile]]}/>
    {entry.status==='draft'&&<Button onClick={()=>update({status:'submitted'},'submitted')}>Submit demo proposal</Button>}
  </FlowStep>
  if (page==='submitted') return <FlowStep title="Proposal submitted" back={workspace}>
    <div className="result-card" role="status"><strong>{tender.id}</strong><p>Your demo proposal is ready for evaluation.</p></div><Button onClick={open('track')}>Track tender</Button>
  </FlowStep>
  if (page==='track') return <FlowStep title="Tender tracking" back={workspace}>
    <FlowDetails rows={[[ 'Tender',tender.id ],['Status',statuses[entry.status]],['Proposal',money(entry.quote)]]}/>
    {entry.status==='submitted'&&<Button onClick={()=>update({status:'review'},'track')}>Preview evaluation</Button>}
    {entry.status==='review'&&<><Button onClick={()=>update({status:'awarded'},'award')}>Preview award</Button>
      <Button kind="secondary" onClick={()=>update({status:'unsuccessful'},'track')}>Preview unsuccessful result</Button></>}
    {entry.status==='awarded'&&<Button onClick={open('award')}>View award and SST</Button>}
    {entry.status==='contract'&&<Button onClick={open('contract')}>View contract</Button>}
    {entry.status==='order'&&<Button onClick={open('order')}>View purchase order</Button>}
    {['delivery','delivered'].includes(entry.status)&&<Button onClick={open('delivery-track')}>Track delivery</Button>}
    {['invoiced','approved','paid'].includes(entry.status)&&<Button onClick={open('invoice-track')}>Track invoice</Button>}
  </FlowStep>
  if (page==='award') return <FlowStep title="Award and SST" back={open('track')}>
    <FlowDetails rows={[[ 'Awarded tender',tender.title ],['Award value',money(entry.quote)],['Letter of acceptance','SST-'+tender.id]]}/>
    <label className="check"><input type="checkbox" checked={agreement} onChange={event=>setAgreement(event.target.checked)}/> Accept the demo letter of award.</label>
    <Button disabled={!agreement} onClick={()=>update({status:'contract'},'contract')}>Accept award</Button>
  </FlowStep>
  if (page==='contract') return <FlowStep title="Contract details" back={open('track')}>
    <FlowDetails rows={[[ 'Contract','CON-'+tender.id ],['Contract value',money(entry.quote)],['Supplier',data.supplier.company],['Status','Accepted']]}/>
    <Button onClick={()=>update({status:'order'},'order')}>Preview purchase order</Button>
  </FlowStep>
  if (page==='order') return <FlowStep title="Purchase order" back={open('track')}>
    <FlowDetails rows={[[ 'Purchase order','PO-'+tender.id ],['Item',tender.title],['Amount',money(entry.quote)]]}/>
    <Button onClick={()=>edit('delivery',entry.deliveryReference)}>Submit delivery</Button>
  </FlowStep>
  if (page==='delivery') return <FlowStep title="Delivery submission" back={open('order')}>
    <label>Delivery note reference<input maxLength={50} value={input} onChange={event=>setInput(event.target.value)}/></label>
    <Button disabled={!input.trim()} onClick={()=>{update({deliveryReference:input.trim()},'delivery-document')}}>Attach delivery note</Button>
  </FlowStep>
  if (page==='delivery-document') return <DemoDocument label="Delivery note" onCancel={()=>edit('delivery',entry.deliveryReference)} onComplete={file=>update({deliveryFile:file,status:'delivery'},'delivery-track')}/>
  if (page==='delivery-track') return <FlowStep title="Delivery tracking" back={open('track')}>
    <FlowDetails rows={[[ 'Delivery note',entry.deliveryReference ],['Document',entry.deliveryFile],['Status',statuses[entry.status]] ]}/>
    {entry.status==='delivery'
      ? <Button onClick={()=>update({status:'delivered'},'delivery-track')}>Preview delivery acceptance</Button>
      : <Button onClick={()=>edit('invoice',entry.invoiceReference)}>Create invoice</Button>}
  </FlowStep>
  if (page==='invoice') return <FlowStep title="Create invoice" back={open('delivery-track')}>
    <label>Invoice reference<input maxLength={50} value={input} onChange={event=>setInput(event.target.value)}/></label>
    <FlowDetails rows={[[ 'Purchase order','PO-'+tender.id ],['Invoice total',money(entry.quote)]]}/>
    <Button disabled={!input.trim()} onClick={()=>update({invoiceReference:input.trim(),status:'invoiced'},'invoice-track')}>Submit demo invoice</Button>
  </FlowStep>
  if (page==='invoice-track') return <FlowStep title="Invoice tracking" back={open('track')}>
    <FlowDetails rows={[[ 'Invoice',entry.invoiceReference ],['Amount',money(entry.quote)],['Status',statuses[entry.status]] ]}/>
    {entry.status==='invoiced' ? <Button onClick={()=>update({status:'approved'},'payment-track')}>Preview invoice approval</Button> :
      <Button onClick={open('payment-track')}>Track payment</Button>}
  </FlowStep>
  if (page==='payment-track') return <FlowStep title="Payment tracking" back={open('invoice-track')}>
    <FlowDetails rows={[[ 'Invoice',entry.invoiceReference ],['Amount',money(entry.quote)],['Payment status',entry.status==='paid'?'Paid · Demo':'Awaiting payment']]}/>
    {entry.status==='paid' ? <Button onClick={open('remittance')}>View remittance advice</Button> :
      <Button onClick={()=>update({status:'paid'},'remittance')}>Simulate payment confirmation</Button>}
  </FlowStep>
  return <FlowStep title="Remittance advice" back={open('payment-track')}>
    <FlowDetails rows={[[ 'Reference','REM-'+tender.id ],['Invoice',entry.invoiceReference],['Amount',money(entry.quote)],['Status','Paid · Demo']]}/>
    <Button onClick={open('history')}>View procurement history</Button>
  </FlowStep>
}
