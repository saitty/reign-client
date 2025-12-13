<script setup lang="ts">
import type { Square } from '~~/types/database';

const auth = useAuth()

const props = defineProps<{
  worldData: {
    name: string;
    slug: string;
    boardSize: number;
    maxPlayers: number;
  };
  squares: Square[];
  isProcessing?: boolean;
  errorMessage?: string;
}>()

const emit = defineEmits<{
  'square-click': [square: Square];
}>();

// Player colors (max 4 players)
const playerColors = ['hsl(220 70% 50%)', 'hsl(160 60% 45%)', 'hsl(30 80% 55%)', 'hsl(280 65% 60%)'];

// Compute player statistics: who owns what and how many squares
const playerStats = computed(() => {
  const squareCounts = new Map<string, number>();

  // Count squares per player
  props.squares.forEach(square => {
    if (square.ownerId) {
      squareCounts.set(square.ownerId, (squareCounts.get(square.ownerId) ?? 0) + 1);
    }
  });

  // Sort player IDs alphabetically for stable color assignment
  const sortedPlayerIds = Array.from(squareCounts.keys()).sort();

  // Create stats with stable color indices based on sorted order
  const stats = new Map<string, { ownerId: string; squareCount: number; colorIndex: number }>();
  sortedPlayerIds.forEach((ownerId, index) => {
    stats.set(ownerId, {
      ownerId,
      squareCount: squareCounts.get(ownerId)!,
      colorIndex: index % playerColors.length
    });
  });

  return stats;
});

// Get color index for a player (ensures consistent unique colors)
const playerColorMap = computed(() => {
  const colorMap = new Map<string, number>();
  playerStats.value.forEach((stat, ownerId) => {
    colorMap.set(ownerId, stat.colorIndex);
  });
  return colorMap;
});

// Get square color based on owner
function getSquareColor(square: Square): string {
  if (!square || !square.ownerId) {
    return 'currentColor';  // Empty square
  }

  const colorIndex = playerColorMap.value.get(square.ownerId) ?? 0;
  return playerColors[colorIndex] ?? playerColors[0]!;
}

// Handle square click
function handleSquareClick(square: Square){
  if (!props.isProcessing) {
    emit('square-click', square);
  }
}

const squareSize = 100;
const squareBorder = 10;

// Calculate viewBox dimensions
const viewBoxSize = computed(() => {
  const size = (props.worldData.boardSize * squareSize) + squareBorder;
  return `0 0 ${size} ${size}`;
});

const minSquareSize = 32; // 2rem = 32px

const minBoardSize = computed(() => {
  const size = (props.worldData.boardSize * minSquareSize) + squareBorder;
  return `${size}px`;
});
</script>

<template>
  <div class="w-full">
    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>

    <!-- Player Stats -->
    <div v-if="playerStats.size > 0" class="mb-4 p-4 bg-card rounded-lg border border-border">
      <h3 class="text-sm font-semibold text-card-foreground mb-3">Players</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          v-for="[ownerId, stat] in playerStats"
          :key="ownerId"
          class="flex items-center gap-2 p-2 bg-background rounded border border-border"
        >
          <div
            class="size-8 rounded shrink-0"
            :style="{ backgroundColor: playerColors[stat.colorIndex] }"
          ></div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-foreground truncate">{{ stat.squareCount }} squares</p>
            <p v-if="ownerId === auth.currentUser.value?.id" class="text-xs text-muted-foreground">Me</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Board Container with scroll -->
    <div class="w-full max-w-full overflow-auto border border-border rounded-lg">
      <svg
        :viewBox="viewBoxSize"
        :style="{ minWidth: minBoardSize, minHeight: minBoardSize }"
        class="w-full h-auto fill-current  text-muted"
        preserveAspectRatio="xMidYMid meet"
      >
        <template
          v-for="square in squares"
          :key="square.id"
        >
          <rect
            class="hover:stroke-muted-foreground transition-colors"
            :x="((square.x) * squareSize)+squareBorder"
            :y="((square.y) * squareSize)+squareBorder"
            :width="squareSize - squareBorder"
            :height="squareSize - squareBorder"
            stroke="black"
            :stroke-width="squareBorder"
            :fill="getSquareColor(square)"
            @click="handleSquareClick(square)"
            :style="{
              cursor: isProcessing ? 'wait' : 'pointer'
            }"
          />
          <!-- Defense bonus indicator -->
          <rect
            v-if="square.defenseBonus === 1"
            :x="((square.x) * squareSize) + squareBorder + (squareSize - squareBorder) / 4"
            :y="((square.y) * squareSize) + squareBorder + (squareSize - squareBorder) / 4"
            :width="(squareSize - squareBorder) / 2"
            :height="(squareSize - squareBorder) / 2"
            fill="rgba(0, 0, 0, 0.3)"
            stroke="black"
            :stroke-width="2"
            pointer-events="none"
          />
        </template>
      </svg>
    </div>
  </div>
</template>