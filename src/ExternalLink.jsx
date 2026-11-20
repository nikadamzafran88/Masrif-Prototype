import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export function ExternalLink({href,children,className='text-button',...props}) {
  const [confirm,setConfirm] = useState(false)
  const destination = new URL(href,window.location.origin)
  const phone = destination.protocol==='tel:'
  const email = destination.protocol==='mailto:'
  const title = phone ? 'Open your phone app?' : email ? 'Open your email app?' : 'Open in browser?'
  const name = phone||email ? destination.pathname : destination.hostname
  const action = phone?'Open phone app':email?'Open email app':'Open link'

  function open() {
    setConfirm(false)
    if (phone||email) window.location.assign(destination.href)
    else if (destination.protocol==='https:'||destination.protocol==='http:') {
      window.open(destination.href,'_blank','noopener,noreferrer')
    }
  }

  return <>
    <button type="button" className={className} {...props} aria-haspopup="dialog" onClick={()=>setConfirm(true)}>{children}</button>
    {confirm&&<ConfirmDialog title={title} action={action} onConfirm={open} onCancel={()=>setConfirm(false)}>
      <p>{phone?'Phone number':email?'Email address':'Destination'}<br/><strong className="external-destination">{name}</strong></p>
    </ConfirmDialog>}
  </>
}
