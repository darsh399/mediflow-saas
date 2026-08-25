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

export const fetchEmployeeVisitSummary = createAsyncThunk('visits/employeeSummary', async (params, { rejectWithValue }) => {
  try { return await visitApi.listEmployeeVisitSummary(params) } catch (err) { return rejectWithValue(err.response?.data || { message: err.message }) }
})

export const fetchEmployeeVisits = createAsyncThunk('visits/employeeHistory', async ({ employeeId, params }, { rejectWithValue }) => {
  try { return await visitApi.listEmployeeVisits(employeeId, params) } catch (err) { return rejectWithValue(err.response?.data || { message: err.message }) }
})

export const fetchVisitCalendarSummary = createAsyncThunk('visits/calendarSummary', async (params, { rejectWithValue }) => {
  try { return await visitApi.getVisitCalendarSummary(params) } catch (err) { return rejectWithValue(err.response?.data || { message: err.message }) }
})

const slice = createSlice({
  name: 'visits',
  initialState: { items: [], loading: false, error: null, lastResult: null, employeeSummary: { items: [], pagination: {}, dateRange: {}, loading: false, error: null }, employeeHistory: { employee: null, items: [], pagination: {}, dateRange: {}, loading: false, error: null }, calendarSummary: { items: [], loading: false, error: null } },
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
      .addCase(fetchEmployeeVisitSummary.pending, (s) => { s.employeeSummary.loading = true; s.employeeSummary.error = null })
      .addCase(fetchEmployeeVisitSummary.fulfilled, (s, a) => { s.employeeSummary.loading = false; s.employeeSummary.items = a.payload.employees || []; s.employeeSummary.pagination = a.payload.pagination || {}; s.employeeSummary.dateRange = a.payload.dateRange || {} })
      .addCase(fetchEmployeeVisitSummary.rejected, (s, a) => { s.employeeSummary.loading = false; s.employeeSummary.error = a.payload || a.error })
      .addCase(fetchEmployeeVisits.pending, (s) => { s.employeeHistory.loading = true; s.employeeHistory.error = null })
      .addCase(fetchEmployeeVisits.fulfilled, (s, a) => { s.employeeHistory.loading = false; s.employeeHistory.employee = a.payload.employee || null; s.employeeHistory.items = a.payload.visits || []; s.employeeHistory.pagination = a.payload.pagination || {}; s.employeeHistory.dateRange = a.payload.dateRange || {} })
      .addCase(fetchEmployeeVisits.rejected, (s, a) => { s.employeeHistory.loading = false; s.employeeHistory.error = a.payload || a.error })
      .addCase(fetchVisitCalendarSummary.pending, (s) => { s.calendarSummary.loading = true; s.calendarSummary.error = null })
      .addCase(fetchVisitCalendarSummary.fulfilled, (s, a) => { s.calendarSummary.loading = false; s.calendarSummary.items = a.payload.visits || [] })
      .addCase(fetchVisitCalendarSummary.rejected, (s, a) => { s.calendarSummary.loading = false; s.calendarSummary.error = a.payload || a.error })
  }
})

export default slice.reducer
