<template>
  <div class="card bulk-card">
    <div class="sechead">
      <div>
        <h2>Bulk upload vacancies</h2>
        <div class="sub">Upload an Excel (.xlsx / .csv) file to create many vacancies at once</div>
      </div>
      <button class="btn btn-ghost" type="button" @click="downloadTemplate">Download template</button>
    </div>

    <div
      class="dropzone"
      :class="{ dragging, filled: rows.length > 0 }"
      @click="fileInput.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="onFileChange" />
      <template v-if="!rows.length">
        <div class="dz-icon">⇪</div>
        <div class="dz-title">Drop your file here or click to browse</div>
        <div class="dz-sub">Columns: title, department, location, skills (comma-separated), description, minExperienceYears</div>
      </template>
      <template v-else>
        <div class="dz-title">{{ fileName }}</div>
        <div class="dz-sub">{{ rows.length }} vacancy row(s) parsed — review below</div>
      </template>
    </div>

    <div v-if="rows.length" class="preview-wrap">
      <table class="table">
        <thead>
          <tr><th>#</th><th>Title</th><th>Department</th><th>Location</th><th>Skills</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" :class="{ bad: r.error }">
            <td class="rownum">{{ i + 1 }}</td>
            <td>
              <input v-model="r.title" placeholder="Job title" />
              <div v-if="r.error" class="row-error">{{ r.error }}</div>
            </td>
            <td><input v-model="r.department" placeholder="Department" /></td>
            <td><input v-model="r.location" placeholder="Location" /></td>
            <td><input v-model="r.skills" placeholder="Vue.js, CSS, Git" /></td>
            <td>
              <span class="statuspill" :class="r.error ? 'rejected' : 'open'">
                {{ r.error ? 'Needs fix' : 'Ready' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="actions-row">
        <button class="btn btn-ghost" type="button" @click="clearAll">Clear</button>
        <div class="spacer"></div>
        <button
          class="btn btn-teal"
          :disabled="submitting || validRows.length === 0"
          @click="submit"
        >
          {{ submitting ? 'Creating…' : `Create ${validRows.length} vacancy${validRows.length === 1 ? '' : 'ies'}` }}
        </button>
      </div>
    </div>

    <div v-if="result" class="result-box" :class="result.errors.length ? 'warn' : 'ok'">
      <div class="result-title">Created {{ result.totalCreated }} of {{ rows.length }} vacancies</div>
      <ul v-if="result.errors.length">
        <li v-for="(e, i) in result.errors" :key="i">Row {{ e.row }} — {{ e.error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { useJobStore } from '../store/job'
import { useToastStore } from '../store/toast'

const emit = defineEmits(['created'])

const fileInput = ref(null)
const dragging = ref(false)
const fileName = ref('')
const rows = ref([])
const submitting = ref(false)
const result = ref(null)

const jobStore = useJobStore()
const toast = useToastStore()

const validRows = computed(() => rows.value.filter(r => !r.error))

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) parseFile(file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) parseFile(file)
  e.target.value = ''
}

function parseFile(file) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const workbook = XLSX.read(ev.target.result, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      if (!json.length) {
        toast.error('No data rows found in the file')
        return
      }
      fileName.value = file.name
      rows.value = json.map(normalizeRow).map(validateRow)
      result.value = null
    } catch (err) {
      toast.error('Could not read that file. Use .xlsx, .xls or .csv.')
    }
  }
  reader.readAsArrayBuffer(file)
}

// Accepts a few common header spellings so a spreadsheet dropped in by a
// hiring manager doesn't need a strict template.
function normalizeRow(raw) {
  const pick = (...names) => {
    const entries = Object.entries(raw)
    for (const name of names) {
      const hit = entries.find(([k]) => k.trim().toLowerCase() === name.toLowerCase())
      if (hit) return String(hit[1]).trim()
    }
    return ''
  }
  return {
    title: pick('title', 'job title', 'role', 'position', 'vacancy'),
    department: pick('department', 'team', 'dept'),
    location: pick('location', 'city', 'place', 'work location'),
    description: pick('description', 'jd', 'job description', 'details'),
    skills: pick('skills', 'skill requirements', 'required skills', 'skills required', 'tech stack'),
    minExperienceYears: Number(pick('min experience', 'experience', 'experience years', 'min years')) || 0
  }
}

