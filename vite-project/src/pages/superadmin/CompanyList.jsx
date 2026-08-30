import { useEffect, useState } from 'react'
import axios from '../../api/axiosInstance'
import { Link } from 'react-router-dom'
import { PageContainer, PageHeader, DataTable, EmptyState } from '../../components/ui'

const STATUS_VARIANT = {
  ACTIVE: 'success', BLOCKED: 'danger', REJECTED: 'danger', SUSPENDED: 'warning',
  PENDING: 'warning', PENDING_APPROVAL: 'warning', PENDING_ACTIVATION: 'warning',
}
const badge = (status) => <span className={`mf-badge mf-badge--${STATUS_VARIANT[status] || 'neutral'}`}>{status || '—'}</span>

const CompanyList = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => {
    try { const r = await axios.get('/api/superadmin/companies'); setList(r.data.companies || []) } catch (e) { console.error(e) } finally { setLoading(false) }
  })() }, [])

  const columns = [
    { key: 'companyName', header: 'Name', render: (c) => <span className="fw-semibold">{c.companyName}</span> },
    { key: 'status', header: 'Status', render: (c) => badge(c.status) },
    { key: 'subscription', header: 'Subscription', render: (c) => c.subscription ? badge(c.subscription.status) : <span className="text-muted small">N/A</span> },
    { key: 'actions', header: '', align: 'right', render: (c) => <Link to={`/superadmin/companies/${c._id}`} className="btn btn-sm btn-outline-primary rounded-3">Details</Link> },
  ]

  return (
    <PageContainer>
      <PageHeader eyebrow="Super admin" title="Companies" description="All companies registered on MediFlow." />
      <DataTable
        columns={columns}
        rows={list}
        rowKey={(c) => c._id}
        loading={loading}
        pageSize={25}
        mobileCards
        empty={<EmptyState icon="bi-buildings" title="No companies found" description="Registered companies will appear here." />}
      />
    </PageContainer>
  )
}
export default CompanyList
