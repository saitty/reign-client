# Reign Client

Reign is a multiplayer territory conquest game. Players can capture and defend squares on a grid-based board in real-time.
The client is built with Nuxt and uses WebSocket for real-time updates.

This client need [Reign backend server](https://github.com/bkrnd/reign) to function properly.



## Technologies

- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS
- WebSocket (STOMP)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Configuration

Backend API URL is configured in `nuxt.config.ts`, local [Reign](https://github.com/bkrnd/reign) server should be running at this address:
```typescript
runtimeConfig: {
  public: {
    apiBase: 'http://localhost:8080'
  }
}
```

## Build

```bash
npm run build
```
