import { useSelector, useDispatch } from 'react-redux'
import { markRead, clearNotifications } from '../redux/slices/notificationSlice'

const NotificationBell = ()=>{
  const items = useSelector(s => s.notifications.items)
  const unread = items.filter(i=> !i.read).length
  const dispatch = useDispatch()

  return (
    <div className="dropdown">
      <button className="btn btn-outline-secondary position-relative" data-bs-toggle="dropdown">
        🔔
        {unread>0 && <span className="badge bg-danger position-absolute" style={{top:-6,right:-6}}>{unread}</span>}
      </button>
      <ul className="dropdown-menu dropdown-menu-end" style={{minWidth:300}}>
        <li className="dropdown-header">Notifications</li>
        {items.length===0 && <li className="dropdown-item text-muted">No notifications</li>}
        {items.map(n=> (
          <li key={n.id} className={`dropdown-item ${n.read? 'text-muted':''}`} onClick={()=>dispatch(markRead(n.id))}>
            <div><small className="text-muted">{n.type}</small></div>
            <div>{n.message}</div>
          </li>
        ))}
        {items.length>0 && <li><hr className="dropdown-divider"/></li>}
        {items.length>0 && <li className="dropdown-item text-center"><button className="btn btn-sm btn-link" onClick={()=>dispatch(clearNotifications())}>Clear</button></li>}
      </ul>
    </div>
  )
}

export default NotificationBell
