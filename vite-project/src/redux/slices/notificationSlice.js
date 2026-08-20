import { createSlice } from '@reduxjs/toolkit'

const slice = createSlice({
  name: 'notifications',
  initialState: { items: [] },
  reducers: {
    addNotification(state, action){ state.items.unshift(action.payload) },
    markRead(state, action){ state.items = state.items.map(n=> n.id===action.payload ? ({...n, read:true}) : n) },
    clearNotifications(state){ state.items = [] }
  }
})

export const { addNotification, markRead, clearNotifications } = slice.actions
export default slice.reducer
