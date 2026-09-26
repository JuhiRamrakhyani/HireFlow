<template>
  <div class="grid-kpi">
    <div v-for="kpi in items" :key="kpi.label" class="card kpi" v-tilt>
      <div class="label">{{ kpi.label }}</div>
      <div class="value">
        <CountUpNum :value="kpi.value" :suffix="kpi.suffix" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'

const props = defineProps({ kpis: { type: Object, default: null } })

const items = computed(() => [
  { label: 'Open roles', value: props.kpis?.openRoles ?? 0, suffix: '' },
  { label: 'In pipeline', value: props.kpis?.inPipeline ?? 0, suffix: '' },
  { label: 'Avg time to hire', value: props.kpis?.avgTimeToHireDays ?? 0, suffix: 'd' },
  { label: 'Offers this month', value: props.kpis?.offersThisMonth ?? 0, suffix: '' }
])

const CountUpNum = defineComponent({
  props: { value: { type: Number, required: true }, suffix: { type: String, default: '' } },
  setup(props) {
    const display = ref(0)
    let raf = null

    function animate() {
      if (raf) cancelAnimationFrame(raf)
      const start = performance.now()
      const to = props.value
      const dur = 900
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        display.value = Math.round(to * eased)
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    watch(() => props.value, animate, { immediate: true })
    return () => h('span', null, `${display.value}${props.suffix}`)
  }
})
</script>

<style scoped>
.grid-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;}
.kpi{padding:20px 22px;animation:rise-in .4s var(--ease-out) both;}
.kpi:nth-child(2){animation-delay:80ms;}
.kpi:nth-child(3){animation-delay:160ms;}
.kpi:nth-child(4){animation-delay:240ms;}
.label{font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
.value{font-family:var(--disp);font-size:30px;font-weight:700;margin-top:8px;}
@media(max-width:900px){.grid-kpi{grid-template-columns:repeat(2,1fr);}}
</style>
