<template>
  <footer class="bg-black text-white p-4">
    <div class="flex flex-col items-center">
      <span class="text-center">
        💜 Coded with love by <a
          href="https://twitch.tv/alexitoo_uy"
          class="hover:underline hover:text-twitch-500"
          target="_blank"
        >
          Alexitoo_UY
        </a>
      </span>
      <p class="text-center">
        &copy; {{ new Date().getFullYear() }} Petruquio.LIVE
      </p>

      <span class="text-center mt-8">
        <TwemojiUruguayFlag class="inline-block" />
        <span class="ml-2">Made in Uruguay</span>
      </span>
    </div>
  </footer>
</template>

<script lang="ts" setup>

</script>

<style>

</style>