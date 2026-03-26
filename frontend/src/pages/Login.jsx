import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Lock, User } from 'lucide-react'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="login-container">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-icon"><Lock size={28} /></div>
          <h1>Netzplaner Login</h1>
          <p>Melde dich an, um das BernMobil-Netzwerk zu verwalten</p>

          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Benutzername</label>
            <input
              id="login-username"
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="z.B. netzplaner"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              required
            />
          </div>

          <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
