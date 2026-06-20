import { useState, useRef, useEffect } from 'react'
import AuthPage from './AuthPage'
import KnowledgePanel from './KnowledgePanel'

interface Message {
  role: 'user' | 'assistant'
  content: string
  references?: { title: string; module: string; id: string }[]
  source?: string
}

interface Conversation { id: string; title: string; lang: 'zh' | 'ru'; messages: Message[] }

const MODULES = [
  { key: 'product', label: '产品库' }, { key: 'sop', label: '操作SOP' },
  { key: 'training', label: '培训资料' }, { key: 'store', label: '门店信息' },
  { key: 'marketing', label: '营销活动' }, { key: 'brand', label: '品牌' },
  { key: 'franchise', label: '特许经营' }, { key: 'operations', label: '运营管理' },
  { key: 'equipment', label: '设备' }, { key: 'maintenance', label: '维修' },
]

const CITIES = ['大诺夫哥罗德', '普斯科夫', '特维尔']

const S = {
  body: { display: 'flex', height: '100vh', background: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#1a1a1a' } as React.CSSProperties,
  sidebar: (open: boolean) => ({ width: open ? 260 : 0, minWidth: open ? 260 : 0, background: '#f9f9f9', borderRight: open ? '1px solid #e5e5e5' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.2s' } as React.CSSProperties),
  sidebarTop: { padding: '12px 12px 8px', borderBottom: '1px solid #e5e5e5' } as React.CSSProperties,
  newChatBtn: { width: '100%', padding: '8px', border: '1px solid #d1d1d1', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: '#333' } as React.CSSProperties,
  historyList: { flex: 1, overflowY: 'auto', padding: '8px' } as React.CSSProperties,
  historyItem: (active: boolean) => ({ padding: '8px 10px', borderRadius: 6, fontSize: 13, color: active ? '#1a1a1a' : '#666', cursor: 'pointer', background: active ? '#e8e8e8' : 'transparent', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties),
  sidebarFooter: { padding: '8px 12px', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 } as React.CSSProperties,
  topbar: { padding: '8px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  chatArea: { flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' } as React.CSSProperties,
  messagesWrap: { width: '100%', maxWidth: 720 } as React.CSSProperties,
  welcome: { textAlign: 'center', padding: '40px 0' } as React.CSSProperties,
  msgRow: (role: string) => ({ display: 'flex', gap: 12, padding: '16px 0', flexDirection: role === 'user' ? 'row-reverse' : 'row' } as React.CSSProperties),
  msgBubble: (role: string) => ({ maxWidth: 620, padding: '10px 16px', borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: role === 'user' ? '#f0f0f0' : 'transparent', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' as 'pre-wrap' } as React.CSSProperties),
  inputWrap: { width: '100%', maxWidth: 720, margin: '16px auto 24px', border: '1px solid #e5e5e5', borderRadius: 16, background: '#f9f9f9', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
}

const App: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [currentUser, setCurrentUser] = useState({ username: localStorage.getItem('username') || '', role: localStorage.getItem('role') || '' })
  const [allowedModules, setAllowedModules] = useState<string[]>(
    JSON.parse(localStorage.getItem('allowed_modules') || '[]')
  )
  const [convs, setConvs] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const active = convs.find(c => c.id === activeId)
  const messages = active?.messages || []
  const currentLang = active?.lang || 'zh'

  useEffect(() => {
    fetch('/api/conversations/list').then(r => r.json()).then((list: any[]) => {
      if (list.length > 0) {
        setConvs(list.map(c => ({ ...c, messages: [] })))
        setActiveId(list[0].id)
        fetch(`/api/conversations/${list[0].id}`).then(r => r.json()).then(d => {
          setConvs(prev => prev.map(c => c.id === d.id ? { ...c, messages: d.messages, lang: d.lang || 'zh' } : c))
        })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [messages, loading])

  const saveConvToServer = (id: string, msgs: Message[], lang: string, title?: string) => {
    fetch(`/api/conversations/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || msgs[0]?.content?.slice(0, 30) || '新对话', lang, messages: msgs }),
    }).catch(() => {})
  }

  const newChat = async () => {
    try {
      const r = await fetch('/api/conversations/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新对话', lang: currentLang, messages: [] }),
      })
      const d = await r.json()
      const c: Conversation = { id: d.id, title: '新对话', lang: currentLang, messages: [] }
      setConvs(prev => [c, ...prev])
      setActiveId(c.id)
    } catch { /* fallback */ }
  }

  const switchConv = async (id: string) => {
    setActiveId(id)
    const existing = convs.find(c => c.id === id)
    if (existing && existing.messages.length === 0) {
      try {
        const r = await fetch(`/api/conversations/${id}`)
        const d = await r.json()
        setConvs(prev => prev.map(c => c.id === id ? { ...c, messages: d.messages, lang: d.lang || 'zh' } : c))
      } catch {}
    }
  }

  const setLang = (lang: 'zh' | 'ru') => {
    if (!active) return
    const updated = { ...active, lang }
    setConvs(prev => prev.map(c => c.id === activeId ? updated : c))
    saveConvToServer(activeId, active.messages, lang)
  }

  const send = async (text?: string) => {
    const q = (text || input).trim()
    if (!q || loading || !active) return
    setInput('')
    const lang = currentLang
    const msgs: Message[] = [...messages, { role: 'user', content: q }]
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages: msgs } : c))
    setLoading(true)
    try {
      const res = await fetch('/api/chat/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, lang }) })
      const d = await res.json()
      const updated = [...msgs, { role: 'assistant' as const, content: d.answer, references: d.references, source: d.source }]
      setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages: updated, title: msgs[0]?.content?.slice(0, 30) || '新对话' } : c))
      saveConvToServer(activeId, updated, lang)
    } catch {
      const updated = [...msgs, { role: 'assistant' as const, content: '⚠️ 服务连接失败' }]
      setConvs(prev => prev.map(c => c.id === activeId ? { ...c, messages: updated } : c))
    }
    setLoading(false)
  }

  const isEmpty = messages.length === 0

  // 登录处理
  const handleLogin = (t: string, username: string, role: string) => {
    setToken(t)
    setCurrentUser({ username, role })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    setToken('')
    setCurrentUser({ username: '', role: '' })
  }

  // 未登录 → 显示登录页
  if (!token) {
    return <AuthPage onLogin={handleLogin} />
  }

  return (
    <div style={S.body}>
      {/* ===== 左侧边栏 ===== */}
      <div style={S.sidebar(sidebarOpen)}>
        {showSettings ? (
          /* 设置面板 */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <b style={{ fontSize: 15 }}>⚙ 项目设置</b>
              <button onClick={() => setShowSettings(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#999' }}>← 返回</button>
            </div>

            {/* 品牌 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>品牌</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: 0 }}>🧋 CHUCHUTEA</p>
              <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>AI 知识库 v0.1</p>
              <p style={{ fontSize: 11, color: '#aaa', margin: '8px 0 0' }}>
                俄罗斯 · {CITIES.join('、')}
              </p>
            </div>

            {/* 语言 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>语言 / Language</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setLang('zh')} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: currentLang === 'zh' ? '1.5px solid #333' : '1px solid #e5e5e5',
                  background: currentLang === 'zh' ? '#f0f0f0' : '#fff', cursor: 'pointer', fontSize: 13,
                  fontWeight: currentLang === 'zh' ? 600 : 400, color: currentLang === 'zh' ? '#1a1a1a' : '#999'
                }}>🇨🇳 中文</button>
                <button onClick={() => setLang('ru')} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: currentLang === 'ru' ? '1.5px solid #333' : '1px solid #e5e5e5',
                  background: currentLang === 'ru' ? '#f0f0f0' : '#fff', cursor: 'pointer', fontSize: 13,
                  fontWeight: currentLang === 'ru' ? 600 : 400, color: currentLang === 'ru' ? '#1a1a1a' : '#999'
                }}>🇷🇺 Русский</button>
              </div>
            </div>

            {/* 门店 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>门店城市</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                {CITIES.map(c => <div key={c}>📍 {c}</div>)}
              </div>
            </div>

            {/* 模块 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>知识模块</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 2 }}>
                {MODULES.map(m => <span key={m.key} style={{ marginRight: 6 }}>{m.label}</span>)}
              </div>
            </div>

            <div style={{ marginTop: 'auto', fontSize: 10, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>
              CHUCHUTEA · v0.1
            </div>
          </div>
        ) : (
          /* 对话列表 */
          <>
            <div style={S.sidebarTop}>
              <button style={S.newChatBtn} onClick={newChat}>＋ 新对话</button>
            </div>
            <div style={S.historyList as React.CSSProperties}>
              {convs.map(c => (
                <div key={c.id} style={S.historyItem(c.id === activeId)} onClick={() => switchConv(c.id)}>
                  {c.title}
                </div>
              ))}
            </div>
            <div style={S.sidebarFooter}>
              <button onClick={() => setShowSettings(true)} style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#999' }}>
                ⚙ 设置
              </button>
              <span style={{ fontSize: 11, color: '#ccc' }}>{currentLang === 'zh' ? '中' : 'РУ'}</span>
            </div>
          </>
        )}
      </div>

      {/* ===== 主区域 ===== */}
      <div style={S.main}>
        <div style={S.topbar}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#999', padding: 4 }}>☰</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>CHUCHUTEA</span>
          <span style={{ marginLeft: 8, fontSize: 10, color: '#aaa', background: '#f0f0f0', padding: '2px 6px', borderRadius: 8 }}>知识优先</span>
          <button onClick={() => { setShowKnowledge(true); setShowSettings(false) }} style={{ marginLeft: 'auto', padding: '5px 12px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#666' }}>📚 知识管理</button>
        </div>

        {showKnowledge && <KnowledgePanel onClose={() => setShowKnowledge(false)} />}

        {/* 对话区 */}
        <div style={S.chatArea} ref={chatRef}>
          <div style={S.messagesWrap}>
            {isEmpty ? (
              <div style={S.welcome}>
                <h2 style={{ fontSize: 22, fontWeight: 400, color: '#333', marginBottom: 8 }}>有什么可以帮助你的？</h2>
                <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{CITIES.join(' · ')}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
                  {MODULES.map(m => (
                    <button key={m.key} onClick={() => send(`查${m.label}`)} style={{ padding: '8px 14px', borderRadius: 16, border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#666' }}>{m.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={S.msgRow(msg.role)}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'user' ? '#d4a574' : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: msg.role === 'user' ? '#fff' : '#666' }}>
                    {msg.role === 'user' ? '我' : 'C'}
                  </div>
                  <div style={S.msgBubble(msg.role)}>
                    <div>{msg.content}</div>
                    {msg.source === 'knowledge_base' && (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>📄 知识库原文 · 引用：{msg.references?.map(r => r.title).join('、') || '无'}</div>
                    )}
                    {msg.source === 'llm_fallback' && (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#aaa' }}>⚡ 仅供参考</div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && <div style={S.msgRow('assistant')}><div style={S.msgBubble('assistant')}>▊</div></div>}
          </div>
        </div>

        {/* 输入框 */}
        <div style={S.inputWrap}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={currentLang === 'zh' ? '输入你的问题...' : 'Введите ваш вопрос...'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#1a1a1a' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: input.trim() ? '#1a1a1a' : '#e5e5e5', color: '#fff', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
        </div>
      </div>
    </div>
  )
}

export default App
