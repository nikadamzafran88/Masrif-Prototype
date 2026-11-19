import { useEffect, useState } from 'react'

export const worshipApi = 'https://masrif.antrex.app/v1/upstream/api'

export function useWorshipData(path, delay=0) {
 const [result,setResult] = useState(null)
 const [attempt,retry] = useState(0)
 useEffect(()=>{
   if(!path) return
   const abort = new AbortController()
   const timer = setTimeout(async ()=>{
     try {
       const response=await fetch(worshipApi+path,{signal:abort.signal})
       if(!response.ok) throw new Error('Request failed')
       const data=await response.json()
       if(data.success===false||data.success==='false') throw new Error('Service unavailable')
       if(!abort.signal.aborted) setResult({path,attempt,data})
     } catch {
       if(!abort.signal.aborted) setResult({path,attempt,error:true})
     }
   },delay)
   return ()=>{clearTimeout(timer);abort.abort()}
 },[path,attempt,delay])
 const current=result?.path===path&&result.attempt===attempt?result:null
 return {data:current?.data,error:current?.error,loading:Boolean(path&&!current),retry:()=>retry(value=>value+1)}
}

export function qiblaBearing(latitude,longitude) {
 const radians=Math.PI/180
 const origin=latitude*radians
 const kaaba=21.4225*radians
 const difference=(39.8262-longitude)*radians
 const bearing=Math.atan2(Math.sin(difference),Math.cos(origin)*Math.tan(kaaba)-Math.sin(origin)*Math.cos(difference))
 return (Math.round(bearing/radians)+360)%360
}
