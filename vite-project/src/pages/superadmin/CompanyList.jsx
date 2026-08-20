import { useEffect, useState } from 'react'
import axios from '../../api/axiosInstance'
import { Link } from 'react-router-dom'
import BackButton from '../../components/BackButton'

const CompanyList = ()=>{
  const [list,setList] = useState([])
  useEffect(()=>{(async ()=>{
    try{ const r = await axios.get('/api/superadmin/companies'); setList(r.data.companies || []) }catch(e){console.error(e)}
  })()},[])

  return (
    <div className="container my-4">
      <div className="d-flex align-items-center mb-3">
        <BackButton />
        <h3 className="mb-0">Companies</h3>
      </div>
      <table className="table">
        <thead><tr><th>Name</th><th>Status</th><th>Subscription</th><th>Actions</th></tr></thead>
        <tbody>
          {list.map(c=> (
            <tr key={c._id}>
              <td>{c.companyName}</td>
              <td>{c.status}</td>
              <td>{c.subscription? c.subscription.status : 'N/A'}</td>
              <td><Link to={`/superadmin/companies/${c._id}`} className="btn btn-sm btn-link">Details</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export default CompanyList
