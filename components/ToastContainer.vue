<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg',
            'flex items-center justify-between gap-4',
            toastTypeClasses[toast.type]
          ]"
        >
          <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
          <button
            @click="removeToast(toast.id)"
            class="text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast, type ToastType } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

const toastTypeClasses: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 border border-green-200',
  error: 'bg-red-50 text-red-800 border border-red-200',
  info: 'bg-blue-50 text-blue-800 border border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
