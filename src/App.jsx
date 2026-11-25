import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { balanceOf, money, confirmedTransferRecipient, matchingPendingTransfer, resolvePending, seed, settle, today } from './demo'
import { Button, Icon, Tile } from './ui'
import { Transfer } from './Transfer'
import { Extras } from './Extras'
import { Receipt } from './Receipt'
import { StatementView } from './StatementView'
import { AddMoney } from './AddMoney'
import { Zakat } from './Zakat'
import { AddCard, CardViews } from './CardViews'
import { AccessFlow, RegistrationProgress } from './AccessFlow'
import { attemptsKey, demoContactKey, lockKey, nameInitials, recoveryNoticeKey, signedInKey, signedOutKey, signupDraftKey } from './demoAuth'
import { Inbox, ProfileMenu, ProfilePage } from './ProfileViews'
import { CashFlowSummaryView, InsightsView, PlanningView } from './AccountViews'
import { monthlyStatement, postedEntries } from './accountStatement'
import { insightOffsetForDate, insightRangeLabel, isInsightDate, isSpending } from './cashFlowInsights'
import { transferHeading, extraTitles, profileLinks, profileDetailTitles, accessTitles } from './routes'
import { isEmbed, seedDraft } from './embed'
import { StatusBar } from './StatusBar'
import { readDemo } from './demoStorage'
import './App.css'

const tabs = [['Home','home'],['Account','account'],['Pay','scan'],['Features','grid','modules'],['Profile','user']]
const accountServices = [
  {label:'Account documents', actions:[
    ['Transaction history','/account/transactions','history'],
    ['View statement','/account/statement','statement'],
    ['View receipts','/account/receipts','receipt'],
  ]},
  {label:'Account management', actions:[
    ['Planning','/account/planning','calculator'],
    ['Card','/account/card','card'],
    ['Profile','/profile','user'],
  ]},
]
const navIndex = slug => tabs.findIndex(([label,,target=label.toLowerCase()])=>target===slug)
const slideBetween = (from, to) => to > from ? 'slide-left' : 'slide-right'
const revealGroup = '.stack, .module-flow, .module-grid, .tiles, .two'
function revealTargets(container) {
  return [...container.children].flatMap(child=>{
    if (child.matches('dialog, [hidden]')) return []
    return child.matches(revealGroup) ? revealTargets(child) : [child]
  })
}
const accountTabs = [
  ['Overview', '/account'],
  ['Insights', '/account/insights'],
]
const accountTabIndex = path => accountTabs.findIndex(([, target]) =>
  target === path || (target==='/account/insights'&&(
    (path.startsWith('/account/insights/')&&path!==insightSummaryPath)||path==='/account/spending'||path==='/account/spending/trends'
  ))
)
const insightSummaryPath = '/account/insights/summary'
const titles = {'/account':'Account','/account/transactions':'Transactions','/pay':'Pay & receive','/modules':'Features','/profile':'Profile','/inbox':'Inbox','/inbox/welcome':'Welcome to SKEB-Pro','/account/add':'Add money','/account/statement':'Account statement','/account/receipts':'Receipts','/account/card':'Card','/account/card/details':'Card details','/profile/cards/details':'Card details','/profile/cards/add':'Add card',...extraTitles,...Object.fromEntries(profileLinks.map(([label,slug])=>['/profile/'+slug,label])),...Object.fromEntries(Object.entries(profileDetailTitles).map(([slug,label])=>['/profile/'+slug,label]))}
const bankKey = 'masrif-records'
const currentPath = () => location.pathname
function canUseApp() {
  return sessionStorage.getItem(signedInKey)==='true'&&sessionStorage.getItem(signedOutKey)!=='true'&&sessionStorage.getItem(lockKey)!=='true'
}
function accessRedirect(target,preview) {
  if (preview || (target!=='/login/welcome'&&Object.hasOwn(accessTitles,target))) return target
  if (sessionStorage.getItem(lockKey)==='true') return '/login/locked'
  return canUseApp()?target:'/login'
}
function insightsScope(search) {
  const params = new URLSearchParams(search)
  const month = params.get('month')
  const category = params.get('category')
  const start = params.get('start')
  const end = params.get('end')
  const income = params.get('direction')==='in'
  if (!category) return null
  if (isInsightDate(start)&&isInsightDate(end)&&start<=end) return {start,end,category,income}
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month||'') ? {month,category,income} : null
}
function readRecords() {
  try { return JSON.parse(localStorage.getItem(bankKey)) || seed } catch { return seed }
}
function RecordRows({items, open}) {
  return items.length ? <div className="records">{items.map(item=><button className="record" key={item.id} onClick={()=>open(item)}>
    <span className={'tile-icon '+(item.amount>0?'incoming':'outgoing')}><Icon name={item.amount>0?'in':'out'}/></span>
    <span><strong>{item.name}</strong><small>{item.date} · {item.status || item.category}</small></span>
    <strong className="record-amount">{item.amount>0?'+':'−'}{money(Math.abs(item.amount))}</strong>
  </button>)}</div> : <p className="notice">No matching transactions.</p>
}

