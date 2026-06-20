import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  references?: { title: string; module: string; id: string }[]
  images?: string[]
  source?: string
}

const MODULES = [
  { key: 'product', label: '🧋 产品库' },
  { key: 'sop', label: '📋 操作SOP' },
  { key: 'training', label: '📚 培训资料' },
  { key: 'store', label: '🏪 门店信息' },
  { key: 'marketing', label: '🎯 营销活动' },
  { key: 'brand', label: '🏷️ 品牌' },
  { key: 'franchise', label: '📜 特许经营' },
  { key: 'operations', label: '⚙️ 运营管理' },
  { key: 'equipment', label: '🔧 设备' },
  { key: 'maintenance', label: '🛠️ 维修' },
]

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是 TeaMind 知识助手。可以查询产品、SOP、培训、门店、设备、维修等内容。',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'zh' | 'ru'>('zh')

  const send = async (text?: string) => {
    const query = (text || input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lang }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          references: data.references,
          images: data.images,
          source: data.source,
        },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 服务连接失败，请确认后端已启动。' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: '#faf7f2' }}>
      {/* Top Bar */}
      <header style={{
        padding: '12px 20px', borderBottom: '1px solid #e8ddd2', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🧋</span>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#4a3a2a' }}>TeaMind</span>
          <span style={{ fontSize: 11, color: '#8a7a6a', background: '#f5ede6', padding: '2px 8px', borderRadius: 10 }}>
            知识优先
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setLang('zh')} style={{
            padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: lang === 'zh' ? '#f5ede6' : 'transparent',
            color: lang === 'zh' ? '#b8895e' : '#8a7a6a', fontWeight: lang === 'zh' ? 600 : 400, fontSize: 13,
          }}>中</button>
          <button onClick={() => setLang('ru')} style={{
            padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: lang === 'ru' ? '#f5ede6' : 'transparent',
            color: lang === 'ru' ? '#b8895e' : '#8a7a6a', fontWeight: lang === 'ru' ? 600 : 400, fontSize: 13,
          }}>РУ</button>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {messages.length === 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' }}>
            {MODULES.slice(0, 5).map(m => (
              <button key={m.key} onClick={() => send(`查${m.label.slice(2)}`)} style={{
                padding: '6px 14px', borderRadius: 16, border: '1px solid #e8ddd2', background: '#fff',
                cursor: 'pointer', fontSize: 12, color: '#6b7280',
              }}>{m.label}</button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? '#b8895e' : '#f5ede6',
              color: msg.role === 'user' ? '#fff' : '#4a3a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>
              {msg.role === 'user' ? '我' : '🧋'}
            </div>
            <div style={{
              maxWidth: 500, padding: '10px 16px', borderRadius: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              background: msg.role === 'user' ? '#f5ede6' : '#fff',
              border: msg.role === 'assistant' ? '1px solid #e8ddd2' : 'none',
            }}>
              <div>{msg.content}</div>
              {msg.source === 'knowledge_base' && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#b8895e' }}>
                  📄 知识库原文
                </div>
              )}
              {msg.references && msg.references.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#8a7a6a' }}>
                  引用：{msg.references.map(r => r.title).join('、')}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ color: '#8a7a6a', fontSize: 12, padding: '8px 16px' }}>🧋 查询中...</div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #e8ddd2', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8, border: '1px solid #e8ddd2', borderRadius: 14, background: '#faf7f2', padding: '6px 14px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={lang === 'zh' ? '输入问题...' : 'Введите вопрос...'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14 }}
          />
          <button onClick={() => send()} disabled={loading} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', background: '#b8895e', color: '#fff', cursor: 'pointer', fontSize: 16,
          }}>➤</button>
        </div>
      </div>
    </div>
  )
}

export default App
