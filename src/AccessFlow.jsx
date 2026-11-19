import { useEffect, useState } from 'react'
import { Button, Icon } from './ui'
import { isEmbed } from './embed'
import { attemptsKey, consentKey, demoCode, demoContactKey, demoMobile, lockKey, recoveryNoticeKey, savedPinKey, signedOutKey, signupDraftKey, storedDemoPin } from './demoAuth'
import { ConfirmDialog } from './ConfirmDialog'

import { readDemo } from './demoStorage'
import { addDemoAlert, biometricKey } from './profileDemo'

const fixedValues = {mobile:'+60 10 000 0000',name:'Farah Amin',email:'farah@example.test'}
const returningUserKey = 'masrif-demo-signed-in-before'
const firstSignInKey = 'masrif-demo-first-sign-in-pending'
const checkpoints = new Set(['register','otp','details','mykad','selfie','verification','attention','guardian','consent','pin','biometrics','funding','pending'].map(step=>step==='register'?'/register':'/register/'+step))

function readSignup() {
 try { return JSON.parse(sessionStorage.getItem(signupDraftKey)) } catch { return null }
}

export function AccessFlow({path,go,dark,exitRequested,onCancelExit}) {
 const draft = readSignup()
 const [showRestart,setShowRestart] = useState(false)
 const [showDeposit,setShowDeposit] = useState(false)
 const [verified,setVerified] = useState(false)
 const [accepted,setAccepted] = useState(false)
 const [dataConsent,setDataConsent] = useState(false)
 const [marketing,setMarketing] = useState(false)
 const [values,setValues] = useState(()=>({...fixedValues,...readDemo(demoContactKey,{}),...draft?.values}))
 const [link,setLink] = useState({account:'',mykad:''})
 const [shareFeedback,setShareFeedback] = useState('')
 const [failedAttempts,setFailedAttempts] = useState(()=>Number(sessionStorage.getItem(attemptsKey)||0))
 const [recoveryNotice,setRecoveryNotice] = useState(()=>sessionStorage.getItem(recoveryNoticeKey)==='true')
 const [firstSignIn,setFirstSignIn] = useState(()=>localStorage.getItem(firstSignInKey)==='true')
 const [locked,setLocked] = useState(()=>sessionStorage.getItem(lockKey)==='true')
 const [pin,setPin] = useState(storedDemoPin)
 const [newPin,setNewPin] = useState('')
 const [newBiometric,setNewBiometric] = useState(false)
 const [language,setLanguage] = useState('English')
 const next = target => ()=>go(target)
 const edit = (key,value) => setValues(previous=>({...previous,[key]:value}))
 function storePin(value) {
   sessionStorage.setItem(savedPinKey,value)
   setPin(value)
 }
 function failSignIn() {
   const count = failedAttempts+1
   setFailedAttempts(count)
   sessionStorage.setItem(attemptsKey,String(count))
   if (count >= 3) {
     sessionStorage.setItem(lockKey,'true')
     sessionStorage.setItem(signedOutKey,'true')
     setLocked(true)
     addDemoAlert('Security','Account locked','Three incorrect demo PIN attempts.')
     go('/login/locked',true)
   }
 }
 async function shareApp() {
   const url = new URL('/',location.origin).href
   try {
     if (navigator.share) await navigator.share({title:'Masrif',url})
     else {
       await navigator.clipboard.writeText(url)
       setShareFeedback('Masrif app link copied.')
     }
   } catch (error) {
     if (error.name!=='AbortError') setShareFeedback('Share this link with your guardian: '+url)
   }
 }
 function finishRegistration() {
   sessionStorage.removeItem(signupDraftKey)
   localStorage.setItem(demoContactKey,JSON.stringify(values))
   if (newPin) storePin(newPin)
   localStorage.setItem(biometricKey,String(newBiometric))
   if (accepted&&dataConsent) {
     localStorage.setItem('masrif-demo-marketing',String(marketing))
     localStorage.setItem(consentKey,JSON.stringify({date:new Date().toISOString(),marketing}))
   }
   localStorage.setItem(firstSignInKey,'true')
   setFirstSignIn(true)
   setShowDeposit(false)
   go('/register/complete')
 }
 function complete() {
   if (locked) {
     go('/login/locked',true)
     return
   }
   setFailedAttempts(0)
   sessionStorage.removeItem(attemptsKey)
   sessionStorage.removeItem(recoveryNoticeKey)
   sessionStorage.removeItem(signedOutKey)
   setRecoveryNotice(false)
   localStorage.setItem(returningUserKey,'true')
   localStorage.removeItem(firstSignInKey)
   go('/login/welcome',true,'',null)
 }
 const logo = <img className="access-logo" src={'/masrif/access-logo-'+(dark?'dark':'light')+'.svg'} width="159" height="44" alt="Masrif"/>
 useEffect(()=>{
   if(isEmbed) return // overview frames stay on their screen
   if(path==='/login/welcome') {
     const timer=setTimeout(()=>go('/home',true,'',null),1600)
     return ()=>clearTimeout(timer)
   }
   if(path!=='/') return
   const timer=setTimeout(()=>{
     const knownUser = localStorage.getItem(returningUserKey) === 'true' || localStorage.getItem(firstSignInKey) === 'true'
     go(knownUser ? '/welcome' : '/language',true,'',null)
   },900)
   return ()=>clearTimeout(timer)
 },[path,go])

 useEffect(()=>{
   if (isEmbed || !checkpoints.has(path)) return
   const savedPath = ['/register/pin','/register/biometrics','/register/funding','/register/pending'].includes(path)?'/register/consent':path
   sessionStorage.setItem(signupDraftKey,JSON.stringify({path:savedPath,values}))
 },[path,values])
 useEffect(()=>{
   if (path!=='/register/verification'||verified) return
   const timer=setTimeout(()=>setVerified(true),900)
   return ()=>clearTimeout(timer)
 },[path,verified])

 function saveAndExit() {
   onCancelExit()
   go('/start',true)
 }
 function restart() {
   sessionStorage.removeItem(signupDraftKey)
   setValues({...fixedValues,...readDemo(demoContactKey,{})})
   setAccepted(false)
   setDataConsent(false)
   setMarketing(false)
   setVerified(false)
   setNewPin('')
   setNewBiometric(false)
   setShowRestart(false)
   go('/register')
 }
 function renderScreen() {
 switch(path) {
   case '/':
   case '/login/welcome': return <section className="signed-in-splash" aria-label={path==='/' ? 'Opening Masrif' : 'Welcome to Masrif'}>
     <div className="signed-in-brand">
       <img className="signed-in-logo" src="/masrif/access-logo-light.svg" width="159" height="44" alt="Masrif"/>
       {path==='/login/welcome'&&<h1>{firstSignIn?'Welcome to Masrif':'Welcome back'}, {(readDemo(demoContactKey,fixedValues).name||fixedValues.name).trim().split(/\s+/)[0]}</h1>}
     </div>
     <div className="signed-in-attribution"><small>Powered by</small><strong>Atlas from Bank Muamalat</strong></div>
   </section>
   case '/language': return <AccessStep heading="Choose your language" className="access-language" footer={<Button onClick={next('/welcome')}>Continue</Button>}>
     <p>Select your preferred language.</p>
     {['English','Bahasa Melayu'].map(item=><label className="access-option" key={item}><input type="radio" name="language" value={item} checked={language===item} onChange={()=>setLanguage(item)}/>{item}</label>)}
     {language==='Bahasa Melayu'&&<small>Screen content is available in English in this demo.</small>}
   </AccessStep>
   case '/welcome': return <AccessStep className="access-welcome" footer={<><Button onClick={next('/start')}>Get started</Button><button className="text-button welcome-signin" onClick={next('/login')}>Sign in</button></>}>
     <div className="access-brand">{logo}<small>by Atlas Muamalat</small></div>
     <h1>Pay zakat, join programmes and bank in one app</h1>
     <p>Your Atlas account from Bank Muamalat, with Masrif services.</p>
     <div className="access-dots" aria-hidden="true"><i/><i/><i/></div>
   </AccessStep>
   case '/start': return <AccessStep heading="How would you like to start?" footer={<Button kind="secondary" onClick={next('/language')}>Change language</Button>}>
     <AccessOption title="Link existing ATLAS account" detail="Connect your ATLAS by Muamalat account" onClick={next('/link-atlas')}/>
     {draft&&checkpoints.has(draft.path)?<>
       <AccessOption title="Resume registration" detail="Continue your saved demo application" onClick={next(draft.path)}/>
       <button type="button" className="text-button" onClick={()=>setShowRestart(true)}>Start over</button>
     </>:<AccessOption title="Register for Masrif account" detail="Register and verify your identity" onClick={next('/register')}/>}
     <button className="text-button" onClick={next('/login')}>Already registered? Sign in</button>
   </AccessStep>
   case '/register': return <AccessStep heading="Enter your mobile number" footer={<Button disabled={!demoMobile(values.mobile)} onClick={next('/register/otp')}>Continue</Button>}>
     <p>Enter a fictional Malaysian mobile number to preview SMS verification.</p>
     <label>Mobile number<input type="tel" autoComplete="off" maxLength={19} value={values.mobile} onChange={event=>edit('mobile',event.target.value)}/></label>
   </AccessStep>
   case '/register/otp': return <OtpScreen mobile={values.mobile} onSuccess={next('/register/details')}/>
   case '/register/details': return <AccessStep className="registration-details" footer={<Button disabled={!values.name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())} onClick={next('/register/mykad')}>Continue</Button>}>
     <AccessProgress current={1}/><h2>Tell us about you</h2>
     <label>Full name (as on MyKad)<input autoComplete="off" maxLength={100} value={values.name} onChange={event=>edit('name',event.target.value)}/></label>
     <label>Email address<input type="email" autoComplete="off" maxLength={120} value={values.email} onChange={event=>edit('email',event.target.value)}/></label>
     <p className="access-hint">Use fictional details. The name should match the sample MyKad.</p>
     <Scenarios><button className="text-button" onClick={next('/register/guardian')}>Guardian required</button></Scenarios>
   </AccessStep>
   case '/register/mykad': return <CaptureStep icon="account" progress={2} heading="Scan your MyKad" text="Place the card inside the frame and avoid glare." action="Take demo photo" onClick={next('/register/selfie')}/>
   case '/register/selfie': return <CaptureStep icon="user" progress={3} heading="Take a selfie" text="Follow the prompts on screen." prompts={['Blink','Turn head','Smile']} action="Start demo check" onClick={()=>{setVerified(false);go('/register/verification')}}/>
   case '/register/verification': return <AccessStep className="verification-result" footer={<>
     <Button disabled={!verified} onClick={next('/register/consent')}>Continue</Button>
     <Button kind="secondary" onClick={next('/profile/help')}>Contact support</Button>
     <Scenarios>
       <button className="text-button" onClick={next('/register/attention')}>Document issue</button>
       <button className="text-button" onClick={next('/register/pending')}>Activation pending</button>
     </Scenarios>
   </>}>
     <div className="verification-symbol"><Icon name="scan" size={42}/></div>
     <div role="status"><h2>{verified?'Demo identity verified':'Checking your demo identity'}</h2><p>{verified?'Continue to review the terms and set up your PIN.':'Checking the sample MyKad and selfie.'}</p></div>
     <p className="notice">Prototype. Bank verification and activation are simulated.</p>
   </AccessStep>
   case '/register/attention': return <AccessStep heading="Check your verification" footer={<Button onClick={next('/register/mykad')}>Retake document</Button>}>
     <p>Some verification details need your attention.</p><div className="module-panel"><h2>What happens next</h2><p>Review the requested information and submit it again. This preview does not perform a real identity check.</p></div>
   </AccessStep>
   case '/register/guardian': return <AccessStep heading="A guardian needs to register" footer={<><Button onClick={shareApp}>Share app link</Button><Button kind="secondary" onClick={next('/register/details')}>Back to profile details</Button></>}>
     <StatusPanel icon="user" text="Ask a parent or guardian to open Masrif and review the registration flow."/>
     {shareFeedback&&<p className="notice" role="status">{shareFeedback}</p>}
   </AccessStep>
   case '/register/consent': return <AccessStep heading="Review terms and consent" footer={<Button disabled={!accepted||!dataConsent} onClick={next('/register/pin')}>Agree and continue</Button>}>
     <details className="module-panel"><summary>Demo terms and privacy notice</summary><p>Masrif’s prototype uses fictional information to demonstrate account setup and verification. No bank application or identity check is submitted.</p></details>
     <label className="check"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/> I accept the demo Terms of Use (required)</label>
     <label className="check"><input type="checkbox" checked={dataConsent} onChange={event=>setDataConsent(event.target.checked)}/> I consent to processing the demo details (required)</label>
     <label className="check"><input type="checkbox" checked={marketing} onChange={event=>setMarketing(event.target.checked)}/> Send me offers (optional)</label>
   </AccessStep>
   case '/register/pin': return <CodeScreen key={path} create heading="Create your PIN" description="Choose a fictional six-digit PIN for this browser session." action="Continue" onSuccess={value=>{setNewPin(value);go('/register/biometrics')}}/>
   case '/register/biometrics': return <AccessStep heading="Enable biometrics" footer={<><Button onClick={()=>{setNewBiometric(true);go('/register/funding')}}>Simulate biometrics</Button><Button kind="secondary" onClick={()=>{setNewBiometric(false);go('/register/funding')}}>Skip for now</Button></>}><StatusPanel icon="user" text="Preview using biometrics for future sign-ins."/></AccessStep>
   case '/register/funding': return <AccessStep heading="Activate your Atlas account" footer={<Button onClick={()=>setShowDeposit(true)}>Review initial deposit</Button>}>
     <StatusPanel icon="account" text="Your demo account is open. Preview the initial deposit to activate it."/>
     <dl className="details"><dt>Atlas account</dt><dd>•••• 4812</dd><dt>Initial deposit</dt><dd>RM 0.01</dd></dl>
     <p className="notice">No money will move and the demo balance stays the same.</p>
   </AccessStep>
   case '/register/complete': return <AccessStep heading="Registration successful" footer={<><Button onClick={next('/login')}>Continue to sign in</Button><Button kind="secondary" onClick={next('/register/tour')}>Take a quick tour</Button></>}>
     <StatusPanel icon="user" text="Your demo Masrif account is ready."/>
     <dl className="details"><dt>Masrif ID</dt><dd>MSR-000125</dd><dt>Device</dt><dd>This device</dd><dt>Linked account</dt><dd>Atlas •••• 4812</dd></dl>
   </AccessStep>
   case '/register/tour': return <AccessStep heading="Explore Masrif" footer={<Button onClick={next('/login')}>Continue to sign in</Button>}>
     <div className="module-panel"><h3>Account</h3><p>See your balance, spending, statements, and planning tools.</p></div>
     <div className="module-panel"><h3>Pay &amp; Receive</h3><p>Try a demo transfer, scan a QR code, or view receiving details.</p></div>
     <div className="module-panel"><h3>Features</h3><p>Explore Zakat, Pintar, e-Procurement, and Muslim Companion.</p></div>
   </AccessStep>
   case '/register/pending': return <AccessStep heading="Activation pending" footer={<Button onClick={next('/register/consent')}>Resume account setup</Button>}><StatusPanel icon="account" text="Finish consent and PIN setup before activating the demo account."/></AccessStep>
   case '/link-atlas': return <AccessStep heading="Link your ATLAS account" footer={<Button disabled={link.account.length!==12||link.mykad.length!==12} onClick={next('/link-atlas/pending')}>Link demo account</Button>}>
     <div className="module-panel">{logo}<p>Use fictional details to preview account ownership verification.</p></div>
     <label>ATLAS account number<input inputMode="numeric" autoComplete="off" value={link.account} onChange={event=>setLink({...link,account:event.target.value.replace(/\D/g,'').slice(0,12)})}/></label>
     <label>MyKad number<input inputMode="numeric" autoComplete="off" value={link.mykad} onChange={event=>setLink({...link,mykad:event.target.value.replace(/\D/g,'').slice(0,12)})}/></label>
     <button className="text-button" onClick={()=>setLink({account:'000000004812',mykad:'000000000000'})}>Use sample details</button>
     <Scenarios><button className="text-button" onClick={next('/link-atlas/already-linked')}>Already linked</button></Scenarios>
   </AccessStep>
   case '/link-atlas/pending': return <AccessStep heading="Account linking pending" footer={<Button onClick={next('/link-atlas/confirmed')}>Resume linking</Button>}>
     <StatusPanel icon="account" text="We’re checking the demo account connection."/>
     <div className="module-panel"><h3>What happens next</h3><p>Resume linking to check the result. You can continue with the same account details.</p></div>
   </AccessStep>
   case '/link-atlas/confirmed': return <AccessStep heading="Atlas account linked" footer={<Button onClick={next('/login')}>Continue to sign in</Button>}><StatusPanel icon="account" text="Your demo Atlas account has been linked."/></AccessStep>
   case '/link-atlas/already-linked': return <AccessStep heading="Account already linked" footer={<Button onClick={next('/login')}>Go to sign in</Button>}><StatusPanel icon="account" text="This demo ATLAS account is already connected to Masrif."/></AccessStep>
   case '/login': if (locked) return <AccessStep heading="Account locked" footer={<Button onClick={next('/login/recovery')}>Start PIN recovery</Button>}><StatusPanel icon="account" text="Verify your identity and reset your demo PIN to sign in again."/></AccessStep>
     return <CodeScreen key={path} heading="Welcome back" description="Enter your PIN" logo={logo} action="Sign in" expected={pin} onIncorrect={failSignIn} onSuccess={complete}
     attemptsLeft={3-failedAttempts} notice={recoveryNotice?'PIN reset. Sign in with your new demo PIN.':''}
     alternate={<><AccessOption title="Secure confirmation" detail="Approve in another trusted way" onClick={next('/login/identity')}/><button type="button" className="text-button" onClick={next('/login/recovery')}>Forgot PIN?</button></>}
     footer={<>{localStorage.getItem(biometricKey)==='true'&&<Button type="button" kind="secondary" onClick={complete}>Use Face ID · Demo</Button>}<Scenarios><button type="button" className="text-button" onClick={next('/login/locked')}>Account locked</button></Scenarios><button type="button" className="text-button" onClick={next('/start')}>Register or link an account</button></>}/>
   case '/login/locked': return <AccessStep heading="Account locked" footer={<><Button onClick={next('/login/recovery')}>Unlock with identity check</Button><Button kind="secondary" onClick={next('/profile/help/contact')}>Contact support</Button></>}><StatusPanel icon="account" text="Verify your identity and reset your demo PIN to unlock access."/></AccessStep>
   case '/login/identity': return <AccessStep heading="Confirm your identity" footer={<Button onClick={complete}>Simulate selfie check</Button>}><StatusPanel icon="user" text="Preview the additional identity check used when signing in on a new device."/></AccessStep>
   case '/login/recovery': return <AccessStep heading="Reset your PIN" footer={<Button onClick={next('/login/recovery/code')}>Start verification</Button>}>
     <ol className="stack"><li>Verify the code sent to your registered number</li><li>Complete the demo identity check</li><li>Create a new PIN</li></ol>
   </AccessStep>
   case '/login/recovery/code': return <OtpScreen key={path} mobile={values.mobile} onSuccess={next('/login/recovery/identity')}/>
   case '/login/recovery/identity': return <AccessStep heading="Confirm your identity" footer={<Button onClick={next('/login/recovery/pin')}>Simulate selfie check</Button>}>
     <StatusPanel icon="user" text="Preview the identity check before resetting your PIN."/>
   </AccessStep>
   case '/login/recovery/pin': return <CodeScreen key={path} create heading="Create a new PIN" description="Choose a fictional six-digit PIN." action="Continue" onSuccess={value=>{
     storePin(value)
     sessionStorage.removeItem(lockKey)
     sessionStorage.removeItem(attemptsKey)
     sessionStorage.setItem(recoveryNoticeKey,'true')
     setLocked(false)
     setFailedAttempts(0)
     setRecoveryNotice(true)
     addDemoAlert('Security','PIN reset','Your demo PIN was reset through account recovery.')
     go('/login',true)
   }}/>
   default: return null
 }
 }
 return <>{renderScreen()}
   {exitRequested&&checkpoints.has(path)&&<ConfirmDialog title="Leave registration?" action="Save and exit" onConfirm={saveAndExit} onCancel={onCancelExit}><p>Your place is saved in this browser tab so you can resume later.</p></ConfirmDialog>}
   {showRestart&&<ConfirmDialog title="Start over?" action="Discard draft" onConfirm={restart} onCancel={()=>setShowRestart(false)}><p>This clears your saved registration progress in this tab.</p></ConfirmDialog>}
   {showDeposit&&<ConfirmDialog title="Confirm demo deposit" action="Simulate deposit" onConfirm={finishRegistration} onCancel={()=>setShowDeposit(false)}><dl className="details"><dt>Amount</dt><dd>RM 0.01</dd><dt>Atlas account</dt><dd>•••• 4812</dd></dl><p>Your demo balance stays the same.</p></ConfirmDialog>}
 </>
}

