<template>
  <div class="login-page">
    <div class="blob blob-a"></div>
    <div class="blob blob-b"></div>
    <div class="blob blob-c"></div>

    <div class="card login-card">
      <div class="brand"><span class="hf">Hire</span>Flow</div>
      <p class="sub">Sign in to continue</p>

      <label>Username</label>
      <input v-model="username" placeholder="Username" autocomplete="username" @keyup.enter="handleLogin" />

      <label>Password</label>
      <input
        v-model="password" type="password" placeholder="Password"
        autocomplete="current-password" @keyup.enter="handleLogin"
      />

      <button class="btn btn-primary" @click="handleLogin" :disabled="authStore.loading || !username || !password">
        <span v-if="authStore.loading" class="spinner"></span>
        {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
      </button>

      <p v-if="authStore.error" class="error">{{ authStore.error }}</p>

      <div class="divider"><span>demo accounts</span></div>
      <div class="demo-row">
        <button class="btn btn-ghost" @click="fillDemo('candidate')">Candidate demo</button>
        <button class="btn btn-ghost" @click="fillDemo('hr')">HR demo</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')

const DEMO = {
  candidate: { username: 'candidate', password: 'candidate123' },
  hr: { username: 'hr', password: 'hr123' }
}

function fillDemo(which) {
  username.value = DEMO[which].username
  password.value = DEMO[which].password
}

async function handleLogin() {
  const ok = await authStore.login(username.value, password.value)
  if (ok) {
    router.push(authStore.user.role === 'hr' ? '/hr' : '/candidate')
  }
}
</script>

<style scoped>
.login-page{
  min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--paper);
  position:relative;overflow:hidden;
}
.blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;animation:float 12s ease-in-out infinite;}
.blob-a{width:380px;height:380px;background:var(--coral-dim);top:-120px;left:-100px;}
.blob-b{width:320px;height:320px;background:var(--teal-dim);bottom:-120px;right:-80px;animation-delay:-4s;}
.blob-c{width:220px;height:220px;background:var(--amber-dim);top:40%;right:12%;animation-delay:-8s;}
@keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(24px,-24px) scale(1.08)}}

.login-card{width:380px;padding:32px;position:relative;z-index:1;animation:rise-in .5s var(--ease-out) both;}
.brand{font-family:var(--disp);font-weight:700;font-size:24px;text-align:center;margin-bottom:6px;}
.brand .hf{color:var(--coral);}
.sub{font-size:13.5px;color:var(--muted);text-align:center;margin-bottom:20px;}
label{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-bottom:6px;}
input{
  width:100%;padding:10px 12px;margin-bottom:16px;border:1px solid var(--border);border-radius:8px;
  font-family:var(--body);font-size:13.5px;background:var(--card);transition:border-color .18s,box-shadow .18s;
}
input:focus{outline:none;border-color:var(--coral);box-shadow:0 0 0 3px var(--coral-dim);}
.btn{width:100%;padding:11px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .15s var(--ease-pop);}
.btn:active{transform:scale(.98);}
.spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.error{color:var(--coral);font-size:12.5px;margin-top:4px;margin-bottom:10px;text-align:center;animation:pop-in .25s var(--ease-pop) both;}
.divider{display:flex;align-items:center;text-align:center;color:var(--muted);font-size:12px;margin:6px 0 12px;}
.divider::before,.divider::after{content:'';flex:1;border-bottom:1px solid var(--border);}
.divider span{padding:0 10px;}
.demo-row{display:flex;gap:8px;}
.demo-row .btn{margin-bottom:0;}
</style>
