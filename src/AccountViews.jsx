import { useId, useLayoutEffect, useRef, useState } from 'react'
import { money, parseAmount } from './demo'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'
import { monthlyStatement, statementMonths } from './accountStatement'
import { buildCashFlow, buildCashFlowSummary, insightPeriods, insightRangeLabel } from './cashFlowInsights'

const insightModes = [['income','Income'],['expenses','Expenses']]
const comparisonModes = [...insightModes,['comparison','Comparison']]
const donutColours = ['var(--chart-primary)','var(--chart-mint)','var(--chart-sky)','var(--chart-gold)','var(--chart-violet)']

function InsightDuration({period,setPeriod,start,end}) {
  const sheet=useRef(null)
  const trigger=useRef(null)
  const label=insightPeriods.find(([value])=>value===period)?.[1]
  return <div className="insight-duration">
    <button ref={trigger} type="button" className="insight-duration-trigger" aria-haspopup="dialog"
      aria-label={'Select duration, '+label} onClick={()=>{
        sheet.current.showModal()
        sheet.current.querySelector('[aria-pressed="true"]')?.focus()
      }}>
      {label}<Icon name="chevron" size={15}/>
    </button>
    <small>{insightRangeLabel(start,end)}</small>
    <dialog ref={sheet} className="sheet insight-duration-sheet" aria-labelledby="insight-duration-title"
      onClose={()=>trigger.current?.focus()} onClick={event=>{if(event.target===sheet.current)sheet.current.close()}}>
      <div className="sheet-body stack">
        <div className="handle"/>
        <header className="row">
          <h2 id="insight-duration-title">Select duration</h2>
          <button type="button" className="icon-button" aria-label="Close duration selector" onClick={()=>sheet.current.close()}><Icon name="close" size={20}/></button>
        </header>
        <div className="insight-duration-options" role="group" aria-label="Duration options">
          {insightPeriods.map(([value,title])=><button type="button" key={value} aria-pressed={period===value} onClick={()=>{
            setPeriod(value)
            sheet.current.close()
          }}>
            <span aria-hidden="true"/>{title}
          </button>)}
        </div>
      </div>
    </dialog>
  </div>
}

function CashFlowDonut({total,categories,mode}) {
  const isIncome=mode==='income'
  const [selected,setSelected]=useState(-1)
  const parts=categories.map(([label,amount],index)=>({label,amount,colour:donutColours[index]}))
  const remainder=total-parts.reduce((sum,part)=>sum+part.amount,0)
  if(remainder>0) parts.push({label:'Other categories',amount:remainder,colour:'var(--muted)'})
  const selection=parts[selected]
  let covered=0
  const segments=[]
  const ends=[]
  for(const {amount,colour} of parts) {
    const from=covered/total*100
    covered+=amount
    const to=covered/total*100
    const separator=Math.min(.45,(to-from)*.12)
    ends.push(covered/total)
    segments.push(colour+' '+from+'% '+(to-separator)+'%', 'var(--soft) '+(to-separator)+'% '+to+'%')
  }
  const donutBackground=segments.length>1?'conic-gradient('+segments.join(',')+')':parts[0]?.colour||'var(--line)'
  const totalLabel=isIncome?'Total income':'Total expenses'
  const label=selection?.label||totalLabel
  const amount=selection?.amount??total
  const share=selection?Math.round(selection.amount/total*100)+'% of '+(isIncome?'income':'expenses'):''

  function selectSegment(event) {
    if(event.detail===0) {
      setSelected(previous=>previous+1<parts.length?previous+1:-1)
      return
    }
    const bounds=event.currentTarget.getBoundingClientRect()
    const x=event.clientX-bounds.left-bounds.width/2
    const y=event.clientY-bounds.top-bounds.height/2
    const radius=Math.hypot(x,y)/(bounds.width/2)
    if(radius<.75) {setSelected(-1);return}
    if(radius>1) return
    const angle=(Math.atan2(x,-y)/(2*Math.PI)+1)%1
    const index=ends.findIndex(end=>angle<end)
    setSelected(previous=>previous===index?-1:index)
  }

  return <button type="button" className="cashflow-donut" style={{background:donutBackground}} disabled={!parts.length}
    aria-label={label+', '+money(amount)+(share?', '+share:'')+(parts.length?'. Activate to cycle through categories.':'')}
    onClick={selectSegment}>
    <span className="cashflow-donut-label" aria-live="polite">
      {selection?<span className="cashflow-category-key" style={{background:selection.colour}} aria-hidden="true"/>:<Icon name={isIncome?'in':'out'} size={22}/>}
      <small>{label}</small>
      <strong>{money(amount)}</strong>
      {share&&<small>{share}</small>}
    </span>
  </button>
}

