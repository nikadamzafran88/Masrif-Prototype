import { useState } from 'react'
import { money, parseAmount } from './demo'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'
import { monthlyStatement, statementMonths } from './accountStatement'

const chartColours = ['#007f7a', '#36aaa5', '#75c7be', '#286d9c', '#9bbfce']
const october = [
  ['Food & groceries',70000], ['Shopping',45000], ['Bills',39000],
  ['Transport',32000], ['Other',28000],
]
const sampleSpending = {
  '2026-06':248000, '2026-07':225000, '2026-08':260000, '2026-09':232000,
  '2026-10':october.reduce((sum,[,amount])=>sum+amount,0),
}
const monthFormat = new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'})
const shortMonthFormat = new Intl.DateTimeFormat('en-GB',{month:'short',timeZone:'UTC'})
const compactAmount = new Intl.NumberFormat('en-MY',{notation:'compact',maximumFractionDigits:1})
const dateForMonth = value => new Date(value+'-01T00:00:00Z')
const formatMonth = value => monthFormat.format(dateForMonth(value))
function monthsBefore(period,offset) {
  const date = dateForMonth(period)
  date.setUTCMonth(date.getUTCMonth()-offset)
  return date.toISOString().slice(0,7)
}

function spendingForMonth(records,period) {
  const {transactions} = monthlyStatement(records,period)
  const totals = new Map()
  const expenses = transactions.filter(row=>row.amount<0 && row.category!=='Transfers')
  for (const row of expenses) totals.set(row.category,(totals.get(row.category) || 0)-row.amount)
  if (transactions.length) return {
    total:expenses.reduce((sum,row)=>sum-row.amount,0),
    categories:[...totals].sort((a,b)=>b[1]-a[1]),
    count:expenses.length,
    source:'posted',
  }
  if (Object.hasOwn(sampleSpending,period)) return {
    total:sampleSpending[period],categories:period==='2026-10' ? october : [],source:'sample',
  }
  return {total:0,categories:[],source:'empty'}
}

function SpendingTrends({records,period,go}) {
  const [highlight,setHighlight] = useState(period)
  const timeline = Array.from({length:6},(_,index)=>{
    const month = monthsBefore(period,5-index)
    return {month,...spendingForMonth(records,month)}
  })
  const selected = timeline.find(row=>row.month===highlight)
  const priorMonth = monthsBefore(highlight,1)
  const prior = spendingForMonth(records,priorMonth)
  const comparable = selected.source!=='empty' && selected.source===prior.source
  const difference = selected.total-prior.total
  const highest = Math.max(1,...timeline.map(row=>row.total))
  return <div className="spending-trends">
    <div><h2>Spending trends</h2><p className="trends-subtitle">{formatMonth(timeline[0].month)} – {formatMonth(period)} · MYR</p></div>
    <ul className="spending-bars" aria-label="Six months of spending">
      {timeline.map(row=><li key={row.month}>
        <button type="button" className="spending-column" data-source={row.source}
          aria-pressed={row.month===highlight}
          aria-label={formatMonth(row.month)+': '+(row.source==='empty'?'No data':money(row.total)+(row.source==='sample'?' sample':''))}
          onClick={()=>setHighlight(row.month)}>
          <span className="spending-column-value" aria-hidden="true">{row.source==='empty'?'—':compactAmount.format(row.total/100)}</span>
          <span className="spending-column-bar" style={{'--bar-height':Math.max(3,row.total/highest*96)+'px'}} aria-hidden="true"/>
          <span className="spending-column-month" aria-hidden="true">{shortMonthFormat.format(dateForMonth(row.month))}</span>
        </button>
      </li>)}
    </ul>
    <section className="spending-comparison" aria-live="polite">
      <div className="row"><h3>{formatMonth(highlight)}</h3><small>{selected.source==='sample'?'Sample data':selected.source==='posted'?'Posted spending':'No data'}</small></div>
      <strong className="spending-trend-total">{selected.source==='empty'?'No spending data':money(selected.total)}</strong>
      {comparable&&<p>
        {difference===0?'Unchanged':money(Math.abs(difference))+(difference>0?' higher':' lower')} than {formatMonth(priorMonth)}.
        {' '}Previous total: {money(prior.total)}.
      </p>}
      {selected.source==='posted'&&<p>{selected.count} posted {selected.count===1?'expense':'expenses'}. The current month may still be in progress.</p>}
    </section>
    <p className="trends-footnote">Striped bars show historical samples. Transfers and unposted payments are excluded from posted spending.</p>
    <Button kind="secondary" onClick={()=>go('/account/spending')}>Back to spending</Button>
  </div>
}

