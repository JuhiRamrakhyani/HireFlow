import { defineStore } from 'pinia'
import api from '../api/client'

export const useReferralStore = defineStore('referral', {
  state: () => ({
    hrReferrals: [],
    statusCounts: { total: 0, pending: 0, contacted: 0, interview: 0, hired: 0, rejected: 0 },
    myReferrals: [],
    loading: false
  }),
  actions: {
    async loadHrReferrals() {
      this.loading = true
      try {
        const { data } = await api.get('/referrals')
        this.hrReferrals = data.referrals
        this.statusCounts = data.statusCounts
      } finally {
        this.loading = false
      }
    },
    async loadMyReferrals() {
      const { data } = await api.get('/referrals/me')
      this.myReferrals = data
    },
    async createReferral(payload) {
      const { data } = await api.post('/referrals', payload)
      await this.loadMyReferrals()
      return data
    },
    async updateStatus(id, status) {
      await api.put(`/referrals/${id}/status`, { status })
      await this.loadHrReferrals()
    }
  }
})
