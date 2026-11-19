import { useId, useLayoutEffect, useRef, useState } from 'react'

export function Dropdown({label, ariaLabel, options, value, onChange, disabled, className = '', placeholder = 'Select an option'}) {
  const id = useId()
  const trigger = useRef(null)
  const menu = useRef(null)
  const search = useRef({text:'', time:0})
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const selected = options.findIndex(option => (typeof option === 'string' ? option : option.value) === value)
  const isOpen = open && !disabled && options.length > 0
  const optionLabel = option => typeof option === 'string' ? option : option.label

  useLayoutEffect(() => {
    if (!isOpen) return
    const button = trigger.current
    const panel = menu.current
    panel.showPopover?.()
    function position(event) {
      if (event?.target === panel) return
      const rect = button.getBoundingClientRect()
      const bounds = button.closest('.app')?.getBoundingClientRect()
      const top = Math.max(0, bounds?.top ?? 0)
      const bottom = Math.min(window.innerHeight, bounds?.bottom ?? window.innerHeight)
      if (rect.bottom <= top || rect.top >= bottom) {
        setOpen(false)
        return
      }
      const below = Math.max(0, bottom - rect.bottom - 12)
      const above = Math.max(0, rect.top - top - 12)
      const placeAbove = below < Math.min(panel.scrollHeight, 240) && above > below
      panel.style.left = rect.left + 'px'
      panel.style.width = rect.width + 'px'
      panel.style.maxHeight = Math.min(240, placeAbove ? above : below) + 'px'
      panel.style.top = (placeAbove ? rect.top - panel.offsetHeight - 6 : rect.bottom + 6) + 'px'
    }
    function dismiss(event) {
      if (!button.contains(event.target) && !panel.contains(event.target)) setOpen(false)
    }
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    document.addEventListener('pointerdown', dismiss)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
      document.removeEventListener('pointerdown', dismiss)
      if (panel.isConnected) panel.hidePopover?.()
    }
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen || active < 0) return
    const panel = menu.current
    const option = panel.children[active]
    if (!option) return
    const top = option.offsetTop
    const bottom = top + option.offsetHeight
    if (top < panel.scrollTop) panel.scrollTop = top
    else if (bottom > panel.scrollTop + panel.clientHeight) panel.scrollTop = bottom - panel.clientHeight
  }, [isOpen, active])

  function choose(index) {
    const option = options[index]
    if (option === undefined) return
    onChange(typeof option === 'string' ? option : option.value)
    setOpen(false)
  }

  function handleKey(event) {
    const {key} = event
    if (key === 'Tab') {
      setOpen(false)
      return
    }
    if (key === 'Escape' && isOpen) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      return
    }
    if (['ArrowDown','ArrowUp','Home','End'].includes(key)) {
      event.preventDefault()
      setOpen(true)
      if (key === 'Home' || key === 'End') setActive(key === 'Home' ? 0 : options.length - 1)
      else if (!isOpen) setActive(selected >= 0 ? selected : key === 'ArrowDown' ? 0 : options.length - 1)
      else setActive(Math.min(options.length - 1, Math.max(0, active + (key === 'ArrowDown' ? 1 : -1))))
      return
    }
    if (isOpen && (key === 'Enter' || key === ' ')) {
      event.preventDefault()
      choose(active)
      return
    }
    if (key.length === 1 && key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now()
      const text = (now - search.current.time < 600 ? search.current.text : '') + key.toLowerCase()
      search.current = {text, time:now}
      const match = options.findIndex(option => optionLabel(option).toLowerCase().startsWith(text))
      if (match >= 0) {
        event.preventDefault()
        setOpen(true)
        setActive(match)
      }
    }
  }

  return <div className={'masrif-dropdown '+className}>
    {label&&<span id={id+'-label'} className="masrif-dropdown-label">{label}</span>}
    <button ref={trigger} type="button" className="masrif-dropdown-trigger" role="combobox"
      aria-labelledby={label ? id+'-label' : undefined} aria-label={label ? undefined : ariaLabel}
      aria-expanded={isOpen} aria-controls={isOpen ? id+'-options' : undefined}
      aria-activedescendant={isOpen && options[active] !== undefined ? id+'-option-'+active : undefined}
      disabled={disabled || !options.length} onKeyDown={handleKey} onBlur={()=>setOpen(false)}
      onClick={()=>{setActive(Math.max(selected,0));setOpen(!isOpen)}}>
      <span>{selected < 0 ? placeholder : optionLabel(options[selected])}</span>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    {isOpen&&<div ref={menu} id={id+'-options'} className="masrif-dropdown-menu" role="listbox"
      aria-labelledby={label ? id+'-label' : undefined} aria-label={label ? undefined : ariaLabel}
      popover="manual" onMouseDown={event=>event.preventDefault()}>
      {options.map((option,index)=><div key={typeof option === 'string' ? option : option.value} id={id+'-option-'+index}
        className="masrif-dropdown-option" role="option" aria-selected={selected===index} data-active={active===index}
        onClick={()=>choose(index)}>
        <span>{optionLabel(option)}</span>{selected===index&&<span className="masrif-dropdown-check" aria-hidden="true">✓</span>}
      </div>)}
    </div>}
  </div>
}
