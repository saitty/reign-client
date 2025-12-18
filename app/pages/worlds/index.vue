<script setup lang="ts">
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)


definePageMeta({
  middleware: 'auth'
})

import type { World } from '~~/types/database';

const auth = useAuth()
const teamColor = useTeamColor()
const route = useRoute()
const router = useRouter()

// Read filters from URL query parameters
const searchQuery = computed({
  get: () => (route.query.s as string) || '',
  set: (value: string) => updateQuery({ s: value || undefined })
})

const isPublicFilter = computed({
  get: () => {
    const visibility = route.query.visibility as string
    return visibility || 'all'
  },
  set: (value: string) => updateQuery({ visibility: value === 'all' ? undefined : value })
})

const boardTypeFilter = computed({
  get: () => {
    const boardType = route.query.boardType as string
    return boardType || 'all'
  },
  set: (value: string) => updateQuery({ boardType: value === 'all' ? undefined : value })
})

const hideFullServers = computed({
  get: () => route.query.hideFull === 'true',
  set: (value: boolean) => updateQuery({ hideFull: value ? 'true' : undefined })
})

// Helper function to update query parameters
const updateQuery = (newParams: Record<string, string | undefined>) => {
  router.push({
    query: {
      ...route.query,
      ...newParams
    }
  })
}

// Build query params for API call from URL
const apiQueryParams = computed(() => {
  const params: Record<string, any> = {}

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }

  if (isPublicFilter.value === 'public') {
    params.isPublic = true
  } else if (isPublicFilter.value === 'private') {
    params.isPublic = false
  }

  if (boardTypeFilter.value !== 'all') {
    params.boardType = boardTypeFilter.value
  }

  if (hideFullServers.value) {
    params.hideFull = true
  }

  return params
})

const { data, error, pending, refresh } = useApiFetch<World[]>('/api/worlds', {
  query: apiQueryParams
})

// Modal state
const showJoinModal = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showJoinPrivateModal = ref(false)
const selectedWorld = ref<World | null>(null)
const isLeaving = ref<string | null>(null) // Track which world is being left
const privateWorldSlug = ref('')
const privateWorldError = ref('')
const isLoadingPrivateWorld = ref(false)
const isDeleting = ref<string | null>(null) // Track which world is being deleted

const gameApi = useGameApi()

const sortedTeams = (world: World) => {
  return [...world.teams].sort((a, b) => a.name.localeCompare(b.name))
}

// Check if user is in a team for a specific world
const isUserInTeam = (world: World) => {
  const userId = auth.currentUser.value?.id
  if (!userId) return false

  return world.teams.some(team =>
    team.members.some(member => member.user.id === userId)
  )
}

const isWorldFull = (world: World) => {
  const totalMembers = world.teams.reduce((sum, team) => sum + team.members.length, 0)
  return totalMembers >= world.maxPlayers
}

const getCurrentPlayerCount = (world: World) => {
  return world.teams.reduce((sum, team) => sum + team.members.length, 0)
}

// Open join modal
const openJoinModal = (world: World) => {
  selectedWorld.value = world
  showJoinModal.value = true
}

// Handle successful join
const handleJoined = async () => {
  // after joining, view the world
  if (selectedWorld.value) {
    showJoinModal.value = false
    await refresh()
    // Navigate to the world page
    window.location.href = `/worlds/${selectedWorld.value.slug}`
  }
}

// Leave team
const handleLeaveTeam = async (world: World) => {
  if (!confirm(`Are you sure you want to leave your team in ${world.name}?`)) {
    return
  }

  try {
    isLeaving.value = world.id
    await gameApi.leaveTeam(world.slug)
    await refresh()
  } catch (error: any) {
    alert(error?.data?.error || 'Failed to leave team')
  } finally {
    isLeaving.value = null
  }
}

// Open create modal
const openCreateModal = () => {
  showCreateModal.value = true
}

// Open edit modal
const openEditModal = (world: World) => {
  selectedWorld.value = world
  showEditModal.value = true
}

// Handle successful create/edit
const handleWorldSuccess = async () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedWorld.value = null
  await refresh()
}

// Open join private modal
const openJoinPrivateModal = () => {
  privateWorldSlug.value = ''
  privateWorldError.value = ''
  showJoinPrivateModal.value = true
}

// Handle join private world
const handleJoinPrivateWorld = async () => {
  if (!privateWorldSlug.value.trim()) {
    privateWorldError.value = 'Please enter a world slug'
    return
  }

  try {
    isLoadingPrivateWorld.value = true
    privateWorldError.value = ''

    // Try to fetch the world to see if it exists
    const world = await gameApi.getWorld(privateWorldSlug.value.trim())

    // Redirect to the world page
    navigateTo(`/worlds/${world.slug}`)
  } catch (error: any) {
    privateWorldError.value = error?.data?.error || 'World not found'
  } finally {
    isLoadingPrivateWorld.value = false
  }
}

