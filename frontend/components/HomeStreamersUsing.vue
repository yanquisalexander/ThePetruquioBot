<template>
  <section class="w-full flex flex-col gap-4 mt-8 items-center justify-center">
    <header class="w-full flex flex-col gap-2 text-center">
      <h1 class="text-2xl font-semibold font-outfit">
        What they say about us
      </h1>
      <p class="opacity-70">
        Check out some of the channels that are using Petruquio.LIVE
      </p>
    </header>
    <div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <template
        v-for="(feedback, index) in FEEDBACKS"
        :key="index"
      >
        <div
          class="w-full flex flex-col gap-2 items-center bg-black rounded-lg p-4 cursor-pointer group hover:shadow-lg transition-all duration-250 hover:bg-white hover:text-black"
          :to="`/feedbacks/${feedback.user}`"
        >
          <div
            class="w-16 h-16 rounded-full overflow-hidden group-hover:ring-4 transition-all duration-250 group-hover:ring-twitch-500"
            :style="{ viewTransitionName: `feedback-img-${feedback.user}` }"
          >
            <img
              :src="feedback.avatar"
              :alt="feedback.user"
            >
          </div>
          <h3
            class="text-lg font-semibold text-center"
            :style="{ viewTransitionName: `
            feedback-${feedback.user}`
            }"
          >
            {{ feedback.user }}
          </h3>

          <p class="text-center relative max-w-[200px]">
            <MessageSquareQuote class="w-4 h-4 absolute -z-1 -top-2 -left-4 opacity-20 -rotate-12 group-hover:opacity-100 group-hover:text-twitch transition-all" />
            {{ feedback.message }}
          </p>

          <footer class="w-full flex justify-end mt-4">
            <a
              :href="`https://twitch.tv/${feedback.user}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-sm opacity-70 group-hover:opacity-100 transition-all"
            >
              <ExternalLink class="w-4 h-4" />
              <span>
                Visit channel
              </span>
            </a>
          </footer>        
        </div>
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ExternalLink, MessageSquareQuote } from "lucide-vue-next";
import FEEDBACKS from "@/FEEDBACKS.json";

const router = useRouter();

</script>

<style>

</style>