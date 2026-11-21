import { opening } from './demo'

const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const firstDemoMonth='2026-11'
const monthLabel=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'})

export function transactionDate(date) {
 const match=typeof date==='string'&&date.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
 if(!match) return ''
 const [,day,name,year]=match
 const index=monthNames.indexOf(name)
 if(index<0||Number(day)<1||Number(day)>31) return ''
 return year+'-'+String(index+1).padStart(2,'0')+'-'+day.padStart(2,'0')
}

export function postedEntries(records) {
 return records.slice().reverse().flatMap(item=>{
   const date=transactionDate(item.date)
   return !date||(item.status&&item.status!=='Successful')?[]:[{item,date}]
 }).sort((a,b)=>a.date.localeCompare(b.date))
}

export function statementMonths(records) {
 const posted=postedEntries(records)
 const latest=posted.at(-1)?.date.slice(0,7)||firstDemoMonth
 const [year,month]=latest.split('-').map(Number)
 const months=Array.from({length:12},(_,index)=>new Date(Date.UTC(year,month-1-index,1)).toISOString().slice(0,7))
 return [...new Set([...months,...posted.map(({date})=>date.slice(0,7))])].sort().reverse()
}

export function monthlyStatement(records,month) {
 const posted=postedEntries(records)
 // The demo balance was seeded immediately before the first demo month.
 const openingBalance=month<firstDemoMonth ? null : opening+posted.reduce((sum,{item,date})=>date.slice(0,7)<month?sum+item.amount:sum,0)
 let moneyIn=0
 let moneyOut=0
 let runningBalance=openingBalance
 const transactions=posted.filter(({date})=>date.startsWith(month+'-')).map(({item})=>{
   moneyIn+=Math.max(item.amount,0)
   moneyOut+=Math.max(-item.amount,0)
   if(runningBalance!==null) runningBalance+=item.amount
   return {...item,runningBalance}
 })
 return {month,label:monthLabel.format(new Date(month+'-01T00:00:00Z')),openingBalance,moneyIn,moneyOut,closingBalance:runningBalance,transactions}
}

