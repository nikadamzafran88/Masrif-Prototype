import { readDemo } from './demoStorage'

export const credentialKey = 'masrif-demo-credentials'
export const trustedDeviceKey = 'masrif-session-trusted-device'
export const sampleCredentials = {username:'farah.demo',password:'SKEB-Pro demo password'}
export const savedCredentials = () => readDemo(credentialKey,null)

async function passwordDigest(password,salt) {
  const encoder = new TextEncoder()
  const secret = await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits'])
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:210000},secret,256)
  return Array.from(new Uint8Array(bits),byte=>byte.toString(16).padStart(2,'0')).join('')
}

export async function createDemoCredentials(username,password) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
  return {username:username.trim().toLowerCase(),salt,digest:await passwordDigest(password,salt)}
}

export async function checkDemoCredentials(username,password,stored) {
  const name = username.trim().toLowerCase()
  if (!stored) return name===sampleCredentials.username&&password===sampleCredentials.password
  if (stored.username!==name) return false
  return await passwordDigest(password,stored.salt)===stored.digest
}
