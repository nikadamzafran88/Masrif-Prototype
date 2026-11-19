import { money } from './demo'

export const receiptLogo = '/masrif/access-logo-light.svg'
export const receiptBrand = 'by ATLAS Bank Muamalat'
export const receiptNotice = 'Demo receipt. No money moved.'

export function receiptDetails(item) {
 return {
   amount:money(Math.abs(item.amount)),
   rows:[
     ['Status','Successful'],
     ['Recipient',item.name],
     ['Date',item.date],
     ['Reference',item.reference?.trim()||item.id],
     ...(item.reference?.trim()&&item.reference.trim()!==item.id?[['Transaction ID',item.id]]:[]),
     ['Category',item.category],
     ...(item.zakatType?[['Zakat type',item.zakatType]]:[]),
     ...(item.bank?[['Bank',item.bank],['Account','•••• '+item.account]]:[]),
   ],
 }
}
