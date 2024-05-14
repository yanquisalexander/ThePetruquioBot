<template>
    <div v-if="hasAtLeastOne" class="my-4 mx-4 p-4 bg-blue-50 rounded-md animate-fade-in-down">
        <h3
            class="text-lg font-medium mb-2 bg-gradient-to-r from-blue-600 via-red-500 to-purple-400 text-transparent bg-clip-text">
            <GeminiLogo class="h-5 w-5 inline-block mr-1 animate-swing animate-duration-[3000ms]"
                style="animation-iteration-count: infinite;" />
            Copilot ha utilizado la siguiente información para responder
        </h3>
        <template v-if="props.context.spotify">
            <UAlert class="animate-fade-in-down animate-delay-[100ms]" color="gray" title="Tu música actual en Spotify"
                icon="i-fa6-brands-spotify">

                <template #description>
                    <div class="flex mt-2">
                        <div class="flex-shrink-0">
                            <img :src="props.context.spotify.item.album.images[0].url" class="h-16 w-16 rounded-md" />

                        </div>
                        <div class="flex items-center space-x-2 flex-col ml-4">


                            <div class="flex flex-col items-start text-white">
                                <span class="font-medium">{{ props.context.spotify.item.name }}</span>
                                <span>{{ props.context.spotify.item.artists[0].name }}</span>
                                <UProgress :value="spotifyCurrentProgress" color="green" class="w-64 mt-4" />
                                <span class="text-white text-sm">{{ spotifyCurrentProgressLabels }}</span>

                            </div>
                        </div>


                    </div>
                </template>
            </UAlert>
        </template>

        <template v-if="props.context.twitchChannel">
            <UAlert class="animate-fade-in-down animate-delay-[200ms]" color="twitch" title="Canal de Twitch"
                icon="i-fa6-brands-twitch">
                <template #description>
                    <div class="flex space-x-2 mt-2">
                        <div class="flex-shrink-0">
                            <UAvatar :src="props.context.twitchChannel.avatar" size="sm" />
                        </div>
                        <div class="flex flex-col">
                            <span class="font-medium">{{ props.context.twitchChannel.displayName }}</span>
                            <span>{{ truncatedText(props.context.twitchChannel.description, 100) }}</span>

                            <div v-if="props.context.twitchChannel.stream" class="flex items-center mt-4">
                                <UIcon name="i-lucide-eye" class="mr-2" />
                                <span>En vivo con {{ props.context.twitchChannel.stream.viewers }} espectadores</span>
                            </div>
                        </div>


                    </div>
                </template>
            </UAlert>
        </template>

        <template v-if="props.context.webResults">
            <template v-if="props.context.webResults.knowledge_panel">
                <UAlert class="animate-fade-in-down animate-delay-[300ms]" color="blue" title="Panel de conocimiento"
                    icon="i-fa6-brands-wikipedia-w">
                    <template #description>
                        <div class="flex space-x-2 mt-2">
                            <div class="flex-shrink-0">
                                <img :src="props.context.webResults.knowledge_panel.images[0].url || '/favicon.ico'"
                                    class="h-16 w-16 rounded-md" />
                            </div>
                            <div class="flex flex-col">
                                <span class="font-medium">{{ props.context.webResults.knowledge_panel.title }}</span>
                                <span>{{ truncatedText(props.context.webResults.knowledge_panel.description, 100)
                                    }}</span>
                            </div>
                        </div>
                    </template>
                </UAlert>
            </template>
        </template>

        <template v-if="props.context.actions.length > 0">
            <template v-for="action in props.context.actions">
                <UAlert class="animate-fade-in-down animate-delay-[400ms] my-2" :color="getActionInfo(action).color"
                    :title="getActionInfo(action).title" variant="subtle" :icon="getActionInfo(action).icon">
                    <template #description>
                        <div class="flex mt-2">
                            <div class="flex-shrink-0">
                                <UIcon name="i-fa6-info-circle" />
                            </div>
                            <div class="flex flex-col">
                                <span>{{ getActionInfo(action).description }}</span>
                            </div>
                        </div>
                    </template>
                </UAlert>
            </template>
        </template>
    </div>

</template>

<script lang="ts" setup>
const props = defineProps<{
    context: any
}>()

const hasAtLeastOne = computed(() => {
    // Check if value is different to null or empty array
    return Object.keys(props.context).some(key => {
        const value = props.context[key]
        return value !== null && value !== undefined && (Array.isArray(value) ? value.length > 0 : true)
    })
})

const getActionInfo = (action: any) => {
    switch (action.id) {
        case 'changeStreamTitle':
            return {
                title: 'Cambio de título de stream',
                icon: 'i-lucide-edit',
                color: 'twitch',
                description: `El título de tu stream ha sido cambiado a "${action.args?.title}"`
            }
        case 'toggleEmoteOnly':
            return {
                title: 'Modo solo emotes',
                icon: 'i-lucide-smile',
                color: 'twitch',
                description: `El modo solo emotes ha sido ${action.args?.enabled ? 'activado' : 'desactivado'}`
            }
        case 'clearChat':
            return {
                title: 'Chat limpiado',
                icon: 'i-lucide-trash',
                color: 'blue',
                description: 'El chat de tu stream ha sido limpiado'
            }
        default:
            return {
                title: action.id,
                color: 'gray',
                icon: 'i-fa6-question-circle',
                description: 'No se ha podido obtener información sobre esta acción'
            }
    }
}


const spotifyInterval = ref<NodeJS.Timeout | null>(null)

const spotifyCurrentProgress = computed(() => {
    return props.context.spotify?.progress_ms / props.context.spotify.item?.duration_ms * 100
})

const spotifyCurrentProgressLabels = computed(() => {
    const currentMs = props.context.spotify?.progress_ms || 0;
    const durationMs = props.context.spotify?.item?.duration_ms || 0;

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const current = formatTime(currentMs);
    const duration = formatTime(durationMs);

    return `${current} / ${duration}`;
});

const truncatedText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}


// Mientras el contexto de Spotify esté presente, actualiza el progreso de la canción

watch(() => props.context.spotify, () => {
    if (spotifyInterval.value) {
        clearInterval(spotifyInterval.value)
    }

    if (props.context.spotify) {
        spotifyInterval.value = setInterval(() => {
            if (props.context.spotify.progress_ms >= props.context.spotify.item.duration_ms) {
                clearInterval(spotifyInterval.value)
                return
            }
            props.context.spotify.progress_ms += 1000
        }, 1000)
    }
})
</script>