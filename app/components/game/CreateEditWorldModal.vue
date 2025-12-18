<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { World, CreateWorldRequest } from '~~/types/database'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  world?: World
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const gameApi = useGameApi()

// Form state
const formData = ref<CreateWorldRequest>({
  slug: '',
  name: '',
  boardType: 'HEXAGON',
  boardSize: 10,
  maxPlayers: 4,
  maxTeams: 2,
  minTeams: 2,
  maxTeamSize: 2,
  minTeamSize: 1,
  allowPlayerTeamCreation: true,
  isPublic: true
})

const isLoading = ref(false)
const errorMessage = ref('')

// Initialize form with world data in edit mode
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.mode === 'edit' && props.world) {
    formData.value = {
      slug: props.world.slug,
      name: props.world.name,
      boardType: props.world.boardType,
      boardSize: props.world.boardSize,
      maxPlayers: props.world.maxPlayers,
      maxTeams: props.world.maxTeams,
      minTeams: props.world.minTeams,
      maxTeamSize: props.world.maxTeamSize,
      minTeamSize: props.world.minTeamSize,
      allowPlayerTeamCreation: props.world.allowPlayerTeamCreation,
      isPublic: props.world.public
    }
  } else if (isOpen && props.mode === 'create') {
    resetForm()
  }
}, { immediate: true })

// Validation
const isFormValid = computed(() => {
  return (
    formData.value.slug.trim().length >= 3 &&
    formData.value.name.trim().length >= 3 &&
    formData.value.boardSize >= 5 &&
    formData.value.boardSize <= 25 &&
    formData.value.maxPlayers >= 2 &&
    formData.value.maxTeams >= 2 &&
    formData.value.minTeams >= 2 &&
    formData.value.minTeams <= formData.value.maxTeams &&
    formData.value.maxTeamSize >= 1 &&
    formData.value.minTeamSize >= 1 &&
    formData.value.minTeamSize <= formData.value.maxTeamSize &&
    formData.value.maxPlayers >= formData.value.minTeams * formData.value.minTeamSize
  )
})

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    slug: '',
    name: '',
    boardType: 'HEXAGON',
    boardSize: 10,
    maxPlayers: 4,
    maxTeams: 2,
    minTeams: 2,
    maxTeamSize: 2,
    minTeamSize: 1,
    allowPlayerTeamCreation: true,
    isPublic: true
  }
  errorMessage.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    isLoading.value = true
    errorMessage.value = ''

    if (props.mode === 'create') {
      await gameApi.createWorld(formData.value)
    } else if (props.mode === 'edit' && props.world) {
      await gameApi.updateWorld(props.world.slug, formData.value)
    }

    emit('success')
    close()
  } catch (error: any) {
    errorMessage.value = error?.data?.error || error?.message || `Failed to ${props.mode} world`
  } finally {
    isLoading.value = false
  }
}

