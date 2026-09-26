<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Recruiting overview</h1>
        <div class="page-sub">Everything that needs your attention right now</div>
      </div>
    </div>

    <KpiDashboard :kpis="pipelineStore.kpis" />

    <div class="dash-grid">
      <div class="card lift panel" style="grid-column: span 2;" v-tilt>
        <div class="panel-head">
          <div>
            <h3>Open vacancies</h3>
            <div class="sub">Latest requisitions awaiting candidates</div>
          </div>
          <router-link to="/hr/vacancies" class="btn btn-ghost small">Manage →</router-link>
        </div>
        <div v-for="(j, i) in recentJobs" :key="j.id" class="job-line" @click="goPipeline(j.id)" :style="{ '--delay': `${i * 60}ms` }">
          <div class="jl-main">
            <span class="statuspill" :class="j.status.toLowerCase()">{{ j.status }}</span>
            <div>
              <div class="jl-title">{{ j.title }}</div>
              <div class="jl-sub">{{ j.department }} · {{ j.location }}</div>
            </div>
          </div>
          <div class="jl-right">
            <span class="jl-count">{{ j.applicantCount }}</span>
            <span class="jl-count-label">applicants</span>
          </div>
        </div>
        <div v-if="recentJobs.length === 0" class="empty">No vacancies yet — create or bulk-import under Vacancies.</div>
      </div>

      <div class="panel-col">
        <div class="card lift panel gradient-violet" v-tilt>
          <div class="panel-head">
            <div>
              <h3 class="on-grad">Referrals</h3>
              <div class="sub on-grad-sub">Candidate-recommended talent</div>
            </div>
            <router-link to="/hr/referrals" class="btn small ghost-light">View →</router-link>
          </div>
          <div class="big-number">{{ referralStore.statusCounts.total }}</div>
          <div class="mini-stats">
            <span class="mini-pill">{{ referralStore.statusCounts.pending }} pending</span>
            <span class="mini-pill">{{ referralStore.statusCounts.hired }} hired</span>
          </div>
        </div>

        <div class="card lift panel gradient-coral" v-tilt>
          <div class="panel-head">
            <div>
              <h3 class="on-grad">Candidate pool</h3>
              <div class="sub on-grad-sub">Profiles in the system</div>
            </div>
            <router-link to="/hr/candidates" class="btn small ghost-light">View →</router-link>
          </div>
          <div class="big-number">{{ poolStore.candidates.length }}</div>
          <div class="mini-stats">
            <span class="mini-pill">{{ poolStore.candidates.filter(c => c.applicationCount > 0).length }} active applicants</span>
          </div>
        </div>

        <div class="card lift panel gradient-teal" v-tilt>
          <div class="panel-head">
            <div>
              <h3 class="on-grad">Hiring managers</h3>
              <div class="sub on-grad-sub">Requisition owners</div>
            </div>
            <router-link to="/hr/managers" class="btn small ghost-light">View →</router-link>
          </div>
          <div class="big-number">{{ managerStore.managers.filter(m => m.isActive).length }}</div>
          <div class="mini-stats">
            <span class="mini-pill">{{ managerStore.managers.filter(m => !m.isActive).length }} inactive</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJobStore } from '../../store/job'
import { usePipelineStore } from '../../store/pipeline'
import { useReferralStore } from '../../store/referral'
import { useCandidatePoolStore } from '../../store/candidatePool'
import { useManagerStore } from '../../store/manager'
import KpiDashboard from '../../components/KpiDashboard.vue'

const router = useRouter()
const jobStore = useJobStore()
const pipelineStore = usePipelineStore()
const referralStore = useReferralStore()
const poolStore = useCandidatePoolStore()
const managerStore = useManagerStore()

const recentJobs = computed(() => jobStore.jobs.slice(0, 5))

function goPipeline(jobId) {
  router.push({ path: '/hr/pipeline', query: { job: jobId } })
}

onMounted(async () => {
  await Promise.all([
    jobStore.loadJobs(),
    pipelineStore.loadKpis(),
    referralStore.loadHrReferrals(),
    poolStore.loadPool(),
    managerStore.loadManagers()
  ])
})
</script>

<style scoped>
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px;flex-wrap:wrap;}
.page-head h1{font-family:var(--disp);font-size:26px;letter-spacing:-0.02em;}
.page-sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:start;}
.panel-col{display:flex;flex-direction:column;gap:18px;}
.panel{padding:22px;}
.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:16px;}
.panel-head h3{font-family:var(--disp);font-weight:600;font-size:16px;}
.panel-head .sub{font-size:12.5px;color:var(--muted);margin-top:3px;}
.btn.small{padding:6px 12px;font-size:12px;}
.job-line{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 6px;border-bottom:1px solid var(--border);cursor:pointer;
  animation:rise-in .35s var(--ease-out) both;animation-delay:var(--delay);
  transition:background .15s,padding .15s;border-radius:8px;
}
.job-line:hover{background:var(--paper);padding-left:12px;}
.job-line:last-child{border-bottom:none;}
.jl-main{display:flex;align-items:center;gap:12px;min-width:0;}
.jl-title{font-weight:600;font-size:13.5px;}
.jl-sub{font-size:12px;color:var(--muted);margin-top:1px;}
.jl-right{display:flex;align-items:baseline;gap:6px;flex-shrink:0;}
.jl-count{font-family:var(--disp);font-weight:700;font-size:17px;color:var(--teal);}
.jl-count-label{font-size:11px;color:var(--muted);}
.gradient-violet{background:var(--grad-violet);color:#fff;}
.gradient-coral{background:var(--grad-coral);color:#fff;}
.gradient-teal{background:var(--grad-teal);color:#fff;}
.on-grad{color:#fff;}
.on-grad-sub{color:rgba(255,255,255,.85);}
.big-number{font-family:var(--disp);font-weight:700;font-size:42px;line-height:1;}
.mini-stats{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.mini-pill{background:rgba(255,255,255,.22);color:#fff;font-size:11.5px;font-weight:600;padding:5px 11px;border-radius:999px;}
.ghost-light{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.35);}
.ghost-light:hover{background:rgba(255,255,255,.28);}
@media(max-width:1000px){.dash-grid{grid-template-columns:1fr;}}
</style>
