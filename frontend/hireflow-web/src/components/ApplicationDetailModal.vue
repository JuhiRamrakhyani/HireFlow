<template>
  <div class="overlay" @click.self="close">
    <div class="panel">
      <div v-if="pipelineStore.detailLoading && !detail" class="loading">Loading application…</div>

      <template v-else-if="detail">
        <div class="phead">
          <div>
            <div class="pname">{{ detail.candidate.name }}</div>
            <div class="prole">Applied for <strong>{{ detail.job.title }}</strong> · {{ detail.job.department }}</div>
          </div>
          <button class="closebtn" title="Close" @click="close">×</button>
        </div>

        <div class="pbody">
          <!-- Overall match + current stage -->
          <div class="summary-row">
            <div class="ring-big" :style="{ '--pct': ringPct }">
              <div class="ring-inner-big">{{ ringDisplay }}%</div>
            </div>
            <div class="summary-text">
              <div class="summary-label">Overall match score</div>
              <div class="summary-sub">
                {{ requiredMatchedCount }}/{{ requiredCount }} required skills matched
                <span v-if="detail.missingRequiredCount > 0" class="warn">
                  · {{ detail.missingRequiredCount }} required skill{{ detail.missingRequiredCount > 1 ? 's' : '' }} missing
                </span>
              </div>
              <span class="stagepill" :class="stageClass(detail.stage)" style="margin-top:8px;display:inline-block;">
                {{ detail.stage }}
              </span>
            </div>
          </div>

          <!-- Contact / profile -->
          <div class="section">
            <div class="section-title">Candidate profile</div>
            <div class="field-grid">
              <div class="field"><span class="k">Email</span><span class="v">{{ detail.candidate.email }}</span></div>
              <div class="field"><span class="k">Phone</span><span class="v">{{ detail.candidate.phone || '—' }}</span></div>
              <div class="field"><span class="k">Location</span><span class="v">{{ detail.candidate.location || '—' }}</span></div>
              <div class="field"><span class="k">Experience</span><span class="v">{{ detail.candidate.experienceYears }} yrs</span></div>
              <div class="field"><span class="k">Applied</span><span class="v">{{ formatDate(detail.appliedAt) }}</span></div>
              <div class="field"><span class="k">Last updated</span><span class="v">{{ formatDate(detail.stageUpdatedAt) }}</span></div>
            </div>
          </div>

          <!-- The actual basis for the match score -->
          <div class="section">
            <div class="section-title">Match breakdown — why this score</div>
            <div class="sub-note">Required skills count double toward the score; optional skills count once.</div>
            <table class="breakdown-table">
              <thead>
                <tr><th>Skill</th><th>Type</th><th>Weight</th><th>On resume?</th></tr>
              </thead>
              <tbody>
                <tr v-for="s in detail.skillBreakdown" :key="s.skillName" :class="{ miss: !s.matched && s.isRequired }">
                  <td>{{ s.skillName }}</td>
                  <td><span class="reqpill" :class="{ optional: !s.isRequired }">{{ s.isRequired ? 'Required' : 'Optional' }}</span></td>
                  <td class="mono">×{{ s.weight }}</td>
                  <td>
                    <span v-if="s.matched" class="matchyes">✓ Matched</span>
                    <span v-else class="matchno">✕ Missing</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <template v-if="detail.extraCandidateSkills.length">
              <div class="sub-note" style="margin-top:14px;">Other skills on the candidate's profile (not requested for this role)</div>
              <div>
                <span v-for="s in detail.extraCandidateSkills" :key="s" class="tag">{{ s }}</span>
              </div>
            </template>
          </div>

          <!-- Resume -->
          <div class="section">
            <div class="section-title">Resume</div>
            <div v-if="detail.candidate.resumeText" class="resume-box">{{ detail.candidate.resumeText }}</div>
            <div v-else class="sub-note">No resume text on file for this candidate.</div>
            <div v-if="detail.candidate.resumeFileName" style="margin-top:10px;">
              <button class="btn btn-ghost" :disabled="resumeBusy" @click="downloadResume">
                {{ resumeBusy ? 'Preparing…' : 'Download resume file' }}
              </button>
              <span class="file-name">{{ detail.candidate.resumeFileName }}</span>
            </div>
          </div>

          <!-- HR notes -->
          <div class="section">
            <div class="section-title">HR notes</div>
            <textarea v-model="notesDraft" rows="3" placeholder="Notes visible only to HR — reasoning, interview feedback, etc."></textarea>
            <button class="btn btn-ghost" style="margin-top:8px;" :disabled="saving" @click="saveNotes">
              {{ saving ? 'Saving…' : 'Save notes' }}
            </button>
          </div>

          <!-- Feedback to candidate -->
          <div class="section">
            <div class="section-title">Message to candidate</div>
            <p class="sub-note">
              Sent back to the candidate with each stage update — interview invites, next steps, rejection reasons.
              <span v-if="detail.feedback" class="sent-note">Last sent: “{{ detail.feedback }}”</span>
            </p>
            <textarea v-model="feedbackDraft" rows="3" placeholder="e.g. Thanks for applying! We'd love to schedule an interview — are you free this Thursday?"></textarea>
            <button class="btn btn-ghost" style="margin-top:8px;" :disabled="sendingFeedback || !feedbackDraft.trim()" @click="sendFeedback">
              {{ sendingFeedback ? 'Sending…' : 'Send to candidate' }}
            </button>
          </div>

          <!-- Decision -->
          <div class="section">
            <div class="section-title">Decision</div>
            <p v-if="detail.stage === 'Rejected'" class="rejected-note">
              This application was rejected. It's kept here for reference — pick a stage below to bring the candidate back into the pipeline.
            </p>
            <div class="stage-row">
              <button
                v-for="s in STAGE_ORDER" :key="s" class="stagebtn"
                :class="{ active: detail.stage === s }" :disabled="deciding"
                @click="setStage(s)"
              >{{ s }}</button>
            </div>
            <div class="decision-actions">
              <button
                v-if="detail.stage === 'Rejected'" class="btn btn-primary" :disabled="deciding"
                @click="setStage('Applied')"
              >{{ deciding ? 'Restoring…' : 'Un-reject — restore to pipeline' }}</button>
              <button
                v-else-if="nextStage" class="btn btn-primary" :disabled="deciding"
                @click="setStage(nextStage)"
              >{{ deciding ? 'Updating…' : `Accept — move to ${nextStage}` }}</button>
              <button
                class="btn btn-reject" :disabled="deciding || detail.stage === 'Rejected'"
                @click="setStage('Rejected')"
              >{{ detail.stage === 'Rejected' ? 'Rejected' : 'Reject application' }}</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { usePipelineStore } from '../store/pipeline'
