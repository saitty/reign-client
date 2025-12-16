<script setup lang="ts">
import BaseButton from "~/components/ui/BaseButton.vue";

const isOpen = ref(false);
</script>

<template>
  <teleport
    to="body"
  >
    <div
      class="rounded-lg absolute top-4 left-4 overflow-auto bg-background text-foreground shadow-lg z-50 transition-all duration-300 ease-in-out"
      :class="isOpen ? 'bottom-0 top-0 left-0 p-4 border' : 'bg-secondary'"
    >
      <BaseButton
        @click="isOpen = !isOpen"
        class="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2"
        :class="isOpen ? 'mb-4' : 'text-gray-500'"
        :variant="isOpen ? 'primary' : 'outline'"
      >
        {{ !isOpen ? 'open' : 'close' }} <Icon name="mdi:chevron-down" v-if="!isOpen" /> <Icon name="mdi:chevron-right" v-else />
      </BaseButton>
      <div v-if="isOpen" class="">
        <pre><slot /></pre>
      </div>

    </div>
  </teleport>
</template>

<style scoped>

</style>