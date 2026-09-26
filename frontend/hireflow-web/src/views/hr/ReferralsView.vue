<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Referrals</h1>
        <div class="page-sub">Candidates recommend talent — track every referral through to hire</div>
      </div>
    </div>

    <div class="ref-stats">
      <div v-for="s in statCards" :key="s.label" class="card ref-stat lift">
        <div class="ref-stat-value" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="ref-stat-label">{{ s.label }}</div>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="t in statusTabs" :key="t.value"
        class="tab-pill" :class="{ active: statusFilter === t.value }"
        @click="statusFilter = t.value"
      >
        <span class="dot" :style="{ background: t.color }"></span>
        {{ t.label }}
      </button>
    </div>

    <div class="card lift" style="padding:10px 24px;">
      <table class="table">
        <thead>
          <tr><th>Referred candidate</th><th>Referrer</th><th>Role</th><th>Note</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" class="clickable-row">
            <td>
              <div class="ref-name">
                <div class="avatar-circle" :style="{ background: avatarGradient(r.id) }">{{ initials(r.referredCandidate.name) }}</div>
                <div>
                  <div class="cand-name">{{ r.referredCandidate.name }}</div>
                  <div class="cand-role">{{ r.referredCandidate.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="ref-by">{{ r.referredBy.name }}</div>
              <div class="cand-role">{{ r.referredBy.email }}</div>
            </td>
            <td>{{ r.job?.title || '—' }}</td>
            <td class="note-cell">{{ r.note || '—' }}</td>
            <td>
              <select class="status-select" :class="r.status.toLowerCase()" :value="r.status" @change="changeStatus(r, $event.target.value)">
                <option v-for="s in REFERRAL_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </td>
            <td class="date-cell">{{ formatDate(r.createdAt) }}</td>
          </tr>
          <tr v-if="filtered.length === 0"><td colspan="6" class="empty">No referrals here yet.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReferralStore } from '../../store/referral'
import { useToastStore } from '../../store/toast'

const referralStore = useReferralStore()
const toast = useToastStore()

const REFERRAL_STATUSES = ['Pending', 'Contacted', 'Interview', 'Hired', 'Rejected']
const statusFilter = ref('All')

const statusTabs = [
  { value: 'All', label: 'All referrals', color: 'var(--ink)' },
  { value: 'Pending', label: 'Pending', color: 'var(--amber)' },
  { value: 'Contacted', label: 'Contacted', color: 'var(--sky)' },
  { value: 'Interview', label: 'Interview', color: 'var(--violet)' },
  { value: 'Hired', label: 'Hired', color: 'var(--mint)' },
  { value: 'Rejected', label: 'Rejected', color: 'var(--coral)' }
]

const statCards = computed(() => [
  { label: 'Total referrals', value: referralStore.statusCounts.total, color: 'var(--ink)' },
  { label: 'Pending', value: referralStore.statusCounts.pending, color: 'var(--amber)' },
  { label: 'In interview', value: referralStore.statusCounts.interview, color: 'var(--violet)' },
  { label: 'Hired', value: referralStore.statusCounts.hired, color: 'var(--mint)' }
])

const filtered = computed(() =>
  statusFilter.value === 'All'
    ? referralStore.hrReferrals
    : referralStore.hrReferrals.filter(r => r.status === statusFilter.value)
)

const GRADIENTS = ['var(--grad-coral)', 'var(--grad-teal)', 'var(--grad-violet)', 'var(--grad-sky)', 'var(--grad-amber)']

function avatarGradient(id) {
  return GRADIENTS[(id || 0) % GRADIENTS.length]
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

async function changeStatus(r, status) {
  await referralStore.updateStatus(r.id, status)
  toast.success(`${r.referredCandidate.name} → ${status}`)
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

onMounted(() => referralStore.loadHrReferrals())
</script>

<style scoped>
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.page-head h1{font-family:var(--disp);font-size:26px;letter-spacing:-0.02em;}
.page-sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.ref-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:26px;}
.ref-stat{padding:16px 18px;}
.ref-stat-value{font-family:var(--disp);font-weight:700;font-size:26px;}
.ref-stat-label{font-size:11.5px;color:var(--muted);margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
.table{width:100%;border-collapse:collapse;}
.table th{text-align:left;font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.03em;padding:0 12px 12px;border-bottom:1px solid var(--border);}
.table td{padding:14px 12px;border-bottom:1px solid var(--border);font-size:13px;vertical-align:middle;}
.table tr:last-child td{border-bottom:none;}
.clickable-row{transition:background .15s;}
.clickable-row:hover{background:var(--paper);}
.ref-name{display:flex;align-items:center;gap:10px;}
.ref-name .avatar-circle{width:32px;height:32px;font-size:11px;}
.cand-name{font-weight:600;font-size:13px;}
.ref-by{font-weight:600;font-size:12.5px;}
.cand-role{font-size:11.5px;color:var(--muted);}
.note-cell{color:var(--muted);font-size:12.5px;max-width:180px;}
.date-cell{font-family:var(--mono);font-size:12px;color:var(--muted);white-space:nowrap;}
.status-select{
  padding:6px 10px;border-radius:999px;border:none;font-size:12px;font-weight:600;cursor:pointer;width:auto;
  appearance:none;background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%236B6A63'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 9px center;padding-right:22px;
}
.status-select.pending{background-color:var(--amber-dim);color:var(--amber);}
.status-select.contacted{background-color:var(--sky-dim);color:var(--sky);}
.status-select.interview{background-color:var(--violet-dim);color:var(--violet);}
.status-select.hired{background-color:var(--mint-dim);color:var(--mint);}
.status-select.rejected{background-color:var(--coral-dim);color:var(--coral);}
@media(max-width:900px){.ref-stats{grid-template-columns:repeat(2,1fr);}}
@media(max-width:800px){.table{display:block;overflow-x:auto;}}
</style>
