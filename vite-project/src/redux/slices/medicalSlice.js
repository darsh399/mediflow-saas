import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import medicalApi from '../../api/medicalApi'

export const fetchMedicals = createAsyncThunk('medicals/fetch', async (_, { rejectWithValue }) => {
  try {
    const data = await medicalApi.listMedicals()
    return data.medicals || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const createMedical = createAsyncThunk('medicals/create', async (payload, { rejectWithValue }) => {
  try {
    const data = await medicalApi.createMedical(payload)
    return data.medical || data
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

export const deleteMedical = createAsyncThunk('medicals/delete', async (id, { rejectWithValue }) => {
  try {
    const data = await medicalApi.deleteMedical(id)
    return { id, data }
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message })
  }
})

const slice = createSlice({
  name: 'medicals',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicals.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchMedicals.fulfilled, (s, a) => { s.loading = false; s.items = a.payload || []; })
      .addCase(fetchMedicals.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(createMedical.pending, (s) => { s.loading = true })
      .addCase(createMedical.fulfilled, (s, a) => { s.loading = false; s.items.unshift(a.payload) })
      .addCase(createMedical.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error })
      .addCase(deleteMedical.fulfilled, (s, a) => { s.items = s.items.filter(d => d._id !== a.payload.id) })
  }
})

export default slice.reducer