function CashFlowCarousel({mode,setMode,children,modes=insightModes}) {
  const scroller=useRef(null)
  const initialIndex=useRef(modes.findIndex(([value])=>value===mode))
  const drag=useRef(null)
  useLayoutEffect(()=>{
    const element=scroller.current
    if(initialIndex.current>0) element.scrollLeft=initialIndex.current*element.clientWidth
  },[])

  function scrollToSlide(element,index) {
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({left:Math.max(0,Math.min(modes.length-1,index))*element.clientWidth,behavior:reducedMotion?'instant':'smooth'})
  }
  function stopDrag(event) {
    if(!drag.current) return
    const {position,startX,moved}=drag.current
    drag.current=null
    if(!moved) return
    const element=event.currentTarget
    element.classList.remove('is-dragging')
    const delta=event.clientX-startX
    const target=event.type==='pointercancel'||Math.abs(delta)<45?position:position+(delta<0?1:-1)
    scrollToSlide(element,target)
  }

  return <>
    <div ref={scroller} className="cashflow-carousel" tabIndex={0} role="region" aria-label={modes.map(([,label])=>label).join(', ')+'. Swipe or use left and right arrow keys'}
      onScroll={event=>{
        const element=event.currentTarget
        if(element.clientWidth) setMode(modes[Math.min(modes.length-1,Math.max(0,Math.round(element.scrollLeft/element.clientWidth)))][0])
      }}
      onKeyDown={event=>{
        if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return
        event.preventDefault()
        const element=event.currentTarget
        scrollToSlide(element,Math.round(element.scrollLeft/element.clientWidth)+(event.key==='ArrowRight'?1:-1))
      }}
      onPointerDown={event=>{
        if(event.pointerType!=='mouse'||event.button!==0) return
        const element=event.currentTarget
        drag.current={startX:event.clientX,left:element.scrollLeft,position:Math.round(element.scrollLeft/element.clientWidth),moved:false}
      }}
      onPointerMove={event=>{
        const current=drag.current
        if(!current) return
        const element=event.currentTarget
        const movement=current.startX-event.clientX
        if(!current.moved) {
          if(Math.abs(movement)<6) return
          current.moved=true
          element.setPointerCapture(event.pointerId)
          element.classList.add('is-dragging')
        }
        element.scrollLeft=current.left+movement
      }}
      onPointerLeave={()=>{if(!drag.current?.moved) drag.current=null}}
      onPointerUp={stopDrag} onPointerCancel={stopDrag}>
      {modes.map(([value,label])=><section className="cashflow-slide" key={value} data-mode={value} aria-label={label} inert={mode!==value}>
        {children(value,label)}
      </section>)}
    </div>
    <div className="cashflow-page-dots" aria-hidden="true">{modes.map(([value])=><span key={value} data-active={value===mode}/>)}</div>
  </>
}