export default function App({preview=false}) {
  const isPreview=preview||isEmbed
  const [path,setPath] = useState(currentPath)
  const [navigationMotion,setNavigationMotion] = useState()
  const [records,setRecords] = useState(readRecords)
  const [draft,setDraft] = useState(()=>isEmbed||location.search.includes('seed=1')?seedDraft(path):{})
  const [hidden,setHidden] = useState(true)
  const [highlight,setHighlight] = useState(()=>sessionStorage.getItem('masrif-highlight')!=='hidden')
  const [appearance,setAppearance] = useState(()=>localStorage.getItem('masrif-appearance')||'Light')
  const [systemDark,setSystemDark] = useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches)
  const dark = appearance==='Dark'||(appearance==='System'&&systemDark)
  useEffect(()=>{
    const media=window.matchMedia('(prefers-color-scheme: dark)')
    const sync=event=>setSystemDark(event.matches)
    media.addEventListener('change',sync)
    return ()=>media.removeEventListener('change',sync)
  },[])
  function applyAppearance(value) {
    localStorage.setItem('masrif-appearance',value)
    setAppearance(value)
  }
  const [query,setQuery] = useState('')
  const [filter,setFilter] = useState('All')
  const [insightPeriod,setInsightPeriod] = useState('month')
  const [summaryPeriod,setSummaryPeriod] = useState('month')
  const [summaryMode,setSummaryMode] = useState('income')
  const [summaryOffset,setSummaryOffset] = useState(0)
  const [summaryAnchor,setSummaryAnchor] = useState(null)
  const [insightMode,setInsightMode] = useState(()=>path.startsWith('/account/spending')?'expenses':'income')
  const [transactionScope,setTransactionScope] = useState(()=>insightsScope(location.search))
  const tabIndex = accountTabIndex(path)
  const accountTab = accountTabs[tabIndex]?.[0]
  const sheet = useRef(null)
  const more = useRef(null)
  const submitted = useRef(null)
  const [compactHeader,setCompactHeader] = useState(false)
  const [scrolled,setScrolled] = useState(false)
  const [companionSummary,setCompanionSummary] = useState(null)
  const companionHome = path==='/modules/companion'
  const viewport = useRef(null)
  const accountViewport = useRef(null)
  const scrollPositions = useRef(new Map())
  const route = useRef(path)
  const historyIndex = useRef(history.state?.masrifIndex ?? 0)
  const nextScroll = useRef(0)
  const balance = balanceOf(records)
  useEffect(()=>{
    const pop = ()=>{
      const current = currentPath()
      const target = accessRedirect(current,isPreview)
      if (target!==current) history.replaceState(history.state,'',target)
      const nextIndex = history.state?.masrifIndex ?? 0
      const back = nextIndex < historyIndex.current
      historyIndex.current = nextIndex
      if (target === route.current) return
      if (target === '/account/transactions') setTransactionScope(insightsScope(location.search))
      scrollPositions.current.set(route.current, (accountViewport.current ?? viewport.current).scrollTop)
      nextScroll.current = scrollPositions.current.get(target) ?? 0
      const fromAccount = accountTabIndex(route.current)
      const toAccount = accountTabIndex(target)
      const fromTab = navIndex(route.current.split('/')[1])
      const toTab = navIndex(target.split('/')[1])
      const motion = fromAccount >= 0 && toAccount >= 0 && fromAccount !== toAccount
        ? toAccount > fromAccount ? 'next' : 'previous'
        : fromTab >= 0 && toTab >= 0 && fromTab !== toTab
          ? slideBetween(fromTab, toTab)
          : back ? 'slide-right' : 'slide-left'
      route.current = target
      setNavigationMotion(motion)
      setPath(target)
    }
    window.addEventListener('popstate',pop)
    return ()=>window.removeEventListener('popstate',pop)
  },[isPreview])
  useEffect(()=>{localStorage.setItem(bankKey,JSON.stringify(records))},[records])
  useLayoutEffect(()=>{
    const scrollContainer = accountViewport.current ?? viewport.current
    scrollContainer.scrollTop = nextScroll.current
    setScrolled(scrollContainer.scrollTop>2)
    setCompactHeader((path==='/home'||path==='/modules/companion') && viewport.current.scrollTop>=52)
  },[path])
  useLayoutEffect(()=>{
    const slidePage = navigationMotion === 'slide-left' || navigationMotion === 'slide-right'
    const slideAccount = navigationMotion === 'next' || navigationMotion === 'previous'
    if (!slidePage && !slideAccount) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const container = viewport.current
    if (!container.animate) return
    const fromRight = navigationMotion === 'slide-left' || navigationMotion === 'next'
    const offset = fromRight ? '100%' : '-100%'
    const animation = slidePage && container.animate(
      [{transform:'translateX('+offset+')'}, {transform:'translateX(0)'}],
      {duration:290, easing:'cubic-bezier(.22,.75,.32,1)'}
    )
    const content = container.querySelector('.account-tab-panel') ?? container.querySelector('main')
    const items = content ? revealTargets(content).slice(0, 8) : []
    const distance = fromRight ? 24 : -24
    const reveals = items.map((item,index)=>item.animate(
      [
        {opacity:0, transform:`translateX(${distance}px)`},
        {opacity:1, transform:'translateX(0)'},
      ],
      {duration:260, delay:90 + index * 40, easing:'cubic-bezier(.22,.75,.32,1)', fill:'backwards'}
    ))
    function revealFocused(event) {
      const index = items.findIndex(item=>item.contains(event.target))
      reveals[index]?.cancel()
    }
    container.addEventListener('focusin',revealFocused)
    return ()=>{
      if (animation) animation.cancel()
      reveals.forEach(reveal=>reveal.cancel())
      container.removeEventListener('focusin',revealFocused)
    }
  },[path,navigationMotion])
  function go(target, replace=false, search='', direction='slide-left') {
    const allowed = accessRedirect(target,isPreview)
    if (allowed!==target) {target=allowed;search=''}
    if(target===path) return
    if (target === '/account/transactions') setTransactionScope(insightsScope(search))
    scrollPositions.current.set(path, (accountViewport.current ?? viewport.current).scrollTop)
    nextScroll.current = 0
    if (!replace) historyIndex.current += 1
    history[replace?'replaceState':'pushState']({
      from:history.state?.from && replace ? history.state.from : path,
      masrifIndex:historyIndex.current,
    }, '',target+search)
    route.current = target
    setNavigationMotion(direction)
    setPath(target)
  }
  function selectAccountTab(target, index) {
    const direction = index === tabIndex ? null : index > tabIndex ? 'next' : 'previous'
    go(target, false, '', direction)
  }
  function back() {
    if(history.state?.from) history.back()
    else if(path===insightSummaryPath) go('/account/insights',true,'','slide-right')
    else go(Object.hasOwn(accessTitles,path)?'/welcome':path.startsWith('/transfer')?'/transfer/bank':path==='/account/card/details'?'/account/card':path.startsWith('/account/')?'/account':path.startsWith('/profile/')?path.slice(0,path.lastIndexOf('/')):path.startsWith('/inbox/')?'/inbox':path.startsWith('/pay/')?'/pay':path.startsWith('/modules/')?'/modules':'/home',true,'','slide-right')
  }
  function newTransfer(recipient) {
    submitted.current=null
    const prefilled = recipient?.bank ? recipient : {}
    setDraft({...prefilled,id:crypto.randomUUID(),origin:path.startsWith('/pay')?'/pay':'/account'})
    go(prefilled.bank ? '/transfer/verify' : '/transfer/bank')
  }
  function submit(details,amount,status) {
    const recipient = confirmedTransferRecipient(details)
    if (!recipient || !Number.isSafeInteger(amount) || amount <= 0) return
    if (matchingPendingTransfer(records,recipient,amount)) {go('/transfer/review',true);return}
    if(submitted.current) {go('/transfer/result/'+submitted.current,true); return}
    const id = details.id || crypto.randomUUID()
    submitted.current=id
    const item = {id, name:recipient.name, category:'Transfers', amount:-amount, date:today(), bank:details.bank, account:details.account.slice(-4), recipientAccount:recipient.account, reference:details.reference, status}
    setRecords(previous=>settle(previous,item))
    go('/transfer/result/'+id,true)
  }
  const updateDraft = next=>setDraft({...next,id:draft.id || crypto.randomUUID()})
  const showRecord = item=>go('/account/transactions/'+item.id)
  function showInsightCategory(category,start,end,income) {
    setQuery('')
    setFilter(income?'Money in':'Money out')
    go('/account/transactions',false,'?'+new URLSearchParams({category,start,end,direction:income?'in':'out'}))
  }
  const paymentResult = path.startsWith('/pay/result/')
  const result = paymentResult || path.startsWith('/transfer/result/')
  const receipt = path.startsWith('/receipts/')
  const detail = path.startsWith('/account/transactions/')
  const item = (result||receipt||detail) && records.find(row=>row.id===path.split('/').at(-1))
  const transfer = path.startsWith('/transfer/') && !result
  const step = path.split('/')[2]
  const access = Object.hasOwn(accessTitles,path)
  const [exitRequested,setExitRequested] = useState(false)
  const profileName = readDemo(demoContactKey,{})?.name || 'Farah Amin'
  const firstName = profileName.trim().split(/\s+/)[0]
  const home = path==='/home'
  const accountView = tabIndex >= 0
  const top = home || accountView || tabs.some(([label,,slug=label.toLowerCase()])=>path==='/'+slug)
  const profilePath = path.slice('/profile/'.length)
  const profileSection = path.startsWith('/profile/')&&!profilePath.startsWith('cards')&&(Object.hasOwn(profileDetailTitles,profilePath)||profileLinks.some(([,slug])=>slug===profilePath))?profilePath:null
  const inbox = path==='/inbox'||path.startsWith('/inbox/')
  const title = result?(paymentResult?'Payment result':'Transfer result'):receipt?'Receipt':detail?'Transaction details':transfer?transferHeading(step):accountView?'Your account':path===insightSummaryPath?'Summary':accessTitles[path] || titles[path] || (inbox?'Notification':'SKEB-Pro')
  const active = paymentResult||((transfer||result)&&draft.origin==='/pay')?'pay':transfer||result||receipt?'account':home?'home':path.split('/')[1]
  function selectNav(slug) {
    const from = navIndex(active)
    const to = navIndex(slug)
    go('/'+slug,false,'',slug==='pay' ? 'pay-up' : from===to ? 'slide-right' : slideBetween(from,to))
  }
  const posted = records.filter(row=>!row.status || row.status==='Successful')
  const scope = path==='/account/transactions'?transactionScope:null
  const legacyStatement = scope?.month ? monthlyStatement(records,scope.month) : null
  const scopedLabel = scope&&(legacyStatement?.label||insightRangeLabel(scope.start,scope.end))
  const transactionRows = scope
    ? (legacyStatement?.transactions||postedEntries(records).filter(({date})=>date>=scope.start&&date<=scope.end).map(({item})=>item))
      .filter(row=>(scope.income?row.amount>0:isSpending(row))&&(row.category||'Other')===scope.category).reverse()
    : records
  const zakat = path === '/modules/zakat'
  return <div className="demo-stage">
    <aside className="demo-intro" aria-labelledby="demo-title">
      <h2 id="demo-title"><img className="demo-brand" src="/brand/logo-dark.png" width="159" height="38" alt="SKEB-Pro"/></h2>
      <p className="demo-attribution">Powered by Atlas from Bank Muamalat</p>
      <p className="demo-intro-note">Interactive prototype · No real money moves</p>
    </aside>
    <div className="phone">
    <div className={'app '+(dark?'dark':'')} data-screen={path==='/'?'launch':path.slice(1)} data-access={access||undefined} data-scrolled={scrolled||undefined} data-compact={compactHeader||undefined}
      onScrollCapture={event=>{const target=event.target;if(target===viewport.current||target===accountViewport.current) setScrolled(target.scrollTop>2)}}>
    <div className="island" aria-hidden="true"/>
    <StatusBar fixed/>
    <div className={accountView ? 'app-scroll account-shell' : 'app-scroll'} data-motion={path==='/pay' && navigationMotion==='pay-up' ? 'pay-up' : undefined} ref={viewport} tabIndex={accountView ? undefined : 0} role="region" aria-label="App content" onScroll={home||companionHome?event=>setCompactHeader(event.currentTarget.scrollTop>=52):undefined}><StatusBar spacer/>
    {home ? <>
      <header className={'hero-top home-toolbar'+(compactHeader?' compact':'')} aria-label="Home shortcuts">
        <button className="home-profile" aria-label={firstName+", open profile"} onClick={()=>go('/profile')}>
          <span className="avatar" aria-hidden="true">{nameInitials(profileName)}</span>
        </button>
        <img className="home-logo" src="/brand/logo-light.png" width="116" height="28" alt="SKEB-Pro"/>
        <button className="icon-button home-notifications" aria-label="Notifications" onClick={()=>go('/inbox')}><Icon name="bell" size={21}/></button>
      </header>
      <div className="hero">
      <div className="hero-content"><div className="home-balance"><small>ATLAS by Bank Muamalat</small><span className="balance-number">{hidden?'RM ••••••':money(balance)}</span><div className="home-account-visibility"><small>Account 0000 0000 4812</small><BalanceToggle hidden={hidden} toggle={()=>setHidden(!hidden)}/></div></div></div>
      </div>
    </> : (path==='/'||path==='/welcome'||path==='/login'||path==='/login/password'||path==='/login/welcome')?null:<header className={'page-header '+(top?'hub':'')+(companionHome && compactHeader?' compact':'')}>{!top&&<button className="icon-button" aria-label="Back" onClick={back}><Icon name="back"/></button>}{companionHome&&compactHeader&&companionSummary?<div className="companion-compact-prayer" aria-label="Muslim Companion, next prayer">
      <span><b>{companionSummary.name}</b> <strong>{companionSummary.time}</strong></span>
      <small>In {companionSummary.countdown}</small>
      <small className="companion-compact-location">{companionSummary.location}</small>
    </div>:<h1>{title}</h1>}</header>}
    <main>
    {access&&<>
      <RegistrationProgress path={path} onExit={()=>setExitRequested(true)}/>
      <AccessFlow path={path} go={go} dark={dark} exitRequested={exitRequested} onCancelExit={()=>setExitRequested(false)}
        onSignInBack={()=>Object.hasOwn(accessTitles,history.state?.from)?back():go('/welcome',true,'','slide-right')}/>
    </>}
    {home && <>

      <section className="home-quick" aria-labelledby="home-quick-title"><h2 id="home-quick-title">Quick actions</h2><div className="tiles quick-actions">{[['book','Quran','companion/quran'],['heart','Zakat','zakat'],['compass','Qibla','companion/qibla'],['pin','Mosques','companion/mosques']].map(([icon,label,target])=><Tile key={label} icon={icon} label={label} onClick={()=>go('/modules/'+target)}/>)}</div></section>
      {highlight&&<aside className="highlight"><span className="tile-icon"><Icon name="spark"/></span><div><h3>A moment for your day</h3><p>Prayer times and your daily companion</p><button className="text-button" onClick={()=>go('/modules/companion')}>Explore Muslim Companion <Icon name="arrow" size={16}/></button></div><button className="icon-button dismiss" aria-label="Dismiss highlight" onClick={()=>{sessionStorage.setItem('masrif-highlight','hidden');setHighlight(false)}}><Icon name="close" size={17}/></button></aside>}
      <section><h2>Highlights</h2><div className="explore" aria-label="Highlights" tabIndex={0}>
        <button className="explore-card highlight-slide" onClick={()=>go('/modules/companion')}><Icon name="compass"/><strong>Muslim Companion</strong><small>Prayer times and worship tools</small></button>
        <button className="explore-card highlight-slide" onClick={()=>go('/modules/pintar')}><Icon name="book"/><strong>Pintar</strong><small>Discover education programmes</small></button>
        <button className="explore-card highlight-slide" onClick={()=>go('/modules/zakat')}><Icon name="heart"/><strong>Zakat</strong><small>Explore giving services</small></button>
      </div></section>
      <section><div className="row"><h2>Explore SKEB-Pro</h2><button className="text-button" onClick={()=>go('/modules')}>View all <Icon name="arrow" size={16}/></button></div><div className="explore">{[['Pintar','Education services','book','pintar'],['e-SKEB','e-procurement services','grid','e-procurement'],['Zakat','Giving services','heart','zakat']].map(([label,description,icon,target])=><button className="explore-card" key={label} onClick={()=>go('/modules/'+target)}><span className="tile-icon"><Icon name={icon}/></span><strong>{label}</strong><small>{description}</small></button>)}</div></section>
      <HomeUpdates/>
      <p className="demo-label"><span/>Interactive demo · No real money moves</p>
    </>}
    {accountView&&<>
      <div className="segments account-tabs" style={{'--active-tab':tabIndex}} role="group" aria-label="Account views">{accountTabs.map(([label,target],index)=><button key={label} aria-pressed={accountTab===label} onClick={()=>selectAccountTab(target,index)}>{label}</button>)}</div>
      <div className="account-tab-viewport" ref={accountViewport} tabIndex={0} role="region" aria-label={accountTab}>
      <div className="account-tab-panel" key={accountTab} data-direction={navigationMotion==='next'||navigationMotion==='previous' ? navigationMotion : undefined}>
      {accountTab==='Overview'&&<><div className="balance-card">
        <strong>ATLAS Savings Account-i</strong>
        <p className="account-number">0000 0000 4812</p>
        <div className="account-balance-row">
          <div className="account-balance-amount">
            <small>Available balance</small>
            <span className="balance-number">{hidden?"RM ••••••":money(balance)}</span>
          </div>
          <BalanceToggle hidden={hidden} toggle={()=>setHidden(!hidden)}/>
        </div>
      </div>
      <div className="tiles account-actions"><Tile icon="plus" label="Add money" onClick={()=>go('/account/add')}/><Tile icon="transfer" label="Transfer" onClick={newTransfer}/><Tile icon="in" label="Receive" onClick={()=>go('/pay/receive')}/><button className="tile" ref={more} onClick={()=>sheet.current.showModal()}><span className="tile-icon"><Icon name="more"/></span>More</button></div>
      <dialog ref={sheet} className="sheet account-more-sheet" onClose={()=>more.current?.focus()} onClick={event=>{if(event.target===sheet.current) sheet.current.close()}} aria-labelledby="services-title">
        <div className="account-more-body">
          <header className="account-more-header">
            <h2 id="services-title">More</h2>
            <button type="button" className="icon-button" aria-label="Close More" autoFocus onClick={()=>sheet.current.close()}><Icon name="close"/></button>
          </header>
          <div className="account-more-scroll">
            {accountServices.map(({label,actions})=><ul key={label} className="account-more-group" aria-label={label}>
              {actions.map(([title,target,icon])=><li key={target}>
                <button type="button" className="account-more-action" onClick={()=>{sheet.current.close();go(target)}}>
                  <span className="account-more-icon"><Icon name={icon} size={21}/></span>
                  <span>{title}</span><Icon name="chevron" size={17}/>
                </button>
              </li>)}
            </ul>)}
          </div>
        </div>
      </dialog>

      <section><h2>Recent transactions</h2><button className="history-link" onClick={()=>{setQuery('');setFilter('All');go('/account/transactions')}}>View all transactions <Icon name="arrow" size={16}/></button><RecordRows items={records.slice(0,3)} open={showRecord}/></section></>}
      {accountTab==='Insights'&&<InsightsView records={records} period={insightPeriod} setPeriod={setInsightPeriod} mode={insightMode} setMode={setInsightMode}
        onCategory={showInsightCategory} onSummary={()=>{
          setSummaryPeriod(insightPeriod)
          setSummaryMode(insightMode)
          setSummaryOffset(0)
          setSummaryAnchor(null)
          go(insightSummaryPath)
        }}/>}
      </div>
      </div>
    </>}
    {path==='/account/planning'&&<PlanningView records={posted}/>}
    {path===insightSummaryPath&&<CashFlowSummaryView records={records} period={summaryPeriod} mode={summaryMode} setMode={setSummaryMode}
      offset={summaryOffset} setOffset={value=>{setSummaryOffset(value);setSummaryAnchor(null)}} onCategory={showInsightCategory}
      onChartDate={setSummaryAnchor} setPeriod={(value,fallbackDate)=>{
        if(value===summaryPeriod) return
        const date=summaryAnchor??fallbackDate
        setSummaryPeriod(value)
        setSummaryOffset(insightOffsetForDate(value,date))
        setSummaryAnchor(date)
      }}/>}
    {path==='/account/transactions'&&<div className="stack transaction-history">
      {scope&&<p className="notice">{scope.category} · {scopedLabel}</p>}
      <input aria-label="Search transactions" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search transactions"/>
      {!scope&&<div className="segments transaction-filters">{['All','Money in','Money out'].map(label=><button key={label} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label}</button>)}</div>}
      <button className="text-button" onClick={()=>{
        setQuery('')
        setFilter('All')
        setTransactionScope(null)
        if (scope) history.replaceState(history.state,'',path)
      }}>Reset filters</button>
      <RecordRows items={transactionRows.filter(row=>(scope||filter==='All'||(filter==='Money in'?row.amount>0:row.amount<0))&&[row.name,row.category,row.reference,row.id].join(' ').toLowerCase().includes(query.toLowerCase().trim()))} open={showRecord}/>
    </div>}
    {transfer&&<Transfer key={step} step={step} draft={draft} setDraft={updateDraft} go={go} balance={balance} records={records} submit={submit}/>}
    {receipt&&item&&(!item.status||item.status==='Successful')&&<><Receipt item={item}/><Button kind="secondary" onClick={back}>Done</Button></>}
    {(detail||result||(receipt&&(!item||item.status&&item.status!=='Successful')))&&<div className="stack transaction-detail">{item?<><div className="result-card payment-result-card" data-status={item.status||"Successful"}>{result&&<div className="payment-result-symbol" aria-hidden="true">{item.status==="Pending"?"…":item.status==="Failed"?"!":"✓"}</div>}<small>{item.status || 'Successful'} · Demo</small><h2>{result?(item.status==='Pending'?'Payment is being checked':item.status==='Failed'?'Payment not completed':'Payment successful'):money(Math.abs(item.amount))}</h2><p>{result?money(Math.abs(item.amount))+' · '+item.name:item.name}</p></div><dl className="details"><dt>Reference</dt><dd>{item.reference || item.id}</dd><dt>Date</dt><dd>{item.date}</dd><dt>Category</dt><dd>{item.category}</dd>{item.bank&&<><dt>Bank</dt><dd>{item.bank}</dd><dt>Account</dt><dd>•••• {item.account}</dd></>}</dl>
    {item.status==='Pending'&&<><div className="module-panel"><h3>What happens next</h3><p>Wait for the final status before sending the same payment again.</p></div><Button onClick={()=>go('/account/transactions')}>View transactions</Button><Button kind="secondary" onClick={()=>setRecords(previous=>resolvePending(previous,item.id))}>Check demo status</Button></>}
    {item.status==='Failed'&&<><div className="module-panel"><h3>What happens next</h3><p>This demo payment could not be completed. Review the recipient and amount before starting again.</p></div><Button onClick={()=>go('/pay')}>Return to Pay</Button></>}
    {(!item.status||item.status==='Successful')&&<>
      {!receipt&&<Button onClick={()=>go('/receipts/'+item.id)}>{result?'Share receipt':'View receipt'}</Button>}

    </>}
    {item.status!=='Failed'&&<Button kind="secondary" onClick={()=>go(paymentResult||draft.origin==='/pay'?'/pay':'/account')}>{result?'Done':paymentResult?'Back to Pay':'Back to Account'}</Button>}</>:<><p className="notice">This demo transaction could not be found.</p><Button onClick={()=>go('/account')}>Back to Account</Button></>}</div>}
    {path==='/profile'&&<ProfileMenu go={go}/>}
    {profileSection&&<ProfilePage key={profileSection} section={profileSection} go={go} appearance={appearance} applyAppearance={applyAppearance} records={records} reset={()=>{
      setRecords(seed)
      setHidden(true)
      setHighlight(true)
      setAppearance('Light')
      setQuery('')
      setFilter('All')
      submitted.current=null
      for(const key of ['masrif-highlight','masrif-recent','masrif-demo-prayer-city']) sessionStorage.removeItem(key)
      for(const key of ['masrif-plan','masrif-planning-budgets','masrif-planning-goals','masrif-planning-reminders','masrif-appearance','masrif-language','masrif-reading','masrif-reading-number','masrif-bookmark','masrif-demo-biometrics','masrif-demo-programmes','masrif-demo-marketing','masrif-demo-recipients','masrif-demo-pintar-applications','masrif-demo-procurement','masrif-demo-personal-contact','masrif-demo-support-tickets','masrif-demo-alerts','masrif-demo-marketing-history','masrif-demo-consent','masrif-demo-device-removed','masrif-demo-credentials']) localStorage.removeItem(key)
      sessionStorage.removeItem('masrif-session-demo-pin')
      sessionStorage.removeItem('masrif-session-demo-lock')
      for(const key of [signupDraftKey,attemptsKey,recoveryNoticeKey,signedOutKey,'masrif-session-trusted-device']) sessionStorage.removeItem(key)
      setDraft({})
      go('/home')
    }}/>}
    {inbox&&<Inbox key={path} id={path.split('/')[2]} go={go}/>}
    {path==='/account/add'&&<AddMoney go={go} onAdd={(amount,bank)=>{
      const id=crypto.randomUUID()
      setRecords(previous=>settle(previous,{id,name:'Top-up from '+bank,category:'Top-up',amount,date:today(),bank,account:'4812',status:'Successful'}))
      return id
    }}/>}
    {['/account/card','/account/card/details','/profile/cards','/profile/cards/details'].includes(path)&&
      <CardViews key={path} details={path.endsWith('/details')} openDetails={()=>go(path+'/details')} done={back}/>}
    {path==='/profile/cards/add'&&<AddCard onCancel={back} onDone={()=>go('/profile/cards',true)}/>}
    {path==='/account/statement'&&<StatementView records={records} renderRows={rows=><RecordRows items={rows} open={showRecord}/>}/>}
    {path==='/account/receipts'&&<section className="stack">
      <p className="planning-note">Select a completed transaction to view or download its PDF receipt.</p>
      <RecordRows items={posted} open={row=>go('/receipts/'+row.id)}/>
    </section>}
    {zakat&&<Zakat records={records} balance={balance} go={go} onPay={({id,institution,type,amount})=>{
      const date = today()
      setRecords(previous=>settle(previous,{id,name:institution,category:'Zakat',zakatType:type,amount:-amount,date,status:'Successful'}))
    }}/>}
    {!zakat&&!access&&!home&&!transfer&&!result&&!receipt&&!detail&&path!=='/account'&&path!=='/account/transactions'&&path!=='/profile'&&!profileSection&&!path.startsWith('/inbox')&&!path.startsWith('/account/')&&path!=='/profile/cards'&&!path.startsWith('/profile/cards/')&&<Extras key={path} path={path} dark={dark} onCompanionSummary={setCompanionSummary} go={go} balance={balance} newTransfer={newTransfer} onPayment={(id,amount,status,name='Campus Bookshop')=>{setRecords(previous=>settle(previous,{id,name,amount:-amount,category:name==='Campus Bookshop'?'Education':'Payments',date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),status}));go('/pay/result/'+id,true)}}/>}
    </main>
    </div>
    {!access&&(isPreview||canUseApp())&&(!transfer || step!=='authorise')&&!result&&<nav className="footer" aria-label="Main navigation">{tabs.map(([label,icon,slug=label.toLowerCase()])=>{return <button key={label} className={(slug==='pay'?'pay-tab ':'')+(active===slug?'selected':'')} aria-current={active===slug?'page':undefined} onClick={()=>selectNav(slug)}><span>{slug==='pay'?<img src="/masrif/pay-tab.svg" width="48" height="48" alt=""/>:<Icon name={icon}/>}</span>{label}</button>})}</nav>}
    </div>
    <span className="phone-button action" aria-hidden="true"/><span className="phone-button vol-up" aria-hidden="true"/><span className="phone-button vol-down" aria-hidden="true"/><span className="phone-button power" aria-hidden="true"/>
    </div>
  </div>
}

function HomeUpdates() {
 return <section className="home-updates" aria-labelledby="home-updates-title">
   <h2 id="home-updates-title">What’s New?</h2>
   <article className="home-update-card">
     <div className="home-update-art" aria-hidden="true">
       {['book','account','compass'].map(name=><div className="home-update-phone" key={name}>
         <div className="home-update-phone-header"><Icon name={name} size={21}/></div>
         <div className="home-update-phone-tiles"><i/><i/><i/><i/></div>
       </div>)}
     </div>
     <div className="home-update-copy"><h3>2 Services, 1 Subscription</h3><p>Get the latest version of the SKEB-Pro app!</p></div>
   </article>
 </section>
}



function BalanceToggle({hidden,toggle}) {
 const label=hidden?'Show balance':'Hide balance'
 return <button className="text-button balance-toggle" onClick={toggle}><Icon name={hidden?'eye':'eyeOff'} size={18}/>{label}</button>
}





