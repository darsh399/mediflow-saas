import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import visitApi from '../../api/visitApi'

export const fetchVisits = createAsyncThunk('visits/fetch', async (_, { rejectWithValue }) => {
  try {
    const data = await visitApi.listVisits()
    return data.visits || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const doctorVisit = createAsyncThunk('visits/doctor', async (payload, { rejectWithValue }) => {
  try {
    const data = await visitApi.doctorVisit(payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const medicalVisit = createAsyncThunk('visits/medical', async (payload, { rejectWithValue }) => {
  try {
    const data = await visitApi.medicalVisit(payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

const slice = createSlice({
  name: 'visits',
  initialState: { items: [], loading: false, error: null, lastResult: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisits.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchVisits.fulfilled, (s, a) => { s.loading = false; s.items = a.payload || []; })
      .addCase(fetchVisits.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(doctorVisit.pending, (s) => { s.loading = true; s.error = null })
      .addCase(doctorVisit.fulfilled, (s, a) => { s.loading = false; s.lastResult = a.payload })
      .addCase(doctorVisit.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(medicalVisit.pending, (s) => { s.loading = true; s.error = null })
      .addCase(medicalVisit.fulfilled, (s, a) => { s.loading = false; s.lastResult = a.payload })
      .addCase(medicalVisit.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
  }
})

export default slice.reducer