export function SpendingView({records, onCategory, trends, go, month, setMonth}) {
  const months = [...new Set([...statementMonths(records),...Object.keys(sampleSpending)])].sort().reverse()
  const period = months.includes(month) ? month : months[0]
  const spending = spendingForMonth(records,period)
  let start = 0
  const segments = []
  for (const [index,[,amount]] of spending.categories.entries()) {
    const end = start + amount/spending.total*100
    segments.push(chartColours[index%chartColours.length]+' '+start+'% '+end+'%')
    start = end
  }
  return <section className="account-tab-content">
    <Dropdown label="Spending month" value={period} options={months.map(value=>({value,label:formatMonth(value)}))} onChange={setMonth}/>
    {trends ? <SpendingTrends key={period} records={records} period={period} go={go}/> : <>
      <div className="spending-donut" style={{background:segments.length?'conic-gradient('+segments.join(',')+')':undefined}}>
        <div><small>TOTAL SPENT</small><strong>{spending.source==='empty'?'—':money(spending.total)}</strong></div>
      </div>
      {spending.categories.length>0&&<div className="spending-categories">
        {spending.categories.map(([category,amount],index)=>{
          const row = <><span className="category-dot" style={{background:chartColours[index%chartColours.length]}}/>
            <span>{category}</span><strong>{money(amount)} · {(amount/spending.total*100).toFixed(1)}%</strong></>
          return spending.source==='sample'
            ? <div className="spending-sample-row" key={category}>{row}</div>
            : <button key={category} onClick={()=>onCategory(category,period)}>{row}</button>
        })}
      </div>}
      <p className="planning-note">{spending.source==='sample'
        ? spending.categories.length?'Historical sample breakdown.':'Historical sample total. Category details aren’t available.'
        : spending.count?'Posted demo spending. Transfers and pending payments are excluded.':'No posted spending for this month.'}</p>
      <Button kind="secondary" onClick={()=>go('/account/spending/trends')}>View spending trends</Button>
    </>}
  </section>
}
const seedGoal = {id:'laptop',name:'Laptop savings goal',target:300000,saved:120000,date:'2027-05-01'}
const seedReminders = [
  {id:'internet',name:'Internet bill',date:'2026-11-20',amount:8900,repeat:'Monthly'},
  {id:'tuition',name:'Tuition instalment',date:'2026-11-25',amount:35000,repeat:'Monthly'},
]
const budgetCategories = [['Food & groceries',28],['Transport',14],['Shopping',20],['Bills',18],['Other',20]]
const budgetAlerts = [
  {value:'',label:'No alert'},
  ...['50','80','100'].map(value=>({value,label:'Notify at '+value+'%'})),
]
const planningDate = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
const formatDate = value => planningDate.format(new Date(value+'T00:00:00Z'))

