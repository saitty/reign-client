export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuth()
  const config = useRuntimeConfig()

  // Skip if already initialized
  if (auth.currentUser.value !== null) {
    return
  }

  if (process.server) {
    // On server: read cookie from request and fetch user
    const cookie = useCookie('token')

    if (cookie.value) {
      try {
        // Fetch user data from backend, including the cookie
        const response = await $fetch<any>(`${config.public.apiBase}/api/auth/me`, {
          headers: {
            Cookie: `token=${cookie.value}` // Forward the cookie to backend
          }
        })

        // Set user state on server (will be serialized to client)
        auth.setUser({
          id: response.userId,
          username: response.username,
          role: response.role,
          userType: response.userType,
          createdAt: new Date().toISOString()
        })
      } catch (error) {
        // User is not authenticated or token is invalid
        auth.setUser(null)
      }
    }
  } else if (process.client) {
    // On client: only fetch if state wasn't set by server
    if (auth.currentUser.value === null) {
      await auth.initAuth()
    }
  }
})