function AccessStep({heading,className='',children,footer}) {
 return <section className={'access-step '+className}>
   <div className="access-content">{heading&&<h2>{heading}</h2>}{children}</div>
   {footer&&<div className="access-actions">{footer}</div>}
 </section>
}

function AccessOption({title,detail,onClick}) {
 return <button type="button" className="access-option" onClick={onClick}><span><strong>{title}</strong><small>{detail}</small></span><Icon name="arrow" size={18}/></button>
}
function StatusPanel({icon,text}) {
 return <div className="access-status"><span className="tile-icon"><Icon name={icon} size={28}/></span><p>{text}</p></div>
}
function AccessProgress({current,total=3}) {
 return <div className="access-progress" role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} style={{gridTemplateColumns:'repeat('+total+',1fr)'}}>
   {Array.from({length:total},(_,index)=><span key={index} data-complete={index<current}/>)}
 </div>
}
function CaptureStep({icon,heading,text,action,onClick,progress,prompts}) {
 return <AccessStep className="identity-capture" footer={<Button onClick={onClick}>{action}</Button>}>
   <AccessProgress current={progress}/><h2>{heading}</h2>
   <div className="access-capture" aria-hidden="true"><div className={prompts?'camera-guide face-guide':'camera-guide'}><Icon name={icon} size={45}/></div><small>{prompts?'Face frame':'Camera view with card frame'}</small></div>
   <p>{text}</p>{prompts&&<ul className="liveness-steps">{prompts.map(prompt=><li key={prompt}>{prompt}</li>)}</ul>}
   <small>Demo only. Your camera stays off.</small>
 </AccessStep>
}
function OtpScreen({mobile,onSuccess}) {
 const [digits,setDigits]=useState('')
 const [seconds,setSeconds]=useState(30)
 const [error,setError]=useState('')
 const [status,setStatus]=useState('')
 useEffect(()=>{
   const timer=setInterval(()=>setSeconds(value=>Math.max(0,value-1)),1000)
   return ()=>clearInterval(timer)
 },[])
 return <form className="access-step otp-screen" onSubmit={event=>{
   event.preventDefault()
   if(digits===demoCode) onSuccess()
   else setError('Use the supplied demo code.')
 }}>
   <div className="access-content">
     <h2>Enter the 6-digit code</h2><p>Demo code for {mobile}</p>
     <label className="otp-entry" aria-label="Six-digit demo code">
       <input aria-label="Six-digit demo code" inputMode="numeric" maxLength={6} value={digits} onChange={event=>{setDigits(event.target.value.replace(/\D/g,''));setError('')}}/>
       <span className="otp-boxes" aria-hidden="true">{Array.from({length:6},(_,index)=><span key={index} data-current={digits.length===index}>{digits[index]||''}</span>)}</span>
     </label>
     <div className="row"><button className="text-button" type="button" onClick={()=>{setDigits(demoCode);setError('')}}>Use demo code</button><button type="button" className="text-button" disabled={seconds>0} onClick={()=>{setSeconds(30);setDigits('');setError('');setStatus('A new demo code is ready.')}}>{seconds>0?'Resend code in 0:'+String(seconds).padStart(2,'0'):'Resend demo code'}</button></div>
     {error&&<p role="alert" className="notice">{error}</p>}
     {status&&<p role="status" className="notice">{status}</p>}
   </div>
   <div className="access-actions"><Button disabled={digits.length!==6}>Verify</Button></div>
 </form>
}
function CodeScreen({heading,description,action,onSuccess,onIncorrect,expected=demoCode,create,logo,alternate,footer,attemptsLeft,notice}) {
 const [digits,setDigits] = useState('')
 const [firstPin,setFirstPin] = useState('')
 const [error,setError] = useState('')
 const confirming = Boolean(firstPin)
 function submit(event) {
   event.preventDefault()
   if(digits.length!==6) return
   if(create&&!confirming){setFirstPin(digits);setDigits('');setError('');return}
   if(digits!==(create?firstPin:expected)){
     setError(create?'The PINs did not match. Enter your chosen PIN again.':'Incorrect demo PIN. Try again.')
     setDigits('')
     onIncorrect?.()
     return
   }
   onSuccess(digits)
 }
 function press(key) {
   setError('')
   setDigits(previous=>key==='Del'?previous.slice(0,-1):(previous+key).slice(0,6))
 }
 return <form className="access-step access-code" onSubmit={submit} onKeyDown={event=>{
   if (!/^\d$/.test(event.key) && event.key!=='Backspace') return
   event.preventDefault()
   press(event.key==='Backspace'?'Del':event.key)
 }}>
   <div className="access-content">
     {alternate}
     {logo&&<div className="access-brand">{logo}<small>by Atlas Muamalat</small></div>}
     <h2>{confirming?'Confirm your PIN':heading}</h2><p>{description}</p>
     <div className="access-code-dots" aria-label={digits.length+' of 6 digits entered'}>{Array.from({length:6},(_,i)=><span key={i} data-filled={i<digits.length}/>)}</div>
     <small>{create ? 'Use a fictional PIN.' : 'Demo PIN: '+expected}</small>
     {notice&&<p className="notice" role="status">{notice}</p>}
     {error&&<p className="notice" role="alert">{error}{!create&&attemptsLeft>0?' '+attemptsLeft+' '+(attemptsLeft===1?'attempt':'attempts')+' remaining.':''}</p>}
     <div className="keypad access-keypad" aria-label="Demo keypad">{['1','2','3','4','5','6','7','8','9','','0','Del'].map(key=>key?<button type="button" key={key} aria-label={key==='Del'?'Delete digit':key} onClick={()=>press(key)}>{key}</button>:<span key="blank"/>)}</div>
   </div>
   <div className="access-actions"><Button disabled={digits.length!==6}>{confirming?'Confirm PIN':action}</Button>{footer}</div>
 </form>
}

// Demo-only shortcuts to alternate outcomes, kept out of the main path.
function Scenarios({children}) {
 return <details className="access-scenarios"><summary>Demo scenarios</summary><div>{children}</div></details>
}
