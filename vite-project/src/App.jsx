
import 'bootstrap/dist/css/bootstrap.min.css';
import AppRoutes from './routes/AppRoutes';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth, setCredentials, validateSession } from './redux/slices/authSlice';
import './App.css';
import GlobalLoader from './components/GlobalLoader';
import ScrollToTop from './components/ScrollToTop';
const App = () => {
  const dispatch = useDispatch()
  const token = useSelector(state => state.auth.token)

  useEffect(() => {
    if (token) dispatch(validateSession())
  }, [dispatch, token])

  useEffect(() => {
    const handleTokenRefresh = (event) => {
      if (event.detail?.token) dispatch(setCredentials(event.detail))
    }
    window.addEventListener('mediflow:token-refreshed', handleTokenRefresh)
    return () => window.removeEventListener('mediflow:token-refreshed', handleTokenRefresh)
  }, [dispatch])

  useEffect(() => {
    const handleAuthFailure = () => dispatch(clearAuth())
    window.addEventListener('mediflow:auth-failed', handleAuthFailure)
    return () => window.removeEventListener('mediflow:auth-failed', handleAuthFailure)
  }, [dispatch])

  return(
    <div className="App">
      <ScrollToTop />
      <GlobalLoader />
      <AppRoutes/>
    </div>
  )
}

export default App;
