import { defineStore } from 'pinia'
import api from '../api/client'

export const useCandidatePoolStore = defineStore('candidatePool', {
  state: () => ({
    candidates: [],
    loading: false
  }),
  actions: {
    async loadPool() {
      this.loading = true
      try {
        const { data } = await api.get('/candidates/pool')
        this.candidates = data
      } finally {
        this.loading = false
      }
    }
  }
})
