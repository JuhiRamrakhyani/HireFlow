<template>
  <div class="card" style="margin-bottom:24px;">
    <div class="sechead">
      <div>
        <h2>{{ isEditing ? 'Edit vacancy' : 'Create vacancy' }}</h2>
        <div class="sub">Define the JD and the skills the matching engine will screen against</div>
      </div>
    </div>

    <div class="row2">
      <div>
        <label>Job title</label>
        <input v-model="form.title" placeholder="e.g. Frontend Engineer — Vue.js" />
      </div>
      <div>
        <label>Department</label>
        <input v-model="form.department" placeholder="e.g. Product" />
      </div>
    </div>

    <div class="row2" style="margin-top:12px;">
      <div>
        <label>Location</label>
        <input v-model="form.location" placeholder="e.g. Agra / Remote" />
      </div>
      <div>
        <label>Minimum experience (years)</label>
        <input v-model.number="form.minExperienceYears" type="number" step="0.1" />
      </div>
    </div>

    <!-- Status is only relevant once a vacancy already exists - a brand new
         one is always created as Open, so this row is hidden on create. -->
    <div v-if="isEditing" style="margin-top:12px;">
      <label>Vacancy status</label>
      <div class="status-switch">
        <button
          v-for="opt in STATUS_OPTIONS" :key="opt.value" type="button"
          class="status-opt" :class="[opt.value.toLowerCase(), { active: form.status === opt.value }]"
          @click="form.status = opt.value"
        >
          <span class="dot"></span>{{ opt.value }}
        </button>
      </div>
      <div class="hint">{{ STATUS_OPTIONS.find(o => o.value === form.status)?.hint }}</div>
    </div>

    <div class="row2" style="margin-top:12px;">
      <div>
        <label>Hiring manager</label>
        <select v-model="form.hiringManagerId">
          <option :value="null">— Not assigned —</option>
          <option v-for="m in managers" :key="m.id" :value="m.id">
            {{ m.name }} · {{ m.department || 'No dept' }}
          </option>
        </select>
      </div>
      <div></div>
    </div>

    <label style="margin-top:12px;">Job description</label>
    <textarea v-model="form.description" rows="4" placeholder="Responsibilities, expectations, team context..."></textarea>

    <label style="margin-top:16px;">Quick add skills (comma-separated)</label>
    <div class="bulk-row">
      <input
        v-model="bulkSkillsText" placeholder="e.g. Vue.js, CSS, Git, REST API"
        @keyup.enter="addBulkSkills"
      />
      <button class="btn btn-ghost" type="button" @click="addBulkSkills">Add</button>
    </div>
    <div class="hint">Adds each as a required skill (weight 2) — adjust required/weight per skill below.</div>

    <label style="margin-top:16px;">Skill requirements</label>
    <div class="skill-rows">
      <div v-for="(req, i) in form.skillRequirements" :key="i" class="skill-row">
        <input v-model="req.skillName" placeholder="Skill name, e.g. Vue.js" />
        <label class="checkbox">
          <input type="checkbox" v-model="req.isRequired" />
          Required
        </label>
        <select v-model.number="req.weight">
          <option :value="1">Weight 1</option>
          <option :value="2">Weight 2</option>
          <option :value="3">Weight 3</option>
        </select>
        <button class="iconbtn" type="button" @click="form.skillRequirements.splice(i, 1)">&times;</button>
      </div>
    </div>
    <button class="btn btn-ghost" type="button" style="margin-top:10px;" @click="addSkillRow">
      + Add skill requirement
    </button>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div class="actions-row">
      <button class="btn btn-primary" :disabled="jobStore.loading || !isValid" @click="submit">
        {{ jobStore.loading ? (isEditing ? 'Saving…' : 'Publishing…') : (isEditing ? 'Save changes' : 'Publish vacancy') }}
      </button>
      <button v-if="isEditing" class="btn btn-ghost" type="button" @click="$emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { useJobStore } from '../store/job'

// When `job` is passed in (the full detail object from GET /jobs/:id,
// including skillRequirements), the form edits that vacancy via PUT
// instead of creating a new one via POST.
const props = defineProps({
  job: { type: Object, default: null },
  managers: { type: Array, default: () => [] }
})
const emit = defineEmits(['created', 'updated', 'cancel'])
const jobStore = useJobStore()
const error = ref('')
const bulkSkillsText = ref('')

