import type { Square, World } from '~~/types/database'

export const useGameApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  /**
   * Capture a square on the game board
   */
  const captureSquare = async (
    worldSlug: string,
    x: number,
    y: number,
    playerId: string,
  ): Promise<Square> => {
    return await $fetch<Square>(`/api/worlds/${worldSlug}/actions/capture`, {
      baseURL,
      method: 'POST',
      credentials: 'include', // Send cookies for authentication
      body: { x, y, playerId }
    })
  }

  /**
   * Defend a square on the game board
   */
  const defendSquare = async (
    worldSlug: string,
    x: number,
    y: number,
    playerId: string
  ): Promise<Square> => {
    return await $fetch<Square>(`/api/worlds/${worldSlug}/actions/defend`, {
      baseURL,
      method: 'POST',
      credentials: 'include', // Send cookies for authentication
      body: { x, y, playerId }
    })
  }

  /**
   * Fetch world metadata
   */
  const getWorld = async (slug: string): Promise<World> => {
    return await $fetch<World>(`/api/worlds/${slug}`, {
      baseURL,
      credentials: 'include' // Send cookies for authentication
    })
  }

  /**
   * Fetch board squares for a world
   */
  const getBoardSquares = async (slug: string): Promise<Square[]> => {
    return await $fetch<Square[]>(`/api/worlds/${slug}/board`, {
      baseURL,
      credentials: 'include' // Send cookies for authentication
    })
  }

  /**
   * Reset world state
   */
  const resetWorld = async (slug: string, playerId: string): Promise<World> => {
    return await $fetch<World>(`/api/worlds/${slug}/reset`, {
      baseURL,
      method: 'POST',
      credentials: 'include', // Send cookies for authentication
      body: { playerId }
    })
  }

  return {
    captureSquare,
    defendSquare,
    getWorld,
    getBoardSquares,
    resetWorld
  }
}
