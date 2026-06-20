import { useState, useRef } from 'react'

interface Props { onClose: () => void }

const KnowledgePanel: React.FC<Props> = ({ onClose }) => {
  const [contentZh, setContentZh] = useState('')
  const [contentRu, setContentRu] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (loading) return
    setLoading(true); setMsg('上传中，AI 正在识别分类...')
    const form = new FormData(); form.append('file', file); form.append('module', 'auto')
    try {
      const r = await fetch('https://revise-overlying-tigress.ngrok-free.dev/api/import/upload', { headers: { 'ngrok-skip-browser-warning': 'true' }, method: 'POST', body: form })
      const d = await r.json(); setMsg(`✅ ${d.message} · 模块：${d.module}`)
      if (fileRef.current) fileRef.current.value = ''
    } catch { setMsg('❌ 上传失败') }
    setLoading(false)
  }

  const pasteText = async () => {
    if (!contentZh.trim() || loading) return
    setLoading(true); setMsg('AI 分析中...')
    try {
      const r = await fetch('/api/import/paste', { headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }, method: 'POST', body: JSON.stringify({ title_zh: titleZh || contentZh.slice(0, 40), content_zh: contentZh, content_ru: contentRu }) })
      const d = await r.json(); setMsg(`✅ 已添加 → ${d.module}`)
      setContentZh(''); setContentRu(''); setTitleZh('')
    } catch { setMsg('❌ 失败') }
    setLoading(false)
  }

  return (
    <div className="kb-panel">
      <div className="kb-header"><b>📚 知识管理</b><button onClick={onClose} className="kb-close">✕</button></div>
      <p className="kb-sub">AI 自动识别内容并分配模块</p>
      <div className="kb-section">
        <div className="kb-section-title">📎 上传文件</div>
        <p className="kb-hint">支持 Word (.docx) 和 PDF</p>
        <button onClick={() => fileRef.current?.click()} className="kb-upload-btn" disabled={loading}>选择文件</button>
        <input ref={fileRef} type="file" accept=".docx,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} />
      </div>
      <div className="kb-section">
        <div className="kb-section-title">📋 粘贴文本</div>
        <input value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="标题（可选）" className="kb-input" />
        <textarea value={contentZh} onChange={e => setContentZh(e.target.value)} placeholder="中文内容 *" className="kb-textarea" rows={5} />
        <textarea value={contentRu} onChange={e => setContentRu(e.target.value)} placeholder="俄语内容（可选）" className="kb-textarea" rows={2} />
        <button onClick={pasteText} disabled={loading || !contentZh.trim()} className="kb-add-btn">{loading ? 'AI 分析中...' : '添加知识'}</button>
      </div>
      {msg && <div className="kb-msg">{msg}</div>}
    </div>
  )
}
export default KnowledgePanel
