<script setup lang="ts">
import type { Square } from '~~/types/database';

const auth = useAuth()
const team = useTeam()
const colorMode = useColorMode()

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


// TODO this is just temporary until we have proper teams
const teamColorKeys = <string[]>[
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'teal'
];

const playerStats = computed(() => {
  const squareCounts = new Map<string, number>();

  // Count squares per player
  props.squares.forEach(square => {
    if (square.ownerId) {
      squareCounts.set(square.ownerId, (squareCounts.get(square.ownerId) ?? 0) + 1);
    }
  });

  const sortedPlayerIds = Array.from(squareCounts.keys()).sort();

  const stats = new Map<string, { ownerId: string; squareCount: number; color: string }>();
  sortedPlayerIds.forEach((ownerId, index) => {
    stats.set(ownerId, {
      ownerId,
      squareCount: squareCounts.get(ownerId)!,
      // TODO teams will be stored in database later
      color: team.getTeamColor(
        <any>teamColorKeys[index % teamColorKeys.length], <'dark' | 'light'>colorMode.value
      )
    });
  });

  return stats;
});

// Get color index for a player (ensures consistent unique colors)
const playerColorMap = computed(() => {
  const colorMap = new Map<string, string>();
  playerStats.value.forEach((stat, ownerId) => {
    colorMap.set(ownerId, stat.color);
  });
  return colorMap;
});

// Get square color based on owner
function getSquareColor(square: Square): string {
  if (!square || !square.ownerId) {
    return 'currentColor';  // Empty square
  }

  return playerColorMap.value.get(square.ownerId) ?? 'currentColor';
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
    <div v-if="errorMessage" class="bg-destructive border border-destructive text-destructive-foreground px-4 py-3 rounded mb-4" role="alert">
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
            :style="{ backgroundColor: stat.color }"
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
        class="w-full h-auto fill-current text-muted"
        preserveAspectRatio="xMidYMid meet"
      >
        <template
          v-for="square in squares"
          :key="square.id"
        >
          <rect
            class="hover:stroke-foreground transition-colors stroke-background"
            :x="((square.x) * squareSize)+squareBorder"
            :y="((square.y) * squareSize)+squareBorder"
            :width="squareSize - squareBorder"
            :height="squareSize - squareBorder"
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
            class="stroke-foreground fill-foreground/30 dark:stroke-background dark:fill-background/30"
            :x="((square.x) * squareSize) + squareBorder + (squareSize - squareBorder) / 4"
            :y="((square.y) * squareSize) + squareBorder + (squareSize - squareBorder) / 4"
            :width="(squareSize - squareBorder) / 2"
            :height="(squareSize - squareBorder) / 2"
            :stroke-width="2"
            pointer-events="none"
          />
        </template>
      </svg>
    </div>
  </div>
</template>