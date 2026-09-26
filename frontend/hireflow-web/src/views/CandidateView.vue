<template>
  <div>
    <FlowRail :steps="flowSteps" :currentIndex="flowIndex" />

    <div v-if="needsProfile" class="cta-banner">
      <div class="cta-icon" v-html="ICONS.bolt"></div>
      <div>
        <div class="cta-title">Create your profile to unlock matches</div>
        <div class="cta-sub">Add your skills and resume so HireFlow can rank open vacancies for you.</div>
      </div>
      <router-link to="/candidate/profile" class="btn btn-primary cta-btn">Build my profile →</router-link>
    </div>

    <template v-else>
      <div class="profile-strip">
        <div class="ps-avatar">{{ profileInitials }}</div>
        <div class="ps-meta">
          <div class="ps-name">{{ candidateStore.profile.name }}</div>
          <div class="ps-sub">{{ candidateStore.profile.location || 'No location set' }} · {{ candidateStore.profile.skills.length }} skills{{ candidateStore.hasResume ? ' · resume on file' : '' }}</div>
        </div>
        <router-link to="/candidate/profile" class="btn btn-ghost">Edit profile</router-link>
      </div>

      <div class="grid-2">
        <JobMatchList :matches="candidateStore.matches" @apply="handleApply" @view-keywords="jobId => (selectedJobForKeywords = jobId)" />
        <ResumeKeywordPanel :active-job="selectedJobForKeywords" />
      </div>

      <ApplicationTracker :applications="candidateStore.applications" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCandidateStore } from '../store/candidate'
import { useToastStore } from '../store/toast'
import FlowRail from '../components/FlowRail.vue'
import ResumeKeywordPanel from '../components/ResumeKeywordPanel.vue'
import JobMatchList from '../components/JobMatchList.vue'
import ApplicationTracker from '../components/ApplicationTracker.vue'

const candidateStore = useCandidateStore()
const toast = useToastStore()
const selectedJobForKeywords = ref(null)

const ICONS = {
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>'
}

const flowSteps = [
  { title: 'Profile', subtitle: 'Build or edit' },
  { title: 'Matched', subtitle: 'See ranked roles' },
  { title: 'Apply', subtitle: 'Submit application' },
  { title: 'Track', subtitle: 'Follow your status' }
]

// A candidate row exists as soon as a resume is uploaded, but the profile
// only counts as "built" once they have a name - until then show the CTA.
const needsProfile = computed(() => !candidateStore.profile || !candidateStore.profile.name)

const flowIndex = computed(() => {
  if (needsProfile.value) return 0
  if (candidateStore.applications.length > 0) return 3
  return 1
})

const profileInitials = computed(() =>
  (candidateStore.profile?.name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
)

async function handleApply(jobId) {
  try {
    await candidateStore.apply(jobId)
    toast.success('Application submitted — good luck!')
  } catch (err) {
    const msg = err.response?.data?.error || 'Could not submit your application.'
    if (err.response?.status === 409) toast.info(msg)
    else toast.error(msg)
  }
}

onMounted(async () => {
  const hasProfile = await candidateStore.loadProfile()
  if (hasProfile) {
    await candidateStore.loadMatches()
    await candidateStore.loadApplications()
    if (candidateStore.matches.length > 0) {
      selectedJobForKeywords.value = candidateStore.matches[0].jobId
    }
  }
})
</script>

<style scoped>
.cta-banner{
  display:flex;align-items:center;gap:16px;background:linear-gradient(120deg,var(--coral-dim),#fff0ea);
  border:1px solid #ffd3c6;border-radius:var(--radius);padding:22px 26px;margin-bottom:30px;
  animation:rise-in .45s var(--ease-out) both;
}
.cta-icon{width:40px;height:40px;color:var(--coral);flex-shrink:0;}
.cta-icon svg{width:100%;height:100%;}
.cta-title{font-family:var(--disp);font-weight:600;font-size:16px;}
.cta-sub{font-size:13px;color:var(--muted);margin-top:3px;}
.cta-btn{margin-left:auto;flex-shrink:0;}

.profile-strip{
  display:flex;align-items:center;gap:14px;background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius);padding:16px 20px;margin-bottom:28px;animation:rise-in .4s var(--ease-out) both;
}
.ps-avatar{
  width:44px;height:44px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;
  justify-content:center;font-family:var(--disp);font-weight:700;font-size:16px;flex-shrink:0;
}
.ps-name{font-weight:700;font-size:15px;}
.ps-sub{font-size:12.5px;color:var(--muted);margin-top:2px;}
.profile-strip .btn{margin-left:auto;}

.grid-2{display:grid;grid-template-columns:1.1fr 1fr;gap:22px;margin-bottom:34px;}
@media(max-width:900px){.grid-2{grid-template-columns:1fr;}.cta-banner{flex-wrap:wrap;}.cta-btn{margin-left:56px;}}
</style>
