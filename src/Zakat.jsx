import { useEffect, useRef, useState } from 'react'
import { money, parseAmount } from './demo'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'
import { ZakatCalculator } from './ZakatCalculator'
import { paymentInstitutions } from './zakatRates'

const types = ['Income zakat', 'Zakat fitrah']
const steps = ['Payment details', 'Enter amount', 'Review payment']

export function Zakat({records, balance, onPay, go}) {
  const [step, setStep] = useState('home')
  const [institution, setInstitution] = useState('')
  const [type, setType] = useState('')
  const [value, setValue] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [calculatorDraft, setCalculatorDraft] = useState(null)
  const [year] = useState(()=>new Intl.DateTimeFormat('en-MY',{year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(new Date()))
  const heading = useRef(null)
  const institutionStrip = useRef(null)
  const submitted = useRef(false)
  const payments = records.filter(record => record.category === 'Zakat')
  const result = payments.find(record => record.id === paymentId)
  const amount = parseAmount(value.trim())
  const canPay = amount > 0 && amount <= balance
  const openReceipt = id => go('/receipts/'+id)

  useEffect(() => { if (step !== 'home') heading.current?.focus() }, [step])

  function scrollInstitutions(direction) {
    const strip = institutionStrip.current
    strip.scrollBy({
      left: direction * strip.clientWidth * .78,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  function start(calculatedPayment = null) {
    submitted.current = false
    setInstitution(calculatedPayment?.institution ?? '')
    setType(calculatedPayment?.type ?? '')
    setValue(calculatedPayment ? (calculatedPayment.amount / 100).toFixed(2) : '')
    setCalculatorDraft(calculatedPayment?.draft ?? null)
    setPaymentId('')
    setStep(calculatedPayment ? 2 : 0)
  }

  function pay() {
    if (!canPay || submitted.current) return
    submitted.current = true
    const id = crypto.randomUUID()
    onPay({id, institution, type, amount})
    setPaymentId(id)
    setStep('result')
  }

  if (step === 'calculator') return <ZakatCalculator draft={calculatorDraft} onBack={()=>setStep('home')} onPay={start}/>

  const showHistory = step === 'history'
  const paidThisYear = payments.filter(payment=>payment.status === 'Successful' && payment.date.endsWith(year))
  if (step === 'home' || showHistory) return <div className="module-flow">
    {showHistory ? <Button kind="secondary" onClick={()=>setStep('home')}>Back to Zakat</Button> :
      <>
        <section className="zakat-year-card" aria-label="Yearly zakat summary">
          <div className="zakat-year-total"><h2>Zakat paid in {year}</h2><strong>{money(paidThisYear.reduce((total, payment)=>total-payment.amount,0))}</strong></div>
          <div className="zakat-payment-count"><strong>{paidThisYear.length}</strong><small>{paidThisYear.length === 1 ? 'Payment' : 'Payments'}</small></div>
        </section>
        <div className="zakat-actions" role="group" aria-label="Zakat actions">
          <button className="zakat-action" onClick={()=>start()}>
            <span className="tile-icon"><Icon name="out"/></span><Icon name="arrow" size={16}/><strong>Pay Zakat</strong>
          </button>
          <button className="zakat-action" onClick={()=>{setCalculatorDraft(null);setStep('calculator')}}>
            <span className="tile-icon"><Icon name="calculator"/></span><Icon name="arrow" size={16}/><strong>Calculate Zakat</strong>
          </button>
        </div>
      </>}
    <section>
      <h2 ref={heading} tabIndex={-1}>{showHistory ? 'Zakat payment history' : 'Recent zakat payments'}</h2>
      {payments.length === 0 && <div className="module-panel zakat-empty"><span className="tile-icon"><Icon name="heart"/></span><strong>No zakat payments yet</strong><p>Your confirmed payments and receipts will appear here.</p></div>}
      {(showHistory ? payments : payments.slice(0, 3)).map(payment => {
        const content = <><span><strong>{payment.name}</strong><small>{payment.zakatType} · {payment.date}{payment.status === 'Failed' && ' · Failed'}</small></span><strong>{money(-payment.amount)}</strong></>
        return payment.status === 'Successful'
          ? <button className="module-row zakat-payment" key={payment.id} onClick={()=>openReceipt(payment.id)}>{content}<Icon name="arrow" size={16}/></button>
          : <div className="module-row zakat-payment" key={payment.id}>{content}</div>
      })}
      {!showHistory && payments.length > 0 && <button className="text-button" onClick={()=>setStep('history')}>View payment history</button>}
      {showHistory && Object.entries(payments.reduce((totals, item) => {
        if (item.status === 'Successful') {
          const year = item.date.slice(-4)
          totals[year] = (totals[year] ?? 0) - item.amount
        }
        return totals
      }, {})).reverse().map(([year, total]) => <p className="notice" key={year}>{year} total paid · {money(total)}</p>)}
    </section>
  </div>

  if (step === 'result') {
    const successful = result?.status === 'Successful'
    return <div className="stack">
      <section className="result-card" role="status">
        <small>Demo zakat payment</small>
        <h2 ref={heading} tabIndex={-1}>{successful ? 'Payment successful' : 'Payment unsuccessful'}</h2>
        <p>{successful ? money(amount)+' · '+institution : 'Your demo balance was not charged.'}</p>
      </section>
      {successful && <Button onClick={()=>openReceipt(result.id)}>View receipt</Button>}
      <Button kind="secondary" onClick={()=>setStep('home')}>Back to Zakat</Button>
    </div>
  }

  return <div className="module-flow">
    <section className="module-panel zakat-checkout">
      {!calculatorDraft&&<p className="progress">Step {step + 1} of {steps.length}</p>}
      <h2 ref={heading} tabIndex={-1}>{steps[step]}</h2>
      {step === 0 && <form className="stack" onSubmit={event=>{event.preventDefault();if(institution&&type)setStep(1)}}>
        <fieldset className="zakat-institutions">
          <legend><span>1</span> Choose a zakat institution</legend>
          <div className="zakat-institution-nav">
            <small>Browse by institution</small>
            <button className="icon-button" type="button" aria-label="Browse earlier institutions" onClick={()=>scrollInstitutions(-1)}><Icon name="back" size={16}/></button>
            <button className="icon-button" type="button" aria-label="Browse more institutions" onClick={()=>scrollInstitutions(1)}><Icon name="arrow" size={16}/></button>
          </div>
          <div className="zakat-institution-strip" ref={institutionStrip}>
            {paymentInstitutions.map(({name,state,logo})=><label key={name} className="zakat-institution">
              <input type="radio" name="zakat-institution" value={name} checked={institution===name} onChange={()=>setInstitution(name)}/>
              <span className="zakat-institution-logo" data-logo={logo}><img src={'/masrif/zakat/'+logo} alt="" width="62" height="40"/></span>
              <strong>{name}</strong><small>{state}</small>
            </label>)}
          </div>
        </fieldset>
        <Dropdown className="zakat-type-label" label={<><i aria-hidden="true">2</i> Select the type of zakat</>}
          value={type} options={types} placeholder="Choose a type" onChange={setType} disabled={!institution}/>
        <Button type="submit" disabled={!institution||!type}>Next</Button>
      </form>}
      {step === 1 && <form className="stack" onSubmit={event=>{event.preventDefault();if(canPay)setStep(2)}}>
        <p>{institution} · {type}</p>
        <label>Amount (RM)<input value={value} onChange={event=>setValue(event.target.value)} inputMode="decimal" placeholder="0.00" aria-describedby="zakat-amount-note"/></label>
        <p id="zakat-amount-note" aria-live="polite">{amount > balance ? 'Insufficient demo balance.' : value.trim() && !amount ? 'Enter a positive amount with up to two decimal places.' : 'Enter the amount you intend to pay.'}</p>
        <Button type="submit" disabled={!canPay}>Review payment</Button>
      </form>}
      {step === 2 && <>
        <dl className="details">
          <dt>Institution</dt><dd>{institution}</dd>
          <dt>Zakat type</dt><dd>{type}</dd>
          <dt>Pay from</dt><dd>Atlas Savings •••• 4812</dd>
          <dt>Total</dt><dd>{money(amount)}</dd>
        </dl>
        <p>{canPay ? 'Demo payment. No real money will move.' : 'Insufficient demo balance.'}</p>
        <Button disabled={!canPay} onClick={pay}>Confirm demo payment</Button>
      </>}
    </section>
    <Button kind="secondary" onClick={()=>setStep(calculatorDraft ? 'calculator' : step === 0 ? 'home' : step - 1)}>
      {calculatorDraft ? 'Back to calculator' : 'Back'}
    </Button>
  </div>
}
