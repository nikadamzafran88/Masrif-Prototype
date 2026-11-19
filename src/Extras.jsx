import { PayViews } from './PayViews'


import { Button, Icon, Tile } from './ui'
import { ModuleLanding } from './ModuleLanding'
import { CompanionTool } from './CompanionTools'
import { CompanionPrayerHeader } from './CompanionPrayerHeader'

import { modules, tools, companion } from './routes'

export function Extras({path,go,balance,newTransfer,onPayment,dark=false,onCompanionSummary}) {
 if(path==='/modules') return <div className="two module-grid">{modules.map(([name,description,,slug])=><button className="feature-card" key={slug} onClick={()=>go('/modules/'+slug)}>
   <span className="feature-card-top">
     <img className="module-tile-art" src={'/masrif/module-'+slug+'-light.svg'} width="48" height="48" alt=""/>
     <span className="feature-card-arrow"><Icon name="arrow" size={15}/></span>
   </span>
   <span className="feature-card-copy"><strong>{name}</strong><small>{description}</small></span>
 </button>)}</div>
 if(path===companion) return <div className="stack companion-flow">
   <CompanionPrayerHeader onSummary={onCompanionSummary} onPrayerTimes={()=>go(companion+'/prayer-times')}/>
   {['Reading & Duas','Worship Tools'].map((heading,index)=><section key={heading}><h2>{heading}</h2><div className="two companion-tiles">{tools.slice(index*4,index*4+4).map(([name,icon,slug])=><Tile key={name} icon={icon} label={slug?name:name+' · Coming soon'} disabled={!slug} onClick={()=>go(companion+'/'+slug)}/>)}</div></section>)}
   <button className="module-row companion-reading" onClick={()=>go(companion+'/quran')}><span><strong>Continue reading</strong><small>{localStorage.getItem('masrif-reading') || 'Al-Fatihah'} · Verse 1</small></span><Icon name="arrow" size={18}/></button>
 </div>
 if(path.startsWith(companion+'/')) return <CompanionTool tool={path.split('/').at(-1)}/>
 const module = modules.find(([, , ,slug])=>path==='/modules/'+slug)
 if(module) return <ModuleLanding slug={module[3]} dark={dark}/>
 if(path==='/pay'||path.startsWith('/pay/')) return <PayViews path={path} dark={dark} go={go} balance={balance} newTransfer={newTransfer} onPayment={onPayment}/>
 return <div className="stack"><p className="notice">This page is unavailable in the demo.</p><Button onClick={()=>go('/home')}>Return home</Button></div>
}

