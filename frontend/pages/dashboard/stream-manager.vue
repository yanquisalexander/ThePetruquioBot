<template>
    <DashboardPageContainer>
        <DashboardPageHeader title="Stream Manager" />

        <UContainer>
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between flex-col md:flex-row">
                        <h2 class="text-xl font-medium font-jost">Stream Manager</h2>
                        <StreamManagerHeader :data="streamData" />
                    </div>
                </template>


                <div class="grid">
                    <div class="grid md:grid-cols-12 gap-4">
                        <!-- Esto va a la izquierda -->
                        <div class="md:col-span-8">
                            <StreamManagerPreview />
                        </div>
                        <!-- Esto va a la derecha -->
                        <div class="md:col-span-4">
                            <LazyStreamManagerChat />
                        </div>
                    </div>
                </div>
            </UCard>
        </UContainer>
    </DashboardPageContainer>
</template>

<script lang="ts" setup>
import { type Socket, io } from "socket.io-client";

const { rawUser } = useCurrentUser()
const client = useAuthenticatedRequest()
const sidebar = useSidebar()
const toast = useToast()
const { getStream } = useStreamManager()

const streamData = ref(null)

const socket = ref<Socket | null>(null)

const connectSocket = () => {
    socket.value = io(SOCKET_ENDPOINT)

    socket.value.on('connect', () => {
        console.log('Connected to socket')
    })

    socket.value.on('disconnect', () => {
        console.log('Disconnected from socket')
    })

    socket.value.emit('subscribeChannel', `stream-manager:${rawUser().twitchId}`)


    socket.value.on('stream:updated', (data) => {
        streamData.value = data
    })

    socket.value.on('channel-point-redemption', (data) => {
        console.log('channel-point-redemption', data)
        toast.add({
            id: data.eventId,
            title: 'Nuevo canje de puntos de canal',
            color: 'blue',
            description: `<b>${data.user.displayName}</b> canjeó <b>${data.rewardName}</b> por ${data.rewardCost} puntos.`,
            icon: 'i-lucide-gift',
            timeout: 6000,
            avatar: {
                src: data.user.avatar ?? data.rewardIcon,
            }
        })
        SoundManager.getInstance().playSound(Sounds.SLACK_NOTIFICATION)
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
