<template>
  <client-only>
    <div
      id="kawaii-text-rotator"
      class="w-full"
    >
      <div class="overflow-hidden">
        <Vue3Marquee>
          <template
            v-for="(phrase, index) in PHRASES"
            :key="index"
          >
            <span class="text-xl uppercase font-semibold mx-4">
              {{ phrase }}
            </span>
          </template>
        </Vue3Marquee>
      </div>
    </div>
  </client-only>
</template>

<script lang="ts" setup>
  const PHRASES = ref<string[]>([
    "(｡◕‿◕｡)",
    "Amazing chatbot for your stream!",
    "(●'◡'●)",
    "IA for your Twitch channel",
    "🤖",
    "Petruquio.LIVE is the best!",
    "^_^",
    "Beep boop",
  ])
</script>
