import { useState } from 'react'

interface Props {
  onClose: () => void
}

const KnowledgePanel: React.FC<Props> = ({ onClose }) => {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload')
  const [contentZh, setContentZh] = useState('')
  const [contentRu, setContentRu] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const uploadFile = async (file: File) => {
    setLoading(true)
    setMsg('上传中，AI 正在识别分类...')
    const form = new FormData()
    form.append('file', file)
    form.append('module', 'auto')
    try {
      const res = await fetch('/api/import/upload', { headers: { 'ngrok-skip-browser-warning': 'true' }, method: 'POST', body: form })
      const d = await res.json()
      setMsg(`✅ 导入 ${d.items?.length || 0} 条 · 模块：${d.module}`)
    } catch {
      setMsg('❌ 上传失败')
    }
    setLoading(false)
  }

  const pasteText = async () => {
    if (!contentZh.trim()) return
    setLoading(true)
    setMsg('AI 正在分析内容并自动分配模块...')
    try {
      const res = await fetch('/api/import/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_zh: titleZh || contentZh.slice(0, 40),
          content_zh: contentZh,
          content_ru: contentRu,
        }),
      })
      const d = await res.json()
      setMsg(`✅ 已添加 → ${d.module}`)
      setContentZh('')
      setContentRu('')
      setTitleZh('')
    } catch {
      setMsg('❌ 添加失败')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, width: 360, height: '100vh', background: '#fff',
      borderLeft: '1px solid #e5e5e5', zIndex: 100, padding: 20, boxShadow: '-2px 0 10px rgba(0,0,0,0.05)',
      overflowY: 'auto', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <b style={{ fontSize: 15 }}>📚 知识管理</b>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#999' }}>✕</button>
      </div>

      <p style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>AI 自动识别内容并分配模块，无需手动选</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setTab('upload')} style={{
          flex: 1, padding: '8px', borderRadius: 8, border: tab === 'upload' ? '1.5px solid #333' : '1px solid #e5e5e5',
          background: tab === 'upload' ? '#f0f0f0' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: tab === 'upload' ? 600 : 400
        }}>📎 上传文件</button>
        <button onClick={() => setTab('paste')} style={{
          flex: 1, padding: '8px', borderRadius: 8, border: tab === 'paste' ? '1.5px solid #333' : '1px solid #e5e5e5',
          background: tab === 'paste' ? '#f0f0f0' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: tab === 'paste' ? 600 : 400
        }}>📋 粘贴文本</button>
      </div>

      {tab === 'upload' ? (
        <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>上传 Word 或 PDF，AI 自动拆条+分类</p>
          <input type="file" accept=".docx,.pdf" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
            style={{ fontSize: 12 }} disabled={loading} />
        </div>
      ) : (
        <div>
          <input value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="标题（可选，不填自动取前40字）"
            style={{ width: '100%', padding: '8px 10px', marginBottom: 8, borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12, boxSizing: 'border-box' }} />
          <textarea value={contentZh} onChange={e => setContentZh(e.target.value)} placeholder="中文内容"
            rows={6}
            style={{ width: '100%', padding: '8px 10px', marginBottom: 8, borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <textarea value={contentRu} onChange={e => setContentRu(e.target.value)} placeholder="俄语内容（可选）"
            rows={3}
            style={{ width: '100%', padding: '8px 10px', marginBottom: 8, borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <button onClick={pasteText} disabled={loading || !contentZh.trim()}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: loading || !contentZh.trim() ? '#ccc' : '#1a1a1a', color: '#fff', fontSize: 13, cursor: loading || !contentZh.trim() ? 'default' : 'pointer' }}>
            {loading ? 'AI 分析中...' : '添加知识'}
          </button>
        </div>
      )}

      {msg && <div style={{ fontSize: 12, color: '#666', padding: '10px 14px', background: '#f0f0f0', borderRadius: 8, marginTop: 14, lineHeight: 1.6 }}>{msg}</div>}

      <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 24 }}>粘贴即生效 · 员工即刻可查</div>
    </div>
  )
}

export default KnowledgePanel
