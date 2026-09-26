<template>
  <div>
    <div class="pagehead">
      <div>
        <h1 class="title">Your profile</h1>
        <p class="sub">Build a complete profile and keep your resume on file — it powers your job matches.</p>
      </div>
      <router-link to="/candidate" class="btn btn-ghost backlink">
        ← Back to dashboard
      </router-link>
    </div>

    <!-- Resume -->
    <div class="card" style="margin-bottom:22px;">
      <div class="sechead">
        <div>
          <h2>Resume</h2>
          <div class="sub">PDF / DOCX / TXT — saved to your profile and available to HR when you apply</div>
        </div>
        <span v-if="candidateStore.hasResume" class="savedpill">✓ On file</span>
      </div>

      <div v-if="!candidateStore.hasResume" class="dropzone" :class="{ over: dragging }" @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop" @click="pickFile">
        <div class="dz-icon" v-html="ICONS.upload"></div>
        <div class="dz-title">Drop your resume here</div>
        <div class="dz-sub">or click to browse · PDF, DOCX or TXT up to 5MB</div>
        <input ref="fileInput" type="file" accept=".pdf,.doc,.docx,.txt" hidden @change="handleFileUpload" />
      </div>

      <div v-else class="resume-file">
        <div class="rf-icon" v-html="ICONS.file"></div>
        <div class="rf-meta">
          <div class="rf-name">{{ candidateStore.profile.resumeFileName }}</div>
          <div class="rf-type">{{ (candidateStore.profile.resumeFileType || 'file').toUpperCase() }}</div>
        </div>
        <div class="rf-actions">
          <button class="btn btn-ghost" :disabled="resumeBusy" @click="viewResume">View</button>
          <button class="btn btn-ghost" :disabled="resumeBusy" @click="downloadResume">Download</button>
          <button class="btn btn-ghost replace" :disabled="resumeBusy" @click="pickFile">Replace</button>
          <input ref="fileInput" type="file" accept=".pdf,.doc,.docx,.txt" hidden @change="handleFileUpload" />
        </div>
      </div>

      <div v-if="uploading" class="uploading">
        <div class="spinner"></div>
        <span>Reading your resume…</span>
      </div>
      <div v-if="uploadError" class="hint error">{{ uploadError }}</div>
      <div v-if="parsedNotice" class="hint ok">{{ parsedNotice }}</div>
    </div>

    <!-- Profile form -->
    <div class="card">
      <div class="sechead">
        <div>
          <h2>Personal details</h2>
          <div class="sub">Skills are auto-detected from your resume — add or remove any</div>
        </div>
      </div>

      <div class="form">
        <div class="row2">
          <div>
            <label>Full name</label>
            <input v-model="form.name" placeholder="e.g. Juhi Sharma" />
          </div>
          <div>
            <label>Email</label>
            <input v-model="form.email" placeholder="you@example.com" />
          </div>
        </div>

        <div class="row2" style="margin-top:12px;">
          <div>
            <label>Phone</label>
            <input v-model="form.phone" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label>Location</label>
            <input v-model="form.location" placeholder="e.g. Agra, Uttar Pradesh" />
          </div>
        </div>

        <div class="row2" style="margin-top:12px;">
          <div>
            <label>Experience (years)</label>
            <input v-model.number="form.experienceYears" type="number" step="0.1" />
          </div>
          <div></div>
        </div>

        <label style="margin-top:14px;">Resume text (skills are auto-detected)</label>
        <textarea v-model="resumeText" rows="5" placeholder="Paste resume content here..."></textarea>
        <button class="btn btn-ghost" style="margin-top:10px;" @click="detectSkills">Detect skills from resume</button>

        <label style="margin-top:14px;">Skills</label>
        <div class="skill-editor">
          <span v-for="(s, i) in form.skills" :key="s" class="tag removable">
            {{ s }} <span @click="form.skills.splice(i, 1)">&times;</span>
          </span>
          <input v-model="newSkill" @keyup.enter="addSkill" placeholder="Type a skill and press enter" style="margin-top:8px;" />
        </div>

        <p v-if="saveError" class="hint error">{{ saveError }}</p>

        <div class="actions-row">
          <button class="btn btn-primary big" :disabled="candidateStore.loading" @click="save">
            {{ candidateStore.loading ? 'Saving…' : 'Save profile' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCandidateStore } from '../store/candidate'
import { useToastStore } from '../store/toast'

const KNOWN_SKILLS = [
  'Vue.js', 'Vue', 'React', 'React.js', 'Angular', 'JavaScript', 'TypeScript',
  'ASP.NET Core', '.NET', 'Node.js', 'Express', 'C#', 'SQL Server', 'SQLite',
  'MySQL', 'PostgreSQL', 'Pinia', 'Vuex', 'Redux', 'REST API', 'GraphQL',
  'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Git', 'Docker', 'Azure', 'AWS',
  'Firebase', 'AG Grid', 'Unit Testing', 'CI/CD', 'Agile', 'Scrum'
]

const candidateStore = useCandidateStore()
const toast = useToastStore()

const dragging = ref(false)
const uploading = ref(false)
const resumeBusy = ref(false)
const uploadError = ref('')
const parsedNotice = ref('')
const saveError = ref('')
const newSkill = ref('')
const resumeText = ref('')
const fileInput = ref(null)

const form = reactive({
  name: '', email: '', phone: '', location: '', experienceYears: 0, skills: []
})

const ICONS = {
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>'
}

function prefillFromProfile() {
  const p = candidateStore.profile
  if (!p) return
  form.name = p.name || ''
  form.email = p.email || ''
  form.phone = p.phone || ''
  form.location = p.location || ''
  form.experienceYears = p.experienceYears || 0
  form.skills = [...(p.skills || [])]
  resumeText.value = p.resumeText || ''
}

function pickFile() {
  fileInput.value?.click()
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) uploadFile(file)
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (file) await uploadFile(file)
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadFile(file) {
  uploadError.value = ''
  parsedNotice.value = ''
  uploading.value = true
  try {
    const result = await candidateStore.uploadResume(file)
    // Merge parsed values into the form, keeping anything already typed.
    if (result?.name && !form.name) form.name = result.name
    if (result?.email && !form.email) form.email = result.email
    if (result?.location && !form.location) form.location = result.location
    if (result?.experienceYears && !form.experienceYears) form.experienceYears = result.experienceYears
    if (result?.rawText) resumeText.value = result.rawText
    for (const skill of result?.skills || []) {
      if (!form.skills.includes(skill)) form.skills.push(skill)
    }
    parsedNotice.value = `Resume saved and parsed — ${(result?.skills || []).length} skills detected.`
    toast.success('Resume saved to your profile')
  } catch (err) {
    console.error('Resume upload failed:', err)
    uploadError.value = 'Could not read that file. Try a different format or paste the text below.'
    toast.error('Resume upload failed')
  } finally {
    uploading.value = false
  }
}

async function viewResume() {
  resumeBusy.value = true
  try {
    const { blob } = await candidateStore.getResumeBlob()
    window.open(URL.createObjectURL(blob), '_blank')
  } catch {
    toast.error('No resume on file')
  } finally {
    resumeBusy.value = false
  }
}

async function downloadResume() {
  resumeBusy.value = true
  try {
    const { blob, filename } = await candidateStore.getResumeBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Resume downloaded')
  } catch {
    toast.error('No resume on file')
  } finally {
    resumeBusy.value = false
  }
}

function detectSkills() {
  const text = resumeText.value.toLowerCase()
  const found = KNOWN_SKILLS.filter(skill => text.includes(skill.toLowerCase()))
  for (const skill of found) {
    if (!form.skills.includes(skill)) form.skills.push(skill)
  }
  if (found.length) toast.info(`Detected ${found.length} skill${found.length > 1 ? 's' : ''}`)
}

function addSkill() {
  const val = newSkill.value.trim()
  if (val && !form.skills.includes(val)) form.skills.push(val)
  newSkill.value = ''
}

async function save() {
  saveError.value = ''
  if (!form.name.trim() || !form.email.trim()) {
    saveError.value = 'Name and email are required.'
    return
  }
  try {
    await candidateStore.saveProfile({ ...form, resumeText: resumeText.value })
    toast.success('Profile saved')
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Could not save your profile. Please try again.'
    toast.error('Could not save your profile')
  }
}

onMounted(async () => {
  const hasProfile = await candidateStore.loadProfile()
  if (hasProfile) prefillFromProfile()
})
</script>

<style scoped>
.pagehead{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:26px;}
.title{font-family:var(--disp);font-weight:700;font-size:26px;letter-spacing:-0.02em;}
.sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.backlink{padding:9px 16px;animation:rise-in .4s var(--ease-out) both;}

.savedpill{font-size:12px;font-weight:600;color:var(--teal);background:var(--teal-dim);padding:6px 14px;border-radius:999px;animation:pop-in .3s var(--ease-pop) both;}

.dropzone{
  border:2px dashed var(--border);border-radius:14px;padding:38px 20px;text-align:center;cursor:pointer;
  transition:border-color .2s,background .2s,transform .15s;animation:rise-in .4s var(--ease-out) both;
}
.dropzone:hover{border-color:var(--coral);background:var(--coral-dim);}
.dropzone.over{border-color:var(--mint);background:var(--mint-dim);transform:scale(1.01);}
.dz-icon{width:44px;height:44px;margin:0 auto 12px;color:var(--coral);}
.dz-icon svg{width:100%;height:100%;}
.dz-title{font-weight:600;font-size:14.5px;}
.dz-sub{font-size:12.5px;color:var(--muted);margin-top:4px;}

.resume-file{
  display:flex;align-items:center;gap:14px;border:1px solid var(--teal);border-radius:14px;
  padding:16px 18px;background:var(--teal-dim);animation:pop-in .35s var(--ease-pop) both;
}
.rf-icon{width:38px;height:38px;color:var(--teal);flex-shrink:0;}
.rf-icon svg{width:100%;height:100%;}
.rf-name{font-weight:600;font-size:14px;word-break:break-all;}
.rf-type{font-size:11.5px;color:var(--teal);font-weight:600;margin-top:2px;}
.rf-actions{margin-left:auto;display:flex;gap:8px;flex-shrink:0;}

.uploading{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:13px;color:var(--muted);}
.spinner{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);border-top-color:var(--coral);animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

.hint{font-size:12.5px;margin-top:8px;}
.hint.error{color:#d64545;}
.hint.ok{color:var(--teal);}

.form{display:flex;flex-direction:column;}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.actions-row{margin-top:20px;display:flex;gap:10px;}
.btn.big{padding:11px 28px;font-size:14px;}
.skill-editor{display:flex;flex-wrap:wrap;align-items:center;gap:4px;}
.tag.removable span{cursor:pointer;margin-left:4px;font-weight:700;}

@media(max-width:700px){.row2{grid-template-columns:1fr;}.pagehead{flex-direction:column;gap:14px;}.rf-actions{width:100%;justify-content:flex-end;}}
</style>
