<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import type { World, Square } from '~~/types/database';

const route = useRoute()
const auth = useAuth()
const gameState = useGameState()
const teamColor = useTeamColor()
const gameApi = useGameApi()

const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : (route.params.slug ?? '')

// Modal state
const showJoinModal = ref(false)

// Initialize WebSocket
const ws = useGameWebSocket(slug!)

// Fetch world metadata first
const { data: worldData, error: worldError } = await useApiFetch<World>('/api/worlds/' + slug)

// Check if user is in a team
const isPlayerInTeam = computed(() => {
  if (!auth.currentUser.value || !worldData.value?.teams) {
    return false
  }
  const userTeam = worldData.value.teams.find(team =>
    team.members.some(member => member.user.id === auth.currentUser.value?.id)
  )
  return !!userTeam
})

// Check if world is full
const isWorldFull = computed(() => {
  if (!worldData.value) return false
  const totalMembers = worldData.value.teams.reduce((sum, team) => sum + team.members.length, 0)
  return totalMembers >= worldData.value.maxPlayers
})

// Only fetch board if user is in a team
const boardData = ref<Square[] | null>(null)
const boardError = ref<any>(null)
const isFetchingBoard = ref(false)

const fetchBoard = async () => {
  if (!isPlayerInTeam.value) {
    return
  }

  try {
    isFetchingBoard.value = true
    boardData.value = await gameApi.getBoardSquares(slug)
  } catch (error) {
    boardError.value = error
  } finally {
    isFetchingBoard.value = false
  }
}

// Setup WebSocket and fetch board on mount
onMounted(async () => {
  // Setup WebSocket message handler BEFORE connecting
  ws.onMessage((message) => {
    gameState.handleWebSocketMessage(message)
  })

  // Fetch board if user is in a team
  if (isPlayerInTeam.value) {
    await fetchBoard()
    // Connect to WebSocket only if in a team
    await ws.connect()
  }
})

// Disconnect WebSocket on unmount
onUnmounted(() => {
  ws.disconnect()
})

// Initialize game state when data loads
watchEffect(() => {
  if (worldData.value && boardData.value) {
    gameState.initGame(worldData.value, boardData.value)
  }
})

// Refetch board and connect WebSocket when user joins a team
const handleJoined = async () => {
  showJoinModal.value = false
  // Refresh world data to get updated teams
  await refreshNuxtData()
  // Fetch board
  await fetchBoard()
  // Connect WebSocket
  if (isPlayerInTeam.value) {
    await ws.connect()
  }
}

const sortedTeams = computed(() => {
  if (!worldData.value?.teams) {
    return []
  }
  return [...worldData.value.teams].sort((a, b) => a.name.localeCompare(b.name))
})

// Handle square click
function handleSquareClick(square: Square) {
  if (!auth.currentUser.value) {
    alert('You must be logged in to interact with the world.')
    return
  }

  if (!isPlayerInTeam.value) {
    if (isWorldFull.value) {
      alert('This world is full. You cannot join at this time.')
      return
    }
    showJoinModal.value = true
    return
  }

  if (square.owner?.id === auth.currentUser.value?.id) {
    // Upgrade defense bonus if owned by current user
    gameState.defendSquare(square)
  } else {
    // Try to capture square
    gameState.captureSquare(square)
  }
}

// Handle world reset
function handleReset() {
  gameState.resetWorldState()
}
</script>

