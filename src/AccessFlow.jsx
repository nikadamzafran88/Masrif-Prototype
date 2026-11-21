import { Fragment, useEffect, useRef, useState } from 'react'
import { Button, Icon } from './ui'
import { Dropdown } from './Dropdown'
import { isEmbed } from './embed'
import { attemptsKey, consentKey, demoCode, demoContactKey, formatMobileDigits, lockKey, normalizeMalaysianMobile, recoveryNoticeKey, savedPinKey, signedInKey, signedOutKey, signupDraftKey, storedDemoPin } from './demoAuth'
import { ConfirmDialog } from './ConfirmDialog'
import { AtlasSupport, PrivacyNoticeButton } from './PrivacyPages'

import { readDemo } from './demoStorage'
import { addDemoAlert, biometricKey } from './profileDemo'
import { checkDemoCredentials, createDemoCredentials, credentialKey, sampleCredentials, savedCredentials, trustedDeviceKey } from './demoCredentials'

const fixedValues = {mobile:'+60 10 000 0000',name:'Farah Amin',email:'farah@example.test'}
const firstSignInKey = 'masrif-demo-first-sign-in-pending'
const checkpoints = new Set(['register','otp','details','mykad','selfie','verification','identity-review','address','attention','guardian','consent','credentials','pin','biometrics','funding','pending'].map(step=>step==='register'?'/register':'/register/'+step))
const states = ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya']
const blankAddress = {line1:'',line2:'',postcode:'',city:'',state:''}
const sampleAddress = {line1:'Unit 8, Jalan Contoh',line2:'',postcode:'50450',city:'Kuala Lumpur',state:'W.P. Kuala Lumpur'}
const validAddress = address => Boolean(address?.line1?.trim()&&/^\d{5}$/.test(address.postcode)&&address.city?.trim()&&states.includes(address.state))

function readSignup() {
 try { return JSON.parse(sessionStorage.getItem(signupDraftKey)) } catch { return null }
}

