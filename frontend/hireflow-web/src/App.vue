<template>
  <router-view v-if="$route.name === 'login'" />

  <div class="app" v-else>
    <nav class="rail">
      <div class="rail-logo" title="HireFlow">Hf</div>
      <div class="rail-nav">
        <router-link
          v-for="item in navItems" :key="item.to"
          :to="item.to" class="rail-link" :class="{ active: isActive(item) }"
          :title="item.label"
        >
          <span class="rail-icon" v-html="item.icon"></span>
          <span class="rail-label">{{ item.label }}</span>
          <span v-if="item.badge" class="rail-badge">{{ item.badge }}</span>
        </router-link>
      </div>
      <div class="rail-bottom">
        <button class="rail-link logout" @click="handleLogout">
          <span class="rail-icon" v-html="ICONS.logout"></span>
          <span class="rail-label">Log out</span>
        </button>
      </div>
    </nav>

    <div class="main">
      <div class="topbar">
        <div class="brand">Hire<span>Flow</span></div>
        <div class="role-badge">
          <span class="badge-dot"></span>
          {{ authStore.user?.role === 'hr' ? 'HR / recruiter' : 'Candidate' }}
        </div>
        <div class="topbar-right">
          <div class="avatar">{{ initials }}</div>
          <div class="who">
            <div class="who-name">{{ authStore.user?.username }}</div>
            <div class="who-role">{{ authStore.user?.role === 'hr' ? 'Recruiting team' : 'Applicant' }}</div>
          </div>
        </div>
      </div>

      <div class="view">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </Transition>
        </router-view>
      </div>
    </div>

    <ToastStack />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './store/auth'
import { useReferralStore } from './store/referral'
import ToastStack from './components/ToastStack.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const referralStore = useReferralStore()

// Load referral counts on boot so the HR nav badge is accurate from the
// start instead of only after visiting the referrals page. Candidates no
// longer have a referrals section, so nothing is loaded for that role.
onMounted(async () => {
  if (authStore.user?.role === 'hr') await referralStore.loadHrReferrals()
})

const initials = computed(() => {
  const source = authStore.user?.username || '?'
  return source.slice(0, 2).toUpperCase()
})

// Role-aware rail navigation. HR gets a full multi-page recruiting suite;
// candidates get a dashboard, their profile, and a referral page.
const navItems = computed(() => {
  if (authStore.user?.role === 'hr') {
    return [
      { to: '/hr/dashboard', label: 'Dashboard', icon: ICONS.grid },
      { to: '/hr/vacancies', label: 'Vacancies', icon: ICONS.briefcase },
      { to: '/hr/pipeline', label: 'Pipeline', icon: ICONS.route },
      { to: '/hr/candidates', label: 'Candidates', icon: ICONS.users },
      { to: '/hr/managers', label: 'Managers', icon: ICONS.badge },
      { to: '/hr/referrals', label: 'Referrals', icon: ICONS.gift, badge: pendingReferrals }
    ]
  }
  return [
    { to: '/candidate', label: 'Dashboard', icon: ICONS.grid },
    { to: '/candidate/profile', label: 'Profile & resume', icon: ICONS.user }
  ]
})

const pendingReferrals = computed(() => referralStore.statusCounts.pending)

function isActive(item) {
  if (item.to === '/candidate') return route.path === '/candidate'
  return route.path.startsWith(item.to)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

const ICONS = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M15.5 3.13a4 4 0 0 1 0 7.75"/></svg>',
  badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.2 1.6 2.7-.3.7 2.7 2.2 1.6-1 2.5 1 2.5-2.2 1.6-.7 2.7-2.7-.3L12 21l-2.2-1.6-2.7.3-.7-2.7-2.2-1.6 1-2.5-1-2.5 2.2-1.6.7-2.7 2.7.3z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M12 8s-3.5-.5-4.5-2A2 2 0 1 1 10.5 3c1.5 2 1.5 5 1.5 5zm0 0s3.5-.5 4.5-2A2 2 0 1 0 13.5 3C12 5 12 8 12 8z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>'
}
</script>

<style scoped>
.app{display:flex;min-height:100vh;}
.rail{
  width:224px;background:var(--nav);flex-shrink:0;display:flex;flex-direction:column;
  padding:22px 14px;gap:18px;position:sticky;top:0;height:100vh;
}
.rail-logo{
  width:44px;height:44px;border-radius:12px;background:var(--grad-coral);display:flex;align-items:center;
  justify-content:center;font-family:var(--disp);font-weight:700;color:#fff;font-size:17px;
  box-shadow:0 6px 18px rgba(255,93,62,.4);margin-left:6px;
}
.rail-nav{display:flex;flex-direction:column;gap:6px;flex:1;}
.rail-link{
  position:relative;display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;
  color:#9aa0b4;transition:color .18s,background .18s,transform .15s var(--ease-pop);
}
.rail-link .rail-icon{width:19px;height:19px;display:flex;flex-shrink:0;}
.rail-link .rail-icon svg{width:100%;height:100%;}
.rail-label{font-size:13px;font-weight:600;white-space:nowrap;}
.rail-link:hover{color:#fff;background:rgba(255,255,255,.07);transform:translateX(2px);}
.rail-link.active{
  color:#fff;background:var(--grad-coral);box-shadow:0 6px 16px rgba(255,93,62,.35);
}
.rail-badge{
  margin-left:auto;background:var(--coral);color:#fff;font-size:10.5px;font-weight:700;
  min-width:19px;height:19px;border-radius:999px;display:flex;align-items:center;justify-content:center;padding:0 5px;
  animation:pop-in .3s var(--ease-pop) both;
}
.rail-link.active .rail-badge{background:#fff;color:var(--coral);}
.rail-bottom{border-top:1px solid rgba(255,255,255,.08);padding-top:10px;}
.rail-link.logout{width:100%;}
.rail-link.logout:hover{color:var(--coral);background:rgba(255,93,62,.12);}

.main{flex:1;min-width:0;display:flex;flex-direction:column;}
.topbar{
  display:flex;align-items:center;justify-content:space-between;padding:18px 40px;
  border-bottom:1px solid var(--border);background:var(--card);
  position:sticky;top:0;z-index:20;
}
.brand{font-family:var(--disp);font-weight:700;font-size:20px;letter-spacing:-0.02em;}
.brand span{color:var(--coral);}
.role-badge{
  display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;
  color:var(--teal);background:var(--teal-dim);padding:6px 14px;border-radius:999px;
}
.badge-dot{width:7px;height:7px;border-radius:50%;background:var(--mint);animation:pulse-dot 1.8s ease-in-out infinite;}
.topbar-right{display:flex;align-items:center;gap:12px;}
.avatar{
  width:38px;height:38px;border-radius:50%;background:var(--grad-violet);display:flex;align-items:center;
  justify-content:center;color:#fff;font-weight:600;font-size:13px;font-family:var(--disp);
}
.who{text-align:left;}
.who-name{font-size:12.5px;font-weight:700;}
.who-role{font-size:11px;color:var(--muted);}
.view{padding:32px 40px 60px;flex:1;}
@media(max-width:760px){
  .rail{width:64px;padding:20px 8px;}
  .rail-label,.rail-badge,.who{display:none;}
  .rail-link{justify-content:center;padding:10px;}
}
</style>