import { useToastStore } from '../store/toast'

const props = defineProps({
  applicationId: { type: [Number, String], required: true }
})
const emit = defineEmits(['close', 'changed'])

const pipelineStore = usePipelineStore()
const toast = useToastStore()
const STAGE_ORDER = ['Applied', 'Screened', 'Interview', 'Offer', 'Hired']

const notesDraft = ref('')
const feedbackDraft = ref('')
const saving = ref(false)
const deciding = ref(false)
const sendingFeedback = ref(false)
const resumeBusy = ref(false)

// Animated match-score ring values, driven by rAF once the detail loads.
const ringPct = ref(0)
const ringDisplay = ref(0)
let ringRaf = null

const detail = computed(() => pipelineStore.activeDetail)

const requiredCount = computed(() =>
  detail.value ? detail.value.skillBreakdown.filter(s => s.isRequired).length : 0
)
const requiredMatchedCount = computed(() =>
  detail.value ? detail.value.skillBreakdown.filter(s => s.isRequired && s.matched).length : 0
)
const nextStage = computed(() => {
  if (!detail.value) return null
  const idx = STAGE_ORDER.indexOf(detail.value.stage)
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null
})

function stageClass(stage) {
  const map = { Applied: 'screened', Screened: 'screened', Interview: 'interview', Offer: 'offer', Hired: 'offer', Rejected: 'rejected' }
  return map[stage] || 'screened'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso.replace(' ', 'T') + 'Z').toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short'
  })
}

function animateRing() {
  if (ringRaf) cancelAnimationFrame(ringRaf)
  const start = performance.now()
  const to = Math.max(0, Math.min(100, detail.value?.matchScorePercent || 0))
  const dur = 1000
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    ringDisplay.value = Math.round(to * eased)
    ringPct.value = to * eased
    if (t < 1) ringRaf = requestAnimationFrame(tick)
  }
  ringRaf = requestAnimationFrame(tick)
}

async function load() {
  const data = await pipelineStore.loadApplicationDetail(props.applicationId)
  notesDraft.value = data.hrNotes || ''
  feedbackDraft.value = ''
  animateRing()
}

watch(() => props.applicationId, load, { immediate: true })
onUnmounted(() => { if (ringRaf) cancelAnimationFrame(ringRaf) })

async function downloadResume() {
  resumeBusy.value = true
  try {
    const { data, headers } = await pipelineStore.getResumeBlob(detail.value.applicationId)
    const filename = (headers['content-disposition'] || '').match(/filename="?([^"]+)"?/i)?.[1] || 'resume'
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Resume downloaded')
  } catch {
    toast.error('No resume on file for this candidate')
  } finally {
    resumeBusy.value = false
  }
}

async function sendFeedback() {
  sendingFeedback.value = true
  try {
    await pipelineStore.updateStage(detail.value.applicationId, detail.value.stage, undefined, feedbackDraft.value.trim())
    toast.success('Feedback sent to candidate')
    emit('changed')
  } catch {
    toast.error('Could not send feedback')
  } finally {
    sendingFeedback.value = false
  }
}

async function saveNotes() {
  saving.value = true
  try {
    await pipelineStore.updateStage(detail.value.applicationId, detail.value.stage, notesDraft.value)
    emit('changed')
    toast.success('Notes saved')
  } finally {
    saving.value = false
  }
}

