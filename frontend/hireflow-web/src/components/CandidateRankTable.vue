<template>
  <div>
    <div class="sechead">
      <div><h2>{{ jobTitle }}</h2><div class="sub">Ranked candidates for this requisition · {{ candidates.length }} applicants</div></div>
    </div>
    <div class="card" style="margin-bottom:34px;padding:10px 24px;">
      <table class="table">
        <thead>
          <tr><th>Candidate</th><th>Experience</th><th>Match</th><th>Stage</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="c in candidates" :key="c.applicationId" class="clickable-row" @click="$emit('review', c.applicationId)">
            <td>
              <div class="cand-name">{{ c.name }}</div>
              <div class="cand-role">{{ c.location || '—' }}</div>
            </td>
            <td>{{ c.experienceYears }} yrs</td>
            <td>
              <div class="scorebar-wrap">
                <div class="scorebar"><div class="scorebar-fill" :style="{ width: c.matchScorePercent + '%' }"></div></div>
                <span class="scoreval">{{ Math.round(c.matchScorePercent) }}%</span>
              </div>
            </td>
            <td><span class="stagepill" :class="stageClass(c.stage)">{{ c.stage }}</span></td>
            <td>
              <div class="rowactions">
                <button class="btn btn-ghost reviewbtn" @click.stop="$emit('review', c.applicationId)">Review</button>
                <div class="iconbtn" title="Advance" @click.stop="advance(c)">✓</div>
                <div class="iconbtn" title="Reject" @click.stop="reject(c)">✕</div>
              </div>
            </td>
          </tr>
          <tr v-if="candidates.length === 0"><td colspan="5" class="empty">No applicants yet for this role.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { usePipelineStore } from '../store/pipeline'

const props = defineProps({
  jobTitle: { type: String, default: '' },
  candidates: { type: Array, default: () => [] }
})
const emit = defineEmits(['stage-changed', 'review'])
const pipelineStore = usePipelineStore()

const STAGE_ORDER = ['Applied', 'Screened', 'Interview', 'Offer', 'Hired']

function stageClass(stage) {
  const map = { Applied: 'screened', Screened: 'screened', Interview: 'interview', Offer: 'offer', Hired: 'offer', Rejected: 'rejected' }
  return map[stage] || 'screened'
}

async function advance(c) {
  const idx = STAGE_ORDER.indexOf(c.stage)
  const next = idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : c.stage
  await pipelineStore.updateStage(c.applicationId, next)
  emit('stage-changed')
}

async function reject(c) {
  await pipelineStore.updateStage(c.applicationId, 'Rejected')
  emit('stage-changed')
}
</script>

<style scoped>
.table{width:100%;border-collapse:collapse;}
.table th{text-align:left;font-size:11.5px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.03em;padding:0 14px 12px;border-bottom:1px solid var(--border);}
.table td{padding:14px 14px;border-bottom:1px solid var(--border);font-size:13.5px;vertical-align:middle;}
.table tr:last-child td{border-bottom:none;}
.cand-name{font-weight:600;}
.cand-role{font-size:12px;color:var(--muted);}
.scorebar-wrap{display:flex;align-items:center;gap:8px;}
.scorebar{width:70px;height:6px;border-radius:3px;background:var(--border);overflow:hidden;}
.scorebar-fill{height:100%;background:var(--mint);}
.scoreval{font-family:var(--mono);font-size:12px;font-weight:600;width:32px;}
.clickable-row{cursor:pointer;transition:background .15s,transform .15s;}
.clickable-row:hover{background:var(--paper);}
.clickable-row td:first-child{border-radius:10px 0 0 10px;}
.clickable-row td:last-child{border-radius:0 10px 10px 0;}
.rowactions{display:flex;gap:6px;align-items:center;}
.reviewbtn{padding:6px 12px;font-size:12px;}
.iconbtn{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;}
.iconbtn:hover{border-color:var(--ink);}
.stagepill{font-size:11.5px;font-weight:600;padding:5px 12px;border-radius:999px;}
.stagepill.screened{background:var(--amber-dim);color:var(--amber);}
.stagepill.interview{background:var(--teal-dim);color:var(--teal);}
.stagepill.offer{background:var(--mint-dim);color:var(--mint);}
.stagepill.rejected{background:var(--coral-dim);color:var(--coral);}
.empty{color:var(--muted);text-align:center;padding:20px !important;}
</style>
