<script setup lang="ts">
import type { Square } from '~~/types/database';

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
  if (!square || !square.ownerId) {
    return 'currentColor';  // Empty square
  }

  // Different colors for different players
  const colors = ['hsl(220 70% 50%)','hsl(160 60% 45%)','hsl(30 80% 55%)','hsl(280 65% 60%)'];
  const hash = square.ownerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] ?? 'white';
}

// Handle square click
function handleSquareClick(square: Square){
  if (!props.isProcessing) {
    emit('square-click', square);
  }
}

const squareSize = 100;
const squareBorder = 10;
</script>

<template>
  <div>
    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>

    <!-- Board -->
    <div style="position: relative;">
      <svg :width="(worldData.boardSize * squareSize)+squareBorder" :height="(worldData.boardSize * squareSize)+squareBorder" class="fill-current mb-4 bg-primary text-muted">
        <template
            v-for="square in squares"
            :key="square.id"
        >
          <rect
            class="hover:stroke-muted-foreground"
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

      <!-- Loading overlay -->
<!--      <div v-if="isProcessing">-->
<!--        Processing...-->
<!--      </div>-->
    </div>

  </div>
</template>