// Copy world link to clipboard
const copyWorldLink = async (world: World) => {
  const url = `${window.location.origin}/worlds/${world.slug}`
  try {
    await navigator.clipboard.writeText(url)
    alert('World link copied to clipboard!')
  } catch (error) {
    alert('Failed to copy link')
  }
}

// Delete world
const handleDeleteWorld = async (world: World) => {
  const confirmMessage = `Are you sure you want to delete "${world.name}"?\n\nThis will:\n- Delete the world permanently\n- Remove all teams and their members\n- Clear the entire board\n\nThis action cannot be undone.`

  if (!confirm(confirmMessage)) {
    return
  }

  try {
    isDeleting.value = world.id
    await gameApi.deleteWorld(world.slug)
    await refresh()
  } catch (error: any) {
    alert(error?.data?.error || 'Failed to delete world')
  } finally {
    isDeleting.value = null
  }
}
</script>

<template>
  <Head>
    <title>Worlds | Reign</title>
  </Head>
  <div class="container px-4 py-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-lg">Worlds</h1>
      <div class="flex gap-2">
        <UiBaseButton
          variant="outline"
          @click="openJoinPrivateModal"
        >
          Join Private World
        </UiBaseButton>
        <UiBaseButton
          variant="primary"
          @click="openCreateModal"
        >
          Create World
        </UiBaseButton>
      </div>
    </div>

    <!-- Search and Filters -->
    <UiCard class="p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search Input -->
        <div>
          <label for="search" class="block text-sm font-medium mb-1">
            Search
          </label>
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            placeholder="Search worlds..."
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          />
        </div>

        <!-- Public/Private Filter -->
        <div>
          <label for="visibility" class="block text-sm font-medium mb-1">
            Visibility
          </label>
          <select
            id="visibility"
            v-model="isPublicFilter"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <!-- Board Type Filter -->
        <div>
          <label for="board-type" class="block text-sm font-medium mb-1">
            Board Type
          </label>
          <select
            id="board-type"
            v-model="boardTypeFilter"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          >
            <option value="all">All</option>
            <option value="HEXAGON">Hexagon</option>
            <option value="SQUARE">Square</option>
          </select>
        </div>

        <!-- Hide Full Servers Checkbox -->
        <div class="flex items-end md:pb-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="hideFullServers"
              type="checkbox"
              class="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span class="text-sm font-medium">Hide Full Servers</span>
          </label>
        </div>
      </div>
    </UiCard>

    <div class="grid grid-cols-1 gap-4 mt-4">
      <template v-if="pending">
        <p class="text-secondary-foreground bg-secondary rounded-md px-4 py-2 w-fit mx-auto">Loading ... </p>
      </template>
      <template v-else-if="error">
        <p class="text-destructive-foreground bg-destructive rounded-md px-4 py-2 w-fit mx-auto">Error loading worlds.</p>
      </template>
      <template v-else-if="data && data.length > 0">
        <UiCard v-for="world in data" :key="world.id" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/worlds/${world.slug}`">
                <h2 class="text-xl">{{ world.name }}</h2>
              </NuxtLink>
              <span
                v-if="!world.public"
                class="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
              >
                Private
              </span>
            </div>
            <p class="text-muted-foreground">Owner: {{ world.owner.username }}</p>
            <p class="text-muted-foreground">Board Type: {{ world.boardType }}</p>
            <p class="text-muted-foreground">Board Size: {{ world.boardSize }}</p>
            <p class="text-muted-foreground">
              Players: {{ getCurrentPlayerCount(world) }}/{{ world.maxPlayers }}
              <span v-if="isWorldFull(world)" class="text-yellow-600 dark:text-yellow-400 font-semibold">(Full)</span>
            </p>
            <p class="text-muted-foreground">Number of teams: {{ world.minTeams === world.maxTeams ? world.maxTeams : world.minTeams + ' - ' + world.maxTeams }}</p>
            <p class="text-muted-foreground">Team Size: {{ world.minTeamSize === world.maxTeamSize ? world.maxTeamSize : world.minTeamSize + ' - ' + world.maxTeamSize }}</p>
            <p class="text-muted-foreground">Created At: {{ dayjs(world.createdAt).fromNow() }}</p>
          </div>
          <div class="p-4 bg-card rounded-lg border border-border">
            <h3 class="text-sm font-semibold text-card-foreground mb-3">Teams and players</h3>
            <div class="grid gap-3">
              <div
                  v-for="team in sortedTeams(world)"
                  :key="team.id"
                  class="flex items-center gap-2 p-2 bg-background rounded border border-border"
              >
                <div
                    class="size-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-foreground"
                    :style="{ backgroundColor: teamColor.getTeamColor( team.color ) }"
                >
                  <div class="bg-background/30 size-6 rounded flex items-center justify-center"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-foreground truncate">{{ team.name }}</p>
                  <p class="text-xs text-muted-foreground">
                <span v-for="(member, index) in team.members" :key="member.user.id">
                  {{ member.user.username }}<span v-if="index < team.members.length - 1">, </span>
                </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="md:col-span-2 flex flex-col md:flex-row gap-4 mt-4">

            <UiBaseButton
              v-if="!isUserInTeam(world)"
              variant="primary"
              @click="openJoinModal(world)"
              :disabled="isWorldFull(world)"
            >
              {{ isWorldFull(world) ? 'World Full' : 'Join World'}}
            </UiBaseButton>
            <template v-else>
              <UiBaseButton
                  variant="outline"
                  @click="() => $router.push(`/worlds/${world.slug}`)"
              >
                View World
              </UiBaseButton>
              <UiBaseButton
                variant="secondary"
                :loading="isLeaving === world.id"
                :disabled="isLeaving === world.id"
                @click="handleLeaveTeam(world)"
              >
                Leave Team
              </UiBaseButton>
            </template>
            <UiBaseButton
              v-if="world.owner.id === auth.currentUser.value?.id"
              class="items-center flex"
              variant="secondary"
              @click="copyWorldLink(world)"
              title="Copy world link"
            >
              <Icon name="mdi:link-variant" size="24"/>
            </UiBaseButton>
            <UiBaseButton
              v-if="world.owner.id === auth.currentUser.value?.id"
              class="items-center flex"
              variant="secondary"
              @click="openEditModal(world)"
              title="Edit world settings"
            >
              <Icon name="mdi:settings" size="24"/>
            </UiBaseButton>
            <UiBaseButton
              v-if="world.owner.id === auth.currentUser.value?.id"
              class="items-center flex"
              variant="danger"
              @click="handleDeleteWorld(world)"
              :loading="isDeleting === world.id"
              :disabled="isDeleting === world.id"
              title="Delete world"
            >
              <Icon name="mdi:delete" size="24"/>
            </UiBaseButton>
          </div>
        </UiCard>
      </template>
      <template v-else-if="data && data.length === 0">
        <p class="text-secondary-foreground bg-secondary rounded-md px-4 py-2 w-fit mx-auto">No worlds found.</p>
      </template>
    </div>

    <!-- Join World Modal -->
    <GameJoinWorldModal
      v-if="selectedWorld !== null"
      v-model="showJoinModal"
      :world="selectedWorld!"
      @joined="handleJoined"
    />

    <!-- Create World Modal -->
    <GameCreateEditWorldModal
      v-model="showCreateModal"
      mode="create"
      @success="handleWorldSuccess"
    />

    <!-- Edit World Modal -->
    <GameCreateEditWorldModal
      v-if="selectedWorld !== null"
      v-model="showEditModal"
      mode="edit"
      :world="selectedWorld!"
      @success="handleWorldSuccess"
    />

    <!-- Join Private World Modal -->
    <UiBaseModal
      v-model="showJoinPrivateModal"
      title="Join Private World"
      @close="showJoinPrivateModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Enter the slug of the private world you want to join
        </p>

        <div>
          <label for="private-world-slug" class="block text-sm font-medium mb-1">
            World Slug
          </label>
          <input
            id="private-world-slug"
            v-model="privateWorldSlug"
            type="text"
            placeholder="my-private-world"
            class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary"
            :disabled="isLoadingPrivateWorld"
            @keyup.enter="handleJoinPrivateWorld"
          />
        </div>

        <div v-if="privateWorldError" class="text-sm text-destructive-foreground bg-destructive p-3 rounded">
          {{ privateWorldError }}
        </div>

        <div class="flex gap-2 pt-4">
          <UiBaseButton
            variant="outline"
            @click="showJoinPrivateModal = false"
            class="flex-1"
            :disabled="isLoadingPrivateWorld"
          >
            Cancel
          </UiBaseButton>
          <UiBaseButton
            variant="primary"
            @click="handleJoinPrivateWorld"
            :disabled="isLoadingPrivateWorld || !privateWorldSlug.trim()"
            :loading="isLoadingPrivateWorld"
            class="flex-1"
          >
            Join World
          </UiBaseButton>
        </div>
      </div>
    </UiBaseModal>
  </div>
</template>

<style scoped>

</style>