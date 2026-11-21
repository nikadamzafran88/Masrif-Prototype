// Renders every screen listed in src/screens.js to public/screens/*.webp.
// Usage: npm run screens   (builds first, serves dist, drives local Chrome/Edge)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { screenGroups, screenImage } = await import(pathToFileURL(path.join(root, 'src/screens.js')))
const outDir = path.join(root, 'public/screens')
const PORT = 5197, DEBUG = 9337

const browser = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(file => file && fs.existsSync(file))
if (!browser) throw new Error('No Chrome or Edge found. Set CHROME_PATH.')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(check, label) {
  for (let i = 0; i < 60; i++) { try { if (await check()) return } catch {} await wait(250) }
  throw new Error('Timed out waiting for ' + label)
}

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'], {cwd: root, stdio: 'ignore'})
const profile = fs.mkdtempSync(path.join(root, 'node_modules/.capture-'))
const chrome = spawn(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profile, 'about:blank'], {stdio: 'ignore'})
const cleanup = () => { chrome.kill(); server.kill(); try { fs.rmSync(profile, {recursive: true, force: true}) } catch {} }
process.on('exit', cleanup)

try {
  await until(async () => (await fetch(`http://localhost:${PORT}/`)).ok, 'preview server')
  let targets
  await until(async () => (targets = await (await fetch(`http://127.0.0.1:${DEBUG}/json`)).json()).some(t => t.type === 'page'), 'browser')
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => ws.onopen = resolve)
  let id = 0; const pending = new Map()
  ws.onmessage = event => { const m = JSON.parse(event.data); pending.get(m.id)?.(m.result); pending.delete(m.id) }
  const send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({id: n, method, params})) })
  const run = async expression => (await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})).result?.value

  await send('Page.enable')
  // DARK_OUT=<dir> renders dark-mode review shots there instead of updating public/screens.
  if (process.env.DARK_OUT) await send('Page.addScriptToEvaluateOnNewDocument', {source: "localStorage.setItem('masrif-appearance','Dark')"})
  await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: false})
  fs.mkdirSync(outDir, {recursive: true})
  const screens = screenGroups.flatMap(group => group.items)
  let done = 0
  const warnings = []
  for (const [screen] of screens) {
    await send('Page.navigate', {url: `http://localhost:${PORT}/?embed=1&screen=${encodeURIComponent(screen)}`})
    await until(async () => await run(`document.readyState==='complete' && !!document.querySelector('#root > *')`), screen)
    await run(`Promise.race([Promise.all([document.fonts.ready, ...[...document.images].filter(i => i.complete || i.loading !== 'lazy').map(i => i.decode().catch(() => {}))]), new Promise(r => setTimeout(r, 2500))])`)
    await wait(700)
    if (await run(`/unavailable in the demo|could not be found|Complete the previous step/i.test(document.body.innerText)`)) warnings.push(screen)
    const shot = await send('Page.captureScreenshot', {format: 'webp', quality: 82})
    fs.writeFileSync(process.env.DARK_OUT ? path.join(process.env.DARK_OUT, path.basename(screenImage(screen))) : path.join(root, 'public', screenImage(screen)), Buffer.from(shot.data, 'base64'))
    process.stdout.write(`\r${++done}/${screens.length} ${screen}`.padEnd(70))
  }
  console.log('\nSaved', done, 'screenshots to public/screens')
  ws.close()
} finally { cleanup() }
