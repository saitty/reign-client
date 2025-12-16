<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Team, World } from '~~/types/database'

const props = defineProps<{
  modelValue: boolean
  world: World
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'joined': []
}>()

const gameApi = useGameApi()

// State
const mode = ref<'select' | 'join' | 'create'>('select')
const selectedTeamId = ref<string | null>(null)
const newTeamName = ref('')
const newTeamColor = ref<string>('')
const isLoading = ref(false)
const errorMessage = ref('')
const availableTeams = ref<Team[]>([])

// Available colors
const colors = [
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' }
]

// Computed
const usedColors = computed(() => {
  return props.world.teams.map(t => t.color)
})

const availableColors = computed(() => {
  return colors.filter(c => !usedColors.value.includes(c.value))
})

const canCreateTeam = computed(() => {
  return props.world.allowPlayerTeamCreation &&
         props.world.teams.length < props.world.maxTeams
})

const canJoinExistingTeam = computed(() => {
  return availableTeams.value.length > 0
})

const isFormValid = computed(() => {
  if (mode.value === 'join') {
    return selectedTeamId.value !== null
  } else if (mode.value === 'create') {
    return newTeamName.value.trim().length >= 2 && newTeamColor.value !== ''
  }
  return false
})

// Methods
const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  mode.value = 'select'
  selectedTeamId.value = null
  newTeamName.value = ''
  newTeamColor.value = ''
  errorMessage.value = ''
  availableTeams.value = []
}

const loadAvailableTeams = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const teams = await gameApi.getAvailableTeams(props.world.slug) as Team[]
    availableTeams.value = teams
  } catch (error: any) {
    errorMessage.value = error?.data?.error || 'Failed to load available teams'
  } finally {
    isLoading.value = false
  }
}

const selectMode = async (selectedMode: 'join' | 'create') => {
  mode.value = selectedMode
  errorMessage.value = ''

  if (selectedMode === 'join') {
    await loadAvailableTeams()
  } else if (selectedMode === 'create' && availableColors.value.length > 0) {
    newTeamColor.value = availableColors.value[0].value
  }
}

const handleJoinTeam = async () => {
  if (!selectedTeamId.value) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    await gameApi.joinTeam(props.world.slug, selectedTeamId.value)
    emit('joined')
    close()
  } catch (error: any) {
    errorMessage.value = error?.data?.error || 'Failed to join team'
  } finally {
    isLoading.value = false
  }
}

const handleCreateTeam = async () => {
  if (!newTeamName.value.trim() || !newTeamColor.value) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    console.log('Creating team:', { slug: props.world.slug, name: newTeamName.value.trim(), color: newTeamColor.value })
    const result = await gameApi.createTeam(props.world.slug, newTeamName.value.trim(), newTeamColor.value)
    console.log('Team created successfully:', result)
    emit('joined')
    close()
  } catch (error: any) {
    console.error('Error creating team:', error)
    console.error('Error data:', error?.data)
    console.error('Error message:', error?.message)
    errorMessage.value = error?.data?.error || error?.message || 'Failed to create team'
  } finally {
    isLoading.value = false
  }
}

const handleConfirm = () => {
  if (mode.value === 'join') {
    handleJoinTeam()
  } else if (mode.value === 'create') {
    handleCreateTeam()
  }
}

