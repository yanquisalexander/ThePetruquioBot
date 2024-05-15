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

                <div class="my-4">
                    <StreamManagerStreamCopilot />
                </div>

                <div class="grid">
                    <div class="grid md:grid-cols-12 gap-4">
                        <div class="col-span-12 o-2">
                            <ClientOnly>
                                <Splitpanes>
                                    <Pane size="50%" min-size="30" v-if="configuration.showStreamPreview">
                                        <LazyStreamManagerPreview />
                                    </Pane>
                                    <Pane min-size="30">
                                        <LazyStreamManagerChat />
                                    </Pane>
                                </Splitpanes>
                            </ClientOnly>
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
            <StreamManagerConfig v-model="showConfig" @close="showConfig = false" />
        </UContainer>
    </DashboardPageContainer>
</template>

<script lang="ts" setup>
import io from 'socket.io-client'
// @ts-ignore
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

definePageMeta({
    middleware: 'auth',
    layout: 'dashboard',
})

useHead({
    title: 'Stream Manager'
})

const { rawUser } = useCurrentUser()
const sidebar = useSidebar()
const toast = useToast()
const { getStream, handleSocketEvent, configuration } = useStreamManager()


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

    socket.value.on('title-change', async (data: any) => {
        await handleSocketEvent('title-change', data)
    })

    socket.value.on('chat-cleared', async (data: any) => {
        await handleSocketEvent('chat-cleared', data)
    })
}



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


<style>
.splitpanes__pane {
    width: 100%;
    height: 100%;
    padding: 1px;
}

.splitpanes--vertical>.splitpanes__splitter {
    min-width: 1px;
    cursor: col-resize;
    box-sizing: border-box;
    position: relative;
    flex-shrink: 0;
}

.splitpanes__splitter:before,
.splitpanes__splitter:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: #00000026;
    transform: translate(-50%, -50%);
    z-index: 1;
    transform: translateY(-50%);
    width: 1px;
    height: 30px;

}

.splitpanes--vertical>.splitpanes__splitter:before {
    margin-left: -2px;
}

.splitpanes--vertical>.splitpanes__splitter:after {
    margin-left: 2px;
}
</style>