export function InsightsView({records,period,setPeriod,mode,setMode,onCategory,onSummary}) {
  const {start,end,income,expenses} = buildCashFlow(records,period)
  const isIncome=mode==='income'
  const comparing=mode==='comparison'
  const {categories} = isIncome?income:expenses

  return <section className="account-tab-content cashflow-insights" data-mode={mode}>
    <InsightDuration period={period} setPeriod={setPeriod} start={start} end={end}/>
    <section className="module-panel cashflow-summary" aria-label="Income and expense breakdown">
      <CashFlowCarousel mode={mode} setMode={setMode} modes={comparisonModes}>
        {(value,label)=><><h2>{label}</h2>{value==='comparison'
          ?<CashFlowComparison key={period} records={records} period={period} end={end}/>
          :<CashFlowDonut key={period} {...(value==='income'?income:expenses)} mode={value}/>}</>}
      </CashFlowCarousel>
      {!comparing&&<button type="button" className="cashflow-details-link" onClick={onSummary}>View more details <Icon name="chevron" size={16}/></button>}
    </section>
    {!comparing&&<section className="stack cashflow-categories" aria-labelledby="cashflow-categories-title">
      <h2 id="cashflow-categories-title">{isIncome?'Top income sources':'Top expense categories'}</h2>
      {categories.length?categories.map(([category,amount],index)=><button type="button" className="module-row cashflow-category" key={category}
        onClick={()=>onCategory(category,start,end,isIncome)}>
        <span className="cashflow-category-copy"><span className="cashflow-category-key" style={{background:donutColours[index]}} aria-hidden="true"/><strong>{category}</strong><strong>{money(amount)}</strong></span>
        <Icon name="chevron" size={16}/>
      </button>):<p className="notice">No posted {isIncome?'income':'expenses'} in this period.</p>}
      <p className="planning-note">{isIncome?'Income includes money received and top-ups.':'Expenses exclude outgoing transfers.'}</p>
    </section>}
  </section>
}

const compactAmount = new Intl.NumberFormat('en-MY',{notation:'compact',maximumFractionDigits:1})
const signedMoney = amount => (amount<0?'−':amount>0?'+':'')+money(Math.abs(amount))

function CashFlowComparison({records,period,end}) {
  const [selected,setSelected]=useState(null)
  const income=buildCashFlowSummary(records,period,'income',0,end)
  const expenses=buildCashFlowSummary(records,period,'expenses',0,end)
  const groups=[]
  income.bars.forEach((bar,index)=>{
    const groupIndex=period==='month'?Math.floor(index/7):index
    const group=groups[groupIndex]??={income:0,expenses:0,label:bar.label,description:bar.accessibleLabel}
    group.income+=bar.amount
    group.expenses+=expenses.bars[index].amount
    if(period==='month') group.description=group.label+'–'+bar.label+' '+income.label
  })
  const max=Math.max(...groups.map(group=>Math.max(group.income,group.expenses)))
  const step=max?10**Math.floor(Math.log10(max)):100
  const scale=Math.ceil(max/step)*step||step
  const active=groups[selected]
  const values=active??{income:income.total,expenses:expenses.total}
  const plotWidth=360
  const plotHeight=108
  const x=index=>(index+.5)*plotWidth/groups.length
  const y=amount=>plotHeight-(amount/scale)*(plotHeight-4)

  return <div className="cashflow-comparison">
    <p className="cashflow-comparison-net"><span>Net cash flow</span><strong>{signedMoney(income.total-expenses.total)}</strong></p>
    <div className="cashflow-comparison-chart" aria-label="Income and expenses on a shared RM scale" role="group">
      <div className="cashflow-comparison-scale" aria-hidden="true"><span>RM {compactAmount.format(scale/100)}</span><span>RM 0</span></div>
      <div className="cashflow-comparison-plot">
        <svg viewBox="0 0 360 108" preserveAspectRatio="none" aria-hidden="true">
          {[0,27,54,81,108].map(level=><line key={level} x1="0" x2={plotWidth} y1={level} y2={level} className="cashflow-comparison-gridline"/>)}
          {insightModes.map(([series])=>{
            const coordinates=groups.map((group,index)=>x(index)+','+y(group[series])).join(' ')
            return <g key={series} className="cashflow-comparison-series" data-series={series}>
              <polygon points={x(0)+','+plotHeight+' '+coordinates+' '+x(groups.length-1)+','+plotHeight}/>
              <polyline points={coordinates}/>
            </g>
          })}
          {active&&<line x1={x(selected)} x2={x(selected)} y1="0" y2={plotHeight} className="cashflow-comparison-guide"/>}
          {active&&insightModes.map(([series])=><circle key={series} data-series={series} className="cashflow-comparison-point" cx={x(selected)} cy={y(active[series])} r="3"/>)}
        </svg>
        <div className="cashflow-comparison-groups" style={{gridTemplateColumns:'repeat('+groups.length+',minmax(0,1fr))'}}>
        {groups.map((group,index)=><button type="button" key={group.description} aria-pressed={selected===index}
          aria-label={group.description+', Income '+money(group.income)+', Expenses '+money(group.expenses)}
          onClick={()=>setSelected(selected===index?null:index)}>
          <span aria-hidden="true"/>
          <span aria-hidden="true">{period==='year'?group.label.slice(0,1):group.label}</span>
        </button>)}
        </div>
      </div>
    </div>
    <div className="cashflow-comparison-values" aria-live="polite">
      <span><i/>Income <strong>{money(values.income)}</strong></span>
      <span><i/>Expenses <strong>{money(values.expenses)}</strong></span>
      {active&&<small>{active.description} · Net {signedMoney(active.income-active.expenses)}</small>}
    </div>
    <p className="planning-note">Expenses exclude outgoing transfers.</p>
  </div>
}

