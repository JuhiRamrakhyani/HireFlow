<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Candidate pool</h1>
        <div class="page-sub">Everyone who has built a profile and applied — search by name or skill</div>
      </div>
      <input v-model="query" class="search-input" placeholder="Search name, skill, location…" />
    </div>

    <div class="cand-grid">
      <div v-for="(c, idx) in filteredCandidates" :key="c.id" class="card cand-card lift" :style="{ '--delay': `${idx * 50}ms` }">
        <div class="cand-top">
          <div class="avatar-circle" :style="{ background: avatarGradient(idx) }">{{ initials(c.name) }}</div>
          <div class="cand-meta">
            <div class="cand-name">{{ c.name }}</div>
            <div class="cand-role">{{ c.location || '—' }} · {{ c.experienceYears }} yrs exp</div>
          </div>
          <span v-if="c.hiredCount > 0" class="statuspill hired">Hired ×{{ c.hiredCount }}</span>
        </div>

        <div class="cand-stats">
          <div class="stat">
            <div class="stat-n">{{ c.applicationCount }}</div>
            <div class="stat-l">Applications</div>
          </div>
          <div class="stat">
            <div class="stat-n">{{ Math.round(c.bestMatch || 0) }}%</div>
            <div class="stat-l">Best match</div>
          </div>
          <div class="stat">
            <div class="stat-n" :style="{ color: hasResume(c) ? 'var(--mint)' : 'var(--muted)' }">{{ hasResume(c) ? '✓' : '—' }}</div>
            <div class="stat-l">Resume</div>
          </div>
        </div>

        <div class="cand-skills">
          <span v-for="s in c.skills.slice(0, 5)" :key="s" class="tag">{{ s }}</span>
          <span v-if="c.skills.length > 5" class="tag muted-tag">+{{ c.skills.length - 5 }}</span>
          <span v-if="c.skills.length === 0" class="no-skills">No skills listed</span>
        </div>

        <div v-if="c.referralCode" class="ref-code">Referral code: <b>{{ c.referralCode }}</b></div>
      </div>
      <div v-if="filteredCandidates.length === 0" class="empty-card card">
        <div class="empty-title">{{ poolStore.candidates.length ? 'No candidates match your search' : 'No candidates yet' }}</div>
        <div class="empty-sub">Candidates appear here once they build a profile in their portal.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCandidatePoolStore } from '../../store/candidatePool'

const poolStore = useCandidatePoolStore()
const query = ref('')

const filteredCandidates = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return poolStore.candidates
  return poolStore.candidates.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.location || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    c.skills.some(s => s.toLowerCase().includes(q))
  )
})

const GRADIENTS = ['var(--grad-coral)', 'var(--grad-teal)', 'var(--grad-violet)', 'var(--grad-sky)', 'var(--grad-amber)']

function avatarGradient(idx) {
  return GRADIENTS[idx % GRADIENTS.length]
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function hasResume(c) {
  return c.hasResume
}

onMounted(() => poolStore.loadPool())
</script>

<style scoped>
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px;flex-wrap:wrap;}
.page-head h1{font-family:var(--disp);font-size:26px;letter-spacing:-0.02em;}
.page-sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.search-input{width:260px;flex-shrink:0;}
.cand-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px;}
.cand-card{padding:20px;animation:rise-in .4s var(--ease-out) both;animation-delay:var(--delay);}
.cand-top{display:flex;align-items:center;gap:12px;}
.cand-meta{min-width:0;flex:1;}
.cand-name{font-weight:700;font-size:14.5px;}
.cand-role{font-size:12px;color:var(--muted);margin-top:2px;}
.cand-stats{display:flex;gap:10px;margin-top:16px;}
.stat{background:var(--paper);border:1px solid var(--border);border-radius:10px;padding:9px 10px;flex:1;text-align:center;}
.stat-n{font-family:var(--disp);font-weight:700;font-size:17px;color:var(--teal);}
.stat-l{font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.03em;}
.cand-skills{margin-top:14px;}
.muted-tag{background:var(--border);color:var(--muted);}
.no-skills{font-size:12px;color:var(--muted);}
.ref-code{margin-top:12px;font-size:12px;color:var(--muted);background:var(--violet-dim);border-radius:8px;padding:7px 10px;color:var(--violet);}
.empty-card{text-align:center;padding:40px;grid-column:1/-1;}
.empty-title{font-family:var(--disp);font-weight:600;font-size:16px;}
.empty-sub{font-size:13px;color:var(--muted);margin-top:6px;}
</style>
