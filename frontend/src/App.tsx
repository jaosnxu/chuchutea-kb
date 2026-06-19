import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  references?: { title: string; module: string; id: string }[]
  images?: string[]
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是 TeaMind AI 知识助手。可以查询产品、SOP、培训资料、门店政策和营销活动。有什么可以帮你的？',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'zh' | 'ru'>('zh')

  const send = async () => {
    if (!input.trim() || loading) return
    const query = input
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        references: data.references,
        images: data.images,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，服务暂时不可用。' }])
    }
    setLoading(false)
  }

  const quickAsk = (text: string) => {
    setInput(text)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🧋</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>TeaMind</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>知识库问答</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setLang('zh')}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none',
              background: lang === 'zh' ? '#f3e8dc' : 'transparent',
              color: lang === 'zh' ? '#b8895e' : '#6b7280',
              fontWeight: lang === 'zh' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            中
          </button>
          <button
            onClick={() => setLang('ru')}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none',
              background: lang === 'ru' ? '#f3e8dc' : 'transparent',
              color: lang === 'ru' ? '#b8895e' : '#6b7280',
              fontWeight: lang === 'ru' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            РУ
          </button>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Quick chips */}
        {messages.length === 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center' }}>
            {[
              { label: '🧋 查产品', query: '草莓多多是什么' },
              { label: '📋 查 SOP', query: '制作流程' },
              { label: '📚 培训资料', query: '培训材料' },
              { label: '🏪 加盟政策', query: '加盟条件' },
              { label: '🎯 营销活动', query: '当前营销活动' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => quickAsk(chip.query)}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6b7280',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: msg.role === 'user' ? '#b8895e' : '#f3e8dc',
              color: msg.role === 'user' ? '#fff' : '#4a3a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}>
              {msg.role === 'user' ? '我' : '🧋'}
            </div>
            <div style={{
              maxWidth: 500, padding: '12px 16px', borderRadius: 16,
              background: msg.role === 'user' ? '#f3e8dc' : '#fff',
              border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
              fontSize: 14, lineHeight: 1.7,
            }}>
              <div>{msg.content}</div>
              {msg.references && msg.references.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#b8895e' }}>
                  📄 来源：{msg.references.map(r => r.title).join('、')}
                </div>
              )}
              {msg.images && msg.images.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {msg.images.filter(Boolean).map((src, j) => (
                    <img key={j} src={src} alt="" style={{ maxWidth: 200, borderRadius: 8, marginRight: 6 }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 16px' }}>
            🧋 正在查询知识库...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{
          display: 'flex', gap: 8,
          border: '1px solid #e5e7eb', borderRadius: 16,
          background: '#fafaf7', padding: '8px 16px',
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="输入问题..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 14,
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: 'none', background: '#b8895e', color: '#fff',
              cursor: 'pointer', fontSize: 18,
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