// Generate slug from name
const generateSlug = () => {
  if (props.mode === 'create') {
    formData.value.slug = formData.value.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="mode === 'create' ? 'Create World' : 'Edit World'"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="close"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name -->
      <div>
        <label for="world-name" class="block text-sm font-medium mb-1">
          World Name
        </label>
        <input
          id="world-name"
          v-model="formData.name"
          @blur="generateSlug"
          type="text"
          placeholder="My Awesome World"
          class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          maxlength="100"
          :disabled="isLoading"
          required
        />
        <p class="text-xs text-muted-foreground mt-1">
          {{ formData.name.length }} / 100 characters (min 3)
        </p>
      </div>

      <!-- Slug -->
      <div>
        <label for="world-slug" class="block text-sm font-medium mb-1">
          World Slug (URL)
        </label>
        <input
          id="world-slug"
          v-model="formData.slug"
          type="text"
          placeholder="my-awesome-world"
          class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          pattern="[a-z0-9-]+"
          maxlength="50"
          :disabled="isLoading || mode === 'edit'"
          required
        />
        <p class="text-xs text-muted-foreground mt-1">
          Lowercase letters, numbers, and hyphens only. {{ mode === 'edit' ? '(Cannot be changed)' : '' }}
        </p>
      </div>

      <!-- Board Type -->
      <div>
        <label class="block text-sm font-medium mb-2">
          Board Type
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="formData.boardType = 'HEXAGON'"
            class="p-3 border-2 rounded-lg hover:bg-muted transition-colors"
            :class="formData.boardType === 'HEXAGON' ? 'border-primary bg-muted' : 'border-border'"
            :disabled="isLoading"
          >
            Hexagon Grid
          </button>
          <button
            type="button"
            @click="formData.boardType = 'SQUARE'"
            class="p-3 border-2 rounded-lg hover:bg-muted transition-colors"
            :class="formData.boardType === 'SQUARE' ? 'border-primary bg-muted' : 'border-border'"
            :disabled="isLoading"
          >
            Square Grid
          </button>
        </div>
      </div>

      <!-- Board Size -->
      <div>
        <label for="board-size" class="block text-sm font-medium mb-1">
          Board Size: {{ formData.boardSize }}
        </label>
        <input
          id="board-size"
          v-model.number="formData.boardSize"
          type="range"
          min="5"
          max="25"
          step="1"
          class="w-full"
          :disabled="isLoading"
        />
        <p class="text-xs text-muted-foreground">
          Total squares: {{ formData.boardSize * formData.boardSize }}
        </p>
      </div>

      <!-- Team Settings -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="min-teams" class="block text-sm font-medium mb-1">
            Min Teams
          </label>
          <input
            id="min-teams"
            v-model.number="formData.minTeams"
            type="number"
            min="2"
            :max="formData.maxTeams"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
            :disabled="isLoading"
            required
          />
        </div>
        <div>
          <label for="max-teams" class="block text-sm font-medium mb-1">
            Max Teams
          </label>
          <input
            id="max-teams"
            v-model.number="formData.maxTeams"
            type="number"
            :min="formData.minTeams"
            max="10"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
            :disabled="isLoading"
            required
          />
        </div>
      </div>

      <!-- Team Size Settings -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="min-team-size" class="block text-sm font-medium mb-1">
            Min Team Size
          </label>
          <input
            id="min-team-size"
            v-model.number="formData.minTeamSize"
            type="number"
            min="1"
            :max="formData.maxTeamSize"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
            :disabled="isLoading"
            required
          />
        </div>
        <div>
          <label for="max-team-size" class="block text-sm font-medium mb-1">
            Max Team Size
          </label>
          <input
            id="max-team-size"
            v-model.number="formData.maxTeamSize"
            type="number"
            :min="formData.minTeamSize"
            max="10"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
            :disabled="isLoading"
            required
          />
        </div>
      </div>

      <!-- Max Players -->
      <div>
        <label for="max-players" class="block text-sm font-medium mb-1">
          Max Players
        </label>
        <input
          id="max-players"
          v-model.number="formData.maxPlayers"
          type="number"
          min="2"
          max="100"
          class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          :disabled="isLoading"
          required
        />
      </div>

      <!-- Public -->
      <div>
        <div class="flex items-center gap-2">
          <input
            id="is-public"
            v-model="formData.isPublic"
            type="checkbox"
            class="w-4 h-4"
            :disabled="isLoading"
          />
          <label for="is-public" class="text-sm font-medium">
            Public world
          </label>
        </div>
        <p class="text-xs text-muted-foreground mt-1 ml-6">
          {{ formData.isPublic ? 'This world will be visible in the worlds list' : 'This world can only be accessed via direct link' }}
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-sm text-destructive-foreground bg-destructive p-3 rounded">
        {{ errorMessage }}
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-4">
        <UiBaseButton
          type="button"
          variant="outline"
          @click="close"
          class="flex-1"
          :disabled="isLoading"
        >
          Cancel
        </UiBaseButton>
        <UiBaseButton
          type="submit"
          variant="primary"
          :disabled="!isFormValid || isLoading"
          :loading="isLoading"
          class="flex-1"
        >
          {{ mode === 'create' ? 'Create World' : 'Save Changes' }}
        </UiBaseButton>
      </div>
    </form>
  </UiBaseModal>
</template>
