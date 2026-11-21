import { postedEntries, transactionDate } from './accountStatement'
import { today } from './demo'

export const insightPeriods = [['week','This week'],['month','This month'],['year','This year']]

const asDate = day => new Date(day+'T00:00:00Z')
const iso = date => date.toISOString().slice(0,10)
const shortDate = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})
const longDate = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})
const addDays = (date,days) => new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()+days))

export function insightRangeLabel(start,end) {
  return start===end?longDate.format(asDate(end)):shortDate.format(asDate(start))+' – '+longDate.format(asDate(end))
}

export function isInsightDate(value) {
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(asDate(value).getTime())&&iso(asDate(value))===value
}

export function isSpending(item) {
  return item.amount<0&&item.category!=='Transfers'
}

function periodBounds(period,currentDay,offset) {
  const current = asDate(currentDay)
  const year = current.getUTCFullYear()
  const month = current.getUTCMonth()
  if(period==='week') {
    const start=addDays(current,offset*7-((current.getUTCDay()+6)%7))
    return [start,addDays(start,6)]
  }
  if(period==='year') return [new Date(Date.UTC(year+offset,0,1)),new Date(Date.UTC(year+offset,11,31))]
  return [new Date(Date.UTC(year,month+offset,1)),new Date(Date.UTC(year,month+offset+1,0))]
}

function aggregateFlows(records,start,end,bucketIndex) {
  const emptyFlow = () => ({total:0,totals:new Map(),bars:[]})
  const flows = {income:emptyFlow(),expenses:emptyFlow()}
  for (const {item,date} of postedEntries(records)) {
    if (date<start||date>end) continue
    if (item.amount<=0&&!isSpending(item)) continue
    const flow=item.amount>0?flows.income:flows.expenses
    const amount=Math.abs(item.amount)
    const category=item.category||'Other'
    flow.total+=amount
    const entry=flow.totals.get(category)||[category,0,0]
    entry[1]+=amount
    entry[2]+=1
    flow.totals.set(category,entry)
    if(bucketIndex) {
      const index=bucketIndex(asDate(date))
      flow.bars[index]=(flow.bars[index]||0)+amount
    }
  }
  return flows
}

const sortedCategories = flow => [...flow.totals.values()].sort((a,b)=>b[1]-a[1])

export function buildCashFlow(records,period,currentDay=transactionDate(today())) {
  const start=iso(periodBounds(period,currentDay,0)[0])
  const {income,expenses}=aggregateFlows(records,start,currentDay)
  const summarize = flow => ({total:flow.total,categories:sortedCategories(flow).slice(0,5)})
  return {start,end:currentDay,income:summarize(income),expenses:summarize(expenses)}
}

const monthName = new Intl.DateTimeFormat('en-GB',{month:'short',timeZone:'UTC'})
const monthYear = new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'})
const chartDay = new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})

export function insightOffsetForDate(period,day,currentDay=transactionDate(today())) {
  const [reference]=periodBounds(period,day>currentDay?currentDay:day,0)
  const [current]=periodBounds(period,currentDay,0)
  if(period==='week') return Math.round((reference-current)/604800000)
  const years=reference.getUTCFullYear()-current.getUTCFullYear()
  return period==='year'?years:years*12+reference.getUTCMonth()-current.getUTCMonth()
}

export function buildCashFlowSummary(records,period,mode,offset,currentDay=transactionDate(today())) {
  const [first,last]=periodBounds(period,currentDay,offset)
  const start=iso(first)
  const end=offset===0?currentDay:iso(last)
  const bucketIndex=period==='year'?date=>date.getUTCMonth()
    :date=>Math.round((date-first)/86400000)
  const flow=aggregateFlows(records,start,end,bucketIndex)[mode]
  const count=period==='year'?12:period==='week'?7:last.getUTCDate()
  const bars=Array.from({length:count},(_,index)=>{
    const date=period==='year'?new Date(Date.UTC(first.getUTCFullYear(),index,1)):addDays(first,index)
    const label=period==='year'?monthName.format(date):String(date.getUTCDate())
    return {date:iso(date),label,accessibleLabel:period==='year'?monthYear.format(date):chartDay.format(date),amount:flow.bars[index]||0}
  })
  const label=period==='year'?'Jan – Dec '+first.getUTCFullYear()
    :period==='month'?monthYear.format(first):insightRangeLabel(start,iso(last))
  return {start,end,label,bars,total:flow.total,categories:sortedCategories(flow)}
}
