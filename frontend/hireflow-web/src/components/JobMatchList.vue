<template>
  <div style="margin-bottom:34px;">
    <div class="sechead">
      <div><h2>Matched openings</h2><div class="sub">Ranked by fit to your profile</div></div>
    </div>
    <div class="card">
      <div v-if="matches.length === 0" class="empty">
        Save your profile to see ranked openings here.
      </div>
      <div
        v-for="(m, i) in matches" :key="m.jobId" class="jobcard"
        :style="{ '--delay': `${i * 80}ms` }"
        @click="$emit('view-keywords', m.jobId)"
      >
        <div>
          <div class="jt">{{ m.title }}</div>
          <div class="jc">{{ m.department }} · {{ m.location }}</div>
          <div class="skillline">
            <span v-for="s in m.matchedSkills.slice(0, 3)" :key="s" class="tag">{{ s }}</span>
          </div>
        </div>
        <div class="matchscore">
          <MatchRing :value="m.matchScorePercent" />
          <button class="btn btn-primary applybtn" @click.stop="$emit('apply', m.jobId)">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, h, ref, onMounted } from 'vue'

defineProps({ matches: { type: Array, default: () => [] } })
defineEmits(['apply', 'view-keywords'])

// Animated match-score ring: conic gradient + number both ease up from 0.
const MatchRing = defineComponent({
  props: { value: { type: Number, required: true } },
  setup(props) {
    const pct = ref(0)
    const display = ref(0)
    let raf = null

    onMounted(() => {
      const start = performance.now()
      const to = Math.max(0, Math.min(100, props.value))
      const dur = 1100
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        display.value = Math.round(to * eased)
        pct.value = to * eased
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })

    return () => h('div', { class: ['ring', { high: props.value >= 70 }], style: { '--pct': pct.value } }, [
      h('div', { class: 'ring-inner' }, `${display.value}%`)
    ])
  }
})
</script>

<style scoped>
.empty{font-size:13.5px;color:var(--muted);padding:8px 4px;}
.jobcard{
  display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:16px 18px;
  border:1px solid var(--border);border-radius:12px;margin-bottom:10px;gap:12px;
  animation:rise-in .45s var(--ease-out) both;animation-delay:var(--delay);
  transition:transform .2s var(--ease-out),border-color .2s,box-shadow .2s;
}
.jobcard:last-child{margin-bottom:0;}
.jobcard:hover{border-color:var(--ink);transform:translateY(-2px);box-shadow:0 10px 24px rgba(20,22,31,.08);}
.jt{font-weight:600;font-size:14.5px;}
.jc{font-size:12.5px;color:var(--muted);margin-top:2px;}
.skillline{margin-top:6px;}
.skillline .tag{font-size:10.5px;padding:3px 8px;margin:2px 4px 0 0;}
.matchscore{display:flex;align-items:center;gap:12px;}
.ring{
  --pct:0;width:52px;height:52px;border-radius:50%;position:relative;display:flex;align-items:center;
  justify-content:center;background:conic-gradient(var(--mint) calc(var(--pct)*1%), var(--border) 0);
}
.ring.high{background:conic-gradient(var(--teal) calc(var(--pct)*1%), var(--border) 0);}
.ring-inner{
  width:40px;height:40px;border-radius:50%;background:var(--card);display:flex;align-items:center;
  justify-content:center;font-family:var(--mono);font-size:11.5px;font-weight:600;
}
.applybtn{animation:pop-in .35s var(--ease-pop) both;animation-delay:var(--delay);}
</style>
