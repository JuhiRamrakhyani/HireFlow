<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <div class="sechead">
        <div>
          <h2>{{ isEditing ? 'Edit manager' : 'Add manager' }}</h2>
          <div class="sub">The person who owns hiring for a team</div>
        </div>
        <button class="iconbtn" @click="$emit('close')">&times;</button>
      </div>

      <div class="row2">
        <div>
          <label>Full name</label>
          <input v-model="form.name" placeholder="e.g. Priya Nair" />
        </div>
        <div>
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="priya@hireflow.dev" />
        </div>
      </div>

      <div class="row2" style="margin-top:12px;">
        <div>
          <label>Job title</label>
          <input v-model="form.title" placeholder="e.g. Engineering Manager" />
        </div>
        <div>
          <label>Department</label>
          <input v-model="form.department" placeholder="e.g. Engineering" />
        </div>
      </div>

      <div class="row2" style="margin-top:12px;">
        <div>
          <label>Phone</label>
          <input v-model="form.phone" placeholder="+91 90000 00000" />
        </div>
        <div>
          <label>Status</label>
          <select v-model="form.isActive">
            <option :value="true">Active</option>
            <option :value="false">Inactive</option>
          </select>
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="actions-row">
        <button class="btn btn-teal" :disabled="managerStore.loading || !isValid" @click="submit">
          {{ managerStore.loading ? 'Saving…' : isEditing ? 'Save changes' : 'Add manager' }}
        </button>
        <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { useManagerStore } from '../store/manager'

const props = defineProps({
  manager: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const managerStore = useManagerStore()
const error = ref('')

const isEditing = computed(() => !!props.manager)

const form = reactive({ name: '', email: '', title: '', department: '', phone: '', isActive: true })

watch(() => props.manager, (m) => {
  if (m) {
    form.name = m.name || ''
    form.email = m.email || ''
    form.title = m.title || ''
    form.department = m.department || ''
    form.phone = m.phone || ''
    form.isActive = m.isActive
  }
}, { immediate: true })

const isValid = computed(() => form.name.trim() && form.email.trim())

async function submit() {
  error.value = ''
  try {
    const payload = { ...form }
    if (isEditing.value) {
      await managerStore.updateManager(props.manager.id, payload)
    } else {
      await managerStore.createManager(payload)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err.response?.data?.error || 'Could not save manager'
  }
}
</script>

<style scoped>
.overlay{position:fixed;inset:0;background:rgba(18,20,28,.45);backdrop-filter:blur(3px);z-index:50;display:flex;align-items:flex-start;justify-content:center;padding:80px 20px;overflow:auto;}
.panel{background:var(--card);border-radius:var(--radius);padding:26px;width:100%;max-width:520px;animation:pop-in .28s var(--ease-pop) both;}
.iconbtn{width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:15px;color:var(--muted);}
.iconbtn:hover{border-color:var(--coral);color:var(--coral);}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.error-msg{color:#d64545;font-size:12.5px;margin-top:12px;}
.actions-row{margin-top:20px;display:flex;gap:10px;}
@media(max-width:600px){.row2{grid-template-columns:1fr;}}
</style>
