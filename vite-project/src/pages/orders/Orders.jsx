import { useEffect, useState } from 'react'
import orderApi from '../../api/orderApi'
import doctorApi from '../../api/doctorApi'
import productApi from '../../api/productApi'
import { PageContainer, PageHeader, FormSection, DataTable, EmptyState } from '../../components/ui'

const Orders = () => {
  const [orders, setOrders] = useState([]); const [doctors, setDoctors] = useState([]); const [products, setProducts] = useState([])
  const [doctorId, setDoctorId] = useState(''); const [productId, setProductId] = useState(''); const [quantity, setQuantity] = useState(1); const [error, setError] = useState('')
  const load = async () => { try { const [o, d, p] = await Promise.all([orderApi.listOrders(), doctorApi.listDoctors(), productApi.listProducts()]); setOrders(o.orders || []); setDoctors(d.doctors || []); setProducts(p.products || []) } catch (err) { setError(err?.response?.data?.message || 'Unable to load orders') } }
  useEffect(() => {
    let cancelled = false
    Promise.all([orderApi.listOrders(), doctorApi.listDoctors(), productApi.listProducts()]).then(([orderResponse, doctorResponse, productResponse]) => {
      if (cancelled) return
      setOrders(orderResponse.orders || [])
      setDoctors(doctorResponse.doctors || [])
      setProducts(productResponse.products || [])
    }).catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Unable to load orders') })
    return () => { cancelled = true }
  }, [])
  const create = async event => { event.preventDefault(); try { await orderApi.createOrder({ doctorId, items: [{ productId, quantity: Number(quantity) }] }); setDoctorId(''); setProductId(''); setQuantity(1); load() } catch (err) { setError(err?.response?.data?.message || 'Unable to create order') } }
  const update = async (id, status) => { try { await orderApi.updateOrderStatus(id, status); load() } catch (err) { setError(err?.response?.data?.message || 'Unable to update order') } }

  const statusColor = (status) => {
    switch (status) {
      case 'FULFILLED': return 'success'
      case 'CONFIRMED': return 'primary'
      case 'CANCELLED': return 'danger'
      default: return 'warning'
    }
  }

  const columns = [
    { key: 'doctor', header: 'Doctor', render: (o) => <span className="fw-semibold">{o.doctorId?.name || '—'}</span> },
    { key: 'items', header: 'Items', render: (o) => o.items?.map(item => `${item.productId?.name || 'Product'} × ${item.quantity}`).join(', ') },
    { key: 'createdBy', header: 'Created by', render: (o) => <span className="text-muted">{o.createdBy?.name || '—'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <select
          className={`form-select form-select-sm border-0 bg-${statusColor(o.status)}-subtle text-${statusColor(o.status)}-emphasis fw-semibold`}
          style={{ maxWidth: '160px' }}
          value={o.status}
          onChange={event => update(o._id, event.target.value)}
        >
          <option>PLACED</option>
          <option>CONFIRMED</option>
          <option>FULFILLED</option>
          <option>CANCELLED</option>
        </select>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Sales & Activity"
        title="Orders"
        description="Place and track product orders for doctors."
      />

      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-exclamation-triangle-fill"></i> {error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <form onSubmit={create}>
            <FormSection title="Place a new order" hint="Order a product on behalf of a doctor.">
              <div>
                <label className="form-label fw-semibold">Doctor</label>
                <select className="form-select" value={doctorId} onChange={event => setDoctorId(event.target.value)} required>
                  <option value="">Select doctor…</option>
                  {doctors.map(doctor => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label fw-semibold">Product</label>
                <select className="form-select" value={productId} onChange={event => setProductId(event.target.value)} required>
                  <option value="">Select product…</option>
                  {products.map(product => <option key={product._id} value={product._id}>{product.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label fw-semibold">Quantity</label>
                <input className="form-control" type="number" min="1" value={quantity} onChange={event => setQuantity(event.target.value)} />
              </div>
              <div className="d-flex align-items-end">
                <button className="btn btn-primary rounded-3 fw-semibold w-100" type="submit">
                  <i className="bi bi-plus-lg me-1"></i> Place order
                </button>
              </div>
            </FormSection>
          </form>
        </div>
      </div>

      <div>
        <h2 className="mf-section-title">Order history <span className="text-muted fw-normal">· {orders.length}</span></h2>
        <DataTable
          columns={columns}
          rows={orders}
          rowKey={(o) => o._id}
          mobileCards
          empty={<EmptyState icon="bi-bag" title="No orders yet" description="Orders placed for doctors will appear here." />}
        />
      </div>
    </PageContainer>
  )
}
export default Orders
