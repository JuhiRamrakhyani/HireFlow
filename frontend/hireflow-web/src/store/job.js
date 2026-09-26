import { defineStore } from 'pinia'
import api from '../api/client'

export const useJobStore = defineStore('job', {
  state: () => ({
    jobs: [],
    activeJob: null,
    loading: false
  }),
  actions: {
    async loadJobs() {
      this.loading = true
      try {
        const { data } = await api.get('/jobs')
        this.jobs = data
      } finally {
        this.loading = false
      }
    },
    async loadJob(id) {
      const { data } = await api.get(`/jobs/${id}`)
      this.activeJob = data
      return data
    },
    async createJob(payload) {
      const { data } = await api.post('/jobs', payload)
      await this.loadJobs()
      return data
    },
    async bulkCreateJobs(vacancies) {
      const { data } = await api.post('/jobs/bulk', { vacancies })
      await this.loadJobs()
      return data
    },
    async updateJob(id, payload) {
      const { data } = await api.put(`/jobs/${id}`, payload)
      await this.loadJobs()
      return data
    }
  }
})
