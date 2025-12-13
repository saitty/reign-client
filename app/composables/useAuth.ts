import type { User, AuthResponse, LoginRequest, RegisterRequest } from '~~/types/database'

export const useAuth = () => {
  const config = useRuntimeConfig()

  // Store current user in composable state (shared across the app)
  const currentUser = useState<User | null>('currentUser', () => null)
  const isAuthenticated = computed(() => currentUser.value !== null)

  // Set the current user (cookies are handled automatically by the browser)
  const setUser = (user: User | null) => {
    currentUser.value = user
  }

  /**
   * Fetch current user from backend using httpOnly cookie
   */
  const initAuth = async () => {
    if (process.client) {
      try {
        const response = await $fetch<AuthResponse>(`${config.public.apiBase}/api/auth/me`, {
          credentials: 'include' // Send cookies
        })

        currentUser.value = {
          id: response.userId,
          username: response.username,
          role: response.role,
          userType: response.userType,
          createdAt: new Date().toISOString()
        }
      } catch (error) {
        // User is not authenticated (no valid cookie)
        currentUser.value = null
      }
    }
  }

  /**
   * Login with username and password
   */
  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await $fetch<AuthResponse>(`${config.public.apiBase}/api/auth/login`, {
        method: 'POST',
        body: credentials,
        credentials: 'include' // Send and receive cookies
      })

      const user: User = {
        id: response.userId,
        username: response.username,
        role: response.role,
        userType: response.userType,
        createdAt: new Date().toISOString()
      }

      setUser(user)
      return { success: true }
    } catch (error: any) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.data?.message || 'Invalid username or password'
      }
    }
  }

  /**
   * Register a new user
   */
  const register = async (credentials: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await $fetch<AuthResponse>(`${config.public.apiBase}/api/auth/register`, {
        method: 'POST',
        body: credentials,
        credentials: 'include' // Send and receive cookies
      })

      const user: User = {
        id: response.userId,
        username: response.username,
        role: response.role,
        userType: response.userType,
        createdAt: new Date().toISOString()
      }

      setUser(user)
      return { success: true }
    } catch (error: any) {
      console.error('Registration failed:', error)
      return {
        success: false,
        error: error.data?.message || 'Registration failed. Username may already be taken.'
      }
    }
  }

  /**
   * Login as a guest user
   */
  const loginAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await $fetch<AuthResponse>(`${config.public.apiBase}/api/auth/guest`, {
        method: 'POST',
        credentials: 'include' // Send and receive cookies
      })

      const user: User = {
        id: response.userId,
        username: response.username,
        role: response.role,
        userType: response.userType,
        createdAt: new Date().toISOString()
      }

      setUser(user)
      return { success: true }
    } catch (error: any) {
      console.error('Guest login failed:', error)
      return {
        success: false,
        error: error.data?.message || 'Failed to create guest account'
      }
    }
  }

  /**
   * Logout current user
   * For guest users, also delete the account from the backend
   */
  const logout = async () => {
    // If user is a guest, delete their account
    if (currentUser.value?.userType === 'GUEST' && currentUser.value?.id) {
      try {
        await $fetch(`${config.public.apiBase}/api/auth/logout/${currentUser.value.id}`, {
          method: 'DELETE',
          credentials: 'include' // Send cookies for authentication
        })
      } catch (error) {
        console.error('Failed to delete guest account:', error)
        // Continue with logout even if deletion fails
      }
    } else {
      // For registered users, just clear the cookie
      try {
        await $fetch(`${config.public.apiBase}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        })
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    setUser(null)
  }

  return {
    currentUser: readonly(currentUser),
    isAuthenticated,
    setUser,
    initAuth,
    login,
    register,
    loginAsGuest,
    logout
  }
}
