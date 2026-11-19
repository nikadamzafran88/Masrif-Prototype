// Read once, before main.jsx rewrites the URL. Embed mode is used by the
// "All screens" overview: each frame loads the app pinned to one screen.
const params = new URLSearchParams(location.search)
export const isEmbed = params.get('embed') === '1'
export const embedScreen = isEmbed ? params.get('screen') : null

// Transfer steps need a filled-in draft to render outside the normal flow.
export function seedDraft(path) {
  if (!path.startsWith('/transfer/')) return {}
  return {
    id: 'preview-transfer', origin: '/account',
    bank: 'Bank Muamalat', account: '12345673345',
    confirmedBank: 'Bank Muamalat', confirmedAccount: '12345673345',
    amount: '50.00', reference: 'Lunch',
  }
}
