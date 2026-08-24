
import 'bootstrap/dist/css/bootstrap.min.css';
import AppRoutes from './routes/AppRoutes';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateSession } from './redux/slices/authSlice';
import './App.css';
import GlobalLoader from './components/GlobalLoader';
const App = () => {
  const dispatch = useDispatch()
  const token = useSelector(state => state.auth.token)

  useEffect(() => {
    if (token) dispatch(validateSession())
  }, [dispatch, token])

  return(
    <div className="App">
      <GlobalLoader />
      <AppRoutes/>
    </div>
  )
}

export default App;
