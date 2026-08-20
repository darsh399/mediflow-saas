import React, { createContext, useContext, useState } from 'react'

const NotificationContext = createContext({ notify: () => {} })

export function useNotify() { return useContext(NotificationContext) }

export default function NotificationProvider({ children }){
  const [notice, setNotice] = useState({ show:false, title:'', message:'' })

  const notify = (title, message='') => {
    setNotice({ show: true, title: title || 'Notice', message: message || '' })
    // auto-hide after 3.5s
    setTimeout(()=> setNotice(n=> ({ ...n, show:false })), 3500)
  }

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notice.show && (
        <div className="modal-backdrop show" />
      )}
      <div className={`modal fade ${notice.show? 'show d-block':''}`} tabIndex={-1} role="dialog" style={{zIndex:1055}}>
        <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{notice.title}</h5>
              <button type="button" className="btn-close" onClick={()=>setNotice(n=>({ ...n, show:false }))}></button>
            </div>
            <div className="modal-body">
              <p>{notice.message}</p>
            </div>
          </div>
        </div>
      </div>
    </NotificationContext.Provider>
  )
}
