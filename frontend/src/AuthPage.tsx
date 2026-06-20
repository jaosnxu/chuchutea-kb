import { useState } from 'react'
import { apiRequest, saveSession, setStoredLang } from './api'
import { t } from './i18n'
import type { Lang, LoginResponse, Session } from './types'

interface Props {
  readonly lang: Lang
  readonly onLangChange: (lang: Lang) => void
  readonly onLogin: (session: Session) => void
}

export default function AuthPage({ lang, onLangChange, onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const changeLang = (nextLang: Lang): void => {
    setStoredLang(nextLang)
    onLangChange(nextLang)
  }

  const login = async (): Promise<void> => {
    if (!username.trim() || !password || loading) return
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      })
      onLogin(saveSession(data))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('登录失败', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <section style={{ width: 320, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{t('CHUCHUTEA', lang)}</h1>
        <p>{t('AI 知识库 · 内部系统', lang)}</p>
        <div className="button-row" style={{ justifyContent: 'center', marginBottom: 16 }}>
          <button className="secondary-button" type="button" onClick={() => changeLang('zh')}>
            中文
          </button>
          <button className="secondary-button" type="button" onClick={() => changeLang('ru')}>
            Русский
          </button>
        </div>
        <div className="form-grid">
          <input className="field" value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void login()} placeholder={t('用户名', lang)} />
          <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void login()} placeholder={t('密码', lang)} />
          {error ? <div className="status" style={{ color: 'var(--status-error)' }}>{error}</div> : null}
          <button className="primary-button" type="button" disabled={loading} onClick={() => void login()}>
            {loading ? t('登录中', lang) : t('登录', lang)}
          </button>
        </div>
      </section>
    </main>
  )
}
