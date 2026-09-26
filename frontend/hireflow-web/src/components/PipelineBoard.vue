<template>
  <div>
    <div class="sechead">
      <div><h2>Pipeline board</h2><div class="sub">Every candidate's screening stage for this role</div></div>
    </div>
    <div class="kanban">
      <div v-for="col in columns" :key="col.stage" class="kcol">
        <div class="kcol-head"><span class="t">{{ col.label }}</span><span class="n">{{ col.items.length }}</span></div>
        <div v-for="(c, i) in col.items" :key="c.applicationId" class="kcard" :style="{ '--delay': `${i * 70}ms` }" @click="$emit('review', c.applicationId)">
          <div class="n">{{ c.name }}</div>
          <div class="r">{{ c.location || '—' }}</div>
          <div class="meta">
            <span class="score">{{ Math.round(c.matchScorePercent) }}% match</span>
            <span class="days">{{ daysAgo(c.appliedAt) }}</span>
          </div>
        </div>
        <div v-if="col.items.length === 0" class="empty">Nobody here yet</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ candidates: { type: Array, default: () => [] } })
defineEmits(['review'])

const STAGES = [
  { stage: 'Screened', label: 'Screened' },
  { stage: 'Interview', label: 'Interview' },
  { stage: 'Offer', label: 'Offer' },
  { stage: 'Hired', label: 'Hired' }
]

const columns = computed(() =>
  STAGES.map(s => ({
    ...s,
    items: props.candidates.filter(c => c.stage === s.stage || (s.stage === 'Screened' && c.stage === 'Applied'))
  }))
)

function daysAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  return days <= 0 ? 'Today' : `${days}d`
}
</script>

<style scoped>
.kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.kcol{background:var(--paper);border-radius:var(--radius);padding:14px;border:1px solid var(--border);animation:rise-in .4s var(--ease-out) both;}
.kcol-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 4px;}
.kcol-head .t{font-weight:600;font-size:13px;}
.kcol-head .n{font-family:var(--mono);font-size:11.5px;color:var(--muted);background:var(--card);border:1px solid var(--border);padding:1px 8px;border-radius:999px;animation:pop-in .3s var(--ease-pop) both;}
.kcard{
  background:var(--card);border:1px solid var(--border);border-radius:10px;padding:13px;margin-bottom:10px;
  cursor:pointer;animation:rise-in .4s var(--ease-out) both;animation-delay:var(--delay);
  transition:transform .18s var(--ease-out),border-color .18s,box-shadow .18s;
}
.kcard:hover{border-color:var(--ink);transform:translateY(-2px);box-shadow:0 8px 20px rgba(20,22,31,.07);}
.kcard .n{font-weight:600;font-size:13px;}
.kcard .r{font-size:11.5px;color:var(--muted);margin-top:2px;}
.kcard .meta{display:flex;justify-content:space-between;align-items:center;margin-top:10px;}
.kcard .score{font-family:var(--mono);font-size:11px;font-weight:600;color:var(--teal);}
.kcard .days{font-size:10.5px;color:var(--muted);}
.empty{font-size:12px;color:var(--muted);padding:6px;}
@media(max-width:900px){.kanban{grid-template-columns:1fr;}}
</style>
