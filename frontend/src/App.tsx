import { useEffect, useMemo, useState } from 'react'
import AuthPage from './AuthPage'
import { ChatView } from './ChatView'
import KnowledgePanel from './KnowledgePanel'
import { Sidebar } from './Sidebar'
import { SettingsPanel } from './SettingsPanel'
import { apiRequest, AuthError, clearSession, getStoredLang, getStoredSession, setStoredLang, streamChat } from './api'
import { MAX_TITLE, MODULES } from './constants'
import { t } from './i18n'
import { canManageKnowledge, type Conversation, type ConversationSummary, type Lang, type Message, type Session } from './types'

interface SaveResponse {
  readonly id: string
}

const createTitle = (messages: readonly Message[]): string => messages[0]?.content.slice(0, MAX_TITLE) || '新对话'

const detectLang = (text: string): Lang => (/[Ѐ-ӿ]/.test(text) ? 'ru' : 'zh')

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getStoredSession())
  const [uiLang, setUiLang] = useState<Lang>(() => getStoredLang())
  const [conversations, setConversations] = useState<readonly Conversation[]>([])
  const [activeId, setActiveId] = useState('')
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const active = conversations.find((conversation) => conversation.id === activeId)
  const messages = active?.messages ?? []
  const allowedModules = session?.allowedModules.length ? session.allowedModules : MODULES.map((module) => module.key)
  const canManage = session ? canManageKnowledge(session.role) : false

  const handleLogout = (): void => {
    clearSession()
    setSession(null)
    setConversations([])
    setActiveId('')
    setShowKnowledge(false)
    setShowSettings(false)
  }

  const handleError = (error: unknown): void => {
    if (error instanceof AuthError) {
      handleLogout()
      return
    }
  }

  const createConversation = async (lang: Lang): Promise<Conversation> => {
    const data = await apiRequest<SaveResponse>('/api/conversations/save', {
      method: 'POST',
      body: { title: t('新对话', lang), lang, messages: [], pinned: false },
    })
    return { id: data.id, title: t('新对话', lang), lang, messages: [], pinned: false }
  }

  const loadConversation = async (id: string): Promise<void> => {
    const data = await apiRequest<Conversation>(`/api/conversations/${id}`)
    setConversations((current) => current.map((conversation) => (conversation.id === data.id ? { ...data, messages: data.messages ?? [] } : conversation)))
  }

  const loadConversations = async (): Promise<void> => {
    try {
      const list = await apiRequest<readonly ConversationSummary[]>('/api/conversations/list')
      if (list.length === 0) {
        const created = await createConversation(uiLang)
        setConversations([created])
        setActiveId(created.id)
        return
      }
      const next = list.map((item) => ({ id: item.id, title: item.title, lang: item.lang ?? 'zh', messages: [], pinned: Boolean(item.pinned) }))
      setConversations(next)
      setActiveId(next[0]?.id ?? '')
      if (next[0]) await loadConversation(next[0].id)
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    if (session) void loadConversations()
  }, [session?.token])

  const saveConversation = async (id: string, nextMessages: readonly Message[], lang: Lang, title: string, pinned: boolean): Promise<void> => {
    await apiRequest<{ readonly message: string }>(`/api/conversations/${id}/full`, {
      method: 'PUT',
      body: { title, lang, messages: nextMessages, pinned },
    })
  }

  const newChat = async (): Promise<void> => {
    try {
      const created = await createConversation(uiLang)
      setConversations((current) => [created, ...current])
      setActiveId(created.id)
    } catch (error) {
      handleError(error)
    }
  }

  const switchConversation = async (id: string): Promise<void> => {
    setActiveId(id)
    try {
      await loadConversation(id)
    } catch (error) {
      handleError(error)
    }
  }

  const renameConversation = async (id: string, title: string): Promise<void> => {
    const nextTitle = window.prompt(t('输入新标题', uiLang), title)?.trim()
    if (!nextTitle || nextTitle === title) return
    try {
      await apiRequest<{ readonly message: string }>(`/api/conversations/${id}`, { method: 'PUT', body: { title: nextTitle } })
      setConversations((current) => current.map((conversation) => (conversation.id === id ? { ...conversation, title: nextTitle } : conversation)))
    } catch (error) {
      handleError(error)
    }
  }

  const togglePin = async (id: string, pinned: boolean): Promise<void> => {
    try {
      await apiRequest<{ readonly message: string }>(`/api/conversations/${id}`, { method: 'PUT', body: { pinned } })
      setConversations((current) => current.map((conversation) => (conversation.id === id ? { ...conversation, pinned } : conversation)).sort((a, b) => Number(b.pinned) - Number(a.pinned)))
    } catch (error) {
      handleError(error)
    }
  }

  const deleteConversation = async (id: string): Promise<void> => {
    if (!window.confirm(t('确认删除', uiLang))) return
    try {
      await apiRequest<{ readonly message: string }>(`/api/conversations/${id}`, { method: 'DELETE' })
      const remaining = conversations.filter((conversation) => conversation.id !== id)
      if (remaining.length === 0) {
        const created = await createConversation(uiLang)
        setConversations([created])
        setActiveId(created.id)
        return
      }
      setConversations(remaining)
      if (activeId === id) setActiveId(remaining[0]?.id ?? '')
    } catch (error) {
      handleError(error)
    }
  }

  const setLang = (lang: Lang): void => {
    setUiLang(lang)
    setStoredLang(lang)
    if (!active) return
    const updated = { ...active, lang }
    setConversations((current) => current.map((conversation) => (conversation.id === activeId ? updated : conversation)))
    void saveConversation(activeId, active.messages, lang, active.title, active.pinned).catch(handleError)
  }

  const saveLang = (): void => {
    setSaveMessage(t('已保存', uiLang))
    window.setTimeout(() => setSaveMessage(''), 1800)
  }

  const send = async (text?: string): Promise<void> => {
    const query = (text ?? input).trim()
    if (!query || loading || !active) return
    const replyLang = detectLang(query)
    setUiLang(replyLang)
    setStoredLang(replyLang)
    setInput('')
    const userMessage: Message = { role: 'user', content: query }
    const nextMessages: readonly Message[] = [...messages, userMessage]
    setConversations((current) => current.map((conversation) => (conversation.id === activeId ? { ...conversation, lang: replyLang, messages: [...nextMessages, { role: 'assistant', content: '' }] } : conversation)))
    setLoading(true)

    try {
      const streamed = await streamChat({
        query,
        lang: replyLang,
        history: messages.slice(-6).map((item) => ({ role: item.role, content: item.content })),
        onText: (textValue, meta) => {
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === activeId
                ? { ...conversation, messages: [...nextMessages, { role: 'assistant', content: textValue, source: meta.source, references: meta.references }] }
                : conversation,
            ),
          )
        },
      })
      const finalMessages: readonly Message[] = [...nextMessages, { role: 'assistant', content: streamed.text, source: streamed.meta.source, references: streamed.meta.references }]
      const title = active.title === t('新对话', active.lang) || active.title === '新对话' ? createTitle(nextMessages) : active.title
      setConversations((current) => current.map((conversation) => (conversation.id === activeId ? { ...conversation, lang: replyLang, messages: finalMessages, title } : conversation)))
      await saveConversation(activeId, finalMessages, replyLang, title, active.pinned)
    } catch (error) {
      handleError(error)
      setConversations((current) => current.map((conversation) => (conversation.id === activeId ? { ...conversation, messages: [...nextMessages, { role: 'assistant', content: t('连接失败', replyLang) }] } : conversation)))
    } finally {
      setLoading(false)
    }
  }

  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned)), [conversations])

  if (!session) {
    return <AuthPage lang={uiLang} onLangChange={setLang} onLogin={setSession} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        lang={uiLang}
        conversations={sortedConversations}
        activeId={activeId}
        search={search}
        onSearch={setSearch}
        onNewChat={() => void newChat()}
        onSwitch={(id) => void switchConversation(id)}
        onRename={(id, title) => void renameConversation(id, title)}
        onTogglePin={(id, pinned) => void togglePin(id, pinned)}
        onDelete={(id) => void deleteConversation(id)}
        onSettings={() => setShowSettings(true)}
      />
      <main className="main">
        <div className="topbar">
          <button className="ghost-button" type="button" onClick={() => setSidebarOpen((open) => !open)}>
            Menu
          </button>
        </div>
        {showSettings ? (
          <SettingsPanel
            lang={uiLang}
            session={session}
            visibleModules={allowedModules}
            canManage={canManage}
            saveMessage={saveMessage}
            onBack={() => setShowSettings(false)}
            onLangChange={setLang}
            onSaveLang={saveLang}
            onKnowledge={() => {
              setShowKnowledge(true)
              setShowSettings(false)
            }}
            onLogout={handleLogout}
          />
        ) : (
          <ChatView lang={uiLang} messages={messages} loading={loading} input={input} visibleModules={allowedModules} onInput={setInput} onSend={(value) => void send(value)} />
        )}
      </main>
      {showKnowledge ? <KnowledgePanel lang={uiLang} onClose={() => setShowKnowledge(false)} onAuthError={handleLogout} /> : null}
    </div>
  )
}
