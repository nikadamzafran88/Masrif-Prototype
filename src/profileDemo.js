import { readDemo } from './demoStorage'

export const alertsKey = 'masrif-demo-alerts'
export const marketingHistoryKey = 'masrif-demo-marketing-history'
export const biometricKey = 'masrif-demo-biometrics'

export function addDemoAlert(category, title, detail) {
  const alerts = readDemo(alertsKey, [])
  localStorage.setItem(alertsKey, JSON.stringify([
    [crypto.randomUUID(), category, title, detail, new Date().toLocaleDateString('en-MY')],
    ...alerts,
  ]))
}

export function setMarketingPreference(enabled) {
  const history = readDemo(marketingHistoryKey, [])
  localStorage.setItem(marketingHistoryKey, JSON.stringify([
    { enabled, date: new Date().toISOString() }, ...history,
  ]))
}
