<script setup lang="ts">
import type { Square } from '~~/types/database';

const config = useRuntimeConfig()

const props = defineProps<{
  worldData: {
    name: string;
    slug: string;
    boardSize: number;
    maxPlayers: number;
  };
  boardData: Square[];
}>()

const emit = defineEmits<{
  'square-click': [squareId: string];
}>();

const squares = ref<Square[]>(props.boardData);

// Get square color based on owner
function getSquareColor(square: Square): string {

  if (!square || !square.ownerId) {
    return 'white';  // Empty square
  }

  // Different colors for different players
  const colors = ['hsl(220 70% 50%)','hsl(160 60% 45%)','hsl(30 80% 55%)','hsl(280 65% 60%)','hsl(340 75% 55%)'];
  const hash = square.ownerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] ?? 'white';
}

// Handle square click - capture it!
const isProcessing = ref(false);
const errorMessage = ref('');

function handleSquareClick(square: Square){
  emit('square-click', square.id);
}

const squareSize = 100;
const squareBorder = 10;
</script>

<template>
  <div>
    <!-- Error message -->
    <div v-if="errorMessage" style="color: red; margin: 10px 0;">
      {{ errorMessage }}
    </div>

    <!-- Board -->
    <div style="position: relative;">
      <svg :width="(worldData.boardSize * squareSize)+squareBorder" :height="(worldData.boardSize * squareSize)+squareBorder" class="fill-current mb-4">
        <template
            v-for="square in squares"
            :key="square.id"
        >
          <rect
            class="square"
            :x="((square.x) * squareSize)+squareBorder"
            :y="((square.y) * squareSize)+squareBorder"
            :width="squareSize - squareBorder"
            :height="squareSize - squareBorder"
            stroke="black"
            :stroke-width="squareBorder"
            :fill="getSquareColor(square)"
            @click="handleSquareClick(square)"
            :style="{
              cursor: isProcessing ? 'wait' : 'pointer',
              opacity: isProcessing ? 0.5 : 1
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
      <div v-if="isProcessing" style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.7);
      ">
        Processing...
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.square:hover {
  stroke-width: v-bind(squareBorder);
  stroke: #e0234a;
}
</style>