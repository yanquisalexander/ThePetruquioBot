<template>
  <div class="w-full grid auto-rows-[192px] grid-cols-6 gap-4">
    <div
      class="row-span-2 col-span-6 rounded-3xl bg-black relative flex flex-col overflow-hidden gap-10 justify-end p-6 dark:bg-raisin-black xl:col-span-4 lg:items-end sm:flex-row lg:p-10 shadow-md">
      <div class="absolute bg-gradient-to-t from-blue-500/50 to-transparent top-0 left-0 bottom-0 right-0 z-[2]" />
      <img class="absolute w-full h-full object-cover left-0 top-0 object-right md:object-center z-[1]"
        src="https://petruquiolive-next.vercel.app/images/petruquiolive_banner.webp" alt="PetruquioLIVE"
        title="PetruquioLIVE">
      <div
        class="w-full flex flex-col z-[2] absolute left-0 bottom-0 leading-4 p-4 bg-zinc-900 bg-opacity-90 md:shadow-xl md:p-8 md:leading-6 md:rounded-3xl md:backdrop-blur-sm md:backdrop-filter">
        <h1
          class="font-outfit text-xl font-medium text-white pt-2 animate-fade-down flex flex-col md:flex-row md:items-center text-center sm:text-left">
          <div>
            <h1 class="text-2xl font-black text-white animate-fade-down">
              LET'S GROW YOUR <span class="text-blue-500">CHANNEL</span>
            </h1>
            Meet
            <span
              class="inline-flex animate-text-gradient bg-gradient-to-r from-blue-400 via-[#8678f9] to-purple-500 bg-[200%_auto] bg-clip-text text-xl text-transparent">
              &nbsp;Petruquio.LIVE</span>, your stream assistant
          </div>
        </h1>
      </div>
    </div>
    <div
      class="row-span-1 col-span-6 rounded-3xl bg-black relative flex flex-col overflow-hidden border-2 border-transparent gap-2 p-7 xl:col-span-2 lg:p-8 shadow-md">
      <h2 class="text-2xl font-bold z-[1] font-outfit">
        ¿What is Petruquio.LIVE?
      </h2>
      <p class="font-outfit mb-5 mt-2 text-md animate-fade-down animate-delay-[120ms] text-pretty">
        Petruquio.LIVE is an AI-powered chatbot that helps you
        manage your Twitch channel. It can help you with moderation,
        channel points, and more!
      </p>
    </div>
    <div
      class="row-span-1 col-span-3 rounded-3xl bg-black relative flex flex-col overflow-hidden border-2 border-transparent gap-2 items-center justify-center dark:bg-raisin-black xl:col-span-1">
      <p class="text-5xl z-[1] font-bold flex items-center gap-1">
        <span>+</span>
        <span>
          {{ stats?.channels?.length }}
        </span>
      </p>
      <p class="text-sm font-semibold max-w-fit opacity-70 z-[1] text-center">
        Channels using Petruquio.LIVE
      </p>
      <SparklesIcon class="w-full h-full text-green-200 absolute -right-10 -bottom-12 opacity-[0.2] p-5" />
    </div>
    <div
      class="row-span-1 col-span-3 rounded-3xl bg-black relative flex flex-col overflow-hidden border-2 border-transparent gap-2 items-center justify-center dark:bg-raisin-black xl:col-span-1">
      <p class="text-5xl z-[1] font-bold flex items-center gap-1">
        <span>+</span>
        <span>
          {{ stats?.users }}
        </span>
      </p>
      <p class="text-sm font-semibold max-w-fit opacity-70 z-[1] text-center">
        Chatters from all channels
      </p>
      <UsersIcon class="w-full h-full text-pink-200 absolute -right-10 -bottom-12 opacity-[0.2] p-5" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { SparklesIcon, UsersIcon } from "lucide-vue-next";
const props = defineProps<{
  stats: any
}>()

console.log(props.stats)
</script>