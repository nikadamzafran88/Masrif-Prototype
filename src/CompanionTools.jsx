import { ExternalLink } from './ExternalLink'
import { useEffect, useState } from 'react'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'
import { Skeleton } from './Skeleton'
import { CompanionPrayerHeader } from './CompanionPrayerHeader'
import { qiblaBearing, useWorshipData, worshipApi } from './worship'

const quranKey = 'masrif-reading'
const readingNumberKey = 'masrif-reading-number'

export function CompanionTool({tool}) {
 if(tool==='quran') return <Quran/>
 if(tool==='mosques') return <Mosques/>
 if(tool==='tasbih') return <Tasbih/>
 if(tool==='qibla') return <Qibla/>
 if(tool==='duas') return <Duas/>
 if(tool!=='prayer-times') return <p className="notice">This worship tool is unavailable.</p>
 return <CompanionPrayerHeader full/>
}

function RequestNotice({request,reader=false}) {
 if(request.loading) return <div className="stack" role="status">
   <span className="loading-label">Loading content</span>
   {[1,2,3].map(index=><div key={index} className="module-panel skeleton-content">
     <Skeleton className="skeleton-line skeleton-title"/>
     <Skeleton className="skeleton-line"/>
     {reader&&<Skeleton className="skeleton-line"/>}
   </div>)}
 </div>
 if(request.error) return <div className="stack"><p className="notice" role="status">This content is temporarily unavailable.</p><Button kind="secondary" onClick={request.retry}>Try again</Button></div>
 return null
}

