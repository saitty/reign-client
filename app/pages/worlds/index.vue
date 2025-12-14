<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import type { World } from '~~/types/database';

const { data, error, pending } = useApiFetch<World[]>('/api/worlds')
</script>

<template>
  <Head>
    <title>Worlds | Reign</title>
  </Head>
  <div class="container px-4 py-6">
    <h1 class="text-lg">Worlds</h1>
    <div class="grid grid-cols-1 gap-4 mt-4">
      <template v-if="pending">
        <p class="text-secondary-foreground bg-secondary rounded-md px-4 py-2 w-fit mx-auto">Loading ... </p>
      </template>
      <template v-else-if="error">
        <p class="text-destructive-foreground bg-destructive rounded-md px-4 py-2 w-fit mx-auto">Error loading worlds.</p>
      </template>
      <template v-else-if="data">
        <UiCard v-for="world in data" :key="world.id">
          <NuxtLink :to="`/worlds/${world.slug}`">
            <h2 class="text-xl">{{ world.name }}</h2>
          </NuxtLink>
          <p class="text-muted-foreground">Slug: {{ world.slug }}</p>
          <p class="text-muted-foreground">Owner ID: {{ world.ownerId }}</p>
          <p class="text-muted-foreground">Board Size: {{ world.boardSize }}</p>
          <p class="text-muted-foreground">Max Players: {{ world.maxPlayers }}</p>
          <p class="text-muted-foreground">Created At: {{ world.createdAt }}</p>
          <UiBaseButton
            class="mt-4"
            @click="() => $router.push(`/worlds/${world.slug}`)"
          >
            Join World
          </UiBaseButton>
        </UiCard>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>