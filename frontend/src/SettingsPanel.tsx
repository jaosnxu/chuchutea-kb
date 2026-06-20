import { CITIES, MODULES } from './constants'
import { roleLabel, t } from './i18n'
import type { Lang, Session } from './types'

interface Props {
  readonly lang: Lang
  readonly session: Session
  readonly visibleModules: readonly string[]
  readonly canManage: boolean
  readonly saveMessage: string
  readonly onBack: () => void
  readonly onLangChange: (lang: Lang) => void
  readonly onSaveLang: () => void
  readonly onKnowledge: () => void
  readonly onLogout: () => void
}

export function SettingsPanel({
  lang,
  session,
  visibleModules,
  canManage,
  saveMessage,
  onBack,
  onLangChange,
  onSaveLang,
  onKnowledge,
  onLogout,
}: Props) {
  const modules = MODULES.filter((module) => visibleModules.includes(module.key))

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <strong>{t('项目设置', lang)}</strong>
        <button className="ghost-button" type="button" onClick={onBack}>
          {t('返回', lang)}
        </button>
      </div>

      <section className="section">
        <div className="section-label">{t('品牌', lang)}</div>
        <strong>{t('CHUCHUTEA', lang)}</strong>
        <p>{t('AI 知识库 · 内部系统', lang)}</p>
        <p>{CITIES.map((city) => city[lang]).join(' · ')}</p>
      </section>

      <section className="section">
        <div className="section-label">{t('语言', lang)}</div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => onLangChange('zh')}>
            中文
          </button>
          <button className="secondary-button" type="button" onClick={() => onLangChange('ru')}>
            Русский
          </button>
        </div>
        <button className="primary-button" type="button" style={{ width: '100%', marginTop: 8 }} onClick={onSaveLang}>
          {t('保存', lang)}
        </button>
        {saveMessage ? <div className="status">{saveMessage}</div> : null}
      </section>

      <section className="section">
        <div className="section-label">{t('门店城市', lang)}</div>
        {CITIES.map((city) => (
          <div key={city.zh}>{city[lang]}</div>
        ))}
      </section>

      {canManage ? (
        <section className="section">
          <div className="section-label">{t('知识管理', lang)}</div>
          <button className="secondary-button" type="button" style={{ width: '100%', textAlign: 'left' }} onClick={onKnowledge}>
            {t('知识管理', lang)}
          </button>
        </section>
      ) : null}

      <section className="section">
        <div className="section-label">{t('知识模块', lang)}</div>
        <p>{modules.map((module) => t(module.label, lang)).join(' · ')}</p>
      </section>

      <section className="section">
        <div className="section-label">{t('用户', lang)}</div>
        <strong>{session.username || t('未登录', lang)}</strong>
        <p>{roleLabel(session.role, lang)}</p>
        <button className="secondary-button danger-button" type="button" style={{ width: '100%' }} onClick={onLogout}>
          {t('登出', lang)}
        </button>
      </section>
    </div>
  )
}
