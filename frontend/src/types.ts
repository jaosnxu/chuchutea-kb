export type Lang = 'zh' | 'ru'

export type Role = '' | 'viewer' | 'editor' | 'admin'

export type MessageRole = 'user' | 'assistant'

export type MessageSource = 'knowledge_base' | 'llm_fallback'

export interface Reference {
  readonly title: string
  readonly module: string
  readonly id: string
}

export interface Message {
  readonly role: MessageRole
  readonly content: string
  readonly references?: readonly Reference[]
  readonly source?: MessageSource
}

export interface Conversation {
  readonly id: string
  readonly title: string
  readonly lang: Lang
  readonly messages: readonly Message[]
  readonly pinned: boolean
}

export interface ConversationSummary {
  readonly id: string
  readonly title: string
  readonly lang?: Lang
  readonly pinned?: boolean
  readonly updated_at: string
}

export interface Session {
  readonly token: string
  readonly username: string
  readonly role: Role
  readonly allowedModules: readonly string[]
}

export interface ModuleInfo {
  readonly key: string
  readonly label: string
}

export interface KnowledgeItem {
  readonly id: string
  readonly module: string
  readonly title: string
  readonly content: string
  readonly title_zh: string
  readonly title_ru: string
  readonly content_zh: string
  readonly content_ru: string
  readonly image_url: string
  readonly is_published: boolean
  readonly created_at: string
  readonly updated_at: string
}

export interface KnowledgeListResponse {
  readonly items: readonly KnowledgeItem[]
  readonly total: number
}

export interface LoginResponse {
  readonly token: string
  readonly username: string
  readonly role: Role
  readonly allowed_modules: readonly string[]
}

export const isLang = (value: string | null): value is Lang => value === 'zh' || value === 'ru'

export const normalizeLang = (value: string | null): Lang => (isLang(value) ? value : 'zh')

export const normalizeRole = (value: string | null): Role => {
  if (value === 'viewer' || value === 'editor' || value === 'admin') return value
  return ''
}

export const canManageKnowledge = (role: Role): boolean => role === 'admin' || role === 'editor'
