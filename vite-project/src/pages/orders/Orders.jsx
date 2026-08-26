import { useEffect, useState } from 'react'
import orderApi from '../../api/orderApi'
import doctorApi from '../../api/doctorApi'
import productApi from '../../api/productApi'

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

  return (
    <div className="container-fluid py-4">

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '52px', height: '52px' }}
          >
            <i className="bi bi-bag-fill fs-4"></i>
          </div>
          <div>
            <h2 className="fw-bold mb-0">Orders</h2>
            <p className="text-muted mb-0">Place and track product orders for doctors.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-white border-0 p-4 pb-2">
          <h5 className="fw-bold mb-1">Place New Order</h5>
          <p className="text-muted small mb-0">Select a doctor and product to place an order.</p>
        </div>
        <div className="card-body p-4">
          <form className="row g-3" onSubmit={create}>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Doctor</label>
              <select className="form-select" value={doctorId} onChange={event => setDoctorId(event.target.value)} required>
                <option value="">Select doctor...</option>
                {doctors.map(doctor => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Product</label>
              <select className="form-select" value={productId} onChange={event => setProductId(event.target.value)} required>
                <option value="">Select product...</option>
                {products.map(product => <option key={product._id} value={product._id}>{product.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Quantity</label>
              <input className="form-control" type="number" min="1" value={quantity} onChange={event => setQuantity(event.target.value)} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100 rounded-3">
                <i className="bi bi-plus-lg me-1"></i>
                Place Order
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 p-4">
          <h5 className="fw-bold mb-0">Order History</h5>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-bag-x text-muted fs-1"></i>
            <h6 className="fw-bold mt-3">No orders yet</h6>
            <p className="text-muted mb-0">Orders placed for doctors will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: '#f8f9fc' }}>
                <tr>
                  <th className="px-4 py-3 border-0">Doctor</th>
                  <th className="py-3 border-0">Items</th>
                  <th className="py-3 border-0">Created By</th>
                  <th className="py-3 border-0">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="px-4 py-3 fw-semibold">{order.doctorId?.name || '-'}</td>
                    <td className="py-3">{order.items?.map(item => `${item.productId?.name || 'Product'} x ${item.quantity}`).join(', ')}</td>
                    <td className="py-3">{order.createdBy?.name || '-'}</td>
                    <td className="py-3">
                      <select className="form-select form-select-sm" style={{ maxWidth: '160px' }} value={order.status} onChange={event => update(order._id, event.target.value)}>
                        <option>PLACED</option>
                        <option>CONFIRMED</option>
                        <option>FULFILLED</option>
                        <option>CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
export default Orders