<template>
  <Head>
    <title v-if="worldData">{{ worldData.name }} - World | Reign</title>
    <title v-else>Loading World... | Reign</title>
  </Head>
  <div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex justify-between items-start mb-6">
      <div v-if="worldData">
        <h1 class="text-3xl font-bold text-foreground">{{ worldData.name }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ worldData.boardSize }}x{{ worldData.boardSize }} | Max Players: {{ worldData.maxPlayers }}
          | Number of teams: {{ worldData.minTeams === worldData.maxTeams ? worldData.maxTeams : worldData.minTeams + ' - ' + worldData.maxTeams }}
          | Team Size: {{ worldData.minTeamSize === worldData.maxTeamSize ? worldData.maxTeamSize : worldData.minTeamSize + ' - ' + worldData.maxTeamSize }}
        </p>
      </div>

      <UiBaseButton
          v-if="worldData?.owner.id === auth.currentUser?.value?.id"
          @click="handleReset"
          :loading="gameState.isResetting.value"
          :disabled="!gameState.worldData.value"
          variant="outline"
      >
        Reset World
      </UiBaseButton>

      <div class="flex gap-4 items-start">
        <!-- WebSocket Status -->
        <div class="px-3 py-2 bg-card rounded-lg border border-border flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="ws.isConnected.value ? 'bg-success' : 'bg-destructive'"
          ></div>
          <p class="text-xs text-muted-foreground">
            {{ ws.isConnected.value ? 'Live' : 'Offline' }}
          </p>
        </div>

        <!-- User Info -->
        <div v-if="auth.currentUser.value" class="px-4 py-2 bg-card rounded-lg border border-border">
          <p class="text-sm text-muted-foreground">Playing as</p>
          <p class="font-semibold text-card-foreground">{{ auth.currentUser.value.username }}</p>
        </div>
      </div>
    </div>

    <!-- Error States -->
    <div v-if="worldError" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">Error loading world</h2>
      <p class="text-sm">{{ worldError }}</p>
    </div>

    <!-- World Full Message -->
    <div v-else-if="worldData && !isPlayerInTeam && isWorldFull" class="bg-yellow-500/10 border border-yellow-500 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">World Full</h2>
      <p class="text-sm">This world has reached its maximum capacity of {{ worldData.maxPlayers }} players. You cannot join at this time.</p>
    </div>

    <!-- Not in Team Prompt -->
    <div v-else-if="worldData && !isPlayerInTeam && !isWorldFull" class="bg-blue-500/10 border border-blue-500 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">Join a Team</h2>
      <p class="text-sm mb-3">You need to join a team to view and interact with this world.</p>
      <UiBaseButton variant="primary" @click="showJoinModal = true">
        Join Team
      </UiBaseButton>
    </div>

    <!-- Board Error (only show if player is in a team) -->
    <div v-else-if="boardError && isPlayerInTeam" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">Error loading board</h2>
      <p class="text-sm">{{ boardError }}</p>
    </div>

    <!-- WebSocket Error -->
    <div v-if="ws.error.value" class="bg-yellow-500/10 border border-yellow-500 text-yellow-700 px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">WebSocket Error</h2>
      <p class="text-sm">{{ ws.error.value }}</p>
      <p class="text-xs mt-1">Check browser console for details. Make sure backend is running on port 8080.</p>
    </div>

    <!-- Teams List (always show if world data loaded) -->
    <div v-if="worldData" class="mb-4 p-4 bg-card container rounded-lg border border-border">
      <h3 class="text-sm font-semibold text-card-foreground mb-3">Teams and players</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
            v-for="team in sortedTeams"
            :key="team.id"
            class="flex items-center gap-2 p-2 bg-background rounded border border-border"
        >
          <div
              class="size-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-foreground"
              :style="{ backgroundColor: teamColor.getTeamColor( team.color ) }"
          >
            <div class="bg-background/30 size-6 rounded flex items-center justify-center">
              <template v-if="isPlayerInTeam && gameState.squares.value.length > 0">
                {{ gameState.squares.value.filter(square => square.owner && team.members.some(member => member.user.id === square.owner!.id)).length }}
              </template>
            </div>
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

    <!-- Game Board (only show if player is in a team) -->
    <div v-if="isPlayerInTeam && gameState.worldData.value && gameState.squares.value.length > 0" class="flex flex-col items-center">
      <GameWorldBoard
        :worldData="gameState.worldData.value"
        :squares="gameState.squares.value"
        :isProcessing="gameState.isProcessing.value"
        :errorMessage="gameState.errorMessage.value"
        @square-click="handleSquareClick"
      />
    </div>

    <!-- Loading State -->
    <div v-else-if="!worldData" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading world...</p>
      </div>
    </div>

    <!-- Join World Modal -->
    <GameJoinWorldModal
      v-if="worldData"
      v-model="showJoinModal"
      :world="worldData"
      @joined="handleJoined"
    />
  </div>
</template>