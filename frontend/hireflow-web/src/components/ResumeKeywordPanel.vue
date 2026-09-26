<template>
  <div class="card">
    <div class="sechead">
      <div><h2>Resume keyword gap</h2><div class="sub">What to add for your top matched role</div></div>
    </div>

    <div v-if="!activeJob" class="empty">
      Save your profile and view a job match to see keyword suggestions here.
    </div>

    <div v-else-if="suggestion">
      <div class="scoreline">
        <div>
          <span class="mono">{{ suggestion.currentMatchPercent }}%</span>
          <span class="arrow">→</span>
          <span class="mono potential">{{ suggestion.potentialMatchPercent }}%</span>
        </div>
        <span class="sub-inline">match if you add the missing keywords</span>
      </div>
      <div class="section">
        <div class="label present">Already in your resume</div>
        <div>
          <span v-for="s in suggestion.keywordsPresent" :key="s" class="tag present-tag">{{ s }}</span>
          <span v-if="suggestion.keywordsPresent.length === 0" class="sub">None yet</span>
        </div>
      </div>

      <div class="section">
        <div class="label missing">Add these keywords</div>
        <div>
          <span v-for="s in suggestion.keywordsToAdd" :key="s" class="tag missing-tag">{{ s }}</span>
          <span v-if="suggestion.keywordsToAdd.length === 0" class="sub">You already cover every requirement 🎯</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
import { useCandidateStore } from '../store/candidate'

const props = defineProps({
  activeJob: { type: [Number, String], default: null }
})

const candidateStore = useCandidateStore()
const suggestion = ref(null)

watch(() => props.activeJob, async (jobId) => {
  if (!jobId) { suggestion.value = null; return }
  suggestion.value = await candidateStore.loadKeywordSuggestions(jobId)
}, { immediate: true })
</script>

<style scoped>
.empty{font-size:13.5px;color:var(--muted);padding:12px 0;}
.scoreline{display:flex;flex-direction:column;gap:2px;margin-bottom:18px;animation:rise-in .35s var(--ease-out) both;}
.mono{font-family:var(--mono);font-weight:600;font-size:20px;}
.mono.potential{color:var(--mint);}
.arrow{margin:0 8px;color:var(--muted);}
.sub-inline{font-size:12px;color:var(--muted);}
.section{margin-top:16px;animation:rise-in .35s var(--ease-out) both;}
.section:nth-of-type(2){animation-delay:90ms;}
.label{font-size:12px;font-weight:600;margin-bottom:8px;}
.label.present{color:var(--teal);}
.label.missing{color:var(--coral);}
.present-tag{background:var(--teal-dim);color:var(--teal);}
.missing-tag{background:var(--coral-dim);color:var(--coral);}
</style>
