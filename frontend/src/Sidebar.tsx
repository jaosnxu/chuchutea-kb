import type { Conversation, Lang } from './types'
import { t } from './i18n'

interface Props {
  readonly open: boolean
  readonly lang: Lang
  readonly conversations: readonly Conversation[]
  readonly activeId: string
  readonly search: string
  readonly onSearch: (value: string) => void
  readonly onNewChat: () => void
  readonly onSwitch: (id: string) => void
  readonly onRename: (id: string, title: string) => void
  readonly onTogglePin: (id: string, pinned: boolean) => void
  readonly onDelete: (id: string) => void
  readonly onSettings: () => void
}

export function Sidebar({
  open,
  lang,
  conversations,
  activeId,
  search,
  onSearch,
  onNewChat,
  onSwitch,
  onRename,
  onTogglePin,
  onDelete,
  onSettings,
}: Props) {
  const visible = conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <aside className={open ? 'sidebar' : 'sidebar closed'}>
      <div className="sidebar-top">
        <button className="secondary-button" type="button" style={{ width: '100%' }} onClick={onNewChat}>
          + {t('新对话', lang)}
        </button>
        <input className="field" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={t('搜索对话', lang)} />
      </div>
      <div className="history-list">
        {visible.map((conversation) => (
          <div className={conversation.id === activeId ? 'conv-row active' : 'conv-row'} key={conversation.id}>
            <button className="conv-title" type="button" onClick={() => onSwitch(conversation.id)} title={conversation.title}>
              {conversation.pinned ? '[P] ' : ''}
              {conversation.title}
            </button>
            <div className="conv-actions">
              <button className="icon-button" type="button" onClick={() => onRename(conversation.id, conversation.title)} title={t('改名', lang)}>
                Edit
              </button>
              <button className="icon-button" type="button" onClick={() => onTogglePin(conversation.id, !conversation.pinned)} title={conversation.pinned ? t('取消置顶', lang) : t('置顶', lang)}>
                Pin
              </button>
              <button className="icon-button danger-button" type="button" onClick={() => onDelete(conversation.id)} title={t('删除', lang)}>
                Del
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="ghost-button" type="button" onClick={onSettings}>
          {t('设置', lang)}
        </button>
        <span className="section-label">{lang === 'zh' ? '中' : 'RU'}</span>
      </div>
    </aside>
  )
}
