import { useEffect, useState } from 'react'

export const receiveCode = amount => 'MASRIF-DEMO:RECEIVE:'+amount
export const cashierCode = expiry => 'MASRIF-DEMO:CASHIER:'+expiry

export function decodeDemoPayment(payload) {
  const receive = payload.match(/^MASRIF-DEMO:RECEIVE:(\d{1,10})$/)
  if (receive) return {kind:'receive',name:'Farah Amin',amount:Number(receive[1])}
  const cashier = payload.match(/^MASRIF-DEMO:CASHIER:(\d{13})$/)
  if (cashier) return {kind:Number(cashier[1])>Date.now()?'cashier':'expired'}
  return {kind:payload==='MASRIF-DEMO:CAMPUS-BOOKSHOP'?'sample':'other'}
}

export function usePaymentCode(payload,barcode='') {
  const [result,setResult] = useState(null)
  useEffect(()=>{
    if (!payload) return
    let active = true
    async function generate() {
      try {
        const {default:QR} = await import('qrcode')
        const image=await QR.toDataURL(payload,{width:300,margin:4,errorCorrectionLevel:'M'})
        let bars
        if (barcode) {
          const {default:drawBarcode}=await import('jsbarcode')
          const canvas=document.createElement('canvas')
          drawBarcode(canvas,barcode,{format:'CODE128',width:1.5,height:42,margin:12,displayValue:false})
          bars=canvas.toDataURL()
        }
        if (active) setResult({payload,image,bars})
      } catch {
        if (active) setResult({payload,error:true})
      }
    }
    generate()
    return ()=>{active=false}
  },[payload,barcode])
  return result?.payload===payload ? result : null
}
