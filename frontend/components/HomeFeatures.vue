<template>
  <section class="w-full flex flex-col gap-4 items-center justify-center my-8">
    <header class="w-full flex flex-col gap-2 text-center mt-6">
      <h1 class="text-2xl font-semibold font-outfit">
        Some of our features
      </h1>
      <p class="opacity-70">
        Using the power of AI, Petruquio.LIVE can help you with...
      </p>
    </header>

    <div class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      <template
        v-for="(feature, i) in FEATURES"
        :key="i"
      >
        <div
          class="w-full flex flex-col gap-2 bg-black rounded-lg p-4 cursor-pointer group hover:shadow-lg transition-all duration-250 hover:bg-white hover:text-black hover:shadow-white/10"
        >
          <div class="flex items-center gap-3 opacity-50 z-[1]">
            <span class="font-semibold uppercase">
              {{ feature.category }}            
            </span>
          </div>
          <h3 class="text-lg font-semibold text-center flex items-center gap-2">
            <component
              :is="feature.icon"
              :class="[
                'w-10',
                'h-10',
                'rounded-full',
                'overflow-hidden',
                'p-2',
                feature.iconClasses,
                'group-hover:ring-4',
                'transition-all',
                'duration-250',
                'group-hover:ring-twitch-500'
              ]"
            />

            {{ feature.title }}
          </h3>
          <div class="relative opacity-80 group-hover:opacity-100 transition-all">
            <template
              v-for="(line, index) in feature.description.split('\n')"
              :key="index"
            >
              <p
                class="text-pretty text-sm"
              >
                {{ line }}
              </p>
            </template>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { LucideCakeSlice, LucideMapPin, LucideSquirrel, LucideSword } from "lucide-vue-next"

const FEATURES = ref([
    {
        icon: LucideMapPin,
        iconClasses: "text-twitch-500 bg-twitch-500/20",
        title: "Community Map",
        description: "Collaborative map where your viewers can pin their location and see where other viewers are from.\nUsers can opt out of the map if they don't want to be shown, or self-anonymize their profile.",
        category: "User Interaction"
    },
    {
        icon: LucideSword,
        iconClasses: "text-yellow-500 bg-yellow-100/20",
        title: "Detoxify",
        description: "Automatically detects and removes toxic messages from your chat, helping you keep a positive environment for your viewers.",
        category: "Moderation"
    },
    {
        icon: LucideSquirrel,
        iconClasses: "text-green-500 bg-green-100/20",
        title: "Shoutouts",
        description: "Automatically give shoutouts to your streamer friends when they appear in your chat (or when you want to)\nYou can customize the message (or messages) to specific users to make them feel special.",
        category: "Community"
    },
    {
        icon: LucideCakeSlice,
        iconClasses: "text-pink-500 bg-pink-100/20",
        title: "Birthday",
        description: "PetruquioLIVE can greet your viewers on their birthday.\nMake your viewers feel special by congratulating them on their special day.",
        category: "Community"
    }
])
</script>