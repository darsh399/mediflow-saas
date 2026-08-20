import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import store from './redux/store'
import { setAuthToken } from './api/axiosInstance'
import NotificationProvider from './components/NotificationProvider'

// restore token from persisted auth state
try {
  const raw = localStorage.getItem('auth')
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed?.token) setAuthToken(parsed.token)
  }
} catch (e) {}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
