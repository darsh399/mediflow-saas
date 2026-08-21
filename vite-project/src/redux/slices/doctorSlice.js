import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import doctorApi from '../../api/doctorApi'

export const fetchDoctors = createAsyncThunk('doctors/fetch', async (_, { rejectWithValue }) => {
  try {
    const data = await doctorApi.listDoctors()
    console.log('in slice doctor', data)
    return data.doctors || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const createDoctor = createAsyncThunk('doctors/create', async (payload, { rejectWithValue }) => {
  try {
    const data = await doctorApi.createDoctor(payload)
    return data.doctor || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const deleteDoctor = createAsyncThunk('doctors/delete', async (id, { rejectWithValue }) => {
  try {
    const data = await doctorApi.deleteDoctor(id)
    return { id, data }
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

const slice = createSlice({
  name: 'doctors',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchDoctors.fulfilled, (s, a) => { s.loading = false; s.items = a.payload || []; })
      .addCase(fetchDoctors.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(createDoctor.pending, (s) => { s.loading = true })
      .addCase(createDoctor.fulfilled, (s, a) => { s.loading = false; s.items.unshift(a.payload) })
      .addCase(createDoctor.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(deleteDoctor.fulfilled, (s, a) => { s.items = s.items.filter(d => d._id !== a.payload.id) })
  }
})

export default slice.reducer
