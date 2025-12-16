<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import type { World } from '~~/types/database';

const auth = useAuth();

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
        <UiCard v-for="world in data" :key="world.id" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <NuxtLink :to="`/worlds/${world.slug}`">
              <h2 class="text-xl">{{ world.name }}</h2>
            </NuxtLink>
            <p class="text-muted-foreground">Owner: {{ world.owner.username }}</p>
            <p class="text-muted-foreground">Board Size: {{ world.boardSize }}</p>
            <p class="text-muted-foreground">Max Players: {{ world.maxPlayers }}</p>
            <p class="text-muted-foreground">Number of teams: {{ world.minTeams === world.maxTeams ? world.maxTeams : world.minTeams + ' - ' + world.maxTeams }}</p>
            <p class="text-muted-foreground">Team Size: {{ world.minTeamSize === world.maxTeamSize ? world.maxTeamSize : world.minTeamSize + ' - ' + world.maxTeamSize }}</p>
            <p class="text-muted-foreground">Created At: {{ world.createdAt }}</p>
          </div>
          <div>
            <p>Teams:</p>
            <dl v-for="team in world.teams" :key="team.id">
              <dt class="text-sm font-medium text-foreground pl-4">{{ team.name }}</dt>
              <dd v-for="member in team.members" :key="member.id"
                class="text-sm text-secondary-foreground pl-8"
              >
                 - {{ member.user.username }}
              </dd>
            </dl>
          </div>
          <div class="col-span-2 flex gap-4 mt-4">
            <UiBaseButton
              variant="secondary"
              @click="() => $router.push(`/worlds/${world.slug}`)"
            >
              View World
            </UiBaseButton>
            <UiBaseButton
              variant="primary"
              disabled
            >
              Join World
            </UiBaseButton>
            <UiBaseButton
              v-if="world.owner.id === auth.currentUser.value?.id"
              class="items-center flex"
              variant="secondary"
              disabled
            >
              <Icon name="mdi:settings" size="24"/>
            </UiBaseButton>
          </div>
        </UiCard>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>