const getTeamMemberCount = (team: Team) => {
  return team.members?.length || 0
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="mode === 'select' ? 'Join World' : mode === 'join' ? 'Join Team' : 'Create Team'"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="close"
  >
    <!-- Mode Selection -->
    <div v-if="mode === 'select'" class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Choose how you want to join {{ world.name }}
      </p>

      <!-- Join Existing Team -->
      <button
        v-if="canJoinExistingTeam || world.teams.length > 0"
        @click="selectMode('join')"
        class="w-full p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors text-left"
      >
        <div class="font-semibold">Join Existing Team</div>
        <div class="text-sm text-muted-foreground">
          Join a team that has open slots
        </div>
      </button>

      <!-- Create New Team -->
      <button
        v-if="canCreateTeam"
        @click="selectMode('create')"
        class="w-full p-4 border-2 border-border rounded-lg hover:bg-muted transition-colors text-left"
        :disabled="availableColors.length === 0"
      >
        <div class="font-semibold">Create New Team</div>
        <div class="text-sm text-muted-foreground">
          Start your own team and choose a color
        </div>
        <div v-if="availableColors.length === 0" class="text-sm text-red-500 mt-1">
          All colors are taken
        </div>
      </button>

      <!-- No options available -->
      <div v-if="!canJoinExistingTeam && !canCreateTeam" class="text-center text-muted-foreground py-4">
        <p>No teams available to join.</p>
        <p v-if="!world.allowPlayerTeamCreation" class="text-sm mt-2">
          Team creation is disabled for this world.
        </p>
      </div>
    </div>

    <!-- Join Team Mode -->
    <div v-else-if="mode === 'join'" class="space-y-4">
      <button
        @click="mode = 'select'"
        class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <span>←</span> Back
      </button>

      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="mt-2 text-sm text-muted-foreground">Loading teams...</p>
      </div>

      <div v-else-if="availableTeams.length === 0" class="text-center text-muted-foreground py-4">
        No teams have open slots
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <button
          v-for="team in availableTeams"
          :key="team.id"
          @click="selectedTeamId = team.id"
          class="w-full p-3 border-2 rounded-lg hover:bg-muted transition-colors text-left"
          :class="selectedTeamId === team.id ? 'border-primary bg-muted' : 'border-border'"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-4 h-4 rounded-full"
              :class="`bg-${team.color}-500`"
            ></div>
            <div class="font-semibold">{{ team.name }}</div>
          </div>
          <div class="text-sm text-muted-foreground mt-1">
            {{ getTeamMemberCount(team) }} / {{ world.maxTeamSize }} members
          </div>
        </button>
      </div>

      <div v-if="errorMessage" class="text-sm text-red-500">
        {{ errorMessage }}
      </div>

      <div class="flex gap-2 pt-4">
        <UiBaseButton
          variant="outline"
          @click="mode = 'select'"
          class="flex-1"
        >
          Back
        </UiBaseButton>
        <UiBaseButton
          variant="primary"
          @click="handleJoinTeam"
          :disabled="!isFormValid || isLoading"
          :loading="isLoading"
          class="flex-1"
        >
          Join Team
        </UiBaseButton>
      </div>
    </div>

    <!-- Create Team Mode -->
    <div v-else-if="mode === 'create'" class="space-y-4">
      <button
        @click="mode = 'select'"
        class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <span>←</span> Back
      </button>

      <div>
        <label for="team-name" class="block text-sm font-medium mb-1">
          Team Name
        </label>
        <input
          id="team-name"
          v-model="newTeamName"
          type="text"
          placeholder="Enter team name"
          class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          maxlength="50"
          :disabled="isLoading"
        />
        <p class="text-xs text-muted-foreground mt-1">
          {{ newTeamName.length }} / 50 characters (min 2)
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">
          Team Color
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="color in availableColors"
            :key="color.value"
            @click="newTeamColor = color.value"
            class="p-3 border-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
            :class="newTeamColor === color.value ? 'border-primary bg-muted' : 'border-border'"
            :disabled="isLoading"
          >
            <div
              class="w-6 h-6 rounded-full"
              :class="color.class"
            ></div>
            <span class="text-sm">{{ color.label }}</span>
          </button>
        </div>
        <p v-if="availableColors.length === 0" class="text-xs text-red-500 mt-2">
          All colors are taken
        </p>
      </div>

      <div v-if="errorMessage" class="text-sm text-red-500">
        {{ errorMessage }}
      </div>

      <div class="flex gap-2 pt-4">
        <UiBaseButton
          variant="outline"
          @click="mode = 'select'"
          class="flex-1"
        >
          Back
        </UiBaseButton>
        <UiBaseButton
          variant="primary"
          @click="handleCreateTeam"
          :disabled="!isFormValid || isLoading"
          :loading="isLoading"
          class="flex-1"
        >
          Create Team
        </UiBaseButton>
      </div>
    </div>
  </UiBaseModal>
</template>