async function setStage(stage) {
  deciding.value = true
  try {
    // Send the candidate-facing message along with the stage change when one
    // is drafted - only include feedback if it's non-empty so an existing
    // message isn't wiped by a plain stage advance.
    const feedback = feedbackDraft.value.trim() || undefined
    await pipelineStore.updateStage(detail.value.applicationId, stage, notesDraft.value, feedback)
    emit('changed')
    toast.success(stage === 'Rejected' ? 'Application rejected' : `Moved to ${stage}`)
  } catch {
    toast.error('Could not update the stage')
  } finally {
    deciding.value = false
  }
}

function close() {
  pipelineStore.clearActiveDetail()
  emit('close')
}
</script>

<style scoped>
.overlay{
  position:fixed;inset:0;background:rgba(20,22,31,0.5);display:flex;align-items:flex-start;
  justify-content:center;padding:40px 20px;overflow-y:auto;z-index:50;
}
.panel{background:var(--card);border-radius:var(--radius);width:100%;max-width:640px;max-height:calc(100vh - 80px);overflow-y:auto;}
.loading{padding:60px;text-align:center;color:var(--muted);font-size:13.5px;}
.phead{
  display:flex;justify-content:space-between;align-items:flex-start;padding:24px 24px 18px;
  border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--card);border-radius:var(--radius) var(--radius) 0 0;
}
.pname{font-family:var(--disp);font-weight:700;font-size:20px;}
.prole{font-size:13px;color:var(--muted);margin-top:4px;}
.closebtn{
  width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:none;
  font-size:18px;line-height:1;cursor:pointer;color:var(--muted);
}
.closebtn:hover{border-color:var(--ink);color:var(--ink);}
.pbody{padding:22px 24px 28px;}

.summary-row{display:flex;align-items:center;gap:18px;padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid var(--border);}
.ring-big{
  --pct:0;width:76px;height:76px;border-radius:50%;flex-shrink:0;
  background:conic-gradient(var(--mint) calc(var(--pct)*1%), var(--border) 0);
  display:flex;align-items:center;justify-content:center;
}
.ring-inner-big{
  width:60px;height:60px;border-radius:50%;background:var(--card);display:flex;align-items:center;
  justify-content:center;font-family:var(--mono);font-weight:700;font-size:15px;
}
.summary-label{font-size:12.5px;color:var(--muted);font-weight:600;}
.summary-sub{font-size:13px;margin-top:3px;}
.warn{color:var(--coral);font-weight:600;}

.section{margin-bottom:22px;}
.section-title{font-family:var(--disp);font-weight:600;font-size:14.5px;margin-bottom:8px;}
.sub-note{font-size:12px;color:var(--muted);margin-bottom:10px;}

.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
.field{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;}
.field:nth-last-child(-n+2){border-bottom:none;}
.field .k{color:var(--muted);}
.field .v{font-weight:600;text-align:right;}

.breakdown-table{width:100%;border-collapse:collapse;}
.breakdown-table th{
  text-align:left;font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;
  letter-spacing:.03em;padding:0 10px 8px;border-bottom:1px solid var(--border);
}
.breakdown-table td{padding:9px 10px;border-bottom:1px solid var(--border);font-size:13px;}
.breakdown-table tr:last-child td{border-bottom:none;}
.breakdown-table tr.miss{background:var(--coral-dim);}
.mono{font-family:var(--mono);font-size:12px;}
.reqpill{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--teal-dim);color:var(--teal);}
.reqpill.optional{background:var(--border);color:var(--muted);}
.matchyes{color:var(--mint);font-weight:600;font-size:12.5px;}
.matchno{color:var(--coral);font-weight:600;font-size:12.5px;}

.resume-box{
  white-space:pre-wrap;font-size:12.5px;line-height:1.6;background:var(--paper);border:1px solid var(--border);
  border-radius:10px;padding:14px;max-height:220px;overflow-y:auto;font-family:var(--mono);
}
.file-name{font-size:12px;color:var(--muted);margin-left:10px;}
.sent-note{display:block;margin-top:6px;color:var(--teal);font-weight:600;}

.stage-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
.rejected-note{font-size:12.5px;color:var(--coral);background:var(--coral-dim);border-radius:8px;padding:10px 12px;margin-bottom:12px;}
.stagebtn{
  padding:7px 14px;border-radius:999px;border:1px solid var(--border);background:none;font-size:12.5px;
  font-weight:600;cursor:pointer;color:var(--muted);font-family:var(--body);
}
.stagebtn.active{background:var(--ink);color:#fff;border-color:var(--ink);}
.stagebtn:disabled{opacity:.5;cursor:not-allowed;}
.decision-actions{display:flex;gap:10px;}
.decision-actions .btn{flex:1;}
.btn-reject{background:var(--coral-dim);color:var(--coral);}

.stagepill{font-size:11.5px;font-weight:600;padding:5px 12px;border-radius:999px;}
.stagepill.screened{background:var(--amber-dim);color:var(--amber);}
.stagepill.interview{background:var(--teal-dim);color:var(--teal);}
.stagepill.offer{background:var(--mint-dim);color:var(--mint);}
.stagepill.rejected{background:var(--coral-dim);color:var(--coral);}
</style>
