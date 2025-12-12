import type { Square, World } from '~~/types/database'

interface GameState {
  squares: Square[]
  worldData: World | null
  isProcessing: boolean
  errorMessage: string
}

export const useGameState = () => {
  const gameApi = useGameApi()
  const auth = useAuth()

  // Reactive game state
  const state = reactive<GameState>({
    squares: [],
    worldData: null,
    isProcessing: false,
    errorMessage: ''
  })

  /**
   * Initialize game state with world data
   */
  const initGame = (world: World, squares: Square[]) => {
    state.worldData = world
    state.squares = squares
    state.isProcessing = false
    state.errorMessage = ''
  }

  /**
   * Update a specific square in the state
   */
  const updateSquare = (updatedSquare: Square) => {
    const index = state.squares.findIndex(s => s.id === updatedSquare.id)
    if (index !== -1) {
      state.squares[index] = updatedSquare
    }
  }

  /**
   * Handle square capture with optimistic updates
   */
  const captureSquare = async (square: Square) => {
    if (!state.worldData || !auth.currentUser.value) {
      state.errorMessage = 'Please login first'
      return
    }

    if (state.isProcessing) {
      return // Prevent double-clicks
    }

    state.isProcessing = true
    state.errorMessage = ''

    // Store original state for rollback
    const originalOwnerId = square.ownerId
    const currentUserId = auth.currentUser.value.id

    try {
      // Optimistic update - update UI immediately
      square.ownerId = currentUserId

      // Call backend
      const updatedSquare = await gameApi.captureSquare(
        state.worldData.slug,
        square.x,
        square.y,
        currentUserId
      )

      // Update with server response
      updateSquare(updatedSquare)
    } catch (error: any) {
      // Rollback on error
      square.ownerId = originalOwnerId

      // Set error message
      if (error.response?.status === 400) {
        state.errorMessage = 'Invalid move! You can only capture adjacent squares.'
      } else if (error.response?.status === 404) {
        state.errorMessage = 'Square not found.'
      } else {
        state.errorMessage = error.message || 'Failed to capture square. Please try again.'
      }

      console.error('Capture error:', error)
    } finally {
      state.isProcessing = false
    }
  }

  /**
   * Handle square defend with optimistic updates
   */
  const defendSquare = async (square: Square) => {
    if (!state.worldData || !auth.currentUser.value) {
      state.errorMessage = 'Please login first'
      return
    }

    if (state.isProcessing) {
      return // Prevent double-clicks
    }

    state.isProcessing = true
    state.errorMessage = ''

    // Store original state for rollback
    const originalDefenseBonus = square.defenseBonus
    const currentDefenseBonus = 1

    try {
      // Optimistic update - update UI immediately
      square.defenseBonus = currentDefenseBonus

      // Call backend
      const updatedSquare = await gameApi.defendSquare(
        state.worldData.slug,
        square.x,
        square.y,
        auth.currentUser.value.id
      )

      // Update with server response
      updateSquare(updatedSquare)
    } catch (error: any) {
      // Rollback on error
      square.defenseBonus = originalDefenseBonus

      // Set error message
      if (error.response?.status === 400) {
        state.errorMessage = 'Invalid move! You can only defend your own squares.'
      } else if (error.response?.status === 404) {
        state.errorMessage = 'Square not found.'
      } else {
        state.errorMessage = error.message || 'Failed to defend square. Please try again.'
      }

      console.error('Capture error:', error)
    } finally {
      state.isProcessing = false
    }
  }

  /**
   * Reset world to initial state (clear all ownership)
   */
  const resetWorldState = async () => {
    if (!state.worldData) {
      state.errorMessage = 'No world loaded'
      return
    }

    if (state.isProcessing) {
      return // Prevent double-clicks
    }

    state.isProcessing = true
    state.errorMessage = ''

    try {
      // Call backend to reset world
      await gameApi.resetWorld(state.worldData.slug)

      // Fetch fresh board state
      const updatedSquares = await gameApi.getBoardSquares(state.worldData.slug)

      // Update local state with reset board
      state.squares = updatedSquares
    } catch (error: any) {
      // Set error message
      if (error.response?.status === 404) {
        state.errorMessage = 'World not found.'
      } else {
        state.errorMessage = error.message || 'Failed to reset world. Please try again.'
      }

      console.error('Reset world error:', error)
    } finally {
      state.isProcessing = false
    }
  }

  /**
   * Handle WebSocket message (for real-time updates from other players)
   */
  const handleWebSocketMessage = async (message: {
    type: 'SQUARE_CAPTURED' | 'SQUARE_DEFENDED' | 'WORLD_RESET'
    square: Square | null
    playerId: string | null
  }) => {
    // Ignore our own messages (we already updated optimistically)
    if (message.playerId === auth.currentUser.value?.id) {
      return
    }

    if (message.type === 'WORLD_RESET') {
      // Reload entire board
      if (state.worldData) {
        try {
          const updatedSquares = await gameApi.getBoardSquares(state.worldData.slug)
          state.squares = updatedSquares
        } catch (error) {
          console.error('Failed to reload board after reset:', error)
        }
      }
    } else if (message.square) {
      // Update single square
      updateSquare(message.square)
    }
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    state.errorMessage = ''
  }

  /**
   * Reset game state
   */
  const resetGame = () => {
    state.squares = []
    state.worldData = null
    state.isProcessing = false
    state.errorMessage = ''
  }

  return {
    // State (readonly to prevent direct mutation)
    squares: toRef(state, 'squares'),
    worldData: toRef(state, 'worldData'),
    isProcessing: toRef(state, 'isProcessing'),
    errorMessage: toRef(state, 'errorMessage'),

    // Actions
    initGame,
    captureSquare,
    defendSquare,
    resetWorldState,
    handleWebSocketMessage,
    updateSquare,
    clearError,
    resetGame
  }
}
