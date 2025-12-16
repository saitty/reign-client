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
    y: number
  ): Promise<Square> => {
    return await $fetch<Square>(`/api/worlds/${worldSlug}/actions/capture`, {
      baseURL,
      method: 'POST',
      credentials: 'include', // Send cookies for authentication
      body: { x, y }
    })
  }

  /**
   * Defend a square on the game board
   */
  const defendSquare = async (
    worldSlug: string,
    x: number,
    y: number
  ): Promise<Square> => {
    return await $fetch<Square>(`/api/worlds/${worldSlug}/actions/defend`, {
      baseURL,
      method: 'POST',
      credentials: 'include', // Send cookies for authentication
      body: { x, y }
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
  const resetWorld = async (slug: string): Promise<World> => {
    return await $fetch<World>(`/api/worlds/${slug}/reset`, {
      baseURL,
      method: 'POST',
      credentials: 'include' // Send cookies for authentication
    })
  }

  /**
   * Get available teams for a world (teams that are not full)
   */
  const getAvailableTeams = async (worldSlug: string) => {
    return await $fetch(`/api/worlds/${worldSlug}/teams/available`, {
      baseURL,
      credentials: 'include'
    })
  }

  /**
   * Get all teams for a world
   */
  const getTeams = async (worldSlug: string) => {
    return await $fetch(`/api/worlds/${worldSlug}/teams`, {
      baseURL,
      credentials: 'include'
    })
  }

  /**
   * Join an existing team
   */
  const joinTeam = async (worldSlug: string, teamId: string) => {
    return await $fetch(`/api/worlds/${worldSlug}/teams/join`, {
      baseURL,
      method: 'POST',
      credentials: 'include',
      body: { teamId }
    })
  }

  /**
   * Create a new team
   */
  const createTeam = async (worldSlug: string, name: string, color: string) => {
    return await $fetch(`/api/worlds/${worldSlug}/teams/create`, {
      baseURL,
      method: 'POST',
      credentials: 'include',
      body: { name, color }
    })
  }

  /**
   * Check if user is in a team for this world
   */
  const checkTeamMembership = async (worldSlug: string) => {
    return await $fetch(`/api/worlds/${worldSlug}/teams/check-membership`, {
      baseURL,
      credentials: 'include'
    })
  }

  /**
   * Leave the current team
   */
  const leaveTeam = async (worldSlug: string) => {
    return await $fetch(`/api/worlds/${worldSlug}/teams/leave`, {
      baseURL,
      method: 'DELETE',
      credentials: 'include'
    })
  }

  return {
    captureSquare,
    defendSquare,
    getWorld,
    getBoardSquares,
    resetWorld,
    getAvailableTeams,
    getTeams,
    joinTeam,
    createTeam,
    checkTeamMembership,
    leaveTeam
  }
}
