<template>
  <div>
    <div class="sechead">
      <div><h2>Your applications</h2><div class="sub">Live status of everything you've applied to</div></div>
    </div>
    <div class="card tracker-card">
      <div v-if="applications.length === 0" class="empty">
        You haven't applied to anything yet — apply to a matched opening above.
      </div>

      <div v-for="(a, idx) in applications" :key="a.applicationId" class="app-item" :class="{ open: openId === a.applicationId }" @click="toggle(a.applicationId)">
        <div class="app-row">
          <div class="app-main">
            <div class="jt">{{ a.jobTitle }}</div>
            <div class="jc">{{ a.department }} · Applied {{ timeAgo(a.appliedAt) }}</div>
          </div>
          <div class="app-right">
            <span v-if="a.feedback && !openId" class="feedback-dot" title="New feedback from HR"></span>
            <span class="stagepill" :class="stageClass(a.stage)">{{ stageLabel(a.stage) }}</span>
            <span class="chevron">▾</span>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="openId === a.applicationId" class="app-detail">
            <!-- Pipeline timeline -->
            <div class="timeline">
              <div v-for="(s, i) in stages" :key="s.key" class="tstep" :class="{ done: i < progressIndex(a), current: i === progressIndex(a) }">
                <div class="tline" v-if="i < stages.length - 1"></div>
                <div class="tdot">{{ i < progressIndex(a) ? '✓' : i + 1 }}</div>
                <div class="tlabel">{{ s.label }}</div>
              </div>
              <div v-if="a.stage === 'Rejected'" class="tstep rejected-tail">
                <div class="tline red"></div>
                <div class="tdot red">✕</div>
                <div class="tlabel red">Rejected</div>
              </div>
            </div>

            <!-- HR feedback -->
            <div v-if="a.feedback" class="feedback-bubble">
              <div class="fb-head"><span class="fb-avatar">HR</span> Feedback from HR</div>
              <p class="fb-text">{{ a.feedback }}</p>
            </div>
            <div v-else class="no-feedback">No feedback from HR yet — keep an eye on this space.</div>

            <div class="updated-note">Last updated {{ timeAgo(a.stageUpdatedAt) }}</div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ applications: { type: Array, default: () => [] } })

const stages = [
  { key: 'Applied', label: 'Applied' },
  { key: 'Screened', label: 'Screened' },
  { key: 'Interview', label: 'Interview' },
  { key: 'Offer', label: 'Offer' },
  { key: 'Hired', label: 'Hired' }
]

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

function progressIndex(a) {
  const idx = stages.findIndex(s => s.key === a.stage)
  return idx >= 0 ? idx : 0
}

function stageClass(stage) {
  const map = { Applied: 'screened', Screened: 'screened', Interview: 'interview', Offer: 'offer', Hired: 'offer', Rejected: 'rejected' }
  return map[stage] || 'screened'
}

function stageLabel(stage) {
  const map = { Applied: 'Applied', Screened: 'Screening', Interview: 'Interview scheduled', Offer: 'Offer extended', Hired: 'Hired', Rejected: 'Not moving forward' }
  return map[stage] || stage
}

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}
</script>

<style scoped>
.empty{font-size:13.5px;color:var(--muted);padding:8px 4px;}
.app-item{border-bottom:1px solid var(--border);cursor:pointer;transition:background .2s;}
.app-item:last-child{border-bottom:none;}
.app-item:hover{background:var(--paper);}
.app-item.open{background:var(--paper);}
.app-row{display:flex;justify-content:space-between;align-items:center;padding:15px 18px;}
.app-main .jt{font-weight:600;font-size:14px;}
.app-main .jc{font-size:12px;color:var(--muted);margin-top:2px;}
.app-right{display:flex;align-items:center;gap:10px;position:relative;}
.feedback-dot{width:9px;height:9px;border-radius:50%;background:var(--coral);box-shadow:0 0 0 0 var(--coral);animation:pulse 1.6s infinite;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,93,62,.5)}70%{box-shadow:0 0 0 7px rgba(255,93,62,0)}100%{box-shadow:0 0 0 0 rgba(255,93,62,0)}}
.chevron{color:var(--muted);font-size:12px;transition:transform .25s var(--ease-out);}
.app-item.open .chevron{transform:rotate(180deg);}
.stagepill{font-size:11.5px;font-weight:600;padding:5px 12px;border-radius:999px;}
.stagepill.screened{background:var(--amber-dim);color:var(--amber);}
.stagepill.interview{background:var(--teal-dim);color:var(--teal);}
.stagepill.offer{background:var(--mint-dim);color:var(--mint);}
.stagepill.rejected{background:var(--coral-dim);color:var(--coral);}

.app-detail{padding:6px 18px 20px;animation:rise-in .3s var(--ease-out) both;}

.timeline{display:flex;align-items:flex-start;padding:14px 4px 6px;overflow-x:auto;}
.tstep{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;min-width:74px;}
.tdot{
  width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:11.5px;font-weight:600;border:2px solid var(--border);
  color:var(--muted);background:var(--card);z-index:1;transition:all .3s;
}
.tstep.done .tdot{background:var(--teal);border-color:var(--teal);color:#fff;}
.tstep.current .tdot{background:var(--coral);border-color:var(--coral);color:#fff;box-shadow:0 0 0 5px var(--coral-dim);animation:pop-in .3s var(--ease-pop) both;}
.tlabel{font-size:10.5px;color:var(--muted);margin-top:7px;font-weight:600;}
.tstep.done .tlabel{color:var(--teal);}
.tstep.current .tlabel{color:var(--coral);}
.tline{position:absolute;top:15px;left:30px;right:-8px;height:2px;background:var(--border);}
.tstep.done .tline{background:var(--teal);}
.tdot.red{background:var(--coral);border-color:var(--coral);color:#fff;}
.tlabel.red{color:var(--coral);}
.tline.red{background:var(--coral);}

.feedback-bubble{
  margin-top:18px;background:var(--teal-dim);border:1px solid #cfe7e4;border-radius:12px;padding:14px 16px;
  animation:pop-in .35s var(--ease-pop) both;
}
.fb-head{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.03em;}
.fb-avatar{width:24px;height:24px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;}
.fb-text{font-size:13.5px;line-height:1.55;margin-top:8px;color:var(--ink);}
.no-feedback{font-size:12.5px;color:var(--muted);margin-top:16px;padding:10px 12px;background:var(--paper);border:1px dashed var(--border);border-radius:10px;}
.updated-note{font-size:11px;color:var(--muted);margin-top:12px;text-align:right;}

.expand-enter-active,.expand-leave-active{transition:opacity .25s var(--ease-out),transform .25s var(--ease-out);overflow:hidden;}
.expand-enter-from{opacity:0;transform:translateY(-6px);}
.expand-leave-to{opacity:0;transform:translateY(-6px);}
</style>
