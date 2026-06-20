import { useEffect, useRef, useState } from 'react'
import { apiRequest, AuthError } from './api'
import { MODULES } from './constants'
import { t } from './i18n'
import type { KnowledgeItem, KnowledgeListResponse, Lang } from './types'

interface Props {
  readonly lang: Lang
  readonly onClose: () => void
  readonly onAuthError: () => void
}

interface KnowledgeForm {
  readonly module: string
  readonly titleZh: string
  readonly titleRu: string
  readonly contentZh: string
  readonly contentRu: string
}

const emptyForm: KnowledgeForm = {
  module: 'product',
  titleZh: '',
  titleRu: '',
  contentZh: '',
  contentRu: '',
}

const matchesSearch = (item: KnowledgeItem, search: string): boolean => {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return `${item.title_zh} ${item.title_ru} ${item.content_zh} ${item.content_ru}`.toLowerCase().includes(q)
}

export default function KnowledgePanel({ lang, onClose, onAuthError }: Props) {
  const [items, setItems] = useState<readonly KnowledgeItem[]>([])
  const [form, setForm] = useState<KnowledgeForm>(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleError = (error: unknown): void => {
    if (error instanceof AuthError) {
      onAuthError()
      return
    }
    setMessage(error instanceof Error ? error.message : t('操作失败', lang))
  }

  const loadKnowledge = async (): Promise<void> => {
    try {
      const query = new URLSearchParams({ lang, size: '100' })
      if (moduleFilter) query.set('module', moduleFilter)
      const data = await apiRequest<KnowledgeListResponse>(`/api/knowledge/list?${query.toString()}`)
      setItems(data.items)
    } catch (error) {
      handleError(error)
    }
  }

  useEffect(() => {
    void loadKnowledge()
  }, [lang, moduleFilter])

  const resetForm = (): void => {
    setForm(emptyForm)
    setEditingId('')
  }

  const pasteText = async (): Promise<void> => {
    if (!form.contentZh.trim() || loading) return
    setLoading(true)
    setMessage(t('分析中', lang))
    try {
      await apiRequest<{ readonly id: string; readonly module: string }>('/api/import/paste', {
        method: 'POST',
        body: {
          title_zh: form.titleZh || form.contentZh.slice(0, 40),
          content_zh: form.contentZh,
          content_ru: form.contentRu,
        },
      })
      setMessage(t('学习成功', lang))
      resetForm()
      await loadKnowledge()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const updateKnowledge = async (): Promise<void> => {
    if (!editingId || !form.contentZh.trim() || loading) return
    setLoading(true)
    try {
      await apiRequest<{ readonly message: string }>(`/api/knowledge/${editingId}`, {
        method: 'PUT',
        body: {
          module: form.module,
          title_zh: form.titleZh,
          title_ru: form.titleRu,
          content_zh: form.contentZh,
          content_ru: form.contentRu,
          is_published: true,
        },
      })
      setMessage(t('已保存', lang))
      resetForm()
      await loadKnowledge()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File): Promise<void> => {
    if (loading) return
    setLoading(true)
    setMessage(t('上传中', lang))
    const body = new FormData()
    body.append('file', file)
    body.append('module', 'auto')
    try {
      await apiRequest<{ readonly message: string; readonly module: string; readonly items: readonly unknown[] }>('/api/import/upload', {
        method: 'POST',
        body,
        timeoutMs: 120000,
      })
      setMessage(t('学习成功', lang))
      if (fileRef.current) fileRef.current.value = ''
      await loadKnowledge()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (item: KnowledgeItem): void => {
    setEditingId(item.id)
    setForm({
      module: item.module,
      titleZh: item.title_zh,
      titleRu: item.title_ru,
      contentZh: item.content_zh,
      contentRu: item.content_ru,
    })
  }

  const deleteKnowledge = async (item: KnowledgeItem): Promise<void> => {
    if (!window.confirm(t('确认删除', lang))) return
    setLoading(true)
    try {
      await apiRequest<{ readonly message: string }>(`/api/knowledge/${item.id}`, { method: 'DELETE' })
      setMessage(t('删除', lang))
      await loadKnowledge()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const visibleItems = items.filter((item) => matchesSearch(item, search))

  return (
    <aside className="drawer">
      <div className="panel-header">
        <strong>{t('知识管理', lang)}</strong>
        <button className="ghost-button" type="button" onClick={onClose}>
          {t('关闭', lang)}
        </button>
      </div>

      <section className="section">
        <div className="section-label">{t('上传文件', lang)}</div>
        <p>{t('支持文件', lang)}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.pdf"
          disabled={loading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void uploadFile(file)
          }}
        />
      </section>

      <section className="section form-grid">
        <div className="section-label">{editingId ? t('编辑', lang) : t('粘贴文本', lang)}</div>
        <select className="select" value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })}>
          {MODULES.map((module) => (
            <option key={module.key} value={module.key}>
              {t(module.label, lang)}
            </option>
          ))}
        </select>
        <input className="field" value={form.titleZh} onChange={(event) => setForm({ ...form, titleZh: event.target.value })} placeholder={t('标题中文', lang)} />
        <input className="field" value={form.titleRu} onChange={(event) => setForm({ ...form, titleRu: event.target.value })} placeholder={t('标题俄文', lang)} />
        <textarea className="textarea" value={form.contentZh} onChange={(event) => setForm({ ...form, contentZh: event.target.value })} placeholder={t('中文内容', lang)} />
        <textarea className="textarea" value={form.contentRu} onChange={(event) => setForm({ ...form, contentRu: event.target.value })} placeholder={t('俄语内容', lang)} />
        <div className="button-row">
          <button className="primary-button" type="button" disabled={loading || !form.contentZh.trim()} onClick={() => (editingId ? void updateKnowledge() : void pasteText())}>
            {editingId ? t('更新知识', lang) : t('添加知识', lang)}
          </button>
          {editingId ? (
            <button className="secondary-button" type="button" onClick={resetForm}>
              {t('取消编辑', lang)}
            </button>
          ) : null}
        </div>
      </section>

      {message ? <div className="status">{message}</div> : null}

      <section className="section">
        <div className="section-label">{t('知识列表', lang)}</div>
        <div className="form-grid">
          <select className="select" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
            <option value="">{t('全部模块', lang)}</option>
            {MODULES.map((module) => (
              <option key={module.key} value={module.key}>
                {t(module.label, lang)}
              </option>
            ))}
          </select>
          <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('搜索知识', lang)} />
        </div>
        <div className="knowledge-list">
          {visibleItems.length === 0 ? <div className="status">{t('暂无知识', lang)}</div> : null}
          {visibleItems.map((item) => (
            <article className="knowledge-item" key={item.id}>
              <div className="knowledge-meta">
                <span>{t(MODULES.find((module) => module.key === item.module)?.label ?? item.module, lang)}</span>
                <span>{item.is_published ? 'Live' : 'Draft'}</span>
              </div>
              <div className="knowledge-title">{lang === 'zh' ? item.title_zh : item.title_ru || item.title_zh}</div>
              <div className="knowledge-content">{lang === 'zh' ? item.content_zh : item.content_ru || item.content_zh}</div>
              <div className="knowledge-actions">
                <button className="secondary-button" type="button" onClick={() => startEdit(item)}>
                  {t('编辑', lang)}
                </button>
                <button className="secondary-button danger-button" type="button" onClick={() => void deleteKnowledge(item)}>
                  {t('删除', lang)}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}
