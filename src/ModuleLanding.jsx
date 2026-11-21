import { Pintar } from './Pintar'
import { Procurement } from './Procurement'

export function ModuleLanding({slug,dark}) {
  if (slug === 'pintar') return <Pintar dark={dark}/>
  return <Procurement dark={dark}/>
}