function SummaryChart({bars,period,modeLabel,onChartDate}) {
  const [selected,setSelected]=useState(null)
  const gradient=useId()
  const annual=period==='year'
  const max=Math.max(1,...bars.map(({amount})=>amount))
  const points=bars.map(({amount},index)=>({
    x:annual?(index+.5)*360/bars.length:8+index*344/(bars.length-1),
    y:176-amount/max*152,
  }))
  const line=points.map(({x,y},index)=>{
    if(index===0) return 'M '+x+' '+y
    const previous=points[index-1]
    const mid=(previous.x+x)/2
    return 'C '+mid+' '+previous.y+' '+mid+' '+y+' '+x+' '+y
  }).join(' ')
  const point=points[selected]
  const active=bars[selected]
  function selectPoint(index) {
    setSelected(index)
    onChartDate(bars[index]?.date??null)
  }

  return <div className="insight-detail-chart" role="group" aria-label={modeLabel+' by '+(annual?'month':'day')}>
    <div className="insight-detail-plot">
      {active&&<div className="insight-detail-tooltip" role="status" style={{left:'clamp(58px,'+(point.x/3.6)+'%,calc(100% - 58px))'}}>
        <strong>{money(active.amount)}</strong><small>{active.accessibleLabel}</small>
      </div>}
      <svg viewBox="0 0 360 178" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={gradient} x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".26"/><stop offset="100%" stopColor="currentColor" stopOpacity=".04"/></linearGradient></defs>
        {annual?points.map(({x,y},index)=><rect key={index} x={x-4} y={Math.min(y,174)} width="8" height={Math.max(2,176-y)} rx="4" fill="currentColor" opacity={bars[index].amount?(selected===null||selected===index?1:.82):.3}/>):<>
          <path d={line+' L 352 176 L 8 176 Z'} fill={'url(#'+gradient+')'}/>
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        </>}
        {point&&<line x1={point.x} x2={point.x} y1="0" y2={point.y} stroke="currentColor" strokeOpacity=".55" strokeDasharray="4 4"/>}
        {point&&!annual&&<circle cx={point.x} cy={point.y} r="4" fill="currentColor"/>}
      </svg>
      <div className="insight-detail-hitbox" style={{gridTemplateColumns:'repeat('+bars.length+',minmax(0,1fr))'}}
        onKeyDown={event=>{
          const direction=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0
          if(!direction) return
          event.preventDefault()
          event.stopPropagation()
          const index=Math.max(0,Math.min(bars.length-1,Number(event.target.dataset.index)+direction))
          selectPoint(index)
          event.currentTarget.children[index].focus()
        }}>
        {bars.map(({accessibleLabel,amount},index)=><button key={accessibleLabel} type="button" data-index={index}
          tabIndex={index===(selected??0)?0:-1} aria-pressed={selected===index} aria-label={accessibleLabel+', '+money(amount)}
          onClick={()=>selectPoint(selected===index?null:index)}/>)}
      </div>
    </div>
    <div className="insight-detail-axis" aria-hidden="true">
      {bars.map(({label},index)=>(period!=='month'||index===0||index===bars.length-1||(index%6===0&&index<bars.length-3))&&
        <span key={index} data-selected={selected===index} style={{left:(points[index].x/3.6)+'%'}}>{annual?label.slice(0,1):label}</span>)}
    </div>
  </div>
}

