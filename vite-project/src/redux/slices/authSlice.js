import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '../../api/axiosInstance'
import { setAuthToken } from '../../api/axiosInstance'

const storageKey = 'auth'

const persistState = state => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch (error) { void error }
}

const clearPersistedState = () => {
    try { localStorage.removeItem(storageKey) } catch (error) { void error }
}

const initialState = (() => {
    try {
        const raw = localStorage.getItem(storageKey)
        if (raw) return JSON.parse(raw)
    } catch (error) { void error }
    return { user: null, token: null, isAuthenticated: false, loading: false, sessionValidated: false, error: null }
})()

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
    try {
        const resp = await axios.post('/api/login', { email, password })
        return resp.data
    } catch (err) {
        return rejectWithValue(err.response?.data || { message: err.message })
    }
})

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await axios.post('/api/logout')
        return true
    } catch (err) {
        return rejectWithValue(err.response?.data || { message: err.message })
    }
})

export const validateSession = createAsyncThunk(
    'auth/validateSession',
    async (_, { rejectWithValue }) => {
        try {
            const resp = await axios.get('/api/auth/me')
            return resp.data
        } catch (err) {
            return rejectWithValue(err.response?.data || { message: err.message })
        }
    },
    {
        condition: (_, { getState }) => {
            const auth = getState().auth
            return Boolean(auth.token && !auth.sessionValidated && !auth.loading)
        }
    }
)

const slice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials(state, action) {
            const { user, token } = action.payload
            state.user = user
            state.token = token
            state.isAuthenticated = !!token
            state.sessionValidated = !!token
            state.error = null
            persistState(state)
            setAuthToken(token)
        },
        updateUser(state, action) {
            state.user = { ...state.user, ...action.payload }
            persistState(state)
        },
        clearAuth(state) {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.error = null
            clearPersistedState()
            setAuthToken(null)
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => { state.loading = true; state.error = null })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false
                const { user, token } = action.payload
                if (user?.blocked || (user?.active === false)) {
                    state.user = user
                    state.token = null
                    state.isAuthenticated = false
                    state.error = { message: 'Account is disabled or blocked' }
                    persistState(state)
                } else {
                    state.user = user
                    state.token = token
                    state.isAuthenticated = !!token
                    state.sessionValidated = true
                    state.error = null
                    persistState(state)
                    setAuthToken(token)
                }
            })
            .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload || { message: 'Login failed' } })
            .addCase(validateSession.pending, (state) => { state.loading = true; state.sessionValidated = false })
            .addCase(validateSession.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.isAuthenticated = !!state.token
                state.sessionValidated = true
                state.error = null
                persistState(state)
            })
            .addCase(validateSession.rejected, (state) => {
                state.loading = false
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state.sessionValidated = true
                state.error = null
                clearPersistedState()
                setAuthToken(null)
            })
            .addCase(logout.fulfilled, (state) => { state.user = null; state.token = null; state.isAuthenticated = false; clearPersistedState(); setAuthToken(null) })
    }
})

export const { setCredentials, updateUser, clearAuth } = slice.actions

export default slice.reducer



