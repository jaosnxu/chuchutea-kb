export interface Message {
  role: 'user' | 'assistant'
  content: string
  references?: { title: string; module: string; id: string }[]
  source?: string
}

export interface Conversation {
  id: string
  title: string
  lang: 'zh' | 'ru'
  messages: Message[]
  pinned: boolean
}
