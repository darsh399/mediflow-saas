import { createContext, useCallback, useContext, useRef, useState } from 'react'

const NotificationContext = createContext({ notify: () => {} })

export function useNotify() { return useContext(NotificationContext) }

const AUTO_DISMISS_MS = 4500

const ICONS = {
  success: 'bi-check-circle-fill',
  error: 'bi-x-circle-fill',
  info: 'bi-info-circle-fill',
}

// notify(title, message) is called all over the app without a type — infer
// success/error from the title so every existing call site gets the right
// color/icon for free, no call-site changes required.
function detectType(title) {
  const text = String(title || '').toLowerCase()
  if (/fail|unable|error|denied|invalid|not a\b|missing|do not match|already exists|expired|cannot|wrong/.test(text)) return 'error'
  return 'success'
}

export default function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    window.clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
  }, [])

  // Optional 3rd arg lets new call sites force a type ('success' | 'error' |
  // 'info'); existing 1-2 arg calls keep working exactly as before.
  const notify = useCallback((title, message = '', type) => {
    const id = ++idRef.current
    const resolvedType = type || detectType(title)
    setToasts((current) => [...current, { id, title: title || 'Notice', message, type: resolvedType }])
    timersRef.current[id] = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }, [dismiss])

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <div className="mf-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`mf-toast mf-toast-${toast.type}`} role="alert" key={toast.id}>
            <div className="mf-toast-icon">
              <i className={`bi ${ICONS[toast.type]}`}></i>
            </div>
            <div className="mf-toast-body">
              <div className="mf-toast-title">{toast.title}</div>
              {toast.message && <div className="mf-toast-message">{toast.message}</div>}
            </div>
            <button type="button" className="mf-toast-close" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <span className="mf-toast-progress" />
          </div>
        ))}
      </div>

      <style>
        {`
          .mf-toast-stack {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2100;
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: min(380px, calc(100vw - 32px));
            pointer-events: none;
          }

          .mf-toast {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 40px 14px 14px;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.08);
            border-left: 4px solid var(--mf-toast-accent, #0d6efd);
            overflow: hidden;
            pointer-events: auto;
            animation: mf-toast-in 0.28s cubic-bezier(0.21, 1.02, 0.73, 1) both;
          }

          .mf-toast-success { --mf-toast-accent: #198754; }
          .mf-toast-error { --mf-toast-accent: #dc3545; }
          .mf-toast-info { --mf-toast-accent: #0d6efd; }

          .mf-toast-icon {
            flex-shrink: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            color: #fff;
            background: var(--mf-toast-accent, #0d6efd);
          }

          .mf-toast-body { min-width: 0; flex: 1; }

          .mf-toast-title {
            font-weight: 700;
            font-size: 14px;
            color: #1f2937;
            line-height: 1.35;
          }

          .mf-toast-message {
            font-size: 13px;
            color: #6b7280;
            margin-top: 2px;
            line-height: 1.4;
            overflow-wrap: anywhere;
          }

          .mf-toast-close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            border: 0;
            border-radius: 50%;
            background: transparent;
            color: #9ca3af;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.15s ease, color 0.15s ease;
          }

          .mf-toast-close:hover {
            background: #f1f3f5;
            color: #374151;
          }

          .mf-toast-progress {
            position: absolute;
            left: 0;
            bottom: 0;
            height: 3px;
            width: 100%;
            background: var(--mf-toast-accent, #0d6efd);
            opacity: 0.35;
            transform-origin: left;
            animation: mf-toast-shrink ${AUTO_DISMISS_MS}ms linear forwards;
          }

          @keyframes mf-toast-in {
            from { opacity: 0; transform: translateX(24px) scale(0.97); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          @keyframes mf-toast-shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .mf-toast { animation: none; }
            .mf-toast-progress { animation: none; opacity: 0; }
          }

          @media (max-width: 575.98px) {
            .mf-toast-stack {
              top: 12px;
              right: 12px;
              left: 12px;
              width: auto;
            }
          }
        `}
      </style>
    </NotificationContext.Provider>
  )
}
