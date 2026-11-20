export const steps = ['bank','recipient','verify','amount','review','authorise']
const headings = ['Transfer','Transfer','Check recipient','Amount','Review payment','Approve payment']
export function transferHeading(step) { return headings[steps.indexOf(step)] || 'Transfer' }

export const modules = [['Zakat','Giving services','heart','zakat'],['Pintar','Education services','book','pintar'],['e-Procurement','Supplier services','grid','e-procurement'],['Muslim Companion','Prayer and reading tools','compass','companion']]
export const tools = [['Quran','book','quran'],['Yasin','book'],['Tahlil','book'],['Duas','heart','duas'],['99 Names','book'],['Tasbih','heart','tasbih'],['Qibla','compass','qibla'],['Mosques','pin','mosques']]
export const companion = '/modules/companion'
export const extraTitles = {'/modules/companion/prayer-times':'Prayer times','/modules/companion/quran':'Al-Quran','/modules/companion/qibla':'Qibla direction','/modules/companion/mosques':'Mosques & Prayer Rooms','/profile/settings/appearance':'Appearance','/pay/scan':'Scan QR','/pay/receive':'Receive money','/pay/code':'Show to pay','/pay/recipients':'Saved recipients','/account/planning':'Planning',...Object.fromEntries(modules.map(([name,,,slug])=>['/modules/'+slug,name])),...Object.fromEntries(tools.filter(([, ,slug])=>slug).map(([name,,slug])=>[companion+'/'+slug,({quran:'Al-Quran',qibla:'Qibla direction',mosques:'Mosques & Prayer Rooms'})[slug]||name]))}



export const profileLinks = [
 ['Personal details','personal'],['Cards','cards'],['Add card','cards/add'],['Security','security'],['Devices','devices'],
 ['Notification settings','notifications'],['App settings','settings'],
 ['Help and support','help'],['Legal','legal'],
]



export const accessTitles = {
 '/': 'Masrif', '/language': 'Choose your language', '/welcome': 'Welcome to Masrif',
 '/start': 'Masrif', '/register': 'Register', '/register/otp': 'Verify',
 '/register/details': 'Your details', '/register/mykad': 'Verify identity', '/register/selfie': 'Verify identity',
 '/register/verification': 'Verification result', '/register/attention': 'Verification needs attention',
 '/register/identity-review': 'Identity review', '/register/address': 'Address',
 '/register/guardian': 'Guardian required', '/register/consent': 'Terms and consent',
 '/register/pin': 'Create PIN', '/register/biometrics': 'Enable biometrics', '/register/funding': 'Activate account', '/register/tour': 'Quick tour',
 '/register/complete': 'Registration success', '/register/pending': 'Activation pending',
 '/link-atlas': 'Link ATLAS account', '/link-atlas/pending': 'Account linking pending', '/link-atlas/confirmed': 'Atlas account linked',
 '/link-atlas/already-linked': 'Already linked', '/login': 'Sign in', '/login/welcome': 'Welcome to Masrif', '/login/locked': 'Account locked',
 '/login/identity': 'Verify your identity', '/login/recovery': 'Forgot PIN',
 '/login/recovery/code': 'Verify code', '/login/recovery/identity': 'Verify identity', '/login/recovery/pin': 'Create new PIN',
}



export const profileDetailTitles = {
 'settings/delete-account':'Delete account',
 'security/pin':'Change PIN', 'settings/appearance':'Appearance', 'settings/language':'Language',
 'help/faq':'FAQ', 'help/contact':'Contact support', 'help/report':'Report a problem', 'help/lock':'Lock my account',
 'legal/terms':'Terms of Use', 'legal/privacy':'Privacy Notice',
 'legal/consent':'Consent history', 'legal/licences':'Open-source licences',
}

