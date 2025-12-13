<script setup lang="ts">
const { isAuthenticated, currentUser, logout } = useAuth()
const router = useRouter()
const colorMode = useColorMode()

const handleLogout = async () => {
  await logout()
  router.push('/')
}
</script>

<template>
  <div>
    <nav class="bg-primary">
      <div class="container px-4 py-1 flex justify-between items-center">
        <NuxtLink to="/" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
          <Icon name="mdi:shield-crown-outline" size="20" />
          Reign
        </NuxtLink>

        <select v-model="$colorMode.preference" class="bg-primary text-foreground">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>

        <ul class="flex gap-2 items-center">
          <li v-if="isAuthenticated">
            <NuxtLink to="/worlds" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
              <Icon name="mdi:map" size="16" />
              Worlds
            </NuxtLink>
          </li>

          <template v-if="isAuthenticated">
            <li class="flex items-center gap-2 px-3 py-1 bg-primary-foreground/10 rounded-md">
              <Icon name="mdi:account" size="16" />
              <span class="text-sm">{{ currentUser?.username }}</span>
              <span v-if="currentUser?.userType === 'GUEST'" class="text-xs opacity-70">(Guest)</span>
            </li>
            <li>
              <button
                @click="handleLogout"
                class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit"
              >
                <Icon name="mdi:logout" size="16" />
                Logout
              </button>
            </li>
          </template>

          <template v-else>
            <li>
              <NuxtLink to="/login" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
                Login
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/register" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
                Register
              </NuxtLink>
            </li>
          </template>
        </ul>
      </div>
    </nav>
    <slot />
  </div>
</template>