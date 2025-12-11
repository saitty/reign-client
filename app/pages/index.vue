<script setup lang="ts">
import type { Square, World } from '~~/types/database';

const worldData = ref<World>({
  id: '1',
  slug: 'kos',
  name: 'Kos',
  ownerId: 'Saitty',
  boardSize: 5,
  maxPlayers: 5,
  createdAt: ''
});

const squares = ref<Square[]>([]);
// Initialize squares for testing
for (let x = 0; x < worldData.value.boardSize; x++) {
  for (let y = 0; y < worldData.value.boardSize; y++) {
    squares.value.push(  {
      id: `${x}-${y}`,
      worldSlug: 'kos',
      x: x,
      y: y,
      ownerId: null,
      defenseBonus: 0
    },);
  }
}

const players = ['Alice', 'Bob', 'Charlie', 'Diana'];
const currentPlayerId = ref<string>(players[0]!);
const config = useRuntimeConfig()
const isResetting = ref(false);
const resetError = ref('');
const isProcessing = ref(false);
const errorMessage = ref('');

// Get stats
const stats = computed(() => ({
  total: squares.value.length,
  owned: squares.value.filter(s => s.ownerId).length,
  empty: squares.value.filter(s => !s.ownerId).length,
  mineCount: squares.value.filter(s => s.ownerId === currentPlayerId.value).length,
  winningPlayer: (() => {
    const counts: Record<string, number> = {};
    squares.value.forEach(s => {
      if (s.ownerId) {
        counts[s.ownerId] = (counts[s.ownerId] || 0) + 1;
      }
    });
    let maxCount = 0;
    let winner = null;
    for (const playerId in counts) {
      if (counts[playerId]! > maxCount) {
        maxCount = counts[playerId]!;
        winner = playerId;
      }
    }
    return winner;
  })()
}));

async function resetBoard() {
  // if (!confirm('Are you sure you want to reset the board? All progress will be lost!')) {
  //   return;
  // }

  // only restart offline
  isResetting.value = true;
  squares.value.forEach(s => {
    s.ownerId = null;
    s.defenseBonus = 0;
  });
  isResetting.value = false;
  return;

  // isResetting.value = true;
  // resetError.value = '';
  //
  // try {
  //   await $fetch(`/api/worlds/${worldData.value.slug}/reset`, {
  //     method: 'POST',
  //     baseURL: config.public.apiBase
  //   });
  //
  //
  //   squares.value = await $fetch<Square[]>(`/api/worlds/${worldData.value.slug}/board`, {
  //     baseURL: config.public.apiBase
  //   });
  // } catch (error: any) {
  //   console.error('Failed to reset board:', error);
  //   resetError.value = 'Failed to reset board. Please try again.';
  // } finally {
  //   isResetting.value = false;
  // }
}

function onSquareClick(squareId: string) {
  // handleSquareClick(squareId);
  // Make offline for testing
  const squareIndex = squares.value.find(s => s.id === squareId);

  if (!squareIndex) { return; }

  if (!squareIndex.ownerId) {
    squareIndex.ownerId = currentPlayerId.value;
  } else if (squareIndex.ownerId === currentPlayerId.value) {
    squareIndex.defenseBonus = 1;
  } else if (squareIndex.defenseBonus === 1) {
    squareIndex.defenseBonus = 0;
  } else {
    squareIndex.ownerId = currentPlayerId.value;
  }
}

async function handleSquareClick(squareId: string) {
  const square = squares.value.find(s => s.id === squareId);

  if (!square) {
    errorMessage.value = 'Square not found';
    setTimeout(() => errorMessage.value = '', 2000);
    return;
  }

  // Check if already owned
  if (square.ownerId) {
    errorMessage.value = `Square already owned by ${square.ownerId}`;
    setTimeout(() => errorMessage.value = '', 2000);
    return;
  }

  isProcessing.value = true;
  errorMessage.value = '';

  try {
    // Call backend to capture square
    const response = await $fetch<Square>(`/api/worlds/${worldData.value.slug}/actions/capture`, {
      method: 'POST',
      baseURL: config.public.apiBase,
      body: {
        x: square.x,
        y: square.y,
        playerId: currentPlayerId.value
      }
    });

    // Update local state with new square data
    const index = squares.value.findIndex(s => s.x === square.x && s.y === square.y);
    if (index !== -1) {
      squares.value[index] = response;
    }

    console.log('Square captured!', response);
  } catch (error: any) {
    console.error('Failed to capture square:', error);
    errorMessage.value = error.data?.message || 'Failed to capture square';
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <Head>
    <title>Reign</title>
  </Head>
  <BaseCard class="container mt-4">
    <label>Player: </label>
<!--    <input v-model="currentPlayerId" class="bg-input border border-border rounded px-2 py-1" placeholder="Enter your username" />-->
    <form>
      <label
          v-for="player in players"
          :key="player"
          class="mr-4"
      >
        <input v-model="currentPlayerId" type="radio" :id="player" name="player" :value="player" class="mr-1">
        {{ player }}
      </label>
    </form>
      <!-- Stats -->
    <div style="margin-top: 20px;">
      <h3>Board Stats</h3>
      <p>Total Squares: {{ stats.total }}</p>
      <p>Your Squares: {{ stats.mineCount }}</p>
      <p>Owned by Others: {{ stats.owned - stats.mineCount }}</p>
      <p>Empty Squares: {{ stats.empty }}</p>
      <p>Winning Player: {{ stats.winningPlayer || 'N/A' }}</p>
    </div>
  </BaseCard>
  <div class="container mt-4">

    <WorldBoard 
      :worldData="worldData"
      :boardData="squares"
      @square-click="onSquareClick"
    />

    <div v-if="resetError" style="color: red; margin: 10px 0;">
      {{ resetError }}
    </div>

    <button
      @click="resetBoard"
      :disabled="isResetting || isProcessing"
      class="bg-primary text-primary-foreground rounded-md px-4 py-2 mt-4 hover:bg-primary/80 transition-colors"
      :style="{
        opacity: (isResetting || isProcessing) ? 0.5 : 1,
        cursor: (isResetting || isProcessing) ? 'not-allowed' : 'pointer'
      }"
    >
      {{ isResetting ? 'Resetting...' : 'Reset Board' }}
    </button>
  </div>
</template>