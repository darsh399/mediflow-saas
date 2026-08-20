import { useEffect, useState } from 'react'
import notificationApi from '../../api/notificationApi'

const Notifications = () => {
  const [items, setItems] = useState([]); const [error, setError] = useState('')
  const load = () => notificationApi.listNotifications().then(response => setItems(response.notifications || [])).catch(err => setError(err?.response?.data?.message || 'Unable to load notifications'))
  useEffect(() => { load() }, [])
  const read = async id => { await notificationApi.markNotificationRead(id); load() }
  return <div><h2>Notifications</h2>{error && <div className="alert alert-danger">{error}</div>}{!items.length && <div className="alert alert-info">No notifications.</div>}<div className="list-group">{items.map(item => <button type="button" className={`list-group-item list-group-item-action ${item.readAt ? '' : 'fw-bold'}`} key={item._id} onClick={() => read(item._id)}><div>{item.title}</div><div className="small">{item.message}</div><div className="small text-muted">{new Date(item.createdAt).toLocaleString()}</div></button>)}</div></div>
}
export default Notifications
