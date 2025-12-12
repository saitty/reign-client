<script setup lang="ts">
import type { World, Square } from '~~/types/database';

const config = useRuntimeConfig()
const route = useRoute()
const auth = useAuth()
const gameState = useGameState()

const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : (route.params.slug ?? '')

// Initialize WebSocket
const ws = useGameWebSocket(slug)

// Initialize auth on mount
onMounted(() => {
  auth.initAuth()

  // Auto-login for testing if no user
  if (!auth.currentUser.value) {
    auth.mockLogin(`Player${Math.floor(Math.random() * 1000)}`)
  }

  // Setup WebSocket message handler BEFORE connecting
  ws.onMessage((message) => {
    gameState.handleWebSocketMessage(message)
  })

  // Connect to WebSocket
  ws.connect()
})

// Disconnect WebSocket on unmount
onUnmounted(() => {
  ws.disconnect()
})

// Fetch world metadata
const { data: worldData, error: worldError } = await useFetch<World>('/api/worlds/' + slug, {
  baseURL: config.public.apiBase
})

// Fetch board squares
const { data: boardData, error: boardError } = await useFetch<Square[]>('/api/worlds/' + slug + '/board', {
  baseURL: config.public.apiBase
})

// Initialize game state when data loads
watchEffect(() => {
  if (worldData.value && boardData.value) {
    gameState.initGame(worldData.value, boardData.value)
  }
})

// Handle square click
function handleSquareClick(square: Square) {
  if ( square.ownerId === auth.currentUser.value?.id ) {
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
        </p>
      </div>

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
    <div v-if="worldError || boardError" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">Error loading world</h2>
      <p class="text-sm">{{ worldError || boardError }}</p>
    </div>

    <!-- WebSocket Error -->
    <div v-if="ws.error.value" class="bg-yellow-500/10 border border-yellow-500 text-yellow-700 px-4 py-3 rounded-lg mb-6">
      <h2 class="font-bold">WebSocket Error</h2>
      <p class="text-sm">{{ ws.error.value }}</p>
      <p class="text-xs mt-1">Check browser console for details. Make sure backend is running on port 8080.</p>
    </div>

    <!-- Game Board -->
    <div v-else-if="gameState.worldData.value && gameState.squares.value.length > 0" class="flex flex-col items-center">
      <GameWorldBoard
        :worldData="gameState.worldData.value"
        :squares="gameState.squares.value"
        :isProcessing="gameState.isProcessing.value"
        :errorMessage="gameState.errorMessage.value"
        @square-click="handleSquareClick"
      />

      <UiBaseButton
        @click="handleReset"
        :loading="gameState.isResetting.value"
        :disabled="!gameState.worldData.value"
        variant="outline"
        class="mt-6"
      >
        Reset World
      </UiBaseButton>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading world...</p>
      </div>
    </div>
  </div>
</template>