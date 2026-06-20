import { normalizeLang, normalizeRole, type Lang, type LoginResponse, type Message, type MessageSource, type Reference, type Session } from './types'

const TOKEN_KEY = 'token'
const USERNAME_KEY = 'username'
const ROLE_KEY = 'role'
const MODULES_KEY = 'allowed_modules'
const UI_LANG_KEY = 'ui_lang'
const REQUEST_TIMEOUT_MS = 90000

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class AuthError extends ApiError {
  constructor(message = '未登录') {
    super(401, message)
    this.name = 'AuthError'
  }
}

interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  readonly body?: unknown | FormData
  readonly timeoutMs?: number
}

interface StreamChatParams {
  readonly query: string
  readonly lang: Lang
  readonly history: readonly Pick<Message, 'role' | 'content'>[]
  readonly onText: (text: string, meta: StreamMeta) => void
}

export interface StreamMeta {
  readonly source?: MessageSource
  readonly references?: readonly Reference[]
}

const parseModules = (raw: string | null): readonly string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export const getStoredLang = (): Lang => normalizeLang(localStorage.getItem(UI_LANG_KEY))

export const setStoredLang = (lang: Lang): void => {
  localStorage.setItem(UI_LANG_KEY, lang)
}

export const getStoredSession = (): Session | null => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  return {
    token,
    username: localStorage.getItem(USERNAME_KEY) ?? '',
    role: normalizeRole(localStorage.getItem(ROLE_KEY)),
    allowedModules: parseModules(localStorage.getItem(MODULES_KEY)),
  }
}

export const saveSession = (data: LoginResponse): Session => {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USERNAME_KEY, data.username)
  localStorage.setItem(ROLE_KEY, data.role)
  localStorage.setItem(MODULES_KEY, JSON.stringify(data.allowed_modules))
  return {
    token: data.token,
    username: data.username,
    role: data.role,
    allowedModules: data.allowed_modules,
  }
}

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(MODULES_KEY)
}

export const authHeaders = (): Headers => {
  const headers = new Headers()
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text()
  if (!text) return response.statusText
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = parsed.detail
      return typeof detail === 'string' ? detail : response.statusText
    }
  } catch {
    return text
  }
  return text
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS)
  const headers = authHeaders()
  let body: BodyInit | undefined

  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
    })
    if (response.status === 401) throw new AuthError()
    if (!response.ok) throw new ApiError(response.status, await readErrorMessage(response))
    return await response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, '请求超时')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function streamChat({ query, lang, history, onText }: StreamChatParams): Promise<{ readonly text: string; readonly meta: StreamMeta }> {
  const headers = authHeaders()
  headers.set('Content-Type', 'application/json')
  const response = await fetch('/api/chat/ask/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, lang, history }),
  })
  if (response.status === 401) throw new AuthError()
  if (!response.ok || !response.body) throw new ApiError(response.status, '连接失败')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let meta: StreamMeta = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      const parsed = JSON.parse(data)
      if (parsed.type === 'meta') {
        meta = { source: parsed.source, references: parsed.references }
      }
      if (parsed.type === 'text' && typeof parsed.text === 'string') {
        text += parsed.text
        onText(text, meta)
      }
    }
  }

  return { text, meta }
}
