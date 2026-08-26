import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useNotify } from '../components/NotificationProvider'
import authApi from '../api/authApi'

const ActivateAccount = ()=>{
  const [search] = useSearchParams()
  const token = search.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const navigate = useNavigate()

  const { notify } = useNotify()
  useEffect(()=>{ if(!token) { notify('Missing token'); navigate('/'); } },[token])

  const submit = async (e)=>{
    e.preventDefault()
    if(password.length < 8) return notify('Password min 8 chars')
    if(password !== confirm) return notify('Passwords do not match')
    try{
      const resp = await authApi.acceptInviteApi(token, { password })
      notify('Account activated', 'Please login.')
      navigate('/login')
    }catch(err){ console.error(err); notify('Activation failed', err?.response?.data?.message || err?.message || 'Activation failed') }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: "linear-gradient(135deg, var(--mf-bg) 0%, var(--mf-color-primary-subtle) 100%)" }}
    >
      <div className="container px-3">
        <div className="card border-0 shadow-lg rounded-4 mx-auto overflow-hidden" style={{ maxWidth: "460px" }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <div
                className="mx-auto mb-3 rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{ width: "70px", height: "70px", fontSize: "28px" }}
              >
                <i className="bi bi-person-check-fill"></i>
              </div>
              <h3 className="fw-bold mb-2">Activate Account</h3>
              <p className="text-muted mb-0">Set a password to activate your account.</p>
            </div>

            <form onSubmit={submit}>
              <div className="mb-4">
                <label className="form-label fw-semibold">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input type="password" className="form-control border-start-0" value={password} onChange={e=>setPassword(e.target.value)} required/>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-shield-check text-muted"></i>
                  </span>
                  <input type="password" className="form-control border-start-0" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>
                </div>
              </div>
              <button className="btn btn-primary w-100 py-2 rounded-3 fw-semibold" type="submit">
                <i className="bi bi-check-lg me-2"></i>
                Activate
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivateAccount
