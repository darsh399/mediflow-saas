import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import doctorReducer from './slices/doctorSlice'
import medicalReducer from './slices/medicalSlice'
import visitReducer from './slices/visitSlice'
import leaveReducer from './slices/leaveSlice'
import userReducer from './slices/userSlice'
import notificationReducer from './slices/notificationSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    doctors: doctorReducer
    ,medicals: medicalReducer,
    visits: visitReducer,
    leaves: leaveReducer
    ,users: userReducer
    ,notifications: notificationReducer
  }
})

export default store
