import { useState } from 'react'
import { t as tl } from './i18n'

interface Props {
  currentLang: 'zh' | 'ru'
  setLang: (l: 'zh' | 'ru') => void
  onClose: () => void
  cities: string[]
  modules: { key: string; label: string }[]
}

const Settings: React.FC<Props> = ({ currentLang, setLang, onClose, cities, modules }) => {
  const [saveMsg, setSaveMsg] = useState('')
  const _ = (k: string) => tl(k, currentLang)
  const cityNames: Record<string, { zh: string; ru: string }> = {
    '大诺夫哥罗德': { zh: '大诺夫哥罗德', ru: 'Великий Новгород' },
    '普斯科夫': { zh: '普斯科夫', ru: 'Псков' },
    '特维尔': { zh: '特维尔', ru: 'Тверь' },
  }

  const saveLang = async (lang: 'zh' | 'ru') => {
    setLang(lang)
    try {
      setSaveMsg(lang === 'zh' ? '✅ 已保存' : '✅ Сохранено')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch { setSaveMsg('❌ Ошибка') }
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <b>{_('项目设置')}</b>
        <button onClick={onClose} className="settings-back">←</button>
      </div>

      <div className="settings-section">
        <div className="settings-label">{_('品牌')}</div>
        <p className="settings-brand">🧋 CHUCHUTEA</p>
        <p className="settings-sub">{currentLang === 'zh' ? '俄罗斯 · ' : 'Россия · '}
          {cities.map(c => currentLang === 'zh' ? c : cityNames[c]?.ru || c).join(' · ')}
        </p>
      </div>

      <div className="settings-section">
        <div className="settings-label">{_('语言 / Language')}</div>
        <div className="lang-btns">
          <button className={`lang-btn ${currentLang === 'zh' ? 'active' : ''}`} onClick={() => setLang('zh')}>🇨🇳 中文</button>
          <button className={`lang-btn ${currentLang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>🇷🇺 Русский</button>
        </div>
        <button className="save-btn" onClick={() => saveLang(currentLang)}>💾 {_('保存')}</button>
        {saveMsg && <div className="save-msg">{saveMsg}</div>}
      </div>

      <div className="settings-section">
        <div className="settings-label">{_('门店城市')}</div>
        <div className="city-list">
          {cities.map(c => <div key={c}>📍 {currentLang === 'zh' ? c : cityNames[c]?.ru || c}</div>)}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">{_('知识模块')}</div>
        <div className="module-list">
          {modules.map(m => <span key={m.key}>{_(m.label)}</span>)}
        </div>
      </div>

      <div className="settings-version">CHUCHUTEA · v0.1</div>
    </div>
  )
}

export default Settings