export function AccessFlow({path,go,dark,exitRequested,onCancelExit,onSignInBack}) {
 const draft = readSignup()
 const [showRestart,setShowRestart] = useState(false)
 const [showDeposit,setShowDeposit] = useState(false)
 const [verified,setVerified] = useState(false)
 const [accepted,setAccepted] = useState(false)
 const [dataConsent,setDataConsent] = useState(false)
 const [marketing,setMarketing] = useState(false)
 const [values,setValues] = useState(()=>({...fixedValues,...readDemo(demoContactKey,{}),...draft?.values}))
 const [link,setLink] = useState({account:'',mykad:''})
 const [mykad,setMykad] = useState('')
 const [shareFeedback,setShareFeedback] = useState('')
 const [failedAttempts,setFailedAttempts] = useState(()=>Number(sessionStorage.getItem(attemptsKey)||0))
 const [recoveryNotice,setRecoveryNotice] = useState(()=>sessionStorage.getItem(recoveryNoticeKey)==='true')
 const [firstSignIn,setFirstSignIn] = useState(()=>localStorage.getItem(firstSignInKey)==='true')
 const [locked,setLocked] = useState(()=>sessionStorage.getItem(lockKey)==='true')
 const [pin,setPin] = useState(storedDemoPin)
 const [newPin,setNewPin] = useState('')
 const [newCredentials,setNewCredentials] = useState(null)
 const [passwordFlow,setPasswordFlow] = useState(null)
 const [newBiometric,setNewBiometric] = useState(false)
 const [language,setLanguage] = useState(()=>localStorage.getItem('masrif-language')==='ms'?'ms':'en')
 const malay = language==='ms'
 const copy = (english,bm) => malay?bm:english
 function changeLanguage(value) {
   localStorage.setItem('masrif-language',value)
   setLanguage(value)
 }
 const supportDialog = useRef(null)
 const next = target => ()=>target.startsWith('/profile/help')?supportDialog.current.showModal():go(target)
 const edit = (key,value) => setValues(previous=>({...previous,[key]:value}))
 function storePin(value) {
   sessionStorage.setItem(savedPinKey,value)
   setPin(value)
 }
 const credentials = savedCredentials()
 const username = credentials?.username||sampleCredentials.username
 const trustedDevice = sessionStorage.getItem(trustedDeviceKey)===username&&Boolean(sessionStorage.getItem(savedPinKey))
 const passwordRequired = !trustedDevice||localStorage.getItem(firstSignInKey)==='true'
 function failSignIn(method='PIN') {
   const count = failedAttempts+1
   setFailedAttempts(count)
   sessionStorage.setItem(attemptsKey,String(count))
   if (count >= 3) {
     sessionStorage.setItem(lockKey,'true')
     sessionStorage.setItem(signedOutKey,'true')
     sessionStorage.removeItem(signedInKey)
     setLocked(true)
     addDemoAlert('Security','Account locked','Too many incorrect demo sign-in attempts. Last method: '+method+'.')
     go('/login/locked',true)
   }
 }
 async function shareApp() {
   const url = new URL('/',location.origin).href
   try {
     if (navigator.share) await navigator.share({title:'SKEB-Pro',url})
     else {
       await navigator.clipboard.writeText(url)
       setShareFeedback('SKEB-Pro app link copied.')
     }
   } catch (error) {
     if (error.name!=='AbortError') setShareFeedback('Share this link with your guardian: '+url)
   }
 }
 function finishRegistration() {
   if (!isEmbed&&!validAddress(values.address)) {
     setShowDeposit(false)
     go('/register/address')
     return
   }
   if (!isEmbed&&(!newCredentials||!newPin||!accepted||!dataConsent)) {
     setShowDeposit(false)
     go('/register/consent')
     return
   }
   sessionStorage.removeItem(signupDraftKey)
   localStorage.setItem(demoContactKey,JSON.stringify(values))
   if (newPin) storePin(newPin)
   if (newCredentials) {
     localStorage.setItem(credentialKey,JSON.stringify(newCredentials))
     sessionStorage.setItem(trustedDeviceKey,newCredentials.username)
   }
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
 function complete(verifiedPassword=false) {
   if (locked) {
     go('/login/locked',true)
     return
   }
   if (!verifiedPassword&&passwordRequired&&!isEmbed) {
     go('/login/password',true)
     return
   }
   setFailedAttempts(0)
   sessionStorage.removeItem(attemptsKey)
   sessionStorage.removeItem(recoveryNoticeKey)
   sessionStorage.removeItem(signedOutKey)
   sessionStorage.setItem(signedInKey,'true')
   setRecoveryNotice(false)
   localStorage.removeItem(firstSignInKey)
   go('/login/welcome',true,'',null)
 }
 function startPasswordCheck(purpose) {
   setPasswordFlow({purpose,stage:'code'})
   go('/login/password/verify')
 }
 function finishPasswordReset(record) {
   localStorage.setItem(credentialKey,JSON.stringify(record))
   sessionStorage.removeItem(lockKey)
   sessionStorage.removeItem(attemptsKey)
   setLocked(false)
   setFailedAttempts(0)
   setPasswordFlow(null)
   addDemoAlert('Security','Password reset','Your demo sign-in password was reset.')
   go('/login/password',true)
 }
 const logo = <img className="access-logo" src={'/brand/logo-'+(dark?'dark':'light')+'.png'} width="159" height="38" alt="SKEB-Pro"/>
 useEffect(()=>{
   if(isEmbed) return // overview frames stay on their screen
   if(path==='/login/welcome') {
     const timer=setTimeout(()=>go('/home',true,'',null),2300)
     return ()=>clearTimeout(timer)
   }
   if(path!=='/') return
   const timer=setTimeout(()=>go('/welcome',true,'',null),900)
   return ()=>clearTimeout(timer)
 },[path,go])

 useEffect(()=>{
   if (isEmbed || !checkpoints.has(path)) return
   const savedPath = ['/register/credentials','/register/pin','/register/biometrics','/register/funding','/register/pending'].includes(path)?'/register/consent':path
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
   setMykad('')
   setNewCredentials(null)
   setNewPin('')
   setNewBiometric(false)
   setShowRestart(false)
   go('/register')
 }
 function renderScreen() {
 switch(path) {
   case '/':
   case '/login/welcome': return <section className="signed-in-splash" aria-label={path==='/' ? 'Opening SKEB-Pro' : 'Welcome to SKEB-Pro'}>
     <div className="signed-in-brand">
       <img className="signed-in-logo" src="/brand/logo-light.png" width="159" height="38" alt="SKEB-Pro"/>
       {path==='/login/welcome'&&<h1>{firstSignIn?'Welcome to SKEB-Pro':'Welcome back'}, {(readDemo(demoContactKey,fixedValues).name||fixedValues.name).trim().split(/\s+/)[0]}</h1>}
     </div>
     <div className="signed-in-attribution"><small>Powered by</small><strong>Atlas from Bank Muamalat</strong></div>
   </section>
   case '/language': return <AccessStep heading="Choose your language" className="access-language" footer={<Button onClick={next('/welcome')}>Continue</Button>}>
     <p>Select your preferred language.</p>
     {[['en','English'],['ms','Bahasa Melayu']].map(([value,label])=><label className="access-option" key={value}><input type="radio" name="language" value={value} checked={language===value} onChange={()=>changeLanguage(value)}/>{label}</label>)}
   </AccessStep>
   case '/welcome': return <AccessStep lang={language} className="access-welcome" footer={<>
     <Button kind="secondary" onClick={next('/login')}>{copy('Sign in','Log masuk')}</Button>
     <Button onClick={next('/start')}>{copy('Register SKEB-Pro','Daftar SKEB-Pro')}</Button>
   </>}>
     <LanguageToggle value={language} onChange={changeLanguage}/>
     <WelcomeCarousel logo={logo} language={language}/>
   </AccessStep>
   case '/start': {
     const resume = draft && checkpoints.has(draft.path)
     return <AccessStep lang={language} footer={<>
       <div className="access-signin-link">
         <span>{copy('Already registered?','Sudah berdaftar?')}</span>
         <button type="button" className="text-button" onClick={next('/login')}>{copy('Sign in','Log masuk')}</button>
       </div>
       <Button onClick={()=>{
         if(!resume){
           setValues({...fixedValues,mobile:''})
           setMykad('')
           setNewCredentials(null)
           go('/register')
         } else go(draft.path==='/register/consent'&&!validAddress(values.address)?'/register/address':draft.path)
       }}>{resume?copy('Resume registration','Sambung pendaftaran'):copy('Register for SKEB-Pro account','Daftar akaun SKEB-Pro')}</Button>
     </>}>
       <h2>{copy('How would you like to start?','Bagaimanakah anda ingin bermula?')}</h2>
       {resume&&<section className="module-panel registration-draft">
         <h3>{copy('Registration saved','Pendaftaran disimpan')}</h3>
         <p>{copy('Continue where you left off in this browser tab.','Sambung dari langkah terakhir dalam tab pelayar ini.')}</p>
         <button type="button" className="text-button" onClick={()=>setShowRestart(true)}>{copy('Start over','Mula semula')}</button>
       </section>}
       <AccessOption title={copy('Link existing ATLAS account','Pautkan akaun ATLAS sedia ada')} detail={copy('Connect your ATLAS by Muamalat account','Sambungkan akaun ATLAS by Muamalat anda')} onClick={next('/link-atlas')}/>
     </AccessStep>
   }
   case '/register': return <RegistrationMobile value={values.mobile} onChange={value=>edit('mobile',value)} onContinue={next('/register/otp')}/>
   case '/register/otp': return <OtpScreen mobile={values.mobile} onChangeNumber={next('/register')} onHelp={next('/profile/help')} onSuccess={()=>{edit('verifiedMobile',normalizeMalaysianMobile(values.mobile));go('/register/details')}}/>
   case '/register/details': return <AccessStep className="registration-details" footer={<Button form="registration-details" type="submit">Continue</Button>}>
     <form id="registration-details" className="stack" onSubmit={event=>{
       event.preventDefault()
       if(!values.name.trim()||(!mykad&&!values.maskedMykad)||mykad&&mykad.length!==12) {
         const input=event.currentTarget.elements.namedItem(!values.name.trim()?'full-name':'mykad')
         input.setCustomValidity(!values.name.trim()?'Enter the name shown on the demo MyKad.':'Enter a 12-digit demo MyKad number.')
         input.reportValidity()
         return
       }
       if(mykad)edit('maskedMykad','••••••-••-'+mykad.slice(-4))
       go('/register/mykad')
     }}>
     <section className="module-panel registration-form-card">
       <h2>Personal details</h2>
       <label>Full name as shown on MyKad<input name="full-name" required autoComplete="off" maxLength={100} value={values.name} onChange={event=>{event.target.setCustomValidity('');edit('name',event.target.value)}}/></label>
       <label>MyKad number<input name="mykad" inputMode="numeric" autoComplete="off" placeholder={values.maskedMykad||'YYMMDD-XX-XXXX'}
         value={[mykad.slice(0,6),mykad.slice(6,8),mykad.slice(8)].filter(Boolean).join('-')} onChange={event=>{
           event.target.setCustomValidity('')
           setMykad(event.target.value.replace(/\D/g,'').slice(0,12))
         }} aria-describedby="mykad-format"/></label>
       <small id="mykad-format">{values.maskedMykad&&!mykad?'Your draft keeps only the masked number. Enter a new number to replace it.':'Enter 12 digits. The dashes are added automatically.'}</small>
       <button type="button" className="text-button registration-phone-sample" onClick={event=>{
         event.currentTarget.form.elements.namedItem('mykad').setCustomValidity('')
         setMykad('980515000123')
       }}>Use sample MyKad number</button>
     </section>
     <section className="module-panel registration-form-card">
       <h2>Contact details</h2>
       <div className="registration-contact-field">
         <span id="registration-contact-mobile">Mobile number</span>
         <div className="registration-contact" role="group" aria-labelledby="registration-contact-mobile">
           <strong>{normalizeMalaysianMobile(values.mobile)?'+60 '+formatMobileDigits(normalizeMalaysianMobile(values.mobile)):'—'}</strong>
           {(isEmbed||values.verifiedMobile&&values.verifiedMobile===normalizeMalaysianMobile(values.mobile))&&<span className="registration-verified"><Icon name="check" size={15}/> Verified</span>}
         </div>
       </div>
       <label>Email address<input type="email" required inputMode="email" autoComplete="off" maxLength={120} value={values.email} onChange={event=>edit('email',event.target.value)}/></label>
     </section>
     <small>Use fictional details for this demo.</small>
     </form>
     <Scenarios><button className="text-button" onClick={next('/register/guardian')}>Guardian required</button></Scenarios>
   </AccessStep>
   case '/register/mykad': return <CaptureStep heading="Scan your MyKad" text="Get your original MyKad ready."
     tips={['Fit all four corners inside the guide.','Use even lighting and keep the details clear.']}
     action="Take demo photo" onClick={next('/register/selfie')}/>
   case '/register/selfie': return <CaptureStep selfie heading="Take a selfie" text="Centre your face inside the guide."
     tips={['Face the light and hold your phone steady.','Keep your face visible and follow the prompts.']}
     prompts={['Blink','Turn your head','Smile']} action="Start demo check" onClick={()=>{setVerified(false);go('/register/verification')}}/>
   case '/register/verification': return <AccessStep className="verification-result" footer={<Button disabled={!verified} onClick={next('/register/identity-review')}>Continue</Button>}>
     <section className="module-panel identity-result" data-verified={verified} role="status">
       <div className="verification-symbol"><Icon name={verified?'shield':'scan'} size={34}/></div>
       <h2>{verified?'Demo identity verified':'Checking your demo identity'}</h2>
       <p>{verified?'Review the sample identity details before continuing.':'Checking the sample MyKad and selfie.'}</p>
     </section>
     <ul className="identity-check-results" aria-label="Verification checks">
       {[['card','MyKad check'],['face','Selfie check']].map(([icon,label])=><li className="module-row" key={icon}>
         <span className="tile-icon"><Icon name={icon} size={19}/></span><strong>{label}</strong>
         <small>{verified?'Complete':'Checking'}</small>
       </li>)}
     </ul>
     <small>Demo verification uses sample data.</small>
     <Button kind="secondary" onClick={next('/profile/help')}>Contact support</Button>
     <Scenarios>
       <button className="text-button" onClick={next('/register/attention')}>Document issue</button>
       <button className="text-button" onClick={next('/register/pending')}>Activation pending</button>
     </Scenarios>
   </AccessStep>
   case '/register/identity-review': return <AccessStep heading="Review your identity" footer={<Button onClick={next('/register/address')}>Confirm details</Button>}>
     <p>Check the sample details from the demo MyKad scan.</p>
     <dl className="details"><dt>Full name</dt><dd>{values.name}</dd><dt>MyKad</dt><dd>{values.maskedMykad||'••••••-••-0123'}</dd><dt>Date of birth</dt><dd>15 May 1998</dd><dt>Nationality</dt><dd>Malaysian</dd></dl>
     <Button kind="secondary" onClick={next('/register/mykad')}>Retake demo scan</Button>
   </AccessStep>
   case '/register/address': return <RegistrationAddress address={values.address||blankAddress} onChange={address=>edit('address',address)} onContinue={next('/register/consent')}/>
   case '/register/attention': return <AccessStep heading="Check your verification" footer={<Button onClick={next('/register/mykad')}>Retake document</Button>}>
     <p>Some verification details need your attention.</p><div className="module-panel"><h2>What happens next</h2><p>Review the requested information and submit it again. This preview does not perform a real identity check.</p></div>
   </AccessStep>
   case '/register/guardian': return <AccessStep heading="A guardian needs to register" footer={<Button onClick={shareApp}>Share app link</Button>}>
     <StatusPanel icon="user" text="Ask a parent or guardian to open SKEB-Pro and review the registration flow."/>
     {shareFeedback&&<p className="notice" role="status">{shareFeedback}</p>}
     <Button kind="secondary" onClick={next('/register/details')}>Back to profile details</Button>
   </AccessStep>
   case '/register/consent': return <AccessStep heading="Review terms and consent" footer={<Button disabled={!accepted||!dataConsent} onClick={next('/register/credentials')}>Agree and continue</Button>}>
     <details className="module-panel"><summary>Demo terms and privacy notice</summary><p>SKEB-Pro’s prototype uses fictional information to demonstrate account setup and verification. No bank application or identity check is submitted.</p></details>
     <PrivacyNoticeButton>Read the full Privacy Notice</PrivacyNoticeButton>
     <label className="check"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/> I accept the demo Terms of Use (required)</label>
     <label className="check"><input type="checkbox" checked={dataConsent} onChange={event=>setDataConsent(event.target.checked)}/> I consent to processing the demo details (required)</label>
     <label className="check"><input type="checkbox" checked={marketing} onChange={event=>setMarketing(event.target.checked)}/> Send me offers (optional)</label>
   </AccessStep>
   case '/register/credentials': return <PasswordStep mode="create" username={newCredentials?.username} onSuccess={record=>{setNewCredentials(record);go('/register/pin')}}/>
   case '/register/pin': return <CodeScreen key={path} create logo={logo} onHelp={next('/profile/help')} heading="Create your PIN" description="Choose a fictional six-digit PIN for this browser session." action="Continue" onSuccess={value=>{setNewPin(value);go('/register/biometrics')}}/>
   case '/register/biometrics': return <AccessStep heading="Enable biometrics" footer={<Button onClick={()=>{setNewBiometric(true);go('/register/funding')}}>Simulate biometrics</Button>}>
     <StatusPanel icon="user" text="Preview using biometrics for returning sign-in and transfer approval."/>
     <Button kind="secondary" onClick={()=>{setNewBiometric(false);go('/register/funding')}}>Skip for now</Button>
   </AccessStep>
   case '/register/funding': return <AccessStep heading="Activate your Atlas account" footer={<Button onClick={()=>setShowDeposit(true)}>Review initial deposit</Button>}>
     <StatusPanel icon="account" text="Your demo account is open. Preview the initial deposit to activate it."/>
     <dl className="details"><dt>Atlas account</dt><dd>•••• 4812</dd><dt>Initial deposit</dt><dd>RM 0.01</dd></dl>
     <p className="notice">No money will move and the demo balance stays the same.</p>
   </AccessStep>
   case '/register/complete': return <AccessStep heading="Registration successful" footer={<Button onClick={next('/login')}>Continue to sign in</Button>}>
     <StatusPanel icon="user" text="Your demo SKEB-Pro account is ready."/>
     <dl className="details"><dt>SKEB-Pro ID</dt><dd>SKB-000125</dd><dt>Device</dt><dd>This device</dd><dt>Linked account</dt><dd>Atlas •••• 4812</dd></dl>
     <Button kind="secondary" onClick={next('/register/tour')}>Take a quick tour</Button>
   </AccessStep>
   case '/register/tour': return <AccessStep heading="Explore SKEB-Pro" footer={<Button onClick={next('/login')}>Continue to sign in</Button>}>
     <div className="module-panel"><h3>Account</h3><p>See your balance, spending, statements, and planning tools.</p></div>
     <div className="module-panel"><h3>Pay &amp; Receive</h3><p>Try a demo transfer, scan a QR code, or view receiving details.</p></div>
     <div className="module-panel"><h3>Features</h3><p>Explore Zakat, Pintar, e-SKEB, and Muslim Companion.</p></div>
   </AccessStep>
   case '/register/pending': return <AccessStep heading="Activation pending" footer={<Button onClick={next('/register/identity-review')}>Resume account setup</Button>}><StatusPanel icon="account" text="Finish reviewing your details and setting up your PIN before activating the demo account."/></AccessStep>
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
   case '/link-atlas/already-linked': return <AccessStep heading="Account already linked" footer={<Button onClick={next('/login')}>Go to sign in</Button>}><StatusPanel icon="account" text="This demo ATLAS account is already connected to SKEB-Pro."/></AccessStep>
   case '/login': if (locked) return <AccessStep heading="Account locked" footer={<Button onClick={next('/login/recovery')}>Start PIN recovery</Button>}>
       <StatusPanel icon="account" text="Verify your identity to recover access to your demo account."/>
       <button className="text-button" onClick={()=>startPasswordCheck('reset')}>Forgot password?</button>
     </AccessStep>
     if (passwordRequired&&!isEmbed) return <PasswordStep mode="signin" logo={logo} stored={credentials} onBack={onSignInBack} onHelp={next('/profile/help')} onRegister={next('/start')} onForgot={()=>startPasswordCheck('reset')}
       onIncorrect={()=>failSignIn('password')} onSuccess={()=>trustedDevice?complete(true):startPasswordCheck('device')}/>
     return <CodeScreen key={path} heading="Welcome back" description="Enter your app PIN" logo={logo} action="Sign in" expected={pin} onIncorrect={failSignIn} onSuccess={()=>complete()}
     attemptsLeft={3-failedAttempts} notice={recoveryNotice?'PIN reset. Sign in with your new demo PIN.':''}
     onBack={onSignInBack} onHelp={next('/profile/help')} onRecovery={next('/login/recovery')} onBiometric={()=>complete()}
     footer={<Scenarios><button type="button" className="text-button" onClick={next('/login/locked')}>Account locked</button></Scenarios>}/>
   case '/login/locked': return <AccessStep heading="Account locked" footer={<Button onClick={next('/login/recovery')}>Unlock with identity check</Button>}>
     <StatusPanel icon="account" text="Verify your identity and reset your demo PIN to unlock access."/>
     <Button kind="secondary" onClick={next('/profile/help/contact')}>Contact support</Button>
     <button className="text-button" onClick={()=>startPasswordCheck('reset')}>Forgot password?</button>
   </AccessStep>
   case '/login/password': return <PasswordStep mode="signin" logo={logo} stored={credentials} locked={locked} onBack={onSignInBack} onHelp={next('/profile/help')} onRegister={next('/start')} onForgot={()=>startPasswordCheck('reset')}
     onIncorrect={()=>failSignIn('password')} onSuccess={()=>trustedDevice?complete(true):startPasswordCheck('device')}/>
   case '/login/password/verify': if(passwordFlow?.stage==='code') return <OtpScreen mobile={values.mobile} onHelp={next('/profile/help')} onSuccess={()=>{
     setPasswordFlow({...passwordFlow,stage:'identity'})
     go('/login/password/identity')
   }}/>
     return <AccessStep heading="Start password verification" footer={<Button onClick={next('/login/password')}>Back to sign in</Button>}/>
   case '/login/password/identity': if(passwordFlow?.stage==='identity') return <AccessStep heading="Confirm your identity" footer={<Button onClick={()=>{
     setPasswordFlow({...passwordFlow,stage:'finish'})
     go(passwordFlow.purpose==='reset'?'/login/password/reset':'/login/device-pin')
   }}>Simulate identity check</Button>}>
     <StatusPanel icon="user" text="Complete the demo identity check before continuing."/>
   </AccessStep>
     return <AccessStep heading="Start password verification" footer={<Button onClick={next('/login/password')}>Back to sign in</Button>}/>
   case '/login/password/reset': if(passwordFlow?.stage==='finish'&&passwordFlow.purpose==='reset') return <PasswordStep mode="reset" username={username} onSuccess={finishPasswordReset}/>
     return <AccessStep heading="Verify your identity first" footer={<Button onClick={next('/login/password')}>Back to sign in</Button>}/>
   case '/login/device-pin': if(passwordFlow?.stage==='finish'&&passwordFlow.purpose==='device') return <CodeScreen create logo={logo} onHelp={next('/profile/help')} heading="Set up your app PIN" description="Choose a fictional six-digit PIN for this browser tab." action="Continue" onSuccess={value=>{
     storePin(value)
     sessionStorage.setItem(trustedDeviceKey,username)
     setPasswordFlow(null)
     addDemoAlert('Security','Demo device registered','Password and identity verification were completed in this browser tab.')
     complete(true)
   }}/>
     return <AccessStep heading="Verify your identity first" footer={<Button onClick={next('/login/password')}>Back to sign in</Button>}/>
   case '/login/identity': return <AccessStep heading="Confirm your identity" footer={<Button onClick={next('/login')}>Return to sign in</Button>}><StatusPanel icon="user" text="Identity verification is part of setting up sign-in on a new device."/></AccessStep>
   case '/login/recovery': return <AccessStep heading="Reset your PIN" footer={<Button onClick={next('/login/recovery/code')}>Start verification</Button>}>
     <ol className="stack"><li>Verify the code sent to your registered number</li><li>Complete the demo identity check</li><li>Create a new PIN</li></ol>
   </AccessStep>
   case '/login/recovery/code': return <OtpScreen key={path} mobile={values.mobile} onHelp={next('/profile/help')} onSuccess={next('/login/recovery/identity')}/>
   case '/login/recovery/identity': return <AccessStep heading="Confirm your identity" footer={<Button onClick={next('/login/recovery/pin')}>Simulate selfie check</Button>}>
     <StatusPanel icon="user" text="Preview the identity check before resetting your PIN."/>
   </AccessStep>
   case '/login/recovery/pin': return <CodeScreen key={path} create logo={logo} onHelp={next('/profile/help')} heading="Create a new PIN" description="Choose a fictional six-digit PIN." action="Continue" onSuccess={value=>{
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
 return <><Fragment key={path}>{renderScreen()}</Fragment>
   <dialog ref={supportDialog} className="sheet" aria-labelledby="access-support-title">
     <div className="sheet-body stack">
       <div className="row">
         <h2 id="access-support-title">Help &amp; support</h2>
         <button type="button" className="icon-button" aria-label="Close help and support" autoFocus onClick={()=>supportDialog.current.close()}><Icon name="close"/></button>
       </div>
       <AtlasSupport/>
     </div>
   </dialog>
   {exitRequested&&checkpoints.has(path)&&<ConfirmDialog title="Leave registration?" action="Save and exit" onConfirm={saveAndExit} onCancel={onCancelExit}><p>Your place is saved in this browser tab so you can resume later.</p></ConfirmDialog>}
   {showRestart&&<ConfirmDialog title={copy('Start over?','Mula semula?')} action={copy('Discard draft','Padam draf')} cancelLabel={copy('Cancel','Batal')} onConfirm={restart} onCancel={()=>setShowRestart(false)}><p>{copy('This clears your saved registration progress in this tab.','Kemajuan pendaftaran yang disimpan dalam tab ini akan dipadamkan.')}</p></ConfirmDialog>}
   {showDeposit&&<ConfirmDialog title="Confirm demo deposit" action="Simulate deposit" onConfirm={finishRegistration} onCancel={()=>setShowDeposit(false)}><dl className="details"><dt>Amount</dt><dd>RM 0.01</dd><dt>Atlas account</dt><dd>•••• 4812</dd></dl><p>Your demo balance stays the same.</p></ConfirmDialog>}
 </>
}

const welcomeSlides = [
  {
    en:['Pay zakat, join programmes and bank in one app','Your Atlas account from Bank Muamalat, with SKEB-Pro services.'],
    ms:['Bayar zakat, sertai program dan urus perbankan dalam satu aplikasi','Akaun Atlas anda daripada Bank Muamalat, dengan perkhidmatan SKEB-Pro.'],
  },
  {
    icon:'card',
    en:['Manage your money in one place','Transfer money, scan to pay and see where you spend.'],
    ms:['Urus wang anda di satu tempat','Pindahkan wang, imbas untuk bayar dan semak perbelanjaan anda.'],
  },
  {
    icon:'heart',
    en:['Make room for what matters','Pay zakat, explore Pintar and find prayer times in Muslim Companion.'],
    ms:['Utamakan perkara yang bermakna','Bayar zakat, terokai Pintar dan semak waktu solat dalam Muslim Companion.'],
  },
]

function WelcomeCarousel({logo,language}) {
 const [active,setActive] = useState(0)
 const start = useRef(null)
 const {icon,[language]:[title,description]} = welcomeSlides[active]
 const malay = language==='ms'
 const direction = change => setActive(current=>Math.max(0,Math.min(welcomeSlides.length-1,current+change)))
 return <section className="welcome-carousel" aria-label={malay?'Pengenalan SKEB-Pro':'Introduction to SKEB-Pro'}>
   <div className="welcome-slide" aria-live="polite" onTouchStart={event=>{
     const {clientX,clientY} = event.touches[0]
     start.current = {clientX,clientY}
   }} onTouchEnd={event=>{
     const origin=start.current
     start.current=null
     if(!origin) return
     const {clientX,clientY} = event.changedTouches[0]
     const delta=clientX-origin.clientX
     if(Math.abs(delta)>45&&Math.abs(delta)>Math.abs(clientY-origin.clientY)) direction(delta<0?1:-1)
   }} onTouchCancel={()=>{start.current=null}}>
     <div className="access-brand">
       {icon?<span className="welcome-feature-icon"><Icon name={icon} size={48}/></span>:<>{logo}<small>{malay?'oleh Atlas Muamalat':'by Atlas Muamalat'}</small></>}
     </div>
     <div className="welcome-slide-copy">
       <h1>{title}</h1><p>{description}</p>
     </div>
   </div>
   <div className="access-dots" role="group" aria-label={malay?'Pilih slaid':'Choose a slide'} onKeyDown={event=>{
     if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return
     event.preventDefault()
     const buttons=[...event.currentTarget.querySelectorAll('button')]
     const nextIndex=Math.max(0,Math.min(buttons.length-1,buttons.indexOf(document.activeElement)+(event.key==='ArrowRight'?1:-1)))
     setActive(nextIndex)
     buttons[nextIndex].focus()
   }}>
     {welcomeSlides.map((slide,index)=><button type="button" key={slide.en[0]} aria-label={(malay?'Slaid ':'Slide ')+(index+1)+': '+slide[language][0]} aria-pressed={index===active} onClick={()=>setActive(index)}/>)}
   </div>
 </section>
}

function LanguageToggle({value,onChange}) {
 return <div className="language-toggle" data-language={value} role="group" aria-label="Bahasa Melayu / English">
   <button type="button" lang="ms" aria-label="Bahasa Melayu" aria-pressed={value==='ms'} onClick={()=>onChange('ms')}>BM</button>
   <button type="button" lang="en" aria-label="English" aria-pressed={value==='en'} onClick={()=>onChange('en')}>EN</button>
 </div>
}

function AccessStep({heading,className='',children,footer,lang}) {
 return <section className={'access-step '+className} lang={lang}>
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
const registrationSteps = [
 ['/register','Mobile number'],
 ['/register/otp','SMS verification'],
 ['/register/details','Personal details'],
 ['/register/mykad','Scan MyKad'],
 ['/register/selfie','Selfie check'],
 ['/register/verification','Identity verification'],
 ['/register/identity-review','Review identity'],
 ['/register/address','Residential address'],
 ['/register/consent','Terms and consent'],
 ['/register/credentials','Sign-in details'],
 ['/register/pin','Set up PIN'],
 ['/register/biometrics','Biometrics (optional)'],
 ['/register/funding','Activate account'],
]
const registrationExceptions = {
 '/register/guardian':{step:'/register/details',next:'Return to personal details'},
 '/register/attention':{step:'/register/mykad',next:'Retake MyKad photo'},
 '/register/pending':{step:'/register/verification',next:'Review identity'},
}

export function RegistrationProgress({path,onExit}) {
 const complete=path==='/register/complete'
 const exception=registrationExceptions[path]
 const index=registrationSteps.findIndex(([route])=>route===(exception?.step||path))
 if(index<0&&!complete) return null
 const total=registrationSteps.length
 const current=complete?total:index+1
 const next=exception?.next||registrationSteps[index+1]?.[1]
 return <section className="registration-progress" aria-label="Registration progress">
   <div className="registration-progress-heading">
     <div className="registration-progress-label">
       <strong>{complete?'Registration complete':'Step '+current+' of '+total}</strong>
       {!complete&&<small>{registrationSteps[index][1]}</small>}
     </div>
     {!complete&&<button type="button" className="text-button" onClick={onExit}>Save and exit</button>}
   </div>
   <div className="access-progress" role="progressbar" aria-label="Registration progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={complete?total:index}
     aria-valuetext={complete?'Registration complete':'Step '+current+' of '+total+' · '+registrationSteps[index][1]} style={{gridTemplateColumns:'repeat('+total+',1fr)'}}>
     {registrationSteps.map(([route],position)=><span key={route} aria-hidden="true" data-state={complete||position<index?'complete':position===index?'current':undefined}/>)}
   </div>
   {!complete&&next&&<small className="registration-progress-next">Next: {next}</small>}
 </section>
}
function CaptureStep({selfie=false,heading,text,action,onClick,tips,prompts}) {
 return <AccessStep className="identity-capture" footer={<Button onClick={onClick}>{action}</Button>}>
   <div className="identity-intro"><h2>{heading}</h2><p>{text}</p></div>
   <div className="identity-preview" aria-hidden="true">
     <div className={selfie?'camera-guide face-guide':'camera-guide'}>
       <Icon name={selfie?'user':'card'} size={48}/>
     </div>
     <span>{selfie?'Selfie guide':'MyKad guide'}</span>
   </div>
   {prompts&&<ol className="liveness-steps">{prompts.map(prompt=><li key={prompt}>{prompt}</li>)}</ol>}
   <section className="module-panel identity-tips"><h3>Before you start</h3>
     <ul>{tips.map(tip=><li key={tip}><Icon name="check" size={16}/>{tip}</li>)}</ul>
   </section>
   <div className="identity-privacy">
     <small>Your camera stays off in this demo.</small>
     <PrivacyNoticeButton/>
   </div>
 </AccessStep>
}
function RegisterPrompt({onRegister}) {
 return <div className="access-signin-link">
   <span>Don’t have an account?</span>
   <button type="button" className="text-button" onClick={onRegister}>Register SKEB-Pro</button>
 </div>
}

function PasswordStep({mode,username:initialUsername='',stored,locked,logo,onBack,onHelp,onRegister,onForgot,onIncorrect,onSuccess}) {
 const signin=mode==='signin'
 const resetting=mode==='reset'
 const name=signin?stored?.username||'':initialUsername
 const [username,setUsername]=useState(name)
 const [password,setPassword]=useState('')
 const [confirmation,setConfirmation]=useState('')
 const [visible,setVisible]=useState(false)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const pending=useRef(false)
 const submitLabel=signin?'Sign in':resetting?'Save new password':'Continue'
 async function submit(event) {
   event.preventDefault()
   if(pending.current||locked) return
   const form=event.currentTarget
   setError('')
   if(!signin) {
     if(!/^[a-z0-9._-]{4,40}$/i.test(username.trim())) {setError('Use 4–40 letters, numbers, dots, hyphens or underscores for your username.');return}
     if(password.length<15) {setError('Use at least 15 characters for your demo password.');return}
     if(password!==confirmation) {setError('The passwords don’t match.');return}
   }
   pending.current=true
   setBusy(true)
   try {
     if(signin) {
       const valid=await checkDemoCredentials(username,password,stored)
       if(!form.isConnected) return
       if(valid) onSuccess()
       else {setError('The username or password is incorrect. Try again.');onIncorrect()}
     } else {
       const record=await createDemoCredentials(username,password)
       if(form.isConnected) onSuccess(record)
     }
   } catch {
     if(form.isConnected) setError('Couldn’t verify the demo credentials. Try again in a secure browser window.')
   } finally {
     pending.current=false
     if(form.isConnected) setBusy(false)
   }
 }
 return <AccessStep className={signin?'password-signin':''} heading={signin?undefined:resetting?'Choose a new password':'Create your sign-in details'}
   footer={!signin&&<Button form="masrif-password-form" type="submit" disabled={busy||locked}>{busy?'Please wait…':submitLabel}</Button>}>
   {signin?<><SignInHeader logo={logo} onBack={onBack} onHelp={onHelp}/>
     <div className="password-signin-hero">
       <h1>Sign in to your <span>SKEB-Pro account</span></h1><p>Enter your demo username and password.</p>
     </div>
   </>:<p>Use fictional credentials for this demo.</p>}
   <form id="masrif-password-form" className="module-panel registration-form-card" onSubmit={submit}>
     <label>Username<input autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={40} required readOnly={resetting}
       value={username} onChange={event=>{setUsername(event.target.value);setError('')}}/></label>
     <div className="password-field">
       <label htmlFor="masrif-password">{resetting?'New password':'Password'}</label>
       <div className="password-field-control">
         <input id="masrif-password" type={visible?'text':'password'} autoComplete={signin?'current-password':'new-password'}
           maxLength={128} required value={password} onChange={event=>{setPassword(event.target.value);setError('')}}/>
         <button type="button" className="icon-button" aria-label={visible?'Hide password':'Show password'} aria-controls="masrif-password" onClick={()=>setVisible(value=>!value)}><Icon name={visible?'eyeOff':'eye'} size={20}/></button>
       </div>
     </div>
     {onForgot&&<button type="button" className="text-button password-forgot" onClick={onForgot}>Forgot password?</button>}
     {!signin&&<><small>Use at least 15 characters.</small>
       <label>Confirm password<input type="password" autoComplete="new-password" maxLength={128} required
         value={confirmation} onChange={event=>{setConfirmation(event.target.value);setError('')}}/></label></>}
     {locked&&<p className="notice passcode-error" role="alert">Your demo account is locked. Reset your password to continue.</p>}
     {error&&<p className="notice passcode-error" role="alert">{error}</p>}
     {signin&&!stored&&<section className="password-demo" aria-label="Demo sign-in details">
       <h2>Demo account</h2>
       <dl>
         <dt>Username</dt><dd>{sampleCredentials.username}</dd>
         <dt>Password</dt><dd>{sampleCredentials.password}</dd>
       </dl>
       <button type="button" className="text-button password-sample" onClick={()=>{setUsername(sampleCredentials.username);setPassword(sampleCredentials.password);setError('')}}>Use sample credentials</button>
     </section>}
     {signin&&<Button type="submit" disabled={busy||locked}>{busy?'Please wait…':submitLabel}</Button>}
     {onRegister&&<RegisterPrompt onRegister={onRegister}/>}
   </form>
 </AccessStep>
}

function RegistrationAddress({address,onChange,onContinue}) {
 const [attempted,setAttempted] = useState(false)
 const error = attempted&&!validAddress(address)
 const edit = (field,value) => onChange({...address,[field]:value})
 return <AccessStep heading="Enter your residential address" footer={<Button type="submit" form="registration-address">Continue</Button>}>
   <p>Use a fictional address in Malaysia.</p>
   <form id="registration-address" className="module-panel registration-form-card" onSubmit={event=>{
     event.preventDefault()
     setAttempted(true)
     if(validAddress(address)) onContinue()
   }}>
     <label>Address line 1<input autoComplete="off" maxLength={100} value={address.line1} onChange={event=>edit('line1',event.target.value)}/></label>
     <label>Address line 2 <small>Optional</small><input autoComplete="off" maxLength={100} value={address.line2} onChange={event=>edit('line2',event.target.value)}/></label>
     <div className="registration-address-locality">
       <label>Postcode<input inputMode="numeric" autoComplete="off" maxLength={5} value={address.postcode} onChange={event=>edit('postcode',event.target.value.replace(/\D/g,''))}/></label>
       <label>City or town<input autoComplete="off" maxLength={60} value={address.city} onChange={event=>edit('city',event.target.value)}/></label>
     </div>
     <Dropdown label="State or federal territory" value={address.state} options={states} onChange={value=>edit('state',value)}/>
     {error&&<p className="notice passcode-error" role="alert">Enter an address, five-digit postcode, city or town, and state.</p>}
     <button type="button" className="text-button registration-phone-sample" onClick={()=>onChange(sampleAddress)}>Use sample address</button>
   </form>
 </AccessStep>
}

function RegistrationMobile({value,onChange,onContinue}) {
 const [touched,setTouched] = useState(false)
 const input = useRef(null)
 const normalized = normalizeMalaysianMobile(value)
 const invalid = touched&&!normalized
 const display = value.startsWith('+60')&&normalized ? formatMobileDigits(normalized) : value
 return <AccessStep heading="Enter your mobile number" footer={<Button type="submit" form="registration-mobile">Continue</Button>}>
   <p>Use a fictional Malaysian mobile number to try verification with a demo code.</p>
   <form id="registration-mobile" className="stack" onSubmit={event=>{
     event.preventDefault()
     setTouched(true)
     if(normalized){onChange(normalized);onContinue()}
     else input.current?.focus()
   }}>
     <label htmlFor="registration-mobile-number">Mobile number</label>
     <div className="registration-phone" data-invalid={invalid||undefined}>
       <span className="registration-phone-prefix" aria-label="Malaysia country code plus 60">MY +60</span>
       <input ref={input} id="registration-mobile-number" type="tel" inputMode="tel" autoComplete="off"
         maxLength={28} placeholder="12 345 6789" value={display} aria-invalid={invalid}
         aria-describedby={invalid?'registration-phone-error':undefined} onBlur={()=>{
           if(value.trim())setTouched(true)
           if(normalized)onChange(normalized)
         }}
         onChange={event=>onChange(event.target.value)} onPaste={event=>{
           const pasted = normalizeMalaysianMobile(event.clipboardData.getData('text'))
           if(pasted){event.preventDefault();onChange(pasted)}
         }}/>
     </div>
     {invalid&&<p id="registration-phone-error" role="alert" className="notice passcode-error">Enter a valid Malaysian mobile number.</p>}
     <button type="button" className="text-button registration-phone-sample" onClick={()=>onChange(normalizeMalaysianMobile(fixedValues.mobile))}>Use sample number</button>
   </form>
 </AccessStep>
}

const demoResendDelay = 30000
const demoOtpLifetime = 5*60*1000

function OtpScreen({mobile,onSuccess,onChangeNumber,onHelp}) {
 const input = useRef(null)
 const [digits,setDigits]=useState('')
 const [issuedAt,setIssuedAt]=useState(()=>Date.now())
 const [now,setNow]=useState(()=>Date.now())
 const [error,setError]=useState('')
 const [status,setStatus]=useState('')
 const remaining = Math.max(0,Math.ceil((issuedAt+demoResendDelay-now)/1000))
 const expired = now>=issuedAt+demoOtpLifetime
 const normalized = normalizeMalaysianMobile(mobile)
 useEffect(()=>{
   const timer=setInterval(()=>setNow(Date.now()),1000)
   return ()=>clearInterval(timer)
 },[])
 function resend() {
   const time = Date.now()
   if(time<issuedAt+demoResendDelay) return
   setIssuedAt(time)
   setNow(time)
   setDigits('')
   setError('')
   setStatus('A fresh demo code is ready. No SMS was sent.')
 }
 return <form className="access-step otp-screen" onSubmit={event=>{
   event.preventDefault()
   if(Date.now()>=issuedAt+demoOtpLifetime) {
     setNow(Date.now())
     return
   }
   if(digits.length!==6) return
   if(digits===demoCode) onSuccess()
   else {
     setStatus('')
     setError('That code is incorrect. Try again.')
     input.current?.select()
   }
 }}>
   <div className="access-content">
     <h2>Enter the 6-digit code</h2>
     <div className="registration-otp-destination">
       <p>Verifying <strong>{normalized?'+60 '+formatMobileDigits(normalized):mobile}</strong></p>
       {onChangeNumber&&<button type="button" className="text-button" onClick={onChangeNumber}>Change number</button>}
     </div>
     <p>This demo doesn’t send an SMS. Select <strong>Use demo code</strong> to try verification.</p>
     <label className="otp-entry" aria-label="Six-digit demo code">
       <input ref={input} aria-label="Six-digit demo code" type="text" inputMode="numeric" autoComplete="one-time-code" value={digits}
         aria-invalid={Boolean(error)||expired} aria-describedby={error||expired?'otp-error':undefined}
         onChange={event=>{setDigits(event.target.value.replace(/\D/g,'').slice(0,6));setError('');setStatus('')}}/>
       <span className="otp-boxes" aria-hidden="true">{Array.from({length:6},(_,index)=><span key={index} data-current={digits.length===index}>{digits[index]||''}</span>)}</span>
     </label>
     <div className="row"><button className="text-button" type="button" disabled={expired} onClick={()=>{setDigits(demoCode);setError('');setStatus('')}}>Use demo code</button><button type="button" className="text-button" disabled={remaining>0} onClick={resend}>{remaining>0?'Resend in '+remaining+'s':'Resend demo code'}</button></div>
     {(expired||error)&&<p id="otp-error" role="alert" className="notice passcode-error">{expired?'This demo code has expired. Resend the code to continue.':error}</p>}
     {!expired&&status&&<p role="status" className="notice">{status}</p>}
     <button type="button" className="text-button registration-phone-sample" onClick={onHelp}>Need help with verification?</button>
   </div>
   <div className="access-actions"><Button disabled={expired||digits.length!==6}>Verify</Button></div>
 </form>
}
function SignInHeader({logo,onBack,onHelp}) {
 return <div className="passcode-header">
   {onBack&&<button type="button" className="icon-button passcode-back" aria-label="Back" onClick={onBack}><Icon name="back" size={20}/></button>}
   {logo}
   {onHelp&&<button type="button" className="icon-button" aria-label="Get sign-in help" onClick={onHelp}><Icon name="help" size={20}/></button>}
 </div>
}

function CodeScreen({heading,description,action,onSuccess,onIncorrect,expected=demoCode,create,logo,onBack,onHelp,onRecovery,onBiometric,footer,attemptsLeft,notice}) {
 const [digits,setDigits] = useState('')
 const [firstPin,setFirstPin] = useState('')
 const [error,setError] = useState('')
 const [biometricPrompt,setBiometricPrompt] = useState(false)
 const [biometricNotice,setBiometricNotice] = useState(false)
 const confirming = Boolean(firstPin)
 function verify(value) {
   if(value.length!==6) return
   if(create&&!confirming){setFirstPin(value);setDigits('');setError('');return}
   if(value!==(create?firstPin:expected)){
     setError(create?'The PINs did not match. Enter your chosen PIN again.':'Incorrect demo PIN. Try again.')
     setDigits('')
     onIncorrect?.()
     return
   }
   onSuccess(value)
 }
 function press(key) {
   setError('')
   const value=key==='Del'?digits.slice(0,-1):(digits+key).slice(0,6)
   setDigits(value)
   if(!create&&key!=='Del'&&digits.length===5) verify(value)
 }
 return <><form className="access-step access-code" onSubmit={event=>{event.preventDefault();if(create)verify(digits)}} onKeyDown={event=>{
   if (!/^\d$/.test(event.key) && event.key!=='Backspace') return
   event.preventDefault()
   press(event.key==='Backspace'?'Del':event.key)
 }}>
   <div className="access-content">
     <SignInHeader logo={logo} onBack={onBack} onHelp={onHelp}/>
     <div className="passcode-prompt">
       <h2>{confirming?'Confirm your PIN':heading}</h2>
       <p>{confirming?'Re-enter your new six-digit PIN.':description}</p>
     </div>
     <div className="access-code-dots" role="group" aria-label={digits.length+' of 6 digits entered'}>{Array.from({length:6},(_,i)=><span key={i} aria-hidden="true" data-filled={i<digits.length}/>)}</div>
     {notice&&<p className="notice" role="status">{notice}</p>}
     {biometricNotice&&<p className="notice" role="status">Face ID is off. Sign in with your PIN, then enable biometrics in Profile → Security.</p>}
     {error&&<p className="notice passcode-error" role="alert">{error}{!create&&attemptsLeft>0?' '+attemptsLeft+' '+(attemptsLeft===1?'attempt':'attempts')+' remaining.':''}</p>}
     {onRecovery&&<button type="button" className="text-button" onClick={onRecovery}>Forgot passcode?</button>}
     {!create&&<small>Demo PIN: {expected}</small>}
     {footer}
   </div>
   <div className="access-actions passcode-keyboard">
     <div className="keypad access-keypad" role="group" aria-label="Demo keypad">
       {'123456789'.split('').map(digit=><button type="button" key={digit} onClick={()=>press(digit)}>{digit}</button>)}
       {onBiometric?<button type="button" aria-label="Use Face ID (demo)" onClick={()=>{
         if(localStorage.getItem(biometricKey)==='true') setBiometricPrompt(true)
         else setBiometricNotice(true)
       }}><Icon name="face" size={23}/></button>:<span aria-hidden="true"/>}
       <button type="button" onClick={()=>press('0')}>0</button>
       <button type="button" aria-label="Delete digit" onClick={()=>press('Del')}><Icon name="backspace" size={23}/></button>
     </div>
     {create&&<Button disabled={digits.length!==6}>{confirming?'Confirm PIN':action}</Button>}
   </div>
 </form>
 {biometricPrompt&&<ConfirmDialog title="Sign in with Face ID" action="Simulate Face ID" onCancel={()=>setBiometricPrompt(false)} onConfirm={()=>{
   setBiometricPrompt(false)
   if(localStorage.getItem(biometricKey)==='true') onBiometric()
   else setBiometricNotice(true)
 }}>
   <p>Preview biometric sign-in for this demo account.</p>
 </ConfirmDialog>}
 </>
}

// Demo-only shortcuts to alternate outcomes, kept out of the main path.
function Scenarios({children}) {
 return <details className="access-scenarios"><summary>Demo scenarios</summary><div>{children}</div></details>
}
