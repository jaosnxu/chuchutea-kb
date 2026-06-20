import { useEffect, useRef } from 'react'
import { Message } from './types'
import { t as tl } from './i18n'

interface Props {
  messages: Message[]
  loading: boolean
  isEmpty: boolean
  currentLang: 'zh' | 'ru'
  modules: { key: string; label: string }[]
  onQuickAsk: (text: string) => void
}

const ChatArea: React.FC<Props> = ({ messages, loading, isEmpty, currentLang, modules, onQuickAsk }) => {
  const ref = useRef<HTMLDivElement>(null)
  const _ = (k: string) => tl(k, currentLang)

  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [messages, loading])

  return (
    <div className="chat-area" ref={ref}>
      <div className="messages-wrap">
        {isEmpty ? (
          <div className="welcome">
            <h2>{_('有什么可以帮助你的？')}</h2>
            <p className="welcome-sub">{currentLang === 'zh' ? '大诺夫哥罗德 · 普斯科夫 · 特维尔' : 'Великий Новгород · Псков · Тверь'}</p>
            <div className="quick-chips">
              {modules.map(m => (
                <button key={m.key} className="chip" onClick={() => onQuickAsk(`查${m.label}`)}>{_(m.label)}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              <div className={`msg-avatar ${msg.role}`}>{msg.role === 'user' ? '我' : 'C'}</div>
              <div className={`msg-bubble ${msg.role}`}>
                <div className="msg-content">{msg.content}</div>
                {msg.source === 'knowledge_base' && msg.references && msg.references.length > 0 && (
                  <div className="source-card">
                    <div className="source-title">📄 {currentLang === 'zh' ? '知识库来源' : 'Источник'}</div>
                    {msg.references.map(r => (
                      <div key={r.id} className="source-item">
                        <span className="source-module">{r.module}</span>
                        <span className="source-name">{r.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.source === 'llm_fallback' && (
                  <div className="source-fallback">
                    ⚡ {currentLang === 'zh' ? '知识库未找到相关内容，以下为 AI 常识回答，仅供参考' : 'Не найдено в базе знаний. Ответ AI, только для справки'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && <div className="msg-row assistant"><div className="msg-bubble assistant">▊</div></div>}
      </div>
    </div>
  )
}

export default ChatArea
