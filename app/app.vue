<script setup lang="ts">
useHead({
  link: [
    {
      rel: "icon",
      type: "image/svg+xml",
      href: "/favicon.svg"
    }
  ],
  bodyAttrs: {
    class: 'bg-background text-foreground'
  }
})
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
