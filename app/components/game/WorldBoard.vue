<script setup lang="ts">
import type {Square, User} from '~~/types/database';

const auth = useAuth()
const teamColor = useTeamColor()
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

// Get square color based on owner
function getSquareColor(square: Square): string {
  if (!square || !square.owner) {
    return 'currentColor';  // Empty square
  }

  let colorKey;
  const team = (props.worldData as any).teams?.find((t: any) =>
    t.members.some((member: any) => member.user.id === square.owner!.id)
  );
  if (team && team.color) {
    colorKey = team.color;
  }

  if (!colorKey) {
    return 'currentColor'; // Default color if no team color found
  }

  return teamColor.getTeamColor( colorKey);
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