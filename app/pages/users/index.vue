<script setup lang="ts">
const config = useRuntimeConfig()

import type { User } from '~~/types/database';

const { data, error, pending } = useFetch<User[]>('/api/users', {
  baseURL: config.public.apiBase
})
</script>

<template>
  <Head>
    <title>Players | Reign</title>
  </Head>
  <div class="container px-4 py-6">
    <h1 class="text-lg">Players</h1>
    <div class="grid grid-cols-1 gap-4 mt-4">
      <template v-if="pending">
        <p class="text-secondary-foreground bg-secondary rounded-md px-4 py-2 w-fit mx-auto">Loading ... </p>
      </template>
      <template v-else-if="error">
        <p class="text-destructive-foreground bg-destructive rounded-md px-4 py-2 w-fit mx-auto">Error loading players.</p>
      </template>
      <template v-else-if="data">
        <UiCard v-for="user in data" :key="user.id">
          <h2 class="text-xl">{{ user.username }}</h2>
          <p class="text-muted-foreground">Created At: {{ user.createdAt }}</p>
        </UiCard>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>