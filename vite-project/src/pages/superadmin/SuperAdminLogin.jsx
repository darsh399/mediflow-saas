import { useState } from 'react'
import superAdminApi from '../../api/superAdminApi'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../../redux/slices/authSlice'
import { useNotify } from '../../components/NotificationProvider'

const SuperAdminLogin = ()=>{
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { notify } = useNotify()

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const data = await superAdminApi.login({ email, password })
      if (data.token && data.user) {
        if (data.user.role !== 'super_admin') return notify('Not a super admin')
        dispatch(setCredentials({ user: data.user, token: data.token }))
        navigate('/superadmin/dashboard')
      }
    }catch(err){
      console.error(err)
      notify(err?.response?.data?.message || err?.message || 'Login failed')
    }
  }

  return (
    <div className="container my-5">
      <h3>Super Admin Login</h3>
      <form onSubmit={submit} style={{maxWidth:420}}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary">Login</button>
      </form>
    </div>
  )
}

export default SuperAdminLogin
