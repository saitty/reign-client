/**
 * Custom fetch composable that properly forwards cookies during SSR
 * and includes credentials for client-side requests
 */
export const useApiFetch = <T>(url: string, options?: any) => {
  const config = useRuntimeConfig()

  // Build headers
  const headers: Record<string, string> = options?.headers || {}

  if (process.server) {
    // On server, forward the cookie from the incoming request to the backend
    const cookie = useCookie('token')
    if (cookie.value) {
      headers.Cookie = `token=${cookie.value}`
    }
  }

  return useFetch<T>(url, {
    ...options,
    baseURL: config.public.apiBase,
    credentials: 'include', // For client-side requests
    headers
  })
}
