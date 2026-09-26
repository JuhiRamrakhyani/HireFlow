import { defineStore } from 'pinia'
import api from '../api/client'

export const useCandidateStore = defineStore('candidate', {
  state: () => ({
    profile: null,
    matches: [],
    applications: [],
    loading: false
  }),
  getters: {
    hasResume: (state) => !!state.profile?.resumeFileName
  },
  actions: {
    async loadProfile() {
      try {
        const { data } = await api.get('/candidates/me')
        this.profile = data
        return true
      } catch (err) {
        if (err.response?.status === 404) {
          this.profile = null
          return false
        }
        throw err
      }
    },

    async saveProfile(payload) {
      this.loading = true
      try {
        const { data } = await api.post('/candidates', payload)
        this.profile = data
        return data
      } finally {
        this.loading = false
      }
    },

    async uploadResume(file) {
      this.loading = true
      try {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await api.post('/candidates/resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        // The backend already recorded the file on the candidate row, so
        // refresh the profile to pick up resumeFileName etc. for the UI.
        await this.loadProfile()
        return data
      } finally {
        this.loading = false
      }
    },

    // Fetches the saved resume as a blob. `view` = open inline in a tab,
    // `download` = save to disk; both use the same endpoint.
    async getResumeBlob() {
      const { data, headers } = await api.get('/candidates/resume', { responseType: 'blob' })
      const filename = (headers['content-disposition'] || '').match(/filename="?([^"]+)"?/i)?.[1] || 'resume'
      return { blob: data, filename }
    },

    async loadMatches() {
      const { data } = await api.get('/candidates/me/matches')
      this.matches = data
    },
    async loadKeywordSuggestions(jobId) {
      const { data } = await api.get(`/candidates/me/keyword-suggestions/${jobId}`)
      return data
    },
    async apply(jobId) {
      await api.post('/applications', { jobRequisitionId: jobId })
      await this.loadApplications()
    },
    async loadApplications() {
      const { data } = await api.get('/applications/me')
      this.applications = data
    }
  }
})
