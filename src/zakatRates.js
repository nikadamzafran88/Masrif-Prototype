export const fitrahYear = 2026

export const institutions = [
  {
    name: 'MUIP',
    state: 'Pahang',
    logo: 'muip.png',
    income: 'https://zakatpahang.my/calculator/calpendapatan.html?v=1',
    fitrah: 'https://muip.gov.my/sidang-media-pengumuman-kadar-zakat-fitrah-negeri-pahang-1447h-2026m/',
    rates: [[800, 'Local white rice'], [1400, 'Imported rice'], [2100, 'Basmati or equivalent']],
  },
  {
    name: 'MAIDAM',
    state: 'Terengganu',
    logo: 'maidam.png',
    income: 'https://ezakat.maidam.gov.my/online/kalkulator.php',
    fitrah: 'https://www.maidam.gov.my/index.php/pusat-maklumat/berita-semasa/527-kadar-zakat-fitrah-1447h-2026m-negeri-terengganu-bermula-rm10-00',
    rates: [[1000, 'Standard minimum'], [2000, 'Basmati or equivalent']],
  },
  {
    name: 'Zakat Selangor',
    state: 'Selangor',
    logo: 'selangor.png',
    income: 'https://www.zakatselangor.com.my/zakat-pendapatan-2/',
    fitrah: 'https://www.zakatselangor.com.my/kadar-zakat-fitrah-selangor-2026-ditetapkan-rm8-rm16-dan-rm25/',
    rates: [[800, 'Local or imported white rice'], [1600, 'Fragrant, glutinous, parboiled or brown rice'], [2500, 'Basmati, Ponni, Calrose, red or black rice']],
  },
]

export const paymentInstitutions = [
  ...institutions,
  {name:'PPZ-MAIWP', state:'Federal Territories', logo:'ppz.png'},
  {name:'MAIJ', state:'Johor', logo:'johor.png'},
  {name:'MAIPk', state:'Perak', logo:'perak.png'},
  {name:'MAIK', state:'Kelantan', logo:'kelantan.png'},
]

export function estimateIncomeZakat(income, deductions, nisab) {
  const eligible = income - deductions
  return eligible >= nisab ? Math.round(eligible / 40) : 0
}
