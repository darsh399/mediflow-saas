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
    <div className="container my-5" style={{maxWidth:540}}>
      <h3>Activate Account</h3>
      <form onSubmit={submit}>
        <div className="mb-3"><label>Password</label><input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
        <div className="mb-3"><label>Confirm Password</label><input type="password" className="form-control" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></div>
        <button className="btn btn-primary">Activate</button>
      </form>
    </div>
  )
}

export default ActivateAccount
