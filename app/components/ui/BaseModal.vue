<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue?: boolean
  title?: string
  closable?: boolean
  showActions?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  confirm: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const close = () => {
  dialogRef.value?.close()
  emit('update:modelValue', false)
  emit('close')
}

const confirm = () => {
  emit('confirm')
}

const open = async () => {
  await nextTick()
  if (dialogRef.value) {
    dialogRef.value.showModal()
  }
  emit('update:modelValue', true)
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue && !dialogRef.value?.open) {
    open()
  } else if (!newValue && dialogRef.value?.open) {
    dialogRef.value?.close()
  }
}, { immediate: true })

// Also handle initial value on mount
onMounted(() => {
  if (props.modelValue && !dialogRef.value?.open) {
    open()
  }
})

// Handle native dialog close event (e.g., ESC key)
const handleDialogClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Handle backdrop click to close
const handleBackdropClick = (event: MouseEvent) => {
  // Only close if clicking on the dialog backdrop (not the content)
  if (event.target === dialogRef.value) {
    close()
  }
}

// Expose methods for parent components
defineExpose({
  open,
  close
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="backdrop:bg-foreground/50 dark:backdrop:bg-background/50 bg-card rounded-lg shadow-xl border-2 border-border p-0 max-w-md w-full"
    @close="handleDialogClose"
    @click="handleBackdropClick"
  >
    <div class="flex flex-col">
      <!-- Header -->
      <div v-if="title || closable !== false" class="flex items-center justify-between p-4 border-b-2 border-border">
        <h2 v-if="title" class="text-lg font-semibold text-foreground">{{ title }}</h2>
        <button
          v-if="closable !== false"
          type="button"
          class="ml-auto rounded hover:bg-muted p-1 transition-colors duration-200"
          @click="close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 text-foreground">
        <slot />
      </div>

      <!-- Actions -->
      <div v-if="showActions || $slots.actions" class="flex items-center justify-end gap-2 p-4 border-t-2 border-border">
        <slot name="actions">
          <UiBaseButton
            variant="outline"
            @click="close"
          >
            Cancel
          </UiBaseButton>
          <UiBaseButton
            variant="primary"
            @click="confirm"
          >
            Confirm
          </UiBaseButton>
        </slot>
      </div>
    </div>
  </dialog>
</template>