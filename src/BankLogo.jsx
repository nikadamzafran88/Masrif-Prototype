import { useState } from 'react'
import { Icon } from './ui'

// PayNet's issuer branding pack and institution-published logos.
const logos = {
  'Bank Muamalat':'muamalat.png', Maybank:'maybank.png', CIMB:'cimb.png',
  'Public Bank':'public-bank.png', 'RHB Bank':'rhb.png', 'Hong Leong Bank':'hong-leong.png',
  AmBank:'ambank.png', 'Bank Islam':'bank-islam.png', 'Bank Rakyat':'bank-rakyat.png',
  'Bank Simpanan Nasional':'bsn.png', Agrobank:'agrobank.png', 'Affin Bank':'affin.png',
  'Affin Islamic Bank':'affin-islamic.png', 'Alliance Bank':'alliance.png',
  'Alliance Islamic Bank':'alliance.png', 'Al Rajhi Bank':'al-rajhi.png',
  'AmBank Islamic':'ambank-islamic.png', 'Bangkok Bank':'bangkok.svg',
  'Bank of America Malaysia':'bofa.png', 'Bank of China Malaysia':'boc.png',
  'Bank Pembangunan Malaysia':'bpmb.svg', 'BNP Paribas Malaysia':'bnp.png',
  'China Construction Bank Malaysia':'ccb.svg', 'CIMB Islamic Bank':'cimb-islamic.png',
  'Citibank Malaysia':'citi.svg', 'Deutsche Bank Malaysia':'deutsche.png',
  'EXIM Bank Malaysia':'exim.svg', 'Hong Leong Islamic Bank':'hong-leong-islamic.png',
  'HSBC Malaysia':'hsbc.png', 'HSBC Amanah':'hsbc.png', 'ICBC Malaysia':'icbc.png',
  'J.P. Morgan Chase Bank':'jpm.png', 'Kuwait Finance House Malaysia':'kfh.png',
  'Maybank Islamic':'maybank-islamic.png', 'MBSB Bank':'mbsb.png',
  'Mizuho Bank Malaysia':'mizuho.svg', 'MUFG Bank Malaysia':'mufg.png',
  'OCBC Bank':'ocbc.png', 'OCBC Al-Amin':'ocbc-al-amin.png',
  'Public Islamic Bank':'public-islamic.png', 'RHB Islamic Bank':'rhb.png',
  'SME Bank':'sme.svg', 'Standard Chartered Malaysia':'standard-chartered.png',
  'Standard Chartered Saadiq':'saadiq.png', 'Sumitomo Mitsui Banking Corporation Malaysia':'smbc.png',
  'UOB Malaysia':'uob.png', 'AEON Bank':'aeon.png', 'Boost Bank':'boost.png',
  GXBank:'gxbank.png', 'KAF Digital Bank':'kaf.png', 'Ryt Bank':'ryt.png',
}

export function BankLogo({bank}) {
  const [failed,setFailed] = useState(null)
  const file=logos[bank]
  return <span className={bank === 'Ryt Bank' ? 'bank-logo bank-logo-ryt' : 'bank-logo'} aria-hidden="true">{file&&failed!==file
    ? <img src={'/masrif/banks/'+file} alt="" width="64" height="34" loading="lazy" onError={()=>setFailed(file)}/>
    : <Icon name="account" size={20}/>}</span>
}
