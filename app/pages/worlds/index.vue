<script setup lang="ts">
const config = useRuntimeConfig()

import type { World } from '~~/types/database';

const { data, error, pending } = useFetch<World[]>('/api/worlds', {
  baseURL: config.public.apiBase
})
</script>

<template>
  <div class="container">
    <h1 class="mt-4 text-lg">Worlds</h1>
    <div class="border border-border mt-4 rounded-md p-4 bg-card">
      <template v-if="pending">
        <p class="text-secondary-foreground bg-secondary rounded-md px-4 py-2 w-fit mx-auto">Loading ... </p>
      </template>
      <template v-else-if="error">
        <p class="text-destructive-foreground bg-destructive rounded-md px-4 py-2 w-fit mx-auto">Error loading worlds.</p>
      </template>
      <template v-else-if="data">
        <div v-for="world in data" :key="world.id">
          <NuxtLink :to="`/worlds/${world.slug}`">
            <h2>{{ world.name }}</h2>
          </NuxtLink>
          <p>Slug: {{ world.slug }}</p>
          <p>Owner ID: {{ world.ownerId }}</p>
          <p>Board Size: {{ world.boardSize }}</p>
          <p>Max Players: {{ world.maxPlayers }}</p>
          <p>Created At: {{ world.createdAt }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>