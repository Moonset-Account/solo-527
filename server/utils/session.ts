import type { H3Event } from 'h3'
import { createHash, randomBytes } from 'crypto'

const SESSION_COOKIE = 'contract_review_session'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

const sessionStore: Map<string, { data: any; expires: number }> = new Map()

function sign(value: string): string {
  const secret = process.env.NUXT_SESSION_SECRET || 'contract-review-dev-secret-key-2024'
  return createHash('sha256').update(value + secret).digest('hex').substring(0, 16)
}

function encode(data: any): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function decode(token: string): any | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  if (sign(payload) !== sig) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function getSid(event: H3Event): string {
  const cookies = parseCookies(event)
  let sid = cookies[SESSION_COOKIE]
  if (!sid) {
    sid = randomBytes(32).toString('hex')
    setCookie(event, SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL / 1000
    })
  }
  return sid
}

export async function getUserSession(event: H3Event): Promise<any> {
  const sid = getSid(event)
  const entry = sessionStore.get(sid)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    sessionStore.delete(sid)
    return null
  }
  return entry.data
}

export async function setUserSession(event: H3Event, data: any): Promise<void> {
  const sid = getSid(event)
  sessionStore.set(sid, {
    data,
    expires: Date.now() + SESSION_TTL
  })
}

export async function clearUserSession(event: H3Event): Promise<void> {
  const cookies = parseCookies(event)
  const sid = cookies[SESSION_COOKIE]
  if (sid) {
    sessionStore.delete(sid)
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
