<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Vacancies</h1>
        <div class="page-sub">Create roles, bulk-import from Excel, and manage every open position</div>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="toggleBulk">
          {{ showBulk ? 'Close bulk upload' : '⇪ Bulk upload' }}
        </button>
        <button class="btn btn-coral" @click="toggleCreate">
          {{ showForm ? 'Close' : '+ Create vacancy' }}
        </button>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="t in statusTabs" :key="t.value"
        class="tab-pill" :class="{ active: statusFilter === t.value }"
        @click="statusFilter = t.value"
      >
        <span class="dot" :style="{ background: t.color }"></span>
        {{ t.label }} ({{ countByStatus(t.value) }})
      </button>
    </div>

    <Transition name="modal">
      <BulkUploadVacancy v-if="showBulk" @created="onBulkCreated" />
    </Transition>

    <Transition name="modal">
      <CreateVacancy
        v-if="showForm" :job="editingJob" :managers="managerStore.managers"
        @created="onJobCreated" @updated="onJobUpdated" @cancel="closeForm"
      />
    </Transition>

    <div class="card joblist lift" style="padding:10px 24px;">
      <div
        v-for="(j, idx) in filteredJobs" :key="j.id" class="jobrow"
        :style="{ '--delay': `${idx * 55}ms` }"
      >
        <div class="jobrow-left">
          <div class="jt">{{ j.title }}</div>
          <div class="jc">
            {{ j.department }} · {{ j.location }} · {{ j.applicantCount }} applicants
            <span v-if="j.hiringManagerName" class="mg">· <span class="mg-icon">◎</span> {{ j.hiringManagerName }}</span>
          </div>
          <div v-if="j.requiredSkills.length" class="jtags">
            <span v-for="s in j.requiredSkills.slice(0, 4)" :key="s" class="tag">{{ s }}</span>
            <span v-if="j.requiredSkills.length > 4" class="tag muted-tag">+{{ j.requiredSkills.length - 4 }}</span>
          </div>
        </div>
        <div class="jobrow-right">
          <div class="status-picker" :class="{ open: statusMenuFor === j.id }">
            <button
              class="statuspill pickbtn" :class="j.status.toLowerCase()"
              @click="statusMenuFor = statusMenuFor === j.id ? null : j.id"
            >
              {{ j.status }} <span class="caret">▾</span>
            </button>
            <div v-if="statusMenuFor === j.id" class="status-menu">
              <button
                v-for="opt in ['Open', 'Draft', 'Closed']" :key="opt"
                class="status-menu-item" :class="{ current: opt === j.status }"
                @click="changeStatus(j, opt)"
              >
                <span class="statuspill" :class="opt.toLowerCase()">{{ opt }}</span>
              </button>
            </div>
          </div>
          <button class="btn btn-ghost editbtn" @click="openEdit(j.id)">Edit</button>
        </div>
      </div>
      <div v-if="filteredJobs.length === 0" class="empty">
        {{ jobStore.jobs.length === 0 ? 'No vacancies yet — create one above or bulk-import from Excel.' : 'No vacancies match this filter.' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useJobStore } from '../../store/job'
import { useManagerStore } from '../../store/manager'
import { useToastStore } from '../../store/toast'
import CreateVacancy from '../../components/CreateVacancy.vue'

// Lazy-loaded: the xlsx parser lives in here and only needs to load when HR
// actually opens the bulk upload panel.
const BulkUploadVacancy = defineAsyncComponent(() => import('../../components/BulkUploadVacancy.vue'))

const jobStore = useJobStore()
const managerStore = useManagerStore()
const toast = useToastStore()

const showForm = ref(false)
const showBulk = ref(false)
const editingJob = ref(null)
const statusFilter = ref('All')
const statusMenuFor = ref(null)

const statusTabs = [
  { value: 'All', label: 'All', color: 'var(--ink)' },
  { value: 'Open', label: 'Open', color: 'var(--mint)' },
  { value: 'Draft', label: 'Draft', color: 'var(--muted)' },
  { value: 'Closed', label: 'Closed', color: 'var(--coral)' }
]

const filteredJobs = computed(() =>
  statusFilter.value === 'All'
    ? jobStore.jobs
    : jobStore.jobs.filter(j => j.status === statusFilter.value)
)

function countByStatus(value) {
  if (value === 'All') return jobStore.jobs.length
  return jobStore.jobs.filter(j => j.status === value).length
}

function toggleCreate() {
  if (showForm.value) closeForm()
  else { editingJob.value = null; showForm.value = true; showBulk.value = false }
}

function toggleBulk() {
  showBulk.value = !showBulk.value
  if (showBulk.value) closeForm()
}

function closeForm() {
  showForm.value = false
  editingJob.value = null
}

async function openEdit(jobId) {
  const detail = await jobStore.loadJob(jobId)
  editingJob.value = detail
  showForm.value = true
  showBulk.value = false
}

// Quick status change straight from the list, without opening the full
// edit form. The backend fills in every other field from the existing
// vacancy, so only { status } needs to go over the wire.
async function changeStatus(job, status) {
  statusMenuFor.value = null
  if (status === job.status) return
  try {
    await jobStore.updateJob(job.id, { status })
    toast.success(`"${job.title}" marked ${status}`)
  } catch (err) {
    toast.error(err.response?.data?.error || 'Could not update the status.')
  }
}

async function onJobCreated(job) {
  closeForm()
  toast.success(`Vacancy "${job.title}" published`)
}

async function onJobUpdated(job) {
  closeForm()
  toast.success(`Vacancy "${job.title}" updated`)
}

async function onBulkCreated() {
  showBulk.value = false
}

function closeStatusMenuOnOutsideClick(e) {
  if (!e.target.closest('.status-picker')) statusMenuFor.value = null
}

onMounted(async () => {
  await Promise.all([jobStore.loadJobs(), managerStore.loadManagers()])
  document.addEventListener('click', closeStatusMenuOnOutsideClick)
})
onUnmounted(() => document.removeEventListener('click', closeStatusMenuOnOutsideClick))
</script>

<style scoped>
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.page-head h1{font-family:var(--disp);font-size:26px;letter-spacing:-0.02em;}
.page-sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.head-actions{display:flex;gap:10px;}
.joblist{margin-bottom:20px;}
.jobrow{
  display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:16px 4px;border-bottom:1px solid var(--border);
  animation:rise-in .4s var(--ease-out) both;animation-delay:var(--delay);
  transition:padding .15s,background .15s;
}
.jobrow:hover{background:var(--paper);padding-left:10px;padding-right:10px;border-radius:10px;}
.jobrow:last-child{border-bottom:none;}
.jobrow-left{min-width:0;}
.jt{font-weight:600;font-size:15px;}
.jc{font-size:12.5px;color:var(--muted);margin-top:3px;}
.mg{color:var(--violet);}
.mg-icon{font-size:10px;}
.jtags{margin-top:7px;}
.muted-tag{background:var(--border);color:var(--muted);}
.jobrow-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.editbtn{padding:6px 12px;font-size:12px;}
.status-picker{position:relative;}
.pickbtn{border:none;cursor:pointer;transition:transform .15s var(--ease-pop),box-shadow .15s;}
.pickbtn:hover{transform:translateY(-1px);box-shadow:var(--shadow-lift);}
.caret{font-size:9px;margin-left:2px;transition:transform .18s var(--ease-out);}
.status-picker.open .caret{transform:rotate(180deg);}
.status-menu{
  position:absolute;top:calc(100% + 6px);right:0;background:var(--card);border:1px solid var(--border);
  border-radius:12px;box-shadow:var(--shadow-pop);padding:6px;display:flex;flex-direction:column;gap:3px;
  z-index:30;min-width:120px;animation:pop-in .16s var(--ease-pop) both;
}
.status-menu-item{
  display:flex;background:none;border:none;padding:5px 6px;border-radius:8px;cursor:pointer;text-align:left;
  transition:background .15s;
}
.status-menu-item:hover{background:var(--paper);}
.status-menu-item.current{opacity:.55;cursor:default;}
.status-menu-item .statuspill{pointer-events:none;}
@media(max-width:640px){.page-head{flex-direction:column;align-items:flex-start;}}
</style>
