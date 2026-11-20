import { useEffect, useId, useRef } from 'react'
import { Button } from './ui'

export function ConfirmDialog({title,children,action,onConfirm,onCancel,cancelLabel='Cancel',destructive=false}) {
  const dialog = useRef(null)
  const cancel = useRef(null)
  const id = useId()
  useEffect(()=>{
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    cancel.current?.focus()
    return ()=>{
      element.close()
      if (previous?.isConnected) previous.focus()
    }
  },[])
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby={id} onCancel={event=>{event.preventDefault();onCancel()}}>
    <div className="stack">
      <h2 id={id}>{title}</h2>
      {children}
      <Button kind={destructive?'danger':'primary'} onClick={onConfirm}>{action}</Button>
      <button ref={cancel} className="button secondary" onClick={onCancel}>{cancelLabel}</button>
    </div>
  </dialog>
}
