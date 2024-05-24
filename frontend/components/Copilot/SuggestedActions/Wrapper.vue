<template>
    <UAlert v-if="hasSuggestedChannelToRaid" color="twitch" class="p-4 my-2" icon="i-fa6-brands-twitch"
        title="Canal sugerido para raid" :actions="[{
            variant: 'solid', color: 'gray', label: `Raid ${props.suggested_actions[0].args.channel.display_name}`,
            icon: 'i-lucide-arrow-up-right'
        }]">
        <template #description>
            <div class="flex items-center mt-4">
                <div class="flex-shrink-0 mr-4">
                    <img :src="props.suggested_actions[0].args.channel.thumbnail_url" class="h-16 rounded-md shadow-md"
                        alt="Suggested channel thumbnail" />
                </div>
                <div class="flex flex-col">
                    <span class="font-medium">{{ props.suggested_actions[0].args.channel.display_name }}</span>
                    <span>{{ props.suggested_actions[0].args.channel.title }}</span>
                    <span>{{ props.suggested_actions[0].args.channel.viewers }} espectadores</span>
                </div>
            </div>
        </template>





    </UAlert>
</template>

<script lang="ts" setup>
const props = defineProps<{
    suggested_actions: any
}>()

const hasSuggestedChannelToRaid = computed(() => {
    return props.suggested_actions.some((action: any) => action.id === 'suggestChannelToRaid')
})
</script>

{
"id": "suggestChannelToRaid",
"args": {
"channel": {
"display_name": "ShuliiPalmi",
"title": "hoy pura variedad",
"viewers": 29,
"started_at": "2024-05-14T18:10:42.000Z",
"language": "es",
"game_name": "Just Chatting",
"thumbnail_url":
"https://static-cdn.jtvnw.net/jtv_user_pictures/0b3b7b7b-7b7b-0b3b-b7b7-7b0b3b7b7b7b-profile_image-300x300.png",
}
}
}