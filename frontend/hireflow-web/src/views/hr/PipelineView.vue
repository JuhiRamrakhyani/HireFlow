<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Pipeline</h1>
        <div class="page-sub">Review ranked candidates and move them through the hiring stages</div>
      </div>
    </div>

    <div class="job-chips">
      <button
        v-for="j in jobStore.jobs" :key="j.id"
        class="jobchip lift" :class="{ active: selectedJobId === j.id }"
        @click="selectJob(j.id)"
      >
        <div class="chip-title">{{ j.title }}</div>
        <div class="chip-sub">
          <span class="statuspill" :class="j.status.toLowerCase()">{{ j.status }}</span>
          <span>{{ j.applicantCount }} applicants</span>
        </div>
      </button>
      <div v-if="jobStore.jobs.length === 0" class="empty">No vacancies yet — create one under the Vacancies page.</div>
    </div>

    <template v-if="selectedJobId">
      <div class="selected-head">
        <div class="job-inline">
          <span class="pulse-dot"></span>
          <div>
            <div class="sel-title">{{ selectedJobTitle }}</div>
            <div class="sel-sub">{{ selectedJobMeta }}</div>
          </div>
        </div>
      </div>

      <CandidateRankTable
        :job-title="selectedJobTitle"
        :candidates="activeCandidates"
        @stage-changed="loadPipelineData"
        @review="openReview"
      />
      <PipelineBoard
        :candidates="activeCandidates"
        @stage-changed="loadPipelineData"
        @review="openReview"
      />

      <!-- Rejected applicants aren't deleted - they stay here as a backup so
           HR can review why someone was passed on, and pull them back into
           the active pipeline later if the decision changes. -->
      <div v-if="rejectedCandidates.length" class="rejected-block">
        <div class="sechead">
          <div>
            <h2>Rejected applicants</h2>
            <div class="sub">Kept for reference · not shown in the ranked list above</div>
          </div>
          <button class="btn btn-ghost" @click="showRejected = !showRejected">
            {{ showRejected ? 'Hide' : `Show (${rejectedCandidates.length})` }}
          </button>
        </div>
        <div v-if="showRejected" class="card rejectedlist lift" style="padding:10px 24px;margin-bottom:34px;">
          <div v-for="c in rejectedCandidates" :key="c.applicationId" class="rejrow" @click="openReview(c.applicationId)">
            <div>
              <div class="cand-name">{{ c.name }}</div>
              <div class="cand-role">{{ c.location || '—' }} · {{ Math.round(c.matchScorePercent) }}% match</div>
            </div>
            <button class="btn btn-ghost" @click.stop="openReview(c.applicationId)">Review</button>
          </div>
        </div>
      </div>
    </template>

    <Transition name="modal">
      <ApplicationDetailModal
        v-if="reviewingApplicationId"
        :application-id="reviewingApplicationId"
        @close="reviewingApplicationId = null"
        @changed="loadPipelineData"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useJobStore } from '../../store/job'
import { usePipelineStore } from '../../store/pipeline'
import CandidateRankTable from '../../components/CandidateRankTable.vue'
import PipelineBoard from '../../components/PipelineBoard.vue'
import ApplicationDetailModal from '../../components/ApplicationDetailModal.vue'

const route = useRoute()
const jobStore = useJobStore()
const pipelineStore = usePipelineStore()

const selectedJobId = ref(null)
const reviewingApplicationId = ref(null)
const showRejected = ref(false)

const selectedJobTitle = computed(() =>
  jobStore.jobs.find(j => j.id === selectedJobId.value)?.title || ''
)

const selectedJobMeta = computed(() => {
  const job = jobStore.jobs.find(j => j.id === selectedJobId.value)
  if (!job) return ''
  return [job.department, job.location].filter(Boolean).join(' · ')
})

const activeCandidates = computed(() =>
  pipelineStore.rankedCandidates.filter(c => c.stage !== 'Rejected')
)
const rejectedCandidates = computed(() =>
  pipelineStore.rankedCandidates.filter(c => c.stage === 'Rejected')
)

function openReview(applicationId) {
  reviewingApplicationId.value = applicationId
}

async function selectJob(id) {
  selectedJobId.value = id
  showRejected.value = false
  await loadPipelineData()
}

async function loadPipelineData() {
  if (!selectedJobId.value) return
  await pipelineStore.loadRankedCandidates(selectedJobId.value)
}

onMounted(async () => {
  await jobStore.loadJobs()
  const requested = Number(route.query.job)
  const initial = jobStore.jobs.some(j => j.id === requested)
    ? requested
    : jobStore.jobs[0]?.id
  if (initial) await selectJob(initial)
})
</script>

<style scoped>
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.page-head h1{font-family:var(--disp);font-size:26px;letter-spacing:-0.02em;}
.page-sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.job-chips{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;margin-bottom:26px;}
.jobchip{
  min-width:190px;background:var(--card);border:1px solid var(--border);border-radius:12px;
  padding:13px 16px;text-align:left;cursor:pointer;transition:all .18s var(--ease-out);flex-shrink:0;
}
.jobchip:hover{border-color:#d8d2c4;}
.jobchip.active{border-color:var(--coral);background:linear-gradient(140deg,#fff,var(--coral-dim));box-shadow:0 8px 20px rgba(255,93,62,.18);}
.chip-title{font-weight:600;font-size:13.5px;margin-bottom:7px;}
.chip-sub{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);}
.selected-head{margin-bottom:20px;}
.job-inline{display:flex;align-items:center;gap:12px;}
.pulse-dot{width:9px;height:9px;border-radius:50%;background:var(--mint);animation:pulse-dot 1.6s ease-in-out infinite;flex-shrink:0;}
.sel-title{font-family:var(--disp);font-weight:600;font-size:16px;}
.sel-sub{font-size:12.5px;color:var(--muted);}
.rejected-block{margin-top:8px;}
.rejrow{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.rejrow:last-child{border-bottom:none;}
.cand-name{font-weight:600;font-size:13.5px;}
.cand-role{font-size:12px;color:var(--muted);margin-top:2px;}
</style>
