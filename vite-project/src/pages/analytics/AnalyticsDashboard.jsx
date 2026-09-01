import { useEffect, useState } from 'react'
import analyticsApi from '../../api/analyticsApi'
import { PageContainer, PageHeader, StatCard, SkeletonTable } from '../../components/ui'

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const [year, month] = period.split('-').map(Number)
    analyticsApi.getSummary({ year, month })
      .then(setData)
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load analytics'))
      .finally(() => setLoading(false))
  }, [period])

  const sales = data?.sales || { count: 0, value: 0 }
  const expenseCount = (data?.expenses || []).reduce((total, item) => total + item.count, 0)
  const fulfillmentCount = (data?.orders || []).reduce((total, item) => total + item.count, 0)

  return <PageContainer>
    <PageHeader eyebrow="Analytics" title="Operations Analytics" description={data?.period || 'Review company activity at a glance.'} />
    <div className="d-flex justify-content-end mb-3"><input type="month" className="form-control" style={{ maxWidth: 190 }} value={period} onChange={(event) => setPeriod(event.target.value)} /></div>
    {error && <div className="alert alert-danger">{error}</div>}
    {loading && !data ? <SkeletonTable rows={4} columns={4} /> : <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><StatCard label="Attendance records" value={data?.attendance || 0} icon="bi-clock-history" iconBg="var(--mf-color-primary-subtle)" iconColor="var(--mf-color-primary)" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Visits" value={data?.visits || 0} icon="bi-geo-alt" iconBg="var(--mf-color-success-subtle)" iconColor="var(--mf-color-success)" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Sales" value={`${sales.count} · ₹${Number(sales.value || 0).toLocaleString('en-IN')}`} icon="bi-graph-up" iconBg="var(--mf-color-info-subtle)" iconColor="var(--mf-color-info)" /></div>
        <div className="col-6 col-lg-3"><StatCard label="Orders" value={fulfillmentCount} icon="bi-bag" iconBg="var(--mf-color-warning-subtle)" iconColor="var(--mf-color-warning)" /></div>
      </div>
      <div className="row g-4"><div className="col-lg-6"><div className="card border-0 shadow-sm"><div className="card-body"><h5 className="fw-bold">Expenses</h5><p className="text-muted">{expenseCount} claims in this period</p>{(data?.expenses || []).map((item) => <div className="d-flex justify-content-between border-bottom py-2" key={item._id || 'unknown'}><span className="text-capitalize">{item._id || 'Unknown'}</span><strong>₹{Number(item.value || 0).toLocaleString('en-IN')}</strong></div>)}</div></div></div><div className="col-lg-6"><div className="card border-0 shadow-sm"><div className="card-body"><h5 className="fw-bold">Fulfillment pipeline</h5>{(data?.orders || []).map((item) => <div className="d-flex justify-content-between border-bottom py-2" key={item._id || 'PENDING'}><span>{item._id || 'PENDING'}</span><strong>{item.count}</strong></div>)}</div></div></div></div>
    </>}
  </PageContainer>
}
