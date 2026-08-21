import { useEffect, useState } from 'react'
import userApi from '../../api/userApi'
import doctorApi from '../../api/doctorApi'
import medicalApi from '../../api/medicalApi'
import visitApi from '../../api/visitApi'
import leaveApi from '../../api/leaveApi'

const AdminDashboard = ()=>{
  const [counts, setCounts] = useState({ users:0, doctors:0, medicals:0, visits:0, leaves:0 })
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      try{
        const [u,d,m,v,l] = await Promise.all([
          userApi.listUsers(), doctorApi.listDoctors(), medicalApi.listMedicals(), visitApi.listVisits(), leaveApi.listLeaves()
        ])
        setCounts({ users: (u.users||u).length, doctors: (d.doctors||d).length, medicals: (m.medicals||m).length, visits: (v.visits||v).length, leaves: (l.leaves||l).length })
      }catch(err){
  console.error('Dashboard API error:', err)
}
setLoading(false)
      
    })()
  },[])
 console.log(counts, 'in admint')
  return (
    <div className="container my-4">
      <h2>Admin Dashboard</h2>
      {loading && <div className="alert alert-info">Loading dashboard...</div>}
      <div className="row g-3 mt-3">
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h5>Users</h5><h3>{counts.users}</h3></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h5>Doctors</h5><h3>{counts.doctors}</h3></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h5>Medicals</h5><h3>{counts.medicals}</h3></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h5>Visits</h5><h3>{counts.visits}</h3></div></div>
        <div className="col-sm-6 col-md-4"><div className="card p-3"><h5>Leaves</h5><h3>{counts.leaves}</h3></div></div>
      </div>
    </div>
  )
}

export default AdminDashboard
