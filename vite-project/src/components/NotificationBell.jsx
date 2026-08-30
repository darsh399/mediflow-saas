import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import notificationApi from '../api/notificationApi'

const TYPE_META = {
  LEAVE_APPROVED: { icon: 'bi-calendar-check', color: '#198754' },
  LEAVE_REJECTED: { icon: 'bi-calendar-x', color: '#dc3545' },
  LEAVE_CANCELLED: { icon: 'bi-calendar-minus', color: '#6c757d' },
  EXPENSE_APPROVED: { icon: 'bi-cash-coin', color: '#198754' },
  EXPENSE_REJECTED: { icon: 'bi-cash-coin', color: '#dc3545' },
  TASK_ASSIGNED: { icon: 'bi-check2-square', color: 'var(--mf-color-primary)' },
  EMPLOYEE_PROMOTED: { icon: 'bi-arrow-up-circle', color: '#fd7e14' },
  DOCTOR_BIRTHDAY: { icon: 'bi-gift', color: '#0dcaf0' },
  DOCUMENT_REUPLOAD_REQUESTED: { icon: 'bi-file-earmark-arrow-up', color: '#fd7e14' },
  company_message: { icon: 'bi-megaphone', color: 'var(--mf-color-primary)' },
  DEMO_REQUEST: { icon: 'bi-megaphone', color: '#d63384' },
}
const DEFAULT_META = { icon: 'bi-bell', color: '#6c757d' }

function metaFor(type) {
  return TYPE_META[type] || DEFAULT_META
}

function timeAgo(value) {
  if (!value) return ''
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const NotificationBell = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const containerRef = useRef(null)
  const unread = items.filter((item) => !item.readAt).length

  useEffect(() => {
    notificationApi.listNotifications()
      .then((response) => setItems(response.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const markRead = async (id) => {
    setItems((current) => current.map((item) => (item._id === id ? { ...item, readAt: new Date().toISOString() } : item)))
    try { await notificationApi.markNotificationRead(id) } catch { /* keep optimistic state */ }
  }

  const handleItemClick = (item) => {
    markRead(item._id)
    setOpen(false)
    if (item.link) navigate(item.link)
  }

  const markAllRead = async () => {
    if (!unread || markingAll) return
    setMarkingAll(true)
    const now = new Date().toISOString()
    setItems((current) => current.map((item) => (item.readAt ? item : { ...item, readAt: now })))
    try { await notificationApi.markAllNotificationsRead() } catch { /* keep optimistic state */ } finally { setMarkingAll(false) }
  }

  return (
    <div className="notification-bell position-relative" ref={containerRef}>
      <button
        type="button"
        className="btn notification-toggle rounded-circle d-inline-flex align-items-center justify-content-center"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <i className="bi bi-bell-fill"></i>
        {unread > 0 && <span className="badge rounded-pill bg-danger notification-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-panel shadow-lg rounded-4 border bg-white">
          <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
            <div>
              <h6 className="fw-bold mb-0">Notifications</h6>
              {unread > 0 && <small className="text-muted">{unread} unread</small>}
            </div>
            {unread > 0 && (
              <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" disabled={markingAll} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="text-center text-muted py-5"><span className="spinner-border spinner-border-sm me-2"></span>Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="bi bi-bell-slash fs-2 d-block mb-2"></i>
                No notifications yet
              </div>
            ) : items.map((item) => {
              const meta = metaFor(item.type)
              return (
                <button type="button" key={item._id} className={`notification-item ${item.readAt ? '' : 'is-unread'}`} onClick={() => handleItemClick(item)}>
                  <span className="notification-icon" style={{ background: `${meta.color}1a`, color: meta.color }}>
                    <i className={`bi ${meta.icon}`}></i>
                  </span>
                  <span className="notification-body">
                    <span className="notification-title">{item.title || item.type}</span>
                    <span className="notification-message">{item.message}</span>
                    <span className="notification-time">{timeAgo(item.createdAt)}</span>
                  </span>
                  {!item.readAt && <span className="notification-dot" aria-hidden="true"></span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <style>
        {`
          .notification-toggle {
            width: 42px;
            height: 42px;
            border: 1px solid #dee2e6;
            background: #fff;
            color: #495057;
            font-size: 17px;
          }

          .notification-toggle:hover {
            border-color: var(--mf-color-primary);
            background: #f3f7ff;
            color: var(--mf-color-primary);
          }

          .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            font-size: 10px;
            padding: 3px 5px;
            min-width: 18px;
            line-height: 1;
          }

          .notification-panel {
            position: absolute;
            top: 54px;
            right: 0;
            width: 380px;
            max-width: min(380px, 92vw);
            z-index: 9999;
            animation: notificationDropdown 0.18s ease-out;
          }

          .notification-list {
            max-height: 420px;
            overflow-y: auto;
          }

          .notification-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            width: 100%;
            border: 0;
            background: transparent;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1px solid #f1f3f5;
            position: relative;
          }

          .notification-item:last-child {
            border-bottom: 0;
          }

          .notification-item:hover {
            background: #f8f9fc;
          }

          .notification-item.is-unread {
            background: #f3f7ff;
          }

          .notification-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 16px;
          }

          .notification-body {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }

          .notification-title {
            font-weight: 600;
            font-size: 13.5px;
            color: #212529;
          }

          .notification-message {
            font-size: 13px;
            color: #495057;
            white-space: normal;
            word-break: break-word;
          }

          .notification-time {
            font-size: 11px;
            color: #868e96;
            margin-top: 2px;
          }

          .notification-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--mf-color-primary);
            position: absolute;
            top: 16px;
            right: 14px;
          }

          @keyframes notificationDropdown {
            from { opacity: 0; transform: translateY(-6px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @media (max-width: 420px) {
            .notification-panel {
              position: fixed;
              top: 64px;
              right: 8px;
              left: 8px;
              width: auto;
            }
          }
        `}
      </style>
    </div>
  )
}

export default NotificationBell
