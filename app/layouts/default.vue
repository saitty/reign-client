<template>
  <div>
    <nav class="bg-primary">
      <div class="container py-1">
        <NuxtLink to="/" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
          <Icon name="mdi:shield-crown-outline" size="20" />
          Reign
        </NuxtLink>
      </div>
    </nav>
    <slot />
  </div>
</template>