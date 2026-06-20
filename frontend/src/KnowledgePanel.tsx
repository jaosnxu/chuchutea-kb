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
    setLoading(true)
    setMsg('上传中...')
    const form = new FormData()
    form.append('file', file)
    form.append('module', 'auto')
    try {
      const r = await fetch('https://revise-overlying-tigress.ngrok-free.dev/api/import/upload', { headers: { 'ngrok-skip-browser-warning': 'true' }, method: 'POST', body: form })
      const d = await r.json()
      setMsg(`✅ ${d.message} · 模块：${d.module}`)
      if (fileRef.current) fileRef.current.value = ''
    } catch { setMsg('❌ 上传失败') }
    setLoading(false)
  }

  const pasteText = async () => {
    if (!contentZh.trim() || loading) return
    setLoading(true)
    setMsg('AI 分析中...')
    try {
      const r = await fetch('/api/import/paste', { headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' }, method: 'POST', body: JSON.stringify({ title_zh: titleZh || contentZh.slice(0, 40), content_zh: contentZh, content_ru: contentRu }) })
      const d = await r.json()
      setMsg(`✅ 已添加 → ${d.module}`)
      setContentZh(''); setContentRu(''); setTitleZh('')
    } catch { setMsg('❌ 失败') }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, width: 360, height: '100vh', background: '#fff', borderLeft: '1px solid #e5e5e5', zIndex: 100, padding: 20, boxShadow: '-2px 0 10px rgba(0,0,0,0.05)', overflowY: 'auto', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <b style={{ fontSize: 15 }}>📚 知识管理</b>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#999' }}>✕</button>
      </div>
      <p style={{ fontSize: 11, color: '#999', marginBottom: 14 }}>AI 自动识别内容并分配模块</p>

      {/* 上传文件 */}
      <div style={{ padding: 14, background: '#f9f9f9', borderRadius: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>📎 上传文件</div>
        <p style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>支持 Word (.docx) 和 PDF</p>
        <input ref={fileRef} type="file" accept=".docx,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} style={{ fontSize: 12 }} disabled={loading} />
      </div>

      {/* 粘贴文本 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>📋 粘贴文本</div>
        <input value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="标题（可选）" style={{ width: '100%', padding: '8px 10px', marginBottom: 6, borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12, boxSizing: 'border-box' }} />
        <textarea value={contentZh} onChange={e => setContentZh(e.target.value)} placeholder="中文内容 *" rows={5} style={{ width: '100%', padding: '8px 10px', marginBottom: 6, borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        <textarea value={contentRu} onChange={e => setContentRu(e.target.value)} placeholder="俄语内容（可选）" rows={2} style={{ width: '100%', padding: '8px 10px', marginBottom: 8, borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        <button onClick={pasteText} disabled={loading || !contentZh.trim()} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: loading || !contentZh.trim() ? '#ccc' : '#1a1a1a', color: '#fff', fontSize: 13, cursor: loading || !contentZh.trim() ? 'default' : 'pointer' }}>{loading ? 'AI 分析中...' : '添加知识'}</button>
      </div>

      {msg && <div style={{ fontSize: 12, color: '#666', padding: '10px 14px', background: '#f0f0f0', borderRadius: 8, lineHeight: 1.6 }}>{msg}</div>}
    </div>
  )
}

export default KnowledgePanel
