<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Hiring managers</h1>
        <div class="page-sub">The people who own requisitions — assign them to vacancies and track their load</div>
      </div>
      <button class="btn btn-coral" @click="openCreate">+ Add manager</button>
    </div>

    <div class="mgr-grid">
      <div v-for="(m, idx) in managerStore.managers" :key="m.id" class="card mgr-card lift" :class="{ inactive: !m.isActive }" :style="{ '--delay': `${idx * 60}ms` }">
        <div class="mgr-top">
          <div class="avatar-circle" :style="{ background: avatarGradient(idx) }">{{ initials(m.name) }}</div>
          <div class="mgr-meta">
            <div class="mgr-name">{{ m.name }}</div>
            <div class="mgr-title">{{ m.title || 'Hiring manager' }}<span v-if="m.department"> · {{ m.department }}</span></div>
          </div>
          <span class="statuspill" :class="m.isActive ? 'open' : 'closed'">{{ m.isActive ? 'Active' : 'Inactive' }}</span>
        </div>

        <div class="mgr-stats">
          <div class="stat">
            <div class="stat-n">{{ m.jobCount }}</div>
            <div class="stat-l">Active vacancies</div>
          </div>
        </div>

        <div class="mgr-contact">
          <div class="contact-line">✉ {{ m.email }}</div>
          <div v-if="m.phone" class="contact-line">☏ {{ m.phone }}</div>
        </div>

        <div class="mgr-actions">
          <button class="btn btn-ghost" @click="openEdit(m)">Edit</button>
          <button class="btn btn-ghost danger" @click="remove(m)">Remove</button>
        </div>
      </div>
      <div v-if="managerStore.managers.length === 0" class="empty-card card">
        <div class="empty-title">No hiring managers yet</div>
        <div class="empty-sub">Add your first manager to assign owners to vacancies.</div>
      </div>
    </div>

    <Transition name="modal">
      <ManagerFormModal
        v-if="showModal"
        :manager="editingManager"
        @close="showModal = false"
        @saved="onSaved"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useManagerStore } from '../../store/manager'
import { useToastStore } from '../../store/toast'
import ManagerFormModal from '../../components/ManagerFormModal.vue'

const managerStore = useManagerStore()
const toast = useToastStore()

const showModal = ref(false)
const editingManager = ref(null)

const GRADIENTS = ['var(--grad-coral)', 'var(--grad-teal)', 'var(--grad-violet)', 'var(--grad-sky)', 'var(--grad-amber)']

function avatarGradient(idx) {
  return GRADIENTS[idx % GRADIENTS.length]
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function openCreate() {
  editingManager.value = null
  showModal.value = true
}

function openEdit(m) {
  editingManager.value = m
  showModal.value = true
}

async function remove(m) {
  if (!confirm(`Remove ${m.name}? Vacancies stay intact but lose their manager link.`)) return
  await managerStore.deleteManager(m.id)
  toast.success(`${m.name} removed`)
}

function onSaved() {
  toast.success('Manager saved')
}

onMounted(() => managerStore.loadManagers())
</script>

<style scoped>
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px;flex-wrap:wrap;}
.page-head h1{font-family:var(--disp);font-size:26px;letter-spacing:-0.02em;}
.page-sub{font-size:13.5px;color:var(--muted);margin-top:4px;}
.mgr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}
.mgr-card{padding:20px;animation:rise-in .4s var(--ease-out) both;animation-delay:var(--delay);}
.mgr-card.inactive{opacity:.6;}
.mgr-top{display:flex;align-items:center;gap:12px;}
.mgr-meta{min-width:0;flex:1;}
.mgr-name{font-weight:700;font-size:15px;}
.mgr-title{font-size:12px;color:var(--muted);margin-top:2px;}
.mgr-stats{margin-top:16px;display:flex;gap:10px;}
.stat{background:var(--paper);border:1px solid var(--border);border-radius:10px;padding:10px 16px;flex:1;text-align:center;}
.stat-n{font-family:var(--disp);font-weight:700;font-size:20px;color:var(--teal);}
.stat-l{font-size:11px;color:var(--muted);margin-top:2px;}
.mgr-contact{margin-top:14px;font-size:12.5px;color:var(--muted);display:flex;flex-direction:column;gap:4px;}
.contact-line{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mgr-actions{display:flex;gap:8px;margin-top:16px;}
.mgr-actions .btn{flex:1;}
.btn.danger:hover{border-color:var(--coral);color:var(--coral);}
.empty-card{text-align:center;padding:40px;grid-column:1/-1;}
.empty-title{font-family:var(--disp);font-weight:600;font-size:16px;}
.empty-sub{font-size:13px;color:var(--muted);margin-top:6px;}
</style>
