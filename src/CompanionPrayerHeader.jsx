import { useEffect, useState } from 'react'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'

const timeZone = 'Asia/Kuala_Lumpur'
const masihiDate = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone})
const hijriDate = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric',timeZone})
const clock = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZone})
const liveClock = new Intl.DateTimeFormat('en-MY',{hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true,timeZone})
const apiDate = new Intl.DateTimeFormat('en-US',{day:'2-digit',month:'short',year:'numeric',timeZone})
const monthKey = new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone})
const endpoint = 'https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=month&zone='
const cityKey = 'masrif-demo-prayer-city'
const prayers = [['Fajr','fajr'],['Dhuhr','dhuhr'],['Asr','asr'],['Maghrib','maghrib'],['Isha','isha']]
const cities = [
 ['Kuala Lumpur','WLY01',3.139,101.687],['Shah Alam','SGR01',3.074,101.518],['Putrajaya','WLY01',2.926,101.696],
 ['Johor Bahru','JHR02',1.492,103.741],['George Town','PNG01',5.414,100.329],['Ipoh','PRK02',4.597,101.090],
 ['Melaka','MLK01',2.190,102.251],['Kuantan','PHG02',3.813,103.326],['Kota Bharu','KTN01',6.125,102.238],
 ['Kuala Terengganu','TRG01',5.329,103.137],['Kuching','SWK08',1.554,110.359],['Kota Kinabalu','SBH07',5.981,116.073],
]
const cityNames = cities.map(([name])=>name)
const timedPrayers = day => day ? prayers.flatMap(([name,key])=>{
  if (!/^\d\d:\d\d(?::\d\d)?$/.test(day[key])) return []
  const [hour,minute] = day[key].split(':').map(Number)
  return [{name,time:(hour%12||12)+':'+String(minute).padStart(2,'0')+(hour<12?' AM':' PM'),seconds:(hour*60+minute)*60}]
}) : []

function formatApiDate(value) {
 const parts=apiDate.formatToParts(value)
 return ['day','month','year'].map(type=>parts.find(part=>part.type===type).value).join('-')
}
function nearbyCity(latitude,longitude) {
 const longitudeScale = Math.cos(latitude*Math.PI/180)
 let closest
 let bestDistance = 0.32
 for(const [name,,lat,lon] of cities) {
   const distance = Math.hypot(lat-latitude,(lon-longitude)*longitudeScale)
   if(distance<bestDistance) {
     closest=name
     bestDistance=distance
   }
 }
 return closest
}

export function CompanionPrayerHeader({onPrayerTimes,onSummary,full=false}) {
 const [now,setNow] = useState(()=>new Date())
 const [choice,setChoice] = useState(()=>sessionStorage.getItem(cityKey) || '')
 const [detected,setDetected] = useState('')
 const [result,setResult] = useState(null)
 const [attempt,setAttempt] = useState(0)
 const selectedCity = cities.find(([name])=>name===(choice||detected)) || cities[0]
 const [label,zone] = selectedCity
 const period = monthKey.format(now)
 const key = zone+'|'+period+'|'+attempt

 useEffect(()=>{
   const timer=window.setInterval(()=>setNow(new Date()),1000)
   return ()=>window.clearInterval(timer)
 },[])
 useEffect(()=>{
   if (choice || !navigator.geolocation) return
   let active=true
   navigator.geolocation.getCurrentPosition(({coords})=>{
     if(active)setDetected(nearbyCity(coords.latitude,coords.longitude)||'')
   },()=>{}, {timeout:8000,maximumAge:300000})
   return ()=>{active=false}
 },[choice])
 useEffect(()=>{
   const abort = new AbortController()
   const timer = setTimeout(()=>abort.abort('timeout'),12000)
   async function load() {
     try {
       const response = await fetch(endpoint+zone,{signal:abort.signal})
       if (!response.ok) throw new Error('Prayer times unavailable')
       const data=await response.json()
       if (!Array.isArray(data.prayerTime)||!data.prayerTime.length) throw new Error('No timetable')
       if (!abort.signal.aborted)setResult({key,days:data.prayerTime})
     } catch {
       if (!abort.signal.aborted||abort.signal.reason==='timeout')setResult({key,error:true})
     } finally {clearTimeout(timer)}
   }
   load()
   return ()=>{clearTimeout(timer);abort.abort()}
 },[key,zone])
 const current = result?.key===key ? result : null
 const days = current?.days || []
 const today = timedPrayers(days.find(day=>day.date===formatApiDate(now)))
 const tomorrow = timedPrayers(days.find(day=>day.date===formatApiDate(new Date(now.getTime()+86400000))))
 const timeParts = clock.formatToParts(now)
 const value = type=>Number(timeParts.find(part=>part.type===type).value)
 const seconds = (value('hour')*60+value('minute'))*60+value('second')
 const upcoming = today.find(prayer=>prayer.seconds>seconds)
 const next = upcoming || (today.length ? tomorrow[0] : undefined)
 const remaining = next ? next.seconds + (upcoming?0:86400) - seconds : null
 const minutes = remaining===null ? 0 : Math.ceil(remaining/60)
 const countdown = minutes>=60 ? Math.floor(minutes/60)+'h '+minutes%60+'m' : minutes+'m'
 const compactCountdown = remaining!==null&&remaining<3600 ? Math.floor(remaining/60)+'m '+String(remaining%60).padStart(2,'0')+'s' : countdown
 const nextName=next?.name
 const nextTime=next?.time
 useEffect(()=>{
   onSummary?.(nextName ? {name:nextName,time:nextTime,countdown:compactCountdown,location:label} : null)
 },[onSummary,nextName,nextTime,compactCountdown,label])
 return <div className="stack prayer-schedule">
   {full&&<Dropdown label="Prayer-time location" options={cityNames} value={label} onChange={city=>{sessionStorage.setItem(cityKey,city);setChoice(city)}}/>}
   <section className="prayer-header" aria-label="Prayer overview">
     <div className="prayer-meta">
       <div className="prayer-location"><Icon name="pin" size={18}/><span><strong>{label}</strong><small>{choice?'Selected location':detected?'Detected area':'Default location'}</small></span></div>
       <div className="prayer-dates"><strong>{hijriDate.format(now)}</strong><small><time dateTime={now.toISOString()}>{masihiDate.format(now)}</time></small></div>
     </div>
     <div className="prayer-next">
       <time className="companion-live-clock" dateTime={now.toISOString()} aria-label="Current Malaysia time">{liveClock.format(now)}</time>
       {full
         ? <small>{next ? 'Next prayer · '+next.name+' · In '+countdown : !current ? 'Loading timetable…' : 'Next prayer time unavailable'}</small>
         : <button className="text-button prayer-link" onClick={onPrayerTimes}>{next ? 'Next prayer · '+next.name+' · In '+countdown : 'View prayer times'}</button>}
     </div>
     {today.length>0&&<dl className="prayer-times">{today.map(({name,time})=><div className={name===nextName&&upcoming?'next-prayer':''} key={name}><dt>{name}</dt><dd>{full?time:time.split(' ')[0]}</dd></div>)}</dl>}
     {full&&current&&today.length===0&&<p role="status">The current timetable is unavailable for {label}.</p>}
   </section>
   {full&&current&&today.length===0&&<Button kind="secondary" onClick={()=>setAttempt(value=>value+1)}>Retry timetable</Button>}
   {full&&<a className="text-button" href="https://www.e-solat.gov.my/" target="_blank" rel="noreferrer">JAKIM e-Solat · {zone}</a>}
 </div>
}
