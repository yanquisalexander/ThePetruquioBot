<template>
    <UTooltip :text="c.description || `Looks like ${c.display_name} doesn't have a description, but we are sure that
                      he/she is a great streamer!`" placement="bottom" v-if="c">
        <div class="flex flex-col md:flex-row md:items-center">

            <li
                class="flex cursor-pointer font-gabarito items-center mx-2 my-1 hover:bg-gray-100 transition-all duration-150 hover:text-blue-500 rounded-full px-2 py-1">
                <a :href="`https://www.twitch.tv/${c.username}`" target="_blank" class="flex items-center">
                    <div class="user flex items-center">
                        <img :src="c.profile_image_url" class="w-8 h-8 rounded-full" />
                        <div class="flex flex-col">
                            <span class="ml-2">{{ c.display_name }}</span>
                            <span v-if="$props.liveChannels.find(lc => lc.username === c.username)"
                                class="ml-2 text-xs text-green-500">
                                <UIcon name="i-lucide-video" class="w-4 h-4 inline-block" />
                                En directo
                            </span>
                            <span v-if="c.username === 'petruquiolive'"
                                class="ml-2 text-xs text-blue-500 flex items-center">
                                <UIcon name="i-lucide-bot" class="w-4 h-4 inline-block mr-1" />
                                Canal del bot
                            </span>

                        </div>
                    </div>
                </a>

            </li>
            <div class="rounded-full h-1 w-1 bg-gray-300 mx-2 hidden md:block"
                v-if="!($props.index === $props.joinedChannels.length - 1)"></div>
        </div>
    </UTooltip>
</template>

<script lang="ts" setup>
const props = defineProps<{
    joinedChannels: any[];
    liveChannels: any[];
    index: number;
}>()

const c = computed(() => props.joinedChannels[props.index])
</script>