function readPlan(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function writePlan(key, value) {
  localStorage.setItem(key,JSON.stringify(value))
}
function expenseCategory(label) {
  if (label==='Food & drink') return 'Food & groceries'
  return budgetCategories.some(([name])=>name===label) ? label : 'Other'
}

export function PlanningView({records}) {
  const periods = statementMonths(records)
  const [period,setPeriod] = useState(periods[0])
  const [view,setView] = useState('overview')
  const [budgets,setBudgets] = useState(()=>readPlan('masrif-planning-budgets',{}))
  const [defaultBudget] = useState(()=>parseAmount(localStorage.getItem('masrif-plan') || '') || 250000)
  const [goals,setGoals] = useState(()=>readPlan('masrif-planning-goals',[seedGoal]))
  const [reminders,setReminders] = useState(()=>readPlan('masrif-planning-reminders',seedReminders))
  const [selected,setSelected] = useState(seedGoal)
  const [draft,setDraft] = useState({})
  const [feedback,setFeedback] = useState(null)
  const [today] = useState(()=>new Date())
  const month = monthlyStatement(records,period)
  const budget = budgets[period]?.amount ?? defaultBudget
  const expenses = month.transactions.filter(row=>row.amount<0&&row.category!=='Transfers')
  const spent = expenses.reduce((sum,row)=>sum-row.amount,0)
  const remaining = budget-spent
  const upcoming = reminders.reduce((sum,row)=>sum+row.amount,0)
  const amount = parseAmount(draft.amount || '')
  const savedValue = draft.saved?.trim() || ''
  const validSaved = !savedValue || parseAmount(savedValue)>0 || /^0+(\.0{1,2})?$/.test(savedValue)
  const backToPlanning = ()=>setView('overview')
  const update = (key,value)=>setDraft(previous=>({...previous,[key]:value}))

  function showSaved(title,rows,review) {
    setFeedback({title,rows,review})
    setView('saved')
  }
  function editBudget(value=period) {
    setDraft({period:value,amount:((budgets[value]?.amount ?? defaultBudget)/100).toFixed(2),alert:budgets[value]?.alert ?? ''})
    setView('budget-edit')
  }
  function openForm(target) {
    setDraft({name:'',amount:'',date:'',saved:'',repeat:'Does not repeat'})
    setView(target)
  }
  function saveBudget(event) {
    event.preventDefault()
    if (!amount || !draft.period) return
    const next = {...budgets,[draft.period]:{amount,alert:draft.alert}}
    writePlan('masrif-planning-budgets',next)
    setBudgets(next)
    setPeriod(draft.period)
    showSaved('Budget saved',[
      ['Budget period',monthlyStatement(records,draft.period).label],
      ['Monthly budget',money(amount)],
      ['Budget alert',draft.alert ? 'In-app alert at '+draft.alert+'%' : 'Off'],
      ['Category totals',money(amount)],
    ],'budget')
  }
  function saveGoal(event) {
    event.preventDefault()
    if (!draft.name.trim() || !amount || !draft.date || !validSaved) return
    const goal = {id:crypto.randomUUID(),name:draft.name.trim(),target:amount,saved:parseAmount(savedValue),date:draft.date}
    const next = [...goals,goal]
    writePlan('masrif-planning-goals',next)
    setGoals(next)
    setSelected(goal)
    showSaved('Savings goal created',[
      ['Goal',goal.name],['Target',money(amount)],['Target date',formatDate(goal.date)],['Tracked savings',money(goal.saved)],
    ],'goal')
  }
  function saveReminder(event) {
    event.preventDefault()
    if (!draft.name.trim() || !amount || !draft.date) return
    const reminder = {id:crypto.randomUUID(),name:draft.name.trim(),amount,date:draft.date,repeat:draft.repeat}
    const next = [...reminders,reminder].sort((a,b)=>a.date.localeCompare(b.date))
    writePlan('masrif-planning-reminders',next)
    setReminders(next)
    showSaved('Reminder saved',[
      ['Reminder',reminder.name],['Amount',money(amount)],['Due date',formatDate(reminder.date)],['Repeat',reminder.repeat],
    ],'reminders')
  }

  if (view==='saved') return <section className="account-tab-content">
    <div className="module-panel" role="status"><h2>{feedback.title}</h2>
      <dl className="details">{feedback.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </div>
    <p className="planning-note">Saved in this prototype. No money moved.</p>
    <Button onClick={backToPlanning}>Back to planning</Button>
    <Button kind="secondary" onClick={()=>setView(feedback.review)}>Review details</Button>
  </section>

  if (view==='budget') {
    return <section className="account-tab-content">
      <h2>Monthly budget</h2>
      <div className="planning-budget">
        <strong>{money(Math.abs(remaining))} {remaining>=0?'remaining':'over budget'}</strong>
        <span>{money(spent)} of {money(budget)} · {month.label}</span>
        <progress aria-label="Budget used" max={budget} value={spent}/>
      </div>
      {budgets[period]?.alert&&spent/budget*100>=Number(budgets[period].alert)&&<p className="notice" role="status">You’ve reached your {budgets[period].alert}% budget alert.</p>}
      {budgetCategories.map(([name,share],index)=>{
        const previousShare = budgetCategories.slice(0,index).reduce((total,[,percentage])=>total+percentage,0)
        const limit = Math.floor(budget*(previousShare+share)/100) - Math.floor(budget*previousShare/100)
        const used = expenses.filter(row=>expenseCategory(row.category)===name).reduce((sum,row)=>sum-row.amount,0)
        return <div className="module-panel" key={name}>
          <div className="row"><strong>{name}</strong><small>{money(Math.abs(limit-used))} {used>limit?'over':'left'}</small></div>
          <small>{money(used)} spent of {money(limit)}</small>
          {limit>0&&<progress aria-label={name+' budget used'} max={limit} value={used}/>}
        </div>
      })}
      <Button onClick={()=>editBudget()}>Edit monthly budget</Button>
      <Button kind="secondary" onClick={backToPlanning}>Back to planning</Button>
    </section>
  }

  if (view==='budget-edit') return <form className="account-tab-content" onSubmit={saveBudget}>
    <h2>Set monthly budget</h2>
    <label>Monthly budget (MYR)<input inputMode="decimal" value={draft.amount} onChange={event=>update('amount',event.target.value)}/></label>
    <Dropdown label="Budget period" value={draft.period} options={periods.map(value=>({value,label:monthlyStatement(records,value).label}))} onChange={editBudget}/>
    <Dropdown label="Optional budget alert" value={draft.alert} options={budgetAlerts} onChange={value=>update('alert',value)}/>
    <p className="planning-note">The category targets are split from your total. This budget does not restrict payments.</p>
    <Button type="submit" disabled={!amount}>Save budget</Button>
    <Button type="button" kind="secondary" onClick={()=>setView('budget')}>Cancel</Button>
  </form>

  if (view==='goal-create'||view==='reminder-create') {
    const creatingGoal = view==='goal-create'
    return <form className="account-tab-content" onSubmit={creatingGoal ? saveGoal : saveReminder}>
      <h2>{creatingGoal?'Create savings goal':'Add reminder'}</h2>
      <label>{creatingGoal?'Goal name':'Reminder name'}<input required maxLength={50} value={draft.name} onChange={event=>update('name',event.target.value)}/></label>
      <label>{creatingGoal?'Target amount (MYR)':'Amount (MYR)'}<input required inputMode="decimal" value={draft.amount} onChange={event=>update('amount',event.target.value)}/></label>
      <label>{creatingGoal?'Target date':'Due date'}<input required type="date" value={draft.date} onChange={event=>update('date',event.target.value)}/></label>
      {creatingGoal
        ? <label>Already saved (MYR)<input inputMode="decimal" value={draft.saved} onChange={event=>update('saved',event.target.value)}/></label>
        : <Dropdown label="Repeat" value={draft.repeat} options={['Does not repeat','Weekly','Monthly','Yearly']} onChange={value=>update('repeat',value)}/>}
      <p className="planning-note">{creatingGoal?'Tracking only. No money is reserved or transferred.':'Reminder only. No payment will be scheduled.'}</p>
      {creatingGoal&&!validSaved&&<p className="notice" role="status">Enter a valid amount already saved.</p>}
      <Button type="submit" disabled={!draft.name.trim()||!amount||!draft.date||(creatingGoal&&!validSaved)}>{creatingGoal?'Create goal':'Save reminder'}</Button>
      <Button type="button" kind="secondary" onClick={creatingGoal ? backToPlanning : ()=>setView('reminders')}>Cancel</Button>
    </form>
  }

  if (view==='goal') {
    const left = Math.max(0,selected.target-selected.saved)
    const date = new Date(selected.date+'T00:00:00Z')
    const months = Math.max(1,(date.getUTCFullYear()-today.getUTCFullYear())*12+date.getUTCMonth()-today.getUTCMonth())
    return <section className="account-tab-content">
      <div className="planning-budget"><h2>{selected.name}</h2><strong>{money(selected.saved)} of {money(selected.target)}</strong>
        <progress aria-label="Tracked savings" max={selected.target} value={selected.saved}/>
        <small>{money(left)} remaining · Target {formatDate(selected.date)}</small>
        {left>0&&<small>Suggested contribution: {money(Math.ceil(left/months))} per month for {months} {months===1?'month':'months'}</small>}
      </div>
      <Button onClick={()=>openForm('goal-create')}>Create another goal</Button>
      <Button kind="secondary" onClick={backToPlanning}>Back to planning</Button>
    </section>
  }

  if (view==='reminders') return <section className="account-tab-content">
    <h2>Upcoming commitments</h2>
    <div className="planning-budget"><strong>{money(upcoming)} upcoming</strong><small>{reminders.length} manual reminders</small></div>
    {reminders.map(({id,name,date,amount:cost,repeat})=><div className="planning-row" key={id}>
      <div><strong>{name}</strong><small>{formatDate(date)} · {repeat}</small></div><strong>{money(cost)}</strong>
    </div>)}
    <Button onClick={()=>openForm('reminder-create')}>Add a reminder</Button>
    <Button kind="secondary" onClick={backToPlanning}>Back to planning</Button>
  </section>

  return <section className="account-tab-content">
    <button className="planning-budget" onClick={()=>setView('budget')}>
      <small>{month.label.toUpperCase()} BUDGET</small>
      <strong>{money(Math.abs(remaining))} {remaining>=0?'remaining':'over budget'}</strong>
      <span>{money(spent)} spent of {money(budget)}</span>
      <progress aria-label="Budget used" max={budget} value={spent}/>
      <small>Budget remaining is separate from your bank balance.</small>
    </button>
    {goals.map(goal=><button className="planning-row" key={goal.id} onClick={()=>{setSelected(goal);setView('goal')}}>
      <div><strong>{goal.name}</strong><small>{money(goal.saved)} tracked of {money(goal.target)}</small></div><strong>{Math.round(goal.saved/goal.target*100)}%</strong>
    </button>)}
    <button className="planning-row" onClick={()=>setView('reminders')}>
      <div><strong>Upcoming commitments</strong><small>{reminders.length} reminders · {money(upcoming)} total</small></div><Icon name="arrow" size={18}/>
    </button>
    <Button onClick={()=>openForm('goal-create')}>Create savings goal</Button>
  </section>
}
