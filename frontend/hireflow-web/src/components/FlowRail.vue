<template>
  <div class="flowrail">
    <div
      v-for="(step, i) in steps" :key="i" class="flowstep"
      :class="{ done: i < currentIndex, current: i === currentIndex }"
      :style="{ '--delay': `${i * 90}ms` }"
    >
      <div class="flowline" v-if="i < steps.length - 1"></div>
      <div class="flowdot">{{ i < currentIndex ? '✓' : i + 1 }}</div>
      <div class="flowlabel">
        <span class="t">{{ step.title }}</span>
        <span class="s">{{ step.subtitle }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  currentIndex: { type: Number, default: 0 }
})
</script>

<style scoped>
.flowrail{
  display:flex;align-items:center;margin-bottom:38px;background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius);padding:22px 28px;overflow:hidden;position:relative;
}
.flowstep{display:flex;align-items:center;gap:12px;flex:1;position:relative;animation:step-in .5s var(--ease-out) both;animation-delay:var(--delay);}
@keyframes step-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.flowdot{
  width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:12.5px;font-weight:500;border:2px solid var(--border);color:var(--muted);
  background:var(--paper);z-index:1;transition:all .35s var(--ease-pop);
}
.flowstep.done .flowdot{background:var(--teal);border-color:var(--teal);color:#fff;transform:scale(1.08);}
.flowstep.current .flowdot{
  background:var(--coral);border-color:var(--coral);color:#fff;box-shadow:0 0 0 5px var(--coral-dim);
  animation:current-pulse 1.8s ease-in-out infinite;
}
@keyframes current-pulse{
  0%,100%{box-shadow:0 0 0 5px var(--coral-dim);}
  50%{box-shadow:0 0 0 10px rgba(255,93,62,.12);}
}
.flowlabel{display:flex;flex-direction:column;line-height:1.3;}
.flowlabel .t{font-size:13.5px;font-weight:600;}
.flowlabel .s{font-size:11.5px;color:var(--muted);}
.flowline{position:absolute;top:17px;left:34px;right:-12px;height:2px;background:var(--border);z-index:0;}
.flowstep.done .flowline{background:linear-gradient(90deg,var(--teal),var(--mint));animation:line-fill .5s var(--ease-out) both;}
@keyframes line-fill{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}
</style>