const isEditing = computed(() => !!props.job)

const STATUS_OPTIONS = [
  { value: 'Open', hint: 'Visible to candidates and accepting applications.' },
  { value: 'Draft', hint: 'Hidden from candidates while you finish the JD.' },
  { value: 'Closed', hint: 'No longer accepting applications.' }
]

const form = reactive({
  title: '', department: '', location: '', minExperienceYears: 0, description: '',
  status: 'Open', hiringManagerId: null,
  skillRequirements: [{ skillName: '', isRequired: true, weight: 2 }]
})

watch(() => props.job, (job) => {
  if (job) {
    form.title = job.title || ''
    form.department = job.department || ''
    form.location = job.location || ''
    form.minExperienceYears = job.minExperienceYears || 0
    form.description = job.description || ''
    form.status = job.status || 'Open'
    form.hiringManagerId = job.hiringManagerId || null
    form.skillRequirements = (job.skillRequirements || []).map(r => ({ ...r }))
    if (form.skillRequirements.length === 0) {
      form.skillRequirements.push({ skillName: '', isRequired: true, weight: 2 })
    }
  }
}, { immediate: true })

const isValid = computed(() =>
  form.title.trim() && form.skillRequirements.some(r => r.skillName.trim())
)

function addSkillRow() {
  form.skillRequirements.push({ skillName: '', isRequired: true, weight: 1 })
}

// Splits "Vue.js, CSS, Git" into individual skill rows in one go, skipping
// anything already present (case-insensitive) so pasting the same list
// twice doesn't create duplicate rows. Blank starter rows left over from
// the default form state are dropped once real skills come in.
function addBulkSkills() {
  const names = bulkSkillsText.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (names.length === 0) return

  form.skillRequirements = form.skillRequirements.filter(r => r.skillName.trim())

  for (const name of names) {
    const exists = form.skillRequirements.some(r => r.skillName.toLowerCase() === name.toLowerCase())
    if (!exists) {
      form.skillRequirements.push({ skillName: name, isRequired: true, weight: 2 })
    }
  }

  if (form.skillRequirements.length === 0) {
    form.skillRequirements.push({ skillName: '', isRequired: true, weight: 2 })
  }

  bulkSkillsText.value = ''
}

async function submit() {
  error.value = ''
  try {
    const payload = { ...form, skillRequirements: form.skillRequirements.filter(r => r.skillName.trim()) }
    if (isEditing.value) {
      const job = await jobStore.updateJob(props.job.id, payload)
      emit('updated', job)
    } else {
      const job = await jobStore.createJob(payload)
      emit('created', job)
    }
  } catch (err) {
    error.value = err.response?.data?.error || `Could not ${isEditing.value ? 'save' : 'publish'} this vacancy. Please try again.`
  }
}
</script>

<style scoped>
.row2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.status-switch{display:flex;gap:8px;flex-wrap:wrap;}
.status-opt{
  display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;
  border:1px solid var(--border);background:var(--card);font-size:13px;font-weight:600;color:var(--muted);
  cursor:pointer;transition:all .18s var(--ease-out);
}
.status-opt:hover{border-color:var(--ink);color:var(--ink);transform:translateY(-1px);}
.status-opt .dot{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.5;}
.status-opt.active{color:#fff;border-color:transparent;box-shadow:var(--shadow-lift);}
.status-opt.active .dot{opacity:1;}
.status-opt.open.active{background:var(--mint);}
.status-opt.draft.active{background:var(--muted);}
.status-opt.closed.active{background:var(--coral);}
.bulk-row{display:flex;gap:8px;align-items:center;}
.bulk-row .btn{flex-shrink:0;padding:9px 16px;}
.hint{font-size:11.5px;color:var(--muted);margin-top:5px;}
.skill-rows{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
.skill-row{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;}
.checkbox{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:var(--ink);white-space:nowrap;}
.checkbox input{width:auto;}
.iconbtn{width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:15px;color:var(--muted);}
.iconbtn:hover{border-color:var(--coral);color:var(--coral);}
.error-msg{color:#d64545;font-size:12.5px;margin-top:10px;}
.actions-row{margin-top:20px;display:flex;gap:10px;}
@media(max-width:700px){.row2{grid-template-columns:1fr;} .skill-row{grid-template-columns:1fr;}}
</style>
