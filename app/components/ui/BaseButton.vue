<script setup lang="ts">
const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = {
  primary: 'bg-primary hover:opacity-90 text-primary-foreground',
  secondary: 'bg-secondary hover:opacity-90 text-secondary-foreground',
  danger: 'bg-destructive hover:opacity-90 text-destructive-foreground',
  success: 'bg-accent hover:opacity-90 text-accent-foreground',
  outline: 'bg-transparent hover:bg-muted text-foreground border-2 border-border'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

const baseClasses = 'rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

const buttonClasses = computed(() => {
  const variant = props.variant || 'primary'
  const size = props.size || 'md'

  return [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  ].join(' ')
})

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type || 'button'"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="inline-block mr-2">
      <svg class="animate-spin h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <slot />
  </button>
</template>
