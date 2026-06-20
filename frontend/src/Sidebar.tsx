import { useState } from 'react'
import { Conversation } from './types'
import { t as tl } from './i18n'

interface Props {
  convs: Conversation[]
  activeId: string
  currentLang: 'zh' | 'ru'
  sidebarOpen: boolean
  onSwitch: (id: string) => void
  onNewChat: () => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onSettings: () => void
}

const Sidebar: React.FC<Props> = ({ convs, activeId, currentLang, sidebarOpen, onSwitch, onNewChat, onRename, onDelete, onTogglePin, onSettings }) => {
  const [search, setSearch] = useState('')
  const _ = (k: string) => tl(k, currentLang)
  const filtered = convs.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        <button className="new-chat-btn" onClick={onNewChat}>＋ {_('新对话')}</button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={_('搜索对话...')} className="search-input" />
      </div>

      <div className="history-list">
        {filtered.map(c => (
          <div key={c.id} className={`history-item ${c.id === activeId ? 'active' : ''} conv-item`}>
            <span className="history-title" onClick={() => onSwitch(c.id)}>
              {c.pinned ? '📌 ' : ''}{c.title}
            </span>
            <span className="conv-actions">
              <button className="action-btn" onClick={e => { e.stopPropagation(); const t = prompt(c.title); if (t?.trim()) onRename(c.id, t.trim()) }} title={_('改名')}>✎</button>
              <button className="action-btn" onClick={e => { e.stopPropagation(); onTogglePin(c.id, !c.pinned) }} title={c.pinned ? _('取消置顶') : _('置顶')}>📌</button>
              <button className="action-btn" onClick={e => { e.stopPropagation(); if (confirm(_('删除？'))) onDelete(c.id) }} title={_('删除')}>🗑</button>
            </span>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button className="settings-entry" onClick={onSettings}>⚙ {_('设置')}</button>
      </div>
    </div>
  )
}

export default Sidebar
