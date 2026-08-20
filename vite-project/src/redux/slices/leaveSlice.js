import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import leaveApi from '../../api/leaveApi'

export const applyLeave = createAsyncThunk('leaves/apply', async (payload, { rejectWithValue }) => {
  try {
    const data = await leaveApi.applyLeave(payload)
    return data.leave || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const fetchLeaves = createAsyncThunk('leaves/fetch', async (_, { rejectWithValue }) => {
  try {
    const data = await leaveApi.listLeaves()
    return data.leaves || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const reviewLeave = createAsyncThunk('leaves/review', async ({ id, action }, { rejectWithValue }) => {
  try {
    const data = await leaveApi.reviewLeave(id, action)
    return data.leave || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

const slice = createSlice({
  name: 'leaves',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchLeaves.fulfilled, (s, a) => { s.loading = false; s.items = a.payload || []; })
      .addCase(fetchLeaves.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(applyLeave.fulfilled, (s, a) => { s.items.unshift(a.payload) })
      .addCase(reviewLeave.fulfilled, (s, a) => { s.items = s.items.map(l => l._id === a.payload._id ? a.payload : l) })
  }
})

export default slice.reducer
