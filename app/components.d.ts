import type { DefineComponent } from 'vue'

declare module 'vue' {
  export interface GlobalComponents {
    UiBaseButton: typeof import('./components/ui/BaseButton.vue')['default']
    UiCard: typeof import('./components/ui/Card.vue')['default']
    GameWorldBoard: typeof import('./components/game/WorldBoard.vue')['default']
  }
}

export {}
