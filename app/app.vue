<script setup lang="ts">
useHead({
  link: [
    {
      rel: "icon",
      type: "image/svg+xml",
      href: "/favicon-light.svg",
      media: "(prefers-color-scheme: light)"
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      href: "/favicon-dark.svg",
      media: "(prefers-color-scheme: dark)"
    }
  ],
  bodyAttrs: {
    class: 'bg-background text-foreground accent-primary'
  }
})
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
