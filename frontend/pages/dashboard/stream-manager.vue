<template>
    <DashboardPageContainer>
        <DashboardPageHeader title="Stream Manager" />

        <UContainer>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between flex-col md:flex-row">
                        <h2 class="text-xl font-medium font-jost">Stream Manager</h2>
                        <StreamManagerHeader :data="streamData?.data" />
                    </div>
                </template>


                <div class="grid">
                    <div class="grid md:grid-cols-12 gap-4">
                        <!-- Esto va a la izquierda -->
                        <LazyStreamManagerPreview v-if="configuration.showStreamPreview" />
                        <!-- Esto va a la derecha -->
                        <div class="md:col-span-4">
                            <LazyStreamManagerChat />
                        </div>
                        <LazyStreamManagerSonglist v-if="streamData?.data?.songlist" class="md:col-span-5"
                            :songlistUserId="streamData.data.songlist.id" />

                        <LazyStreamManagerOBSControl v-if="rawUser().channel.preferences.enableObsControl.value"
                            class="md:col-span-7" />

                        <UButton @click="showConfig = true" color="blue" variant="soft" class="md:col-span-12">
                            Configuración
                        </UButton>
                    </div>
                </div>
            </UCard>
            <StreamManagerConfig v-model="showConfig" />
        </UContainer>
    </DashboardPageContainer>
</template>

<script lang="ts" setup>
import io from 'socket.io-client'

const { rawUser } = useCurrentUser()
const sidebar = useSidebar()
const toast = useToast()
const { getStream, handleSocketEvent, configuration } = useStreamManager()
const { initializeConfigFromLocalStorage } = useStreamManagerStore()


const streamData = ref(null)
const showConfig = ref(false)

const socket = ref<typeof io.Socket | null>(null)

const connectSocket = () => {
    socket.value = io(SOCKET_ENDPOINT, {
        transports: ['websocket'],
    })

    socket.value.on('connect', () => {
        console.log('Connected to socket')
    })

    socket.value.on('disconnect', () => {
        console.log('Disconnected from socket')
    })

    socket.value.emit('subscribeChannel', `stream-manager:${rawUser().twitchId}`)



    socket.value.on('channel-point-redemption', async (data: any) => {
        await handleSocketEvent('channel-point-redemption', data)

    })

    socket.value.on('chat-cleared', () => {
        toast.add({
            title: 'Chat despejado',
            color: 'green',
            description: 'Un moderador limpió el chat de tu stream.',
            icon: 'i-lucide-sword',
            timeout: 5000
        })
    })
}

definePageMeta({
    layout: 'dashboard',
    middleware: 'auth'
})

useHead({
    title: 'Stream Manager'
})

onMounted(async () => {
    if (sidebar.sidebarVisible) {
        sidebar.hideSidebar()
        toast.add({
            title: 'Se ocultó la barra lateral',
            description: 'Para una mejor experiencia, la barra lateral se ocultó automáticamente.',
            icon: 'i-lucide-eye-off',
            timeout: 15000
        })
    }
    initializeConfigFromLocalStorage()
    connectSocket()

})

onBeforeMount(async () => {
    try {
        streamData.value = await getStream()
    } catch (error) {
        console.error(error)
    }
})

onUnmounted(() => {
    if (socket.value) {
        socket.value.disconnect()
    }
})


</script>
