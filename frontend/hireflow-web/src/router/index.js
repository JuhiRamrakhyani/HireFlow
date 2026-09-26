import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../store/auth'

// Views are lazy-loaded so each portal page (and the heavy xlsx parser used
// only by bulk vacancy upload) is fetched on demand instead of inflating the
// initial bundle.
const routes = [
  { path: '/', redirect: '/candidate' },
  { path: '/login', name: 'login', component: LoginView },
  {
    path: '/candidate', name: 'candidate',
    component: () => import('../views/CandidateView.vue'),
    meta: { requiresRole: 'candidate' }
  },
  {
    path: '/candidate/profile', name: 'candidate-profile',
    component: () => import('../views/CandidateProfileView.vue'),
    meta: { requiresRole: 'candidate' }
  },
  { path: '/hr', redirect: '/hr/dashboard' },
  {
    path: '/hr/dashboard', name: 'hr-dashboard',
    component: () => import('../views/hr/DashboardView.vue'),
    meta: { requiresRole: 'hr' }
  },
  {
    path: '/hr/vacancies', name: 'hr-vacancies',
    component: () => import('../views/hr/VacanciesView.vue'),
    meta: { requiresRole: 'hr' }
  },
  {
    path: '/hr/pipeline', name: 'hr-pipeline',
    component: () => import('../views/hr/PipelineView.vue'),
    meta: { requiresRole: 'hr' }
  },
  {
    path: '/hr/candidates', name: 'hr-candidates',
    component: () => import('../views/hr/CandidatesView.vue'),
    meta: { requiresRole: 'hr' }
  },
  {
    path: '/hr/managers', name: 'hr-managers',
    component: () => import('../views/hr/ManagersView.vue'),
    meta: { requiresRole: 'hr' }
  },
  {
    path: '/hr/referrals', name: 'hr-referrals',
    component: () => import('../views/hr/ReferralsView.vue'),
    meta: { requiresRole: 'hr' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.ready) {
    await authStore.init()
  }

  if (!authStore.isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  }

  // Each account maps to exactly one fixed role - if someone's logged in
  // and tries to visit the other portal's route directly, send them back
  // to the one that matches their account instead of showing a 403.
  if (to.meta.requiresRole && authStore.user?.role !== to.meta.requiresRole) {
    return { name: authStore.user?.role === 'hr' ? 'hr-dashboard' : 'candidate' }
  }

  if (to.name === 'login' && authStore.isLoggedIn) {
    return { name: authStore.user.role === 'hr' ? 'hr-dashboard' : 'candidate' }
  }
})

export default router
