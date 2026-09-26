import { defineStore } from 'pinia'

let seq = 0

// Tiny toast system - no library. push() adds a message that auto-dismisses
// after a few seconds; ToastStack.vue renders the stack with transitions.
export const useToastStore = defineStore('toast', {
  state: () => ({
    items: []
  }),
  actions: {
    push(message, type = 'success', duration = 3400) {
      const id = ++seq
      this.items.push({ id, message, type })
      setTimeout(() => this.remove(id), duration)
    },
    success(message) {
      this.push(message, 'success')
    },
    error(message) {
      this.push(message, 'error', 5000)
    },
    info(message) {
      this.push(message, 'info')
    },
    remove(id) {
      this.items = this.items.filter(i => i.id !== id)
    }
  }
})
