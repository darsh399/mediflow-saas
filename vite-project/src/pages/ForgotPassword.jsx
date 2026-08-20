import { useState } from 'react'
import { Link } from 'react-router-dom'
import authApi from '../api/authApi'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await authApi.forgotPasswordApi(email)
      setMessage(response.message)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to request password reset')
    }
  }

  return <div className="container my-5" style={{ maxWidth: 520 }}>
    <h3>Forgot Password</h3>
    {message && <div className="alert alert-success">{message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}
    <form onSubmit={submit}>
      <label className="form-label">Email</label>
      <input className="form-control mb-3" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
      <button className="btn btn-primary">Send reset link</button>
    </form>
    <Link className="d-block mt-3" to="/login">Back to login</Link>
  </div>
}

export default ForgotPassword
