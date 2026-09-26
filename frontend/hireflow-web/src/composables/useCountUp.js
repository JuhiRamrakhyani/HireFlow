import { ref, watch, onUnmounted } from 'vue'

// Animates a number from 0 up to `target` with an ease-out curve. Returns a
// ref that updates on every animation frame, plus a start() to re-run it.
export function useCountUp(target, duration = 900) {
  const value = ref(0)
  let raf = null

  function start() {
    if (raf) cancelAnimationFrame(raf)
    const startTime = performance.now()
    const to = Number(target.value ?? target) || 0
    const from = value.value

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      value.value = Math.round(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  watch(target, start, { immediate: true })
  onUnmounted(() => { if (raf) cancelAnimationFrame(raf) })

  return { value, start }
}
