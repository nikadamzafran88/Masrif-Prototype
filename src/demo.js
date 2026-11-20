import { catalogueRecipient } from './bankCatalogue.js'
export const seed = [
  {id:'M1001', name:'Campus Bookshop', category:'Education', amount:-4850, date:'19 Nov 2026'},
  {id:'M1002', name:'Nur Aisyah', category:'Transfers', amount:15000, date:'18 Nov 2026'},
  {id:'M1003', name:'Kedai Kopi Seri', category:'Food & drink', amount:-1450, date:'17 Nov 2026'},
  {id:'M1004', name:'Study allowance', category:'Income', amount:65000, date:'15 Nov 2026'},
  {id:'M1005', name:'Rapid KL', category:'Transport', amount:-1200, date:'14 Nov 2026'},
]
// Today's date in Malaysia time, e.g. "19 Nov 2026", for new transactions.
export const today = () => new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).replace('Sept','Sep')
export const opening = 171950
export const money = amount => 'RM ' + (amount / 100).toLocaleString('en-MY', {minimumFractionDigits:2, maximumFractionDigits:2})
export const balanceOf = records => opening + records.reduce((sum, item) => sum + (item.status && item.status !== 'Successful' ? 0 : item.amount), 0)
export function parseAmount(value) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return 0
  const [ringgit, sen = ''] = value.split('.')
  return Number(ringgit) * 100 + Number(sen.padEnd(2, '0'))
}
export function settle(records, item) {
  if (records.some(record => record.id === item.id)) return records
  return [item.status === 'Successful' && -item.amount > balanceOf(records) ? {...item, status:'Failed'} : item, ...records]
}

export function resolvePending(records, id) {
  const pending = records.find(record => record.id === id && record.status === 'Pending')
  if (!pending) return records
  const status = -pending.amount <= balanceOf(records) ? 'Successful' : 'Failed'
  return records.map(record => record === pending ? {...record,status} : record)
}

export function matchingPendingTransfer(records, recipient, amount) {
  if (!recipient || amount<=0) return undefined
  return records.find(item=>item.status==='Pending'&&item.category==='Transfers'&&item.amount===-amount&&item.bank===recipient.bank&&(
    item.recipientAccount ? item.recipientAccount===recipient.account : item.account===recipient.account.slice(-4)&&item.name===recipient.name
  ))
}


export const savedRecipients = [
  {name:'Ahmad Rahman',bank:'Bank Muamalat',account:'12345673345'},
  {name:'Siti Nur',bank:'Maybank',account:'112233447781'},
  {name:'Faiz Hakim',bank:'CIMB',account:'1000001204'},
]
export const extraRecipients = [
  {name:'Nur Aisyah',bank:'Bank Muamalat',account:'1000004812'},
  {name:'Adam Hakim',bank:'Maybank',account:'2000006274'},
]
export function sampleRecipientFor(bank) {
  return savedRecipients.find(item=>item.bank===bank) || catalogueRecipient(bank)
}

export function demoRecipientFor(bank,account) {
  const sample=sampleRecipientFor(bank)
  if(sample?.account===account) return sample
  return extraRecipients.find(item=>item.bank===bank&&item.account===account)
}

export function confirmedTransferRecipient(draft) {
  return draft.confirmedAccount===draft.account&&draft.confirmedBank===draft.bank
    ? demoRecipientFor(draft.bank,draft.account)
    : undefined
}

