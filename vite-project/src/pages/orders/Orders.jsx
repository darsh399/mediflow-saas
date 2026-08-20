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
  return <div><h2>Orders</h2>{error && <div className="alert alert-danger">{error}</div>}<form className="row g-2 mb-4" onSubmit={create}><div className="col-md-4"><select className="form-select" value={doctorId} onChange={event => setDoctorId(event.target.value)} required><option value="">Doctor...</option>{doctors.map(doctor => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}</select></div><div className="col-md-4"><select className="form-select" value={productId} onChange={event => setProductId(event.target.value)} required><option value="">Product...</option>{products.map(product => <option key={product._id} value={product._id}>{product.name}</option>)}</select></div><div className="col-md-2"><input className="form-control" type="number" min="1" value={quantity} onChange={event => setQuantity(event.target.value)} /></div><div className="col-md-2"><button className="btn btn-primary">Place order</button></div></form><div className="table-responsive"><table className="table"><thead><tr><th>Doctor</th><th>Items</th><th>Created by</th><th>Status</th></tr></thead><tbody>{orders.map(order => <tr key={order._id}><td>{order.doctorId?.name || '-'}</td><td>{order.items?.map(item => `${item.productId?.name || 'Product'} x ${item.quantity}`).join(', ')}</td><td>{order.createdBy?.name || '-'}</td><td><select className="form-select form-select-sm" value={order.status} onChange={event => update(order._id, event.target.value)}><option>PLACED</option><option>CONFIRMED</option><option>FULFILLED</option><option>CANCELLED</option></select></td></tr>)}</tbody></table></div></div>
}
export default Orders
