import { useEffect, useState } from 'react'
import notificationApi from '../api/notificationApi'

const NotificationBell = ()=>{
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const unread = items.filter(item=> !item.readAt).length

  useEffect(() => {
    notificationApi.listNotifications().then(response => setItems(response.notifications || [])).catch(() => {})
  }, [])

  const markRead = async id => {
    await notificationApi.markNotificationRead(id)
    setItems(current => current.map(item => item._id === id ? { ...item, readAt: new Date().toISOString() } : item))
  }

  return (
    <div className="dropdown position-relative">
      <button className="btn btn-outline-secondary position-relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={()=>setOpen(value => !value)}>
        🔔
        {unread>0 && <span className="badge bg-danger position-absolute" style={{top:-6,right:-6}}>{unread}</span>}
      </button>
      {open && <ul className="dropdown-menu dropdown-menu-end show notification-menu">
        <li className="dropdown-header">Notifications</li>
        {items.length===0 && <li className="dropdown-item text-muted">No notifications</li>}
        {items.map(n=> (
          <li key={n._id} className={`dropdown-item ${n.readAt? 'text-muted':''}`} onClick={()=>markRead(n._id)}>
            <div><small className="text-muted">{n.type}</small></div>
            <div>{n.message}</div>
          </li>
        ))}
      </ul>}
    </div>
  )
}

export default NotificationBell
