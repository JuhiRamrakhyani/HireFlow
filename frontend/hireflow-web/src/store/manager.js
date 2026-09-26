import { defineStore } from 'pinia'
import api from '../api/client'

export const useManagerStore = defineStore('manager', {
  state: () => ({
    managers: [],
    loading: false
  }),
  actions: {
    async loadManagers() {
      this.loading = true
      try {
        const { data } = await api.get('/managers')
        this.managers = data
      } finally {
        this.loading = false
      }
    },
    async createManager(payload) {
      const { data } = await api.post('/managers', payload)
      await this.loadManagers()
      return data
    },
    async updateManager(id, payload) {
      const { data } = await api.put(`/managers/${id}`, payload)
      await this.loadManagers()
      return data
    },
    async deleteManager(id) {
      await api.delete(`/managers/${id}`)
      await this.loadManagers()
    }
  }
})
