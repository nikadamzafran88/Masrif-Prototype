import { useEffect, useRef, useState } from 'react'
import { Button, Icon } from './ui'
import { decodeDemoPayment } from './paymentCodes'

const samplePath = '/masrif/scan-sample.png'

function readFrame(decoder, context, source, width, height, maxSize) {
  const scale = Math.min(1,maxSize / Math.max(width,height))
  const canvas = context.canvas
  const nextWidth = Math.max(1,Math.round(width * scale))
  const nextHeight = Math.max(1,Math.round(height * scale))
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
  }
  context.drawImage(source,0,0,nextWidth,nextHeight)
  const frame = context.getImageData(0,0,nextWidth,nextHeight)
  return decoder(frame.data,frame.width,frame.height)?.data
}

async function decodeImage(url) {
  const {default:decode} = await import('jsqr')
  const image = new Image()
  image.src = url
  await image.decode()
  const context = document.createElement('canvas').getContext('2d',{willReadFrequently:true})
  return readFrame(decode,context,image,image.naturalWidth,image.naturalHeight,1600)
}

export function QrScanner({onContinue, merchant}) {
  const [running,setRunning] = useState(false)
  const [cameraReady,setCameraReady] = useState(false)
  const [reading,setReading] = useState(false)
  const [result,setResult] = useState('')
  const [notice,setNotice] = useState('')
  const preview = useRef(null)
  const picker = useRef(null)
  const imageRequest = useRef(null)

  useEffect(()=>()=>imageRequest.current?.abort(),[])

  useEffect(()=>{
    if (!running) return
    const video = preview.current
    let active = true
    let stream
    let frameId
    let lastFrame = 0

    function stopWhenHidden() {
      if (document.hidden) setRunning(false)
    }
    async function start() {
      try {
        const {default:decode} = await import('jsqr')
        if (!active) return
        stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})
        if (!active) {
          stream.getTracks().forEach(track=>track.stop())
          return
        }
        video.srcObject = stream
        await video.play()
        if (!active) return
        setCameraReady(true)
        const context = document.createElement('canvas').getContext('2d',{willReadFrequently:true})
        function scan(time) {
          if (!active) return
          if (video.videoWidth && video.readyState >= 2 && time - lastFrame >= 170) {
            lastFrame = time
            const payload = readFrame(decode,context,video,video.videoWidth,video.videoHeight,720)
            if (typeof payload === 'string') {
              setResult(decodeDemoPayment(payload))
              setRunning(false)
              return
            }
          }
          frameId = requestAnimationFrame(scan)
        }
        frameId = requestAnimationFrame(scan)
      } catch (error) {
        if (!active) return
        setNotice(error.name==='NotAllowedError'
          ? 'Camera access was denied. Allow it in your browser or upload a QR image.'
          : 'The camera could not start. Try uploading a QR image.')
        setRunning(false)
      }
    }
    start()
    document.addEventListener('visibilitychange',stopWhenHidden)
    return ()=>{
      active = false
      cancelAnimationFrame(frameId)
      stream?.getTracks().forEach(track=>track.stop())
      video.srcObject = null
      document.removeEventListener('visibilitychange',stopWhenHidden)
    }
  },[running])

  function startCamera() {
    setNotice('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice('Camera scanning needs a supported browser on HTTPS or localhost. You can still upload an image.')
      return
    }
    setCameraReady(false)
    setRunning(true)
  }

  async function scanImage(file) {
    if (file && (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024)) {
      setNotice('Choose an image file under 12 MB.')
      return
    }
    const request = new AbortController()
    imageRequest.current?.abort()
    imageRequest.current = request
    setNotice('')
    setReading(true)
    const url = file ? URL.createObjectURL(file) : samplePath
    try {
      const payload = await decodeImage(url)
      if (request.signal.aborted) return
      if (typeof payload === 'string') setResult(decodeDemoPayment(payload))
      else setNotice('No QR code found. Try a clearer image with the full code visible.')
    } catch {
      if (!request.signal.aborted) setNotice('This image could not be read. Try another image.')
    } finally {
      if (file) URL.revokeObjectURL(url)
      if (!request.signal.aborted) setReading(false)
    }
  }

  if (result) {
    const cashier = result.kind==='cashier'||result.kind==='expired'
    return <div className="stack">
    <section className="module-panel" role="status">
      <h2>{result.kind==='expired'?'Cashier code expired':'QR code read'}</h2>
      <p>{cashier?'Use Show to pay to simulate a cashier checkout.':result.kind==='sample'||result.kind==='receive'
        ? result.name || merchant : 'This QR code will be used with the demo merchant, '+merchant+'.'}</p>
      <small>Demo payment only. No money will move.</small>
    </section>
    {!cashier&&<Button onClick={()=>onContinue({name:result.name||merchant,amount:result.amount||0})}>Continue to amount</Button>}
    <Button kind="secondary" onClick={()=>setResult('')}>Scan another code</Button>
  </div>
  }

  return <div className="stack">
    <div className="scan-frame qr-live-frame" aria-hidden="true">
      {running&&<video ref={preview} autoPlay playsInline muted/>}
      <div className="scan-target code-outline"><Icon name="scan" size={136}/><span/></div>
    </div>
    <p>Point the camera at a QR code or upload an image.</p>
    <small>Images are read on this device. Payments are simulated.</small>
    {running
      ? <><p role="status">{cameraReady ? 'Scanning for a QR code…' : 'Opening camera…'}</p><Button kind="secondary" onClick={()=>setRunning(false)}>Stop camera</Button></>
      : <>
        <Button onClick={startCamera} disabled={reading}>Open camera</Button>
        <input hidden type="file" accept="image/*" ref={picker} onChange={event=>{
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) scanImage(file)
        }}/>
        <Button kind="secondary" disabled={reading} onClick={()=>picker.current.click()}>Upload QR image</Button>
        <div className="row qr-sample-actions">
          <Button kind="secondary" disabled={reading} onClick={()=>scanImage()}>{reading ? 'Reading image…' : 'Scan sample QR'}</Button>
          <a className="text-button" href={samplePath} download>Download sample</a>
        </div>
      </>}
    {notice&&<p className="notice" role="status">{notice}</p>}
  </div>
}
