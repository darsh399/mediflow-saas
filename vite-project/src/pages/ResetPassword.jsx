import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import authApi from '../api/authApi'

const ResetPassword = () => {
  const [search] = useSearchParams()
  const token = search.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!token) return setError('Reset token is missing')
    if (password.length < 8 || password !== confirm) return setError('Passwords must match and be at least 8 characters')
    try {
      const response = await authApi.resetPasswordApi(token, password)
      setMessage(response.message)
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to reset password')
    }
  }

  return <div className="container my-5" style={{ maxWidth: 520 }}>
    <h3>Reset Password</h3>
    {message && <div className="alert alert-success">{message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}
    <form onSubmit={submit}>
      <label className="form-label">New password</label>
      <input className="form-control mb-3" type="password" value={password} onChange={event => setPassword(event.target.value)} required />
      <label className="form-label">Confirm password</label>
      <input className="form-control mb-3" type="password" value={confirm} onChange={event => setConfirm(event.target.value)} required />
      <button className="btn btn-primary">Reset password</button>
    </form>
    <Link className="d-block mt-3" to="/login">Back to login</Link>
  </div>
}

export default ResetPassword
