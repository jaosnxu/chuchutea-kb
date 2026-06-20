import { useState } from 'react'

interface Props {
  onLogin: (token: string, username: string, role: string, allowedModules: string[]) => void
}

const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('role', data.role)
        localStorage.setItem('allowed_modules', JSON.stringify(data.allowed_modules || []))
        onLogin(data.token, data.username, data.role, data.allowed_modules || [])
      } else {
        setError(data.detail || '登录失败')
      }
    } catch {
      setError('网络错误')
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
      background: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
    }}>
      <div style={{ width: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧋</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: '#333' }}>CHUCHUTEA</h2>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 28 }}>AI 知识库 · 内部系统</p>

        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="用户名"
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 10, borderRadius: 8,
            border: '1px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="密码"
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 14, borderRadius: 8,
            border: '1px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />

        {error && <p style={{ color: '#d44', fontSize: 12, marginBottom: 10 }}>{error}</p>}

        <button
          onClick={login}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: loading ? '#ccc' : '#1a1a1a', color: '#fff', fontSize: 14,
            cursor: loading ? 'default' : 'pointer', fontWeight: 500,
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>
      </div>
    </div>
  )
}

export default AuthPage
