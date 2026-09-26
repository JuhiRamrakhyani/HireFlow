// v-tilt: a lightweight pointer-tracking 3D tilt for cards. Rotates the
// element slightly toward the cursor with a soft perspective + a moving
// glare highlight, then eases back flat on pointer leave. Kept dependency
// -free (raw DOM listeners) since it only needs to run on hover.
const MAX_DEG = 7

function onMove(el, e) {
  const rect = el.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width
  const py = (e.clientY - rect.top) / rect.height
  const rotY = (px - 0.5) * MAX_DEG * 2
  const rotX = (0.5 - py) * MAX_DEG * 2
  el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px) scale(1.012)`
  el.style.setProperty('--glare-x', `${px * 100}%`)
  el.style.setProperty('--glare-y', `${py * 100}%`)
  el.style.setProperty('--glare-o', '1')
}

function onLeave(el) {
  el.style.transform = ''
  el.style.setProperty('--glare-o', '0')
}

export const tilt = {
  mounted(el) {
    el.classList.add('tilt-el')
    el.style.transformStyle = 'preserve-3d'
    el.style.willChange = 'transform'
    el.style.transition = 'transform .25s var(--ease-out)'
    el._tiltMove = (e) => onMove(el, e)
    el._tiltLeave = () => onLeave(el)
    el.addEventListener('mousemove', el._tiltMove)
    el.addEventListener('mouseleave', el._tiltLeave)
  },
  beforeUnmount(el) {
    el.removeEventListener('mousemove', el._tiltMove)
    el.removeEventListener('mouseleave', el._tiltLeave)
  }
}