function validateRow(row, index) {
  const error = !row.title ? 'missing title' : !row.skills ? 'missing skills' : null
  return { ...row, error, _originalIndex: index }
}

function clearAll() {
  rows.value = []
  fileName.value = ''
  result.value = null
}

async function submit() {
  submitting.value = true
  result.value = null
  try {
    const payload = validRows.value.map(r => ({
      title: r.title,
      department: r.department || 'General',
      location: r.location || 'Remote',
      description: r.description,
      skills: r.skills,
      minExperienceYears: r.minExperienceYears
    }))
    const res = await jobStore.bulkCreateJobs(payload)
    result.value = res
    if (res.totalCreated > 0) {
      toast.success(`${res.totalCreated} vacancy(s) created`)
      emit('created')
    }
  } catch (err) {
    toast.error(err.response?.data?.error || 'Bulk upload failed')
  } finally {
    submitting.value = false
  }
}

function downloadTemplate() {
  const data = [
    {
      title: 'Frontend Engineer',
      department: 'Product',
      location: 'Agra / Remote',
      description: 'Build delightful Vue.js interfaces for our candidates',
      skills: 'Vue.js, JavaScript, CSS, Git',
      minExperienceYears: 2
    },
    {
      title: 'Backend Engineer',
      department: 'Platform',
      location: 'Remote',
      description: 'Node.js services, SQL, and API design',
      skills: 'Node.js, SQL, REST API, Docker',
      minExperienceYears: 3
    }
  ]
  const sheet = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Vacancies')
  XLSX.writeFile(wb, 'vacancy-bulk-template.xlsx')
}
</script>

<style scoped>
.bulk-card{margin-bottom:24px;border:1px dashed #d8d2c4;}
.dropzone{
  border:2px dashed #d8d2c4;border-radius:12px;padding:34px 20px;text-align:center;cursor:pointer;
  background:var(--paper);transition:all .2s var(--ease-out);
}
.dropzone:hover{border-color:var(--sky);background:var(--sky-dim);}
.dropzone.dragging{border-color:var(--violet);background:var(--violet-dim);transform:scale(1.01);}
.dropzone.filled{border-color:var(--mint);background:var(--mint-dim);padding:22px;}
.dz-icon{font-size:26px;color:var(--sky);}
.dz-title{font-family:var(--disp);font-weight:600;font-size:14.5px;margin-top:6px;}
.dz-sub{font-size:12px;color:var(--muted);margin-top:4px;}
.preview-wrap{margin-top:18px;}
.table{width:100%;border-collapse:collapse;}
.table th{text-align:left;font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.03em;padding:0 8px 10px;border-bottom:1px solid var(--border);}
.table td{padding:8px;border-bottom:1px solid var(--border);font-size:13px;vertical-align:top;}
.table tr:last-child td{border-bottom:none;}
.table tr.bad td{background:rgba(255,93,62,.05);}
.rownum{font-family:var(--mono);color:var(--muted);font-size:12px;width:30px;}
.row-error{color:var(--coral);font-size:11px;margin-top:3px;font-weight:600;}
.actions-row{display:flex;align-items:center;gap:10px;margin-top:16px;}
.spacer{flex:1;}
.result-box{margin-top:16px;padding:14px 18px;border-radius:10px;font-size:13px;}
.result-box.ok{background:var(--mint-dim);border:1px solid #bfe8d8;color:var(--teal);}
.result-box.warn{background:var(--amber-dim);border:1px solid #f0d9ac;color:#8a5c00;}
.result-title{font-weight:700;margin-bottom:6px;}
.result-box ul{margin:0;padding-left:18px;font-size:12.5px;}
@media(max-width:800px){.table{display:block;overflow-x:auto;}}
</style>
