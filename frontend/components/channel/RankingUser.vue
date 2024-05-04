<template>
  <div
    class="bg-zinc-200 p-2 rounded-md flex items-center mx-4 md:mx-0 group hover:shadow-md transition duration-150 cursor-pointer hover:bg-twitch-500"
  >
    <div class="flex items-center">
      <span
        class="text-xl font-bold text-zinc-500 rotate-[-20deg] group-hover:rotate-0 group-hover:drop-shadow-md duration-150 group-hover:text-white"
      >
        #{{ props.index + 4 }}
      </span>
      <div class="w-12 h-12 relative">
        <img
          :src="data.user_avatar"
          :alt="`Avatar de ${data.user_username}`"
          class="w-12 h-12 rounded-full ml-2 group-hover:drop-shadow-md duration-150 group-hover:scale-110 group-hover:rotate-[-20deg] group-hover:border-4 group-hover:border-white"
        >
      </div>
    </div>
    <div class="flex flex-col ml-6">
      <span class="text-lg font-medium text-zinc-500 group-hover:text-white truncate max-w-[200px] md:max-w-[300px]">
        {{ data.user_display_name }}
      </span>
      <span class="text-sm text-zinc-500 group-hover:text-white">
        Canjes: {{ data.redemption_count }}
      </span>
    </div>
    <!-- Botones para regalar suscripción -->
    <div class="flex-1" />
    <div class="flex items-center hidden">
      <button
        
        class="bg-twitch-500 text-white px-2 py-1 rounded-md text-sm font-medium"
      >
        Regalar
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>

export interface RankingUser {
  user_id: number;
  user_username: string;
  user_avatar: string;
  user_display_name: string;
  redemption_count: number;
}
  const props = defineProps<{
    data: RankingUser;
    index: number;
  }>()
</script>