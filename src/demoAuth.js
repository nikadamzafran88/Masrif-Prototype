export const demoCode = '123456'
export const savedPinKey = 'masrif-session-demo-pin'
export const lockKey = 'masrif-session-demo-lock'
export const demoContactKey = 'masrif-demo-personal-contact'
export const consentKey = 'masrif-demo-consent'
export const signupDraftKey = 'masrif-session-registration'
export const attemptsKey = 'masrif-session-pin-attempts'
export const recoveryNoticeKey = 'masrif-session-pin-reset'
export const signedOutKey = 'masrif-session-signed-out'
export const signedInKey = 'masrif-session-signed-in'
export function normalizeMalaysianMobile(value) {
  const compact = value.trim().replace(/[\s()-]/g,'')
  const national = compact.replace(/^(?:\+60|60|0)/,'')
  const valid = national.startsWith('11') ? /^11\d{8}$/.test(national) : /^1\d{8}$/.test(national)
  return valid?'+60'+national:''
}

export function formatMobileDigits(normalized) {
  const digits = normalized.slice(3)
  return [digits.slice(0,2),digits.slice(2,-4),digits.slice(-4)].join(' ')
}

export const demoMobile = value => Boolean(normalizeMalaysianMobile(value))
export const storedDemoPin = () => sessionStorage.getItem(savedPinKey) || demoCode

export function nameInitials(name) {
  return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()
}
