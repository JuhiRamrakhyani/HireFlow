import { defineStore } from 'pinia'
import api from '../api/client'

export const usePipelineStore = defineStore('pipeline', {
  state: () => ({
    kpis: null,
    rankedCandidates: [],
    loading: false,
    // Full single-application view (candidate profile + skill-match
    // breakdown) shown in the HR review modal - kept separate from
    // rankedCandidates since it carries a lot more data than the table row.
    activeDetail: null,
    detailLoading: false
  }),
  actions: {
    async loadKpis() {
      const { data } = await api.get('/applications/kpis')
      this.kpis = data
    },
    async loadRankedCandidates(jobId) {
      this.loading = true
      try {
        const { data } = await api.get(`/applications/job/${jobId}`)
        this.rankedCandidates = data
      } finally {
        this.loading = false
      }
    },
    async loadApplicationDetail(applicationId) {
      this.detailLoading = true
      try {
        const { data } = await api.get(`/applications/${applicationId}`)
        this.activeDetail = data
        return data
      } finally {
        this.detailLoading = false
      }
    },
    clearActiveDetail() {
      this.activeDetail = null
    },
    // Downloads an applicant's saved resume file (HR-side). The backend
    // serves it from the application's candidate row.
    async getResumeBlob(applicationId) {
      const { data, headers } = await api.get(`/applications/${applicationId}/resume`, { responseType: 'blob' })
      return { data, headers }
    },
    // hrNotes is only included in the request when the caller actually
    // passes one - the backend treats an explicit `null` as "clear the
    // notes", so a plain stage advance (no hrNotes argument) must omit the
    // key entirely or it would silently wipe out any note HR already left.
    // Same rule applies to `feedback` (the message sent to the candidate).
    async updateStage(applicationId, stage, hrNotes, feedback) {
      const payload = { stage }
      if (hrNotes !== undefined) payload.hrNotes = hrNotes
      if (feedback !== undefined) payload.feedback = feedback
      await api.put(`/applications/${applicationId}/stage`, payload)
      if (this.activeDetail?.applicationId === applicationId) {
        await this.loadApplicationDetail(applicationId)
      }
    }
  }
})
