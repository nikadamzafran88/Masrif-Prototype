// Demo destinations based on BNM's Financial Sector Participants Directory:
// https://www.bnm.gov.my/regulations/fsp-directory
// Ryt Bank is listed under its trading name (YTL Digital Bank Berhad).
export const banks = [
  'Bank Muamalat','Maybank','CIMB','Public Bank','RHB Bank','Hong Leong Bank',
  'AmBank','Bank Islam','Bank Rakyat','Bank Simpanan Nasional','Agrobank','Affin Bank',
  'Affin Islamic Bank','Alliance Bank','Alliance Islamic Bank','Al Rajhi Bank',
  'AmBank Islamic','Bangkok Bank','Bank of America Malaysia','Bank of China Malaysia',
  'Bank Pembangunan Malaysia','BNP Paribas Malaysia','China Construction Bank Malaysia',
  'CIMB Islamic Bank','Citibank Malaysia','Deutsche Bank Malaysia','EXIM Bank Malaysia',
  'Hong Leong Islamic Bank','HSBC Malaysia','HSBC Amanah','ICBC Malaysia',
  'J.P. Morgan Chase Bank','Kuwait Finance House Malaysia','Maybank Islamic','MBSB Bank',
  'Mizuho Bank Malaysia','MUFG Bank Malaysia','OCBC Bank','OCBC Al-Amin','Public Islamic Bank',
  'RHB Islamic Bank','SME Bank','Standard Chartered Malaysia','Standard Chartered Saadiq',
  'Sumitomo Mitsui Banking Corporation Malaysia','UOB Malaysia',
  'AEON Bank','Boost Bank','GXBank','KAF Digital Bank','Ryt Bank',
]
const aliases = {
  Maybank:'Malayan Banking', CIMB:'CIMB Bank', 'Bank Simpanan Nasional':'BSN',
  'Bank Rakyat':'Bank Kerjasama Rakyat', Agrobank:'Bank Pertanian Malaysia',
  'UOB Malaysia':'United Overseas Bank', 'GXBank':'GX Bank', 'Ryt Bank':'YTL Digital Bank',
  'ICBC Malaysia':'Industrial and Commercial Bank of China',
  'Al Rajhi Bank':'Al Rajhi Banking and Investment Corporation',
  'EXIM Bank Malaysia':'Export Import Bank', 'SME Bank':'Small Medium Enterprise Development Bank',
}
function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g,'')
}
export function searchBanks(query) {
  const term=normalize(query)
  return banks.filter(bank=>normalize(bank+' '+(aliases[bank]||'')).includes(term))
}

const demoAccounts = new Map(banks.map((bank,index)=>[
  bank,{bank,account:'990000'+String(index+1).padStart(4,'0'),name:'Demo recipient'},
]))
export function catalogueRecipient(bank) {
  return demoAccounts.get(bank)
}
