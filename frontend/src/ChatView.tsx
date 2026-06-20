import { CITIES, MODULES } from './constants'
import { t } from './i18n'
import type { Lang, Message } from './types'

interface Props {
  readonly lang: Lang
  readonly messages: readonly Message[]
  readonly loading: boolean
  readonly input: string
  readonly visibleModules: readonly string[]
  readonly onInput: (value: string) => void
  readonly onSend: (text?: string) => void
}

export function ChatView({ lang, messages, loading, input, visibleModules, onInput, onSend }: Props) {
  const modules = MODULES.filter((module) => visibleModules.includes(module.key))

  return (
    <>
      <div className="chat-area">
        <div className="messages-wrap">
          {messages.length === 0 ? (
            <div className="welcome">
              <h1>{t('有什么可以帮助你的？', lang)}</h1>
              <p>{CITIES.map((city) => city[lang]).join(' · ')}</p>
              <div className="module-buttons">
                {modules.map((module) => (
                  <button className="module-chip" type="button" key={module.key} onClick={() => onSend(`${t('查', lang)}${t(module.label, lang)}`)}>
                    {t(module.label, lang)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div className={`msg-row ${message.role}`} key={`${message.role}-${index}`}>
                <div className="avatar">{message.role === 'user' ? 'U' : 'C'}</div>
                <div className="msg-bubble">
                  <div>{message.content}</div>
                  {message.source === 'knowledge_base' ? (
                    <div className="source-note">
                      {t('知识库原文', lang)} · {t('引用', lang)}: {message.references?.map((ref) => ref.title).join(' · ') || t('无', lang)}
                    </div>
                  ) : null}
                  {message.source === 'llm_fallback' ? <div className="source-note">{t('仅供参考', lang)}</div> : null}
                </div>
              </div>
            ))
          )}
          {loading ? (
            <div className="msg-row">
              <div className="avatar">C</div>
              <div className="msg-bubble">...</div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="composer">
        <input
          value={input}
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
          placeholder={t('输入你的问题...', lang)}
        />
        <button className="send-button" type="button" disabled={loading || !input.trim()} onClick={() => onSend()} title={t('发送', lang)}>
          ↑
        </button>
      </div>
    </>
  )
}
