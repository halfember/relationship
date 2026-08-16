export type AccessTokenPayload = {
  sub: number
  exp: number
}

const TOKEN_KEY = 'webAccessToken'

function decodePayload(token: string): AccessTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  try {
    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as AccessTokenPayload
    if (!Number.isInteger(payload.sub) || payload.sub <= 0 || !Number.isFinite(payload.exp)) return null
    return payload
  } catch {
    return null
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token.trim())
  localStorage.removeItem('webUserId')
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('webUserId')
}

export function getAccessTokenPayload(): AccessTokenPayload | null {
  const token = getAccessToken()
  const payload = token ? decodePayload(token) : null
  if (!payload || payload.exp <= Date.now() / 1000) return null
  return payload
}

export function hasValidAccessToken() {
  return getAccessTokenPayload() !== null
}

export function requireCurrentUserId() {
  const payload = getAccessTokenPayload()
  if (!payload) throw new Error('Web access token is missing or expired')
  return payload.sub
}
