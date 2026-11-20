import { ExternalLink } from './ExternalLink'
import { useState } from 'react'
import { money, parseAmount } from './demo'
import { Button } from './ui'
import { Dropdown } from './Dropdown'
import { estimateIncomeZakat, fitrahYear, institutions } from './zakatRates'

export function ZakatCalculator({draft, onBack, onPay}) {
  const [authority, setAuthority] = useState(draft?.authority ?? institutions[0].name)
  const [type, setType] = useState(draft?.type ?? 'Income zakat')
  const [income, setIncome] = useState(draft?.income ?? '')
  const [deductions, setDeductions] = useState(draft?.deductions ?? '')
  const [nisab, setNisab] = useState(draft?.nisab ?? '')
  const [counts, setCounts] = useState(draft?.counts ?? {})
  const body = institutions.find(item => item.name === authority)
  const fitrah = type === 'Zakat fitrah'
  const parse = value => parseAmount(value.trim())
  const validCounts = Object.values(counts).every(value => !value || /^\d{1,4}$/.test(value))
  const validIncome = parse(income) > 0 && parse(nisab) > 0 &&
    (!deductions.trim() || parse(deductions) > 0 || /^0+(\.0{1,2})?$/.test(deductions.trim()))
  const estimate = fitrah
    ? body.rates.reduce((total, [rate]) => total + rate * Number(counts[rate] || 0), 0)
    : estimateIncomeZakat(parse(income), parse(deductions), parse(nisab))

  return <div className="module-flow">
    <section className="module-panel zakat-checkout">
      <h2>Calculate zakat</h2>
      <Dropdown label="Institution" value={authority} options={institutions.map(item=>item.name)}
        onChange={value=>{if(value!==authority){setAuthority(value);setCounts({});setDeductions('');setNisab('')}}}/>
      <Dropdown label="Zakat type" value={type} options={['Income zakat','Zakat fitrah']} onChange={setType}/>
      {fitrah ? <>
        <p>Ramadan 1447H / {fitrahYear} rates. Enter the number of people in each rice category, including yourself if applicable.</p>
        {body.rates.map(([rate, label])=><label key={rate}>{label} · {money(rate)} per person
          <input inputMode="numeric" value={counts[rate] || ''} onChange={event=>setCounts({...counts,[rate]:event.target.value})} placeholder="0"/>
        </label>)}
        {!validCounts&&<p role="alert">Enter a whole number for each category.</p>}
      </> : <>
        <p>Use {authority}’s official calculator to confirm the nisab and total allowed deductions for your assessment year. Masrif applies 2.5% to eligible yearly income at or above that threshold.</p>
        <label>Total annual income (RM)<input inputMode="decimal" value={income} onChange={event=>setIncome(event.target.value)} placeholder="0.00"/></label>
        <label>Annual deductions allowed by {authority} (RM)<input inputMode="decimal" value={deductions} onChange={event=>setDeductions(event.target.value)} placeholder="0.00"/></label>
        <label>Official nisab for the assessment year (RM)<input inputMode="decimal" value={nisab} onChange={event=>setNisab(event.target.value)} placeholder="Enter the official threshold"/></label>
      </>}
      <ExternalLink href={fitrah ? body.fitrah : body.income}>
        {fitrah ? 'View official rates' : 'Open official income guidance'}
      </ExternalLink>
    </section>
    {(fitrah ? validCounts && estimate > 0 : validIncome) && <section className="module-panel zakat-checkout" aria-live="polite">
      <h3>Estimated zakat</h3>
      <strong>{money(estimate)}</strong>
      {estimate > 0 && <Button onClick={()=>onPay({
        institution:authority, type, amount:estimate, draft:{authority,type,income,deductions,nisab,counts},
      })}>Pay {money(estimate)}</Button>}
    </section>}
    <Button kind="secondary" onClick={onBack}>Back to Zakat</Button>
  </div>
}
