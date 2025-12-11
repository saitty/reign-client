<script setup lang="ts">

</script>

<template>
  <div
    class="container mt-72 p-6 flex flex-col gap-6 rounded-xl border border-secondary py-6 shadow-sm">
    <h1>hello</h1>
  
    <form>
      <label for="checkbox-demo" class="bg-primary/10 rounded-lg w-fit flex">
        <div role="group" class="border border-primary rounded-lg p-4 w-full flex flex-row items-center gap-3">
          <button 
            class="bg-primary rounded size-4"
            type="button" role="checkbox" aria-checked="true" value="on" id="checkbox-demo"
          >
            <span class="grid place-content-center text-current transition-none" style="pointer-events:none"><svg
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-check size-3.5">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </span>
          </button>
          <label for="checkbox-demo">I agree to the terms and conditions</label>
        </div>
      </label>
    </form>

  </div>
</template>

<style scoped></style>