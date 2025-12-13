import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Square } from '~~/types/database'

interface SquareUpdateMessage {
  type: 'SQUARE_CAPTURED' | 'SQUARE_DEFENDED' | 'WORLD_RESET'
  board: Square[]
  playerId: string | null
  timestamp: number
}

export const useGameWebSocket = (worldSlug: string) => {
  const config = useRuntimeConfig()
  let client: Client | null = null
  let subscription: any = null

  const isConnected = ref(false)
  const error = ref<string | null>(null)

  // Callback for when messages arrive
  let messageCallback: ((message: SquareUpdateMessage) => void) | null = null

  const connect = async () => {
    if (client) {
      return
    }

    try {
      // Fetch WebSocket token from backend using httpOnly cookie
      const wsToken = await $fetch<string>(`${config.public.apiBase}/api/auth/ws-token`, {
        credentials: 'include'
      })

      client = new Client({
        // Use SockJS for compatibility
        webSocketFactory: () => new SockJS(`${config.public.apiBase}/ws`),

        // Add JWT token to connection headers
        connectHeaders: {
          Authorization: `Bearer ${wsToken}`
        },

        // Debug disabled
        debug: () => {},

        // Reconnect settings
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // On successful connection
        onConnect: () => {
          isConnected.value = true
          error.value = null

          // Subscribe to world-specific topic
          if (client) {
            subscription = client.subscribe(
              `/topic/worlds/${worldSlug}`,
              (message: IMessage) => {
                try {
                  const data: SquareUpdateMessage = JSON.parse(message.body)

                  // Call the registered callback
                  if (messageCallback) {
                    messageCallback(data)
                  }
                } catch (err) {
                  console.error('Failed to parse WebSocket message:', err)
                }
              }
            )
          }
        },

        // On disconnection
        onDisconnect: () => {
          isConnected.value = false
        },

        // On error
        onStompError: (frame) => {
          error.value = frame.headers['message'] || 'WebSocket authentication failed or connection error'
          isConnected.value = false
          console.error('STOMP error:', frame)
        },

        // On WebSocket error
        onWebSocketError: (event) => {
          error.value = 'Failed to connect to WebSocket'
          isConnected.value = false
        }
      })

      // Activate (connect)
      client.activate()
    } catch (err) {
      error.value = 'Failed to initialize WebSocket'
    }
  }

  const disconnect = () => {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }

    if (client) {
      client.deactivate()
      client = null
    }

    isConnected.value = false
  }

  // Register callback for incoming messages
  const onMessage = (callback: (message: SquareUpdateMessage) => void) => {
    messageCallback = callback
  }

  return {
    connect,
    disconnect,
    onMessage,
    isConnected: readonly(isConnected),
    error: readonly(error)
  }
}