export function CashFlowSummaryView({records,period,setPeriod,mode,setMode,offset,setOffset,onCategory,onChartDate}) {
  const summaries={
    income:buildCashFlowSummary(records,period,'income',offset),
    expenses:buildCashFlowSummary(records,period,'expenses',offset),
  }
  const {start,end,label,total,categories}=summaries[mode]
  const isIncome=mode==='income'

  return <div className="cashflow-insights insight-detail" data-mode={mode}>
    <section className="module-panel insight-detail-panel" aria-label="Summary breakdown">
      <div className="insight-detail-segments" role="group" aria-label="Summary duration">
        {insightPeriods.map(([value,title])=><button type="button" key={value} aria-pressed={period===value} onClick={()=>setPeriod(value,end)}>{title.replace('This ','').replace(/^./,letter=>letter.toUpperCase())}</button>)}
      </div>
      <div className="insight-detail-dates">
        <button type="button" aria-label={'Previous '+period} onClick={()=>setOffset(offset-1)}><Icon name="back" size={17}/></button>
        <span aria-live="polite">{label}</span>
        <button type="button" aria-label={'Next '+period} disabled={offset===0} onClick={()=>setOffset(offset+1)}><Icon name="chevron" size={17}/></button>
      </div>
      {offset<0&&<button type="button" className="insight-detail-today" onClick={()=>setOffset(0)}>Back to today</button>}
      <CashFlowCarousel mode={mode} setMode={setMode}>
        {(value,modeLabel)=><>
          <div className="insight-detail-total"><span>{modeLabel}</span><strong>{money(summaries[value].total)}</strong></div>
          <SummaryChart key={[period,value,start].join(':')} bars={summaries[value].bars} period={period} modeLabel={modeLabel} onChartDate={date=>onChartDate(date&&date>end?end:date)}/>
        </>}
      </CashFlowCarousel>
    </section>
    <section aria-labelledby="insight-detail-categories">
      <h2 id="insight-detail-categories">Categories</h2>
      {categories.length?<ul className="module-panel insight-detail-categories">
        {categories.map(([category,amount,count],index)=><li key={category}><button type="button" onClick={()=>onCategory(category,start,end,isIncome)}>
          <span className="insight-detail-category-icon" style={{'--category-color':donutColours[index%donutColours.length]}}><Icon name={isIncome?'in':'out'} size={18}/></span>
          <span><strong>{category}</strong><small>{count} {count===1?'transaction':'transactions'}</small></span>
          <span className="insight-detail-category-amount"><strong>{isIncome?'':'−'}{money(amount)}</strong><small>{Math.round(amount/total*100)}%</small></span>
        </button></li>)}
      </ul>:<p className="notice">No posted {isIncome?'income':'expenses'} in this period.</p>}
    </section>
  </div>
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
