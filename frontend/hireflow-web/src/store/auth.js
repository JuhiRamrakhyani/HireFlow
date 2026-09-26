import { defineStore } from 'pinia'
import api from '../api/client'

const TOKEN_KEY = 'hireflow_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { id, username, role } | null
    ready: false,
    loading: false,
    error: ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.user
  },
  actions: {
    // Called once on app boot. If a token is already sitting in
    // localStorage from a previous session, verify it's still valid by
    // asking the backend who it belongs to, instead of trusting it blindly.
    async init() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        this.ready = true
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        this.user = data
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        this.user = null
      } finally {
        this.ready = true
      }
    },

    async login(username, password) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await api.post('/auth/login', { username, password })
        localStorage.setItem(TOKEN_KEY, data.token)
        this.user = data.user
        return true
      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      localStorage.removeItem(TOKEN_KEY)
      this.user = null
    }
  }
})
