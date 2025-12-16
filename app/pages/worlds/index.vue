<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import type { World } from '~~/types/database';

const auth = useAuth()
const teamColor = useTeamColor()

const { data, error, pending, refresh } = useApiFetch<World[]>('/api/worlds')

// Modal state
const showJoinModal = ref(false)
const selectedWorld = ref<World | null>(null)
const isLeaving = ref<string | null>(null) // Track which world is being left

const gameApi = useGameApi()

const sortedTeams = (world: World) => {
  return [...world.teams].sort((a, b) => a.name.localeCompare(b.name))
}

// Check if user is in a team for a specific world
const isUserInTeam = (world: World) => {
  const userId = auth.currentUser.value?.id
  if (!userId) return false

  return world.teams.some(team =>
    team.members.some(member => member.user.id === userId)
  )
}

// Open join modal
const openJoinModal = (world: World) => {
  selectedWorld.value = world
  showJoinModal.value = true
}

// Handle successful join
const handleJoined = async () => {
  // after joining, view the world
  if (selectedWorld.value) {
    showJoinModal.value = false
    await refresh()
    // Navigate to the world page
    window.location.href = `/worlds/${selectedWorld.value.slug}`
  }
}

// Leave team
const handleLeaveTeam = async (world: World) => {
  if (!confirm(`Are you sure you want to leave your team in ${world.name}?`)) {
    return
  }

  try {
    isLeaving.value = world.id
    await gameApi.leaveTeam(world.slug)
    await refresh()
  } catch (error: any) {
    alert(error?.data?.error || 'Failed to leave team')
  } finally {
    isLeaving.value = null
  }
}
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
          <div class="p-4 bg-card rounded-lg border border-border">
            <h3 class="text-sm font-semibold text-card-foreground mb-3">Teams and players</h3>
            <div class="grid gap-3">
              <div
                  v-for="team in sortedTeams(world)"
                  :key="team.id"
                  class="flex items-center gap-2 p-2 bg-background rounded border border-border"
              >
                <div
                    class="size-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-foreground"
                    :style="{ backgroundColor: teamColor.getTeamColor( team.color ) }"
                >
                  <div class="bg-background/30 size-6 rounded flex items-center justify-center"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-foreground truncate">{{ team.name }}</p>
                  <p class="text-xs text-muted-foreground">
                <span v-for="(member, index) in team.members" :key="member.user.id">
                  {{ member.user.username }}<span v-if="index < team.members.length - 1">, </span>
                </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="md:col-span-2 flex flex-col md:flex-row gap-4 mt-4">
            <UiBaseButton
              variant="secondary"
              @click="() => $router.push(`/worlds/${world.slug}`)"
            >
              View World
            </UiBaseButton>

            <UiBaseButton
              v-if="!isUserInTeam(world)"
              variant="primary"
              @click="openJoinModal(world)"
            >
              Join World
            </UiBaseButton>

            <template v-else>
              <UiBaseButton
                variant="success"
                disabled
              >
                Already Joined
              </UiBaseButton>
              <UiBaseButton
                variant="danger"
                :loading="isLeaving === world.id"
                :disabled="isLeaving === world.id"
                @click="handleLeaveTeam(world)"
              >
                Leave Team
              </UiBaseButton>
            </template>
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

    <!-- Join World Modal -->
    <GameJoinWorldModal
      v-if="selectedWorld !== null"
      v-model="showJoinModal"
      :world="selectedWorld!"
      @joined="handleJoined"
    />
  </div>
</template>

<style scoped>

</style>