<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div v-for="t in toast.items" :key="t.id" class="toast" :class="t.type">
          <span class="dot"></span>
          <span class="msg">{{ t.message }}</span>
          <button class="close" title="Dismiss" @click="toast.remove(t.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../store/toast'

const toast = useToastStore()
</script>

<style scoped>
.toast-stack{
  position:fixed;top:18px;right:18px;z-index:120;display:flex;flex-direction:column;gap:10px;
  max-width:min(380px,calc(100vw - 36px));
}
.toast{
  display:flex;align-items:center;gap:10px;background:var(--ink);color:#fff;border-radius:12px;
  padding:12px 14px;font-size:13px;font-weight:500;box-shadow:0 12px 32px rgba(20,22,31,.28);
}
.toast .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--mint);}
.toast.error .dot{background:var(--coral);}
.toast.info .dot{background:var(--amber);}
.toast .msg{flex:1;line-height:1.4;}
.toast .close{background:none;border:none;color:rgba(255,255,255,.5);font-size:16px;cursor:pointer;line-height:1;padding:2px;}
.toast .close:hover{color:#fff;}
.toast-enter-active,.toast-leave-active{transition:all .3s var(--ease-out);}
.toast-enter-from{opacity:0;transform:translateX(24px) scale(.95);}
.toast-leave-to{opacity:0;transform:translateX(24px) scale(.95);}
.toast-move{transition:transform .3s var(--ease-out);}
</style>