function Quran() {
 const [query,setQuery]=useState('')
 const [surah,setSurah]=useState(null)
 const [bookmark,setBookmark]=useState(()=>localStorage.getItem('masrif-bookmark'))
 const [translation,setTranslation]=useState('en')
 const [track,setTrack]=useState('')
 const [audioError,setAudioError]=useState(false)
 const list=useWorshipData('/quran/surahs')
 const reader=useWorshipData(surah?'/quran/surah/'+surah.number:null)
 const matches=(list.data?.surahs||[]).filter(item=>[item.number,item.name_ar,item.name_translit,item.english_name].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
 function open(item) {
   setSurah(item)
   setTrack('')
   localStorage.setItem(quranKey,item.name_translit)
   localStorage.setItem(readingNumberKey,String(item.number))
 }
 function play(segment) {setAudioError(false);setTrack(segment)}
 if(surah) return <div className="stack">
  <div className="module-panel"><h2>{surah.name_translit}</h2><span lang="ar" dir="rtl">{surah.name_ar}</span><p>{surah.total_verses} verses</p></div>
  <Dropdown label="Translation" value={translation} onChange={setTranslation} options={[{value:'en',label:'English'},{value:'ms',label:'Malay'}]}/>
  <div className="two"><Button kind="secondary" onClick={()=>play('surah/'+surah.number)}>Recite surah</Button><Button kind="secondary" onClick={()=>{localStorage.setItem('masrif-bookmark',surah.name_translit);setBookmark(surah.name_translit)}}>{bookmark===surah.name_translit?'Bookmarked':'Bookmark surah'}</Button></div>
  {track&&<audio className="worship-audio" key={track} src={worshipApi+'/quran/audio/'+track} controls autoPlay onError={()=>setAudioError(true)}/>}
  {audioError&&<p className="notice" role="status">Audio is temporarily unavailable.</p>}
  <RequestNotice request={reader} reader/>
  {(reader.data?.verses||[]).map(verse=><article className="module-panel verse-card" key={verse.verse_number}>
    <div className="row"><strong>Verse {verse.verse_number}</strong><button className="text-button" onClick={()=>play(surah.number+'/'+verse.verse_number)}>Play verse</button></div>
    <div className="worship-arabic" lang="ar" dir="rtl">{verse.text_ar}</div>
    {verse.transliteration&&<p>{verse.transliteration}</p>}
    <p lang={translation}>{(translation==='ms'?verse.translation_ms:verse.translation_en)||'Translation unavailable.'}</p>
  </article>)}
  <Button kind="secondary" onClick={()=>{setTrack('');setSurah(null)}}>Back to surah list</Button>
 </div>
 const resume=list.data?.surahs?.find(item=>String(item.number)===localStorage.getItem(readingNumberKey)||item.name_translit===localStorage.getItem(quranKey))||list.data?.surahs?.[0]
 return <div className="stack">
  <div className="module-panel"><h2>Start reading</h2><p>Malay and English translations</p><Button disabled={!resume} onClick={()=>open(resume)}>{resume&&localStorage.getItem(quranKey)?'Continue reading':'Start reading'}</Button></div>
  <input type="search" aria-label="Search surahs" placeholder="Search surahs" value={query} onChange={event=>setQuery(event.target.value)}/>
  <h2>Surah list</h2><RequestNotice request={list}/>
  {matches.map(item=><button className="module-row quran-row" key={item.number} onClick={()=>open(item)}><span className="tile-icon">{item.number}</span><span><strong>{item.name_translit}</strong><small>{item.english_name} · {item.total_verses} verses</small></span><span lang="ar" dir="rtl">{item.name_ar}</span></button>)}
  {list.data&&!matches.length&&<p role="status">No surahs match your search.</p>}
 </div>
}

function Duas() {
 const request=useWorshipData('/duas')
 const [query,setQuery]=useState('')
 const [category,setCategory]=useState('')
 const [selected,setSelected]=useState(null)
 const entries=request.data?.duas||[]
 const categories=[...new Set(entries.map(item=>item.category))]
 const matches=entries.filter(item=>(!category||item.category===category)&&[item.title,item.arabic,item.transliteration,item.translation].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
 if(selected) return <div className="stack">
  <article className="module-panel verse-card"><small>{selected.category}</small><h2>{selected.title}</h2><div className="worship-arabic" lang="ar" dir="rtl">{selected.arabic}</div>
  {selected.transliteration&&<><h3>Transliteration</h3><p>{selected.transliteration}</p></>}
  {selected.translation&&<><h3>Meaning</h3><p>{selected.translation}</p></>}
  {selected.reference&&<small>{selected.reference}</small>}</article>
  <Button kind="secondary" onClick={()=>setSelected(null)}>Back to Duas</Button>
 </div>
 return <div className="stack"><h2>Daily supplications</h2><Dropdown label="Category" value={category} onChange={setCategory} options={[{value:'',label:'All categories'},...categories]}/>
  <input type="search" aria-label="Search duas" placeholder="Search duas" value={query} onChange={event=>setQuery(event.target.value)}/><RequestNotice request={request}/>
  {matches.map(item=><button className="module-row" key={item.id} onClick={()=>setSelected(item)}><span><strong>{item.title}</strong><small>{item.category}</small></span><Icon name="arrow" size={18}/></button>)}
  {request.data&&!matches.length&&<p role="status">No duas match your search.</p>}
 </div>
}

function Tasbih() {
 const [count,setCount]=useState(0)
 const [target,setTarget]=useState(33)
 return <div className="stack tasbih-view">
  <h2>Remember and reflect</h2>
  <div className="segments" aria-label="Tasbih target">{[33,99,100].map(value=><button key={value} aria-pressed={value===target} onClick={()=>{if(value!==target){setTarget(value);setCount(0)}}}>{value}</button>)}</div>
  <button className="tasbih-counter" aria-label={'Count dhikr, '+count+' of '+target} disabled={count>=target} onClick={()=>setCount(value=>Math.min(value+1,target))}><strong>{count}</strong><span> / {target}</span></button>
  <p role="status">{count===target?'MashaAllah, target reached.':'Tap the circle to count.'}</p>
  <Button kind="secondary" onClick={()=>setCount(0)}>Reset</Button>
 </div>
}

function Qibla() {
 const [bearing,setBearing]=useState(null)
 const [locationNote,setLocationNote]=useState('Detecting your location…')
 const [heading,setHeading]=useState(null)
 const [manualHeading,setManualHeading]=useState(0)
 const [compass,setCompass]=useState(false)
 const [sensorNote,setSensorNote]=useState('')
 useEffect(()=>{
   let active=true
   const fallback=()=>{if(active) setLocationNote('Location unavailable. Showing Kuala Lumpur as an example.')}
   if(!navigator.geolocation){fallback();return}
   navigator.geolocation.getCurrentPosition(({coords})=>{
     if(active){setBearing(qiblaBearing(coords.latitude,coords.longitude));setLocationNote('Bearing from your detected location')}
   },fallback,{timeout:8000,maximumAge:300000})
   return ()=>{active=false}
 },[])
 useEffect(()=>{
   if(!compass) return
   function readHeading(event) {
     if(Number.isFinite(event.webkitCompassHeading)&&event.webkitCompassHeading>=0) {
       setHeading(event.webkitCompassHeading%360)
     } else if((event.absolute||event.type==='deviceorientationabsolute')&&Number.isFinite(event.alpha)) {
       setHeading((360-event.alpha)%360)
     }
   }
   window.addEventListener('deviceorientationabsolute',readHeading)
   window.addEventListener('deviceorientation',readHeading)
   const timeout=setTimeout(()=>setSensorNote('If the arrow stays still, use the bearing with your device compass.'),4000)
   return ()=>{clearTimeout(timeout);window.removeEventListener('deviceorientationabsolute',readHeading);window.removeEventListener('deviceorientation',readHeading)}
 },[compass])
 async function enable() {
   const sensor=window.DeviceOrientationEvent
   if(!sensor){setSensorNote('Device compass unavailable. Use the bearing shown above.');return}
   try {
     if(typeof sensor.requestPermission==='function'&&await sensor.requestPermission()!=='granted'){setSensorNote('Compass permission was declined.');return}
     setCompass(true)
     setSensorNote('Waiting for compass reading…')
   } catch {setSensorNote('Device compass unavailable. Use the bearing shown above.')}
 }
 const angle=bearing??qiblaBearing(3.139,101.687)
 const live=compass&&heading!==null
 const direction=live?heading:manualHeading
 const offset=(angle-direction+540)%360-180
 const difference=Math.round(Math.abs(offset))
 const aligned=Math.abs(offset)<=5
 const guidance=aligned?'Facing Qibla':(offset>0?'Turn right':'Turn left')+' '+difference+'°'
 function stop() {
   setCompass(false)
   setHeading(null)
   setSensorNote('')
 }
 return <div className="stack qibla-view">
  <div className="qibla-location"><Icon name="pin" size={18}/><small role="status">{locationNote}</small></div>
  <div className={'qibla-instrument'+(aligned?' is-aligned':'')}>
   <div className="qibla-target" aria-hidden="true"/>
   <div className="qibla-face" role="img" aria-label={'Qibla '+angle+' degrees from true north, facing '+Math.round(direction)%360+' degrees'}>
    <div className="qibla-rose" style={{transform:'rotate('+(-direction)+'deg)'}} aria-hidden="true">
     {['N','E','S','W'].map((point,index)=><span key={point} className={'qibla-cardinal point-'+index} style={{transform:'rotate('+direction+'deg)'}}>{point}</span>)}
    </div>
    <div className="qibla-needle" style={{transform:'rotate('+offset+'deg)'}} aria-hidden="true"><span/></div>
    <div className="qibla-degree" aria-hidden="true"><strong>{angle}°</strong><small>Qibla bearing</small></div>
   </div>
   <p className="qibla-guidance">{aligned&&<span aria-hidden="true">✓ </span>}{guidance}</p>
   <small>{live?'Live device compass':'Manual preview'}</small>
  </div>
  <div className="module-panel qibla-controls">
   {live?<p>Hold your phone flat in portrait and turn until the arrow points forward.</p>:<>
    <div className="row"><label htmlFor="qibla-heading">Preview heading</label><output htmlFor="qibla-heading">{manualHeading}°</output></div>
    <input id="qibla-heading" type="range" min="0" max="359" value={manualHeading} onChange={event=>setManualHeading(Number(event.target.value))}/>
    <div className="row"><button className="text-button" onClick={()=>setManualHeading(0)}>Reset to north</button><button className="text-button" onClick={()=>setManualHeading(angle)}>Align to Qibla</button></div>
   </>}
  </div>
  <Button onClick={compass?stop:enable}>{compass?'Stop live compass':'Activate live compass'}</Button>
  {sensorNote&&!live&&<p className="notice" role="status">{sensorNote}</p>}
 </div>
}

function Mosques() {
 const [view,setView]=useState('list')
 const [query,setQuery]=useState('')
 const [state,setState]=useState('')
 const [district,setDistrict]=useState('')
 const [category,setCategory]=useState('')
 const [nearby,setNearby]=useState(null)
 const [locationStatus,setLocationStatus]=useState('')
 const [page,setPage]=useState(1)
 const [selected,setSelected]=useState(null)
 const params=new URLSearchParams({page:String(page),per_page:'30',category:category||'masjid,surau'})
 if(query.trim()) params.set('q',query.trim())
 if(state) params.set('state',state)
 if(district) params.set('district',district)
 if(nearby){params.set('lat',nearby.lat);params.set('long',nearby.lon);params.set('radius_km','20')}
 const directory=useWorshipData('/places?'+params,260)
 const filters=useWorshipData('/masjids/filters'+(state?'?state='+encodeURIComponent(state):''))
 const entries=directory.data?.masjids||[]
 const mapped=entries.filter(item=>item.lat&&item.lng&&Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lng)))
 const place=mapped.find(item=>item.id===selected)||mapped[0]
 function update(setter,value) {setter(value);setPage(1);setSelected(null)}
 function locate() {
   const unavailable=()=>setLocationStatus('Location unavailable. Search by name or area.')
   if(!navigator.geolocation){unavailable();return}
   setLocationStatus('Finding places near you…')
   navigator.geolocation.getCurrentPosition(({coords})=>{
     update(setNearby,{lat:coords.latitude.toFixed(2),lon:coords.longitude.toFixed(2)})
     setLocationStatus('Showing places within 20 km of your approximate location.')
   },unavailable,{timeout:8000,maximumAge:300000})
 }
 return <div className="stack">
  <div><h2>Find a place to pray</h2><p className="planning-note">Browse mosques and prayer rooms.</p></div>
  <div className="segments" aria-label="Directory view">{['list','map'].map(item=><button key={item} aria-pressed={view===item} onClick={()=>setView(item)}>{item==='list'?'List':'Map'}</button>)}</div>
  <input aria-label="Search name, address or town" type="search" placeholder="Search name, address or town" value={query} onChange={event=>update(setQuery,event.target.value)}/>
  <div className="two">
   <Dropdown ariaLabel="State" value={state} onChange={value=>{update(setState,value);setDistrict('')}} options={[{value:'',label:'All states'},...(filters.data?.states||[])]}/>
   <Dropdown ariaLabel="District" value={district} onChange={value=>update(setDistrict,value)} options={[{value:'',label:'All districts'},...(filters.data?.districts||[])]}/>
  </div>
  <div className="segments" aria-label="Place type">{[['','All'],['masjid','Mosque'],['surau','Prayer room']].map(([key,label])=><button key={key} aria-pressed={category===key} onClick={()=>update(setCategory,key)}>{label}</button>)}</div>
  <div className="two"><Button kind="secondary" onClick={locate}>Find nearby</Button>{nearby&&<Button kind="secondary" onClick={()=>{update(setNearby,null);setLocationStatus('')}}>Clear location</Button>}</div>
  {locationStatus&&<p role="status" className="planning-note">{locationStatus}</p>}
  <RequestNotice request={directory}/>
  {view==='map'&&place&&<div className="stack"><Dropdown label="Map location" value={place.id} onChange={setSelected} options={mapped.map(item=>({value:item.id,label:item.name}))}/><PlaceMap place={place}/><PlaceDetails place={place}/></div>}
  {view==='map'&&entries.length>0&&!place&&<p className="notice">Map coordinates are unavailable for these places.</p>}
  {view==='list'&&entries.map(item=><div className="stack" key={item.id}><button className="module-row" onClick={()=>setSelected(selected===item.id?null:item.id)} aria-expanded={selected===item.id}><span><strong>{item.name}</strong><small>{item.address||[item.district,item.state].filter(Boolean).join(', ')}</small></span><Icon name="arrow" size={18}/></button>{selected===item.id&&<PlaceDetails place={item}/>}</div>)}
  {directory.data&&!entries.length&&<p role="status">No places match these filters.</p>}
  {(page>1||directory.data?.has_more)&&<div className="two"><Button kind="secondary" disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</Button><Button kind="secondary" disabled={!directory.data?.has_more} onClick={()=>setPage(page+1)}>Next page</Button></div>}
 </div>
}

function PlaceMap({place}) {
 const lat=Number(place.lat),lon=Number(place.lng),delta=.018
 const query=new URLSearchParams({bbox:[lon-delta,lat-delta,lon+delta,lat+delta].join(','),layer:'mapnik',marker:lat+','+lon})
 return <iframe sandbox="allow-scripts allow-same-origin" className="worship-map" title={'Map of '+place.name} loading="lazy" src={'https://www.openstreetmap.org/export/embed.html?'+query}/>
}

function PlaceDetails({place}) {
 const coordinates=place.lat&&place.lng?place.lat+','+place.lng:null
 return <article className="module-panel"><h2>{place.name}</h2><p>{place.address||[place.district,place.state].filter(Boolean).join(', ')}</p>{place.distance_km!=null&&<small>{Number(place.distance_km).toFixed(1)} km away</small>}{coordinates&&<ExternalLink href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(coordinates)}>Get directions <Icon name="arrow" size={16}/></ExternalLink>}</article>
}

