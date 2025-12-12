<template>
  <div>
    <nav class="bg-primary">
      <div class="container px-4 py-1 flex justify-between">
        <NuxtLink to="/" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
          <Icon name="mdi:shield-crown-outline" size="20" />
          Reign
        </NuxtLink>

        <ul class="flex gap-2">
<!--          <li>-->
<!--            <NuxtLink to="/users" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">-->
<!--              Players-->
<!--            </NuxtLink>-->
<!--          </li>-->
          <li>
            <NuxtLink to="/worlds" class="items-center flex gap-1 hover:bg-secondary rounded-md pl-1.5 pr-2 py-1 w-fit">
              Worlds
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
    <slot />
  </div>
</template>