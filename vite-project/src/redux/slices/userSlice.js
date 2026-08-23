import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import userApi from '../../api/userApi'

export const fetchUsers = createAsyncThunk(
  'users/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userApi.listUsers()
      return data.users || data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

export const searchUsers = createAsyncThunk(
  'users/search',
  async (query, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(query || {}).toString()

      const resp = userApi.searchUsers
        ? await userApi.searchUsers(query)
        : await fetch(`/api/users/search?${params}`).then(r => r.json())

      return resp.users || resp
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

export const fetchUser = createAsyncThunk(
  'users/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await userApi.fetchUser(id)
      return data.user || data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

export const createUser = createAsyncThunk(
  'users/create',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await userApi.createUser(payload)
      return data.user || data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data: body }, { rejectWithValue }) => {
    try {
      const data = await userApi.updateUser(id, body)
      return data.user || data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      const data = userApi.deleteUser
        ? await userApi.deleteUser(id)
        : await fetch(`/api/users/${id}`, {
            method: 'DELETE'
          }).then(r => r.json())

      return { id, data }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

export const changeUserStatus = createAsyncThunk(
  'users/status',
  async ({ id, action }, { rejectWithValue }) => {
    try {
      const data = await userApi.changeUserStatus(id, action)
      return data.user || data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

// Get visits created by logged-in employee
export const getAllMyVisits = createAsyncThunk(
  'users/myvisits',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userApi.getAllMyVisits()

      return data.visits || []
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: err.message }
      )
    }
  }
)

const slice = createSlice({
  name: 'users',

  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // Users
      .addCase(fetchUsers.pending, (s) => {
        s.loading = true
        s.error = null
      })

      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.loading = false
        s.items = a.payload || []
      })

      .addCase(fetchUsers.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload || a.error
      })

      // Search
      .addCase(searchUsers.fulfilled, (s, a) => {
        s.items = a.payload || []
      })

      // Single user
      .addCase(fetchUser.fulfilled, (s, a) => {
        s.current = a.payload
      })

      // Create
      .addCase(createUser.fulfilled, (s, a) => {
        s.items.unshift(a.payload)
      })

      // Update
      .addCase(updateUser.fulfilled, (s, a) => {
        s.current = a.payload

        s.items = s.items.map(u =>
          u._id === a.payload._id
            ? a.payload
            : u
        )
      })

      // Delete
      .addCase(deleteUser.fulfilled, (s, a) => {
        s.items = s.items.filter(
          u => u._id !== a.payload.id
        )
      })

      // Status
      .addCase(changeUserStatus.fulfilled, (s, a) => {
        s.current = a.payload
      })

      // My visits
      .addCase(getAllMyVisits.pending, (s) => {
        s.loading = true
        s.error = null
      })

      .addCase(getAllMyVisits.fulfilled, (s, a) => {
        s.loading = false
        s.error = null
        s.items = a.payload || []
      })

      .addCase(getAllMyVisits.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload || a.error
      })
  }
})

export default slice.reducer