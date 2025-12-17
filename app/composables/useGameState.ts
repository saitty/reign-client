import type { Square, World } from '~~/types/database'

interface GameState {
  squares: Square[]
  worldData: World | null
  isProcessing: boolean
  isResetting: boolean
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
    isResetting: false,
    errorMessage: ''
  })

  /**
   * Initialize game state with world data
   */
  const initGame = (world: World, squares: Square[]) => {
    state.worldData = world
    state.squares = squares
    state.isProcessing = false
    state.isResetting = false
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
   * Handle square capture - server authoritative
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

    try {
      // Call backend - don't update UI yet, wait for WebSocket
      await gameApi.captureSquare(
        state.worldData.slug,
        square.x,
        square.y
      )
      // WebSocket will update the board
    } catch (error: any) {
      state.isProcessing = false

      // Extract error message from server response
      const serverError = error.data?.error || error.response?.data?.error

      if (serverError) {
        state.errorMessage = serverError
      } else if (error.response?.status === 404 || error.statusCode === 404) {
        state.errorMessage = 'Square not found.'
      } else {
        state.errorMessage = error.message || 'Failed to capture square. Please try again.'
      }
    }
  }

  /**
   * Handle square defend - server authoritative
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

    try {
      // Call backend - don't update UI yet, wait for WebSocket
      await gameApi.defendSquare(
        state.worldData.slug,
        square.x,
        square.y
      )
      // WebSocket will update the board
    } catch (error: any) {
      state.isProcessing = false

      // Extract error message from server response
      const serverError = error.data?.error || error.response?.data?.error

      if (serverError) {
        state.errorMessage = serverError
      } else if (error.response?.status === 404 || error.statusCode === 404) {
        state.errorMessage = 'Square not found.'
      } else {
        state.errorMessage = error.message || 'Failed to defend square. Please try again.'
      }
    }
  }

  /**
   * Reset world to initial state - server authoritative
   */
  const resetWorldState = async () => {
    if (!state.worldData || !auth.currentUser.value) {
      state.errorMessage = 'No world loaded or not logged in'
      return
    }

    if (state.isProcessing) {
      return // Prevent double-clicks
    }

    state.isResetting = true
    state.isProcessing = true
    state.errorMessage = ''

    try {
      // Call backend - don't update UI yet, wait for WebSocket
      await gameApi.resetWorld(state.worldData.slug)
      // WebSocket will update the board
    } catch (error: any) {
      state.isResetting = false
      state.isProcessing = false

      // Extract error message from server response
      const serverError = error.data?.error || error.response?.data?.error

      if (serverError) {
        state.errorMessage = serverError
      } else if (error.response?.status === 404 || error.statusCode === 404) {
        state.errorMessage = 'World not found.'
      } else {
        state.errorMessage = error.message || 'Failed to reset world. Please try again.'
      }
    }
  }

  /**
   * Handle WebSocket message - server authoritative board updates
   */
  const handleWebSocketMessage = (message: {
    type: 'SQUARE_CAPTURED' | 'SQUARE_DEFENDED' | 'WORLD_RESET' | 'TEAM_CREATED' | 'TEAM_JOINED' | 'PLAYER_LEFT' | 'USER_DELETED'
    board: Square[]
    teams?: any[]
    playerId: string | null
  }) => {
    console.log('[GameState] WebSocket message received:', message.type)
    console.log('[GameState] Teams in message:', message.teams)
    console.log('[GameState] Current worldData:', state.worldData)

    // Replace entire board state with server's authoritative state
    state.squares = message.board

    // Update teams if included in the message
    if (message.teams && state.worldData) {
      console.log('[GameState] Updating teams from', state.worldData.teams.length, 'to', message.teams.length)
      state.worldData.teams = message.teams
      console.log('[GameState] Teams updated:', state.worldData.teams)
    }

    state.isResetting = false
    state.isProcessing = false
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
    state.isResetting = false
    state.isProcessing = false
    state.errorMessage = ''
  }

  return {
    // State (readonly to prevent direct mutation)
    squares: toRef(state, 'squares'),
    worldData: toRef(state, 'worldData'),
    isProcessing: toRef(state, 'isProcessing'),
    isResetting: toRef(state, 'isResetting'),
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
