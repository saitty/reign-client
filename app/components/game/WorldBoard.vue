<script setup lang="ts">
import type { Square } from '~~/types/database';

const teamColor = useTeamColor()

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

const isHexGrid = ref(true);

// Hover state (the currently hovered square)
const hoveredSquare = ref<Square | null>(null);

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

// Hover handlers
function handleMouseEnter(square: Square) {
  hoveredSquare.value = square;
}
function handleMouseLeave() {
  hoveredSquare.value = null;
}

// Provide neighbor detection (returns array of coordinate pairs)
function getNeighborCoordsForSquare(square: Square, hex: boolean) : Array<{x:number,y:number}> {
  if (!square) return [];
  const x = square.x;
  const y = square.y;

  if (!hex) {
    return [
      { x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 },
        // diagonal neighbors
      // { x: x + 1, y: y + 1 }, { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }, { x: x - 1, y: y - 1 }
    ];
  }

  // hex grid using odd-r horizontal layout offsets (rows shifted on odd rows)
  // Source: odd-r offset neighbor tables (compatible with the layout used in getHexPoints)
  const evenRow = (y % 2) === 0;
  if (evenRow) {
    return [
      { x: x + 1, y: y }, { x: x, y: y - 1 }, { x: x - 1, y: y - 1 }, { x: x - 1, y: y }, { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }
    ];
  } else {
    return [
      { x: x + 1, y: y }, { x: x + 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
    ];
  }
  // fallback (shouldn't be reached)
  return [];
}

// Compute a set of hovered neighbor IDs for fast lookup in template
const hoveredNeighborIds = computed(() => {
  const s = new Set<string | number>();
  if (!hoveredSquare.value) return s;

  // include the hovered square itself
  s.add(hoveredSquare.value.id as any);

  const neigh = getNeighborCoordsForSquare(hoveredSquare.value, isHexGrid.value);
  for (const n of neigh) {
    const found = props.squares.find((sq) => sq.x === n.x && sq.y === n.y);
    if (found) s.add(found.id as any);
  }
  return s;
});

const squareSize = 100;
const squareBorder = 10;

const viewSquareBoxSize = computed(() => {
  const size = (props.worldData.boardSize * squareSize) + squareBorder;
  return `0 0 ${size} ${size}`;
});

// Calculate viewBox dimensions based on actual hex grid extents
const viewHexBoxSize = computed(() => {
  const N = props.worldData.boardSize;
  const pad = squareBorder;

  // Desired spacing between hex origins (preferred)
  const desiredHorizontalSpacing = squareSize * 2;

  // Available drawing width (logical board width)
  const availableWidth = (props.worldData.boardSize * squareSize);

  // Try to compute a hexWidth that fits while keeping preferred spacing
  const maxOffset = desiredHorizontalSpacing / 2;
  // initial candidate hex width
  let hexWidth = availableWidth - ((N - 1) * desiredHorizontalSpacing) - maxOffset - squareBorder;

  // enforce a reasonable minimum hex width
  const minHexWidth = 8;

  let horizontalSpacing = desiredHorizontalSpacing;

  if (hexWidth < minHexWidth) {
    // Preferred spacing won't fit; fallback to using a hex width equal to visual square size
    hexWidth = Math.max(minHexWidth, squareSize - squareBorder);
    // Solve horizontalSpacing from available width: available = (N-1)*hs + hexWidth + maxOffset + squareBorder
    // => hs = (available - hexWidth - squareBorder) / (N - 0.5)
    horizontalSpacing = (availableWidth - hexWidth - squareBorder) / (N - 0.5);
    // Clamp to a small positive value to avoid NaN/infinite
    horizontalSpacing = Math.max(4, horizontalSpacing);
  }

  // Now compute hexHeight from hexWidth (pointy-top hex: width = sqrt(3)/2 * height)
  const hexHeight = hexWidth / (Math.sqrt(3) / 2);
  // vertical spacing between row origins (to make rows overlap vertically)
  const verticalSpacing = hexHeight * 0.825;

  // Compute extents of the grid
  // leftmost originX is pad (for even rows). Rightmost originX could include half-offset.
  const minX = pad;
  const maxX = (N - 1) * horizontalSpacing + (horizontalSpacing / 2) + pad + hexWidth;
  const width = Math.max(0, maxX - minX) + pad; // add right padding

  const minY = pad;
  const maxY = (N - 1) * verticalSpacing + pad + hexHeight;
  const height = Math.max(0, maxY - minY) + pad; // add bottom padding

  return `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`;
});

const viewBoxSize = computed(() => {
  return isHexGrid.value ? viewHexBoxSize.value : viewSquareBoxSize.value;
});

const minSquareSize = 32; // 2rem = 32px

const minBoardSize = computed(() => {
  const size = (props.worldData.boardSize * minSquareSize) + squareBorder;
  return `${size}px`;
});


function getHexPoints(square: Square, borderOffset = 0): string {
  const N = props.worldData.boardSize;
  const pad = squareBorder / 2;

  // Preferred horizontal spacing
  const desiredHorizontalSpacing = squareSize * 2;
  const availableWidth = (props.worldData.boardSize * squareSize);
  const maxOffset = desiredHorizontalSpacing / 2;

  // Try preferred spacing first
  let hexWidth = availableWidth - ((N - 1) * desiredHorizontalSpacing) - maxOffset - squareBorder;
  const minHexWidth = 8;
  let horizontalSpacing = desiredHorizontalSpacing;
  if (hexWidth < minHexWidth) {
    // fallback: keep visual hex size near squareSize and compute spacing that fits
    hexWidth = Math.max(minHexWidth, squareSize - squareBorder);
    horizontalSpacing = (availableWidth - hexWidth - squareBorder) / (N - 0.5);
    horizontalSpacing = Math.max(4, horizontalSpacing);
  }

  const hexHeight = hexWidth / (Math.sqrt(3) / 2);
  const verticalSpacing = hexHeight * 0.825

  // origin is the top-left corner of the hex bounding box for this cell
  const originX = (square.x) * horizontalSpacing + (square.y % 2 ? horizontalSpacing / 2 : 0) + pad;
  const originY = (square.y) * verticalSpacing + pad;

  const halfW = hexWidth / 2;
  const qh = hexHeight / 4; // quarter height offset used for pointy hex

  const cx = originX + halfW;
  const cy = originY + hexHeight / 2;

  // raw corner points (pointy-top hex): top, top-right, bottom-right, bottom, bottom-left, top-left
  const rawPoints: number[][] = [
    [cx, originY],
    [originX + hexWidth, originY + qh],
    [originX + hexWidth, originY + (3 * qh)],
    [cx, originY + hexHeight],
    [originX, originY + (3 * qh)],
    [originX, originY + qh]
  ];

  // If borderOffset is provided, move each point toward the hex center by that many pixels.
  if (borderOffset && borderOffset > 0) {
    const shrunk = rawPoints.map((p) => {
      const x = p[0]! as number;
      const y = p[1]! as number;
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return [x, y] as [number, number];
      // new length along the same direction; clamp to >= 0
      const newLen = Math.max(0, len - borderOffset);
      const scale = newLen / len;
      return [cx + dx * scale, cy + dy * scale] as [number, number];
    });
    return shrunk.map(p => `${p[0]!.toFixed(2)},${p[1]!.toFixed(2)}`).join(' ');
  }

  return rawPoints.map(p => `${p[0]},${p[1]}`).join(' ');
}
</script>

<template>
  <div class="w-full">
    <!-- Error message -->
    <div v-if="errorMessage" class="bg-destructive border border-destructive text-destructive-foreground px-4 py-3 rounded mb-4" role="alert">
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>

    <div>
      <label class="inline-flex items-center mb-2 cursor-pointer">
        <input type="checkbox" class="form-checkbox" v-model="isHexGrid" />
        <span class="ml-2">Use Hex Grid</span>
      </label>
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
          <template v-if="isHexGrid">
            <!-- Highlight overlay for hovered / neighbor (subtle white overlay) -->
            <polygon
              class="stroke-foreground"
              :points="getHexPoints(square)"
              :stroke-width="squareBorder"
              :style="{
                opacity: hoveredNeighborIds.has(square.id) ? (hoveredSquare?.id === square.id ? 1 : 0.25) : 0,
                pointerEvents: 'none',
                transition: 'opacity 300ms ease'
              }"
            />

            <polygon
              :points="getHexPoints(square)"
              :fill="getSquareColor(square)"
              @click="handleSquareClick(square)"
              @mouseenter="handleMouseEnter(square)"
              @mouseleave="handleMouseLeave"
              :style="{
                cursor: isProcessing ? 'wait' : 'pointer'
              }"
            />

            <!-- Defense bonus indicator -->
            <polygon
              v-if="square.defenseBonus === 1"
              class="stroke-foreground fill-foreground/30 dark:stroke-background dark:fill-background/30"
              :points="getHexPoints(square, 25)"
              :stroke-width="2"
              pointer-events="none"
            />
          </template>
          <template v-else>
            <!-- Highlight overlay for hovered / neighbor (subtle white overlay) -->
            <rect
                class="stroke-foreground"
                :x="((square.x) * squareSize)+squareBorder"
                :y="((square.y) * squareSize)+squareBorder"
                :width="squareSize - squareBorder"
                :height="squareSize - squareBorder"
                :stroke-width="squareBorder"
                :style="{
                  opacity: hoveredNeighborIds.has(square.id) ? (hoveredSquare?.id === square.id ? 1 : 0.25) : 0,
                  pointerEvents: 'none',
                  transition: 'opacity 300ms ease'
                }"
            />

            <rect
              :x="((square.x) * squareSize)+squareBorder"
              :y="((square.y) * squareSize)+squareBorder"
              :width="squareSize - squareBorder"
              :height="squareSize - squareBorder"
              :stroke-width="squareBorder"
              :fill="getSquareColor(square)"
              @click="handleSquareClick(square)"
              @mouseenter="handleMouseEnter(square)"
              @mouseleave="handleMouseLeave"
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
        </template>
      </svg>
    </div>
  </div>
</template>

