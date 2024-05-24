<template>
    <UCard>
        <template #header>
            <h2 class="text-xl font-medium font-jost">
                Lista de canciones
            </h2>
        </template>


        <UTable :rows="songRequests?.list" :columns="[
            { key: 'position', label: 'Posición', sortable: true },
            { key: 'song.title', label: 'Canción' },
            { key: 'song.artist', label: 'Artista' },
            { key: 'requesters', label: 'Pedida por' }
        ]" sort-asc-icon="i-heroicons-arrow-up-20-solid"
            class="border-[1px] border-gray-300 border-solid rounded-md mt-2 mx-auto"
            sort-desc-icon="i-heroicons-arrow-down-20-solid"
            :sort-button="{ icon: 'i-heroicons-sparkles-20-solid', color: 'primary', variant: 'outline', size: '2xs', square: false }">
            <template #position-data="{ row }">
                # {{ row.position }}
            </template>
            <template #requesters-data="{ row }">
                {{ row.requests.map((request: any) => request.name).join(', ') }}
            </template>
        </UTable>

    </UCard>
</template>

<script lang="ts" setup>
import axios from "axios";
import io from 'socket.io-client'

const sslSocket = ref<typeof io.Socket | null>(null)
const toast = useToast()
const songRequests = ref<any>(null)
const props = defineProps({
    songlistUserId: Number,
})

const SOCKET_EVENTS = {
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',
    NEW_SONG: 'new-song',
    RELOAD_SONG_LIST: 'reload-song-list',
    UPDATE_SONG: 'update-song',
    UPDATE_SONGS: 'update-songs',
    DELETE_SONG: 'delete-song',
    UPDATE_QUEUE_LIST: 'queue-update',
    RELOAD_SAVED_QUEUE_LIST: 'reload-saved-queue',
    QUEUE_MESSAGE: 'queue-event',
    NEW_PLAYHISTORY: 'new-playhistory',
    UPDATE_PLAYHISTORY: 'update-playhistory',
    DELETE_PLAYHISTORY: 'delete-playhistory',
    UPDATE_STREAMER: 'update-streamer',
    UPDATE_ATTRIBUTES: 'update-attributes',
};

const fetchQueue = async () => {
    try {
        const response = await axios.get(`https://api.streamersonglist.com/v1/streamers/${props.songlistUserId}/queue`)
        songRequests.value = response.data
    } catch (error) {
        toast.add({
            title: 'Error',
            description: (error as Error).message,
            color: 'red',
            timeout: 5000,
        })
    }
}


const connectSocket = () => {
    console.log('Connecting to StreamerSonglist socket')
    sslSocket.value = io('https://api.streamersonglist.com', {
        host: 'api.streamersonglist.com',
        multiplex: false,

    })
    console.log('Socket', sslSocket.value)

    sslSocket.value.on('connect', () => {
        sslSocket.value.emit(SOCKET_EVENTS.JOIN_ROOM, `${props.songlistUserId}`)
        console.log('Connected to StreamerSonglist socket')
    })

    sslSocket.value.on('disconnect', () => {
        console.log('Disconnected from StreamerSonglist socket')
    })

    sslSocket.value.on('connect_error', (err) => {
        console.log(err.message);

        // some additional description, for example the status code of the initial HTTP response
        console.log(err.description);

        // some additional context, for example the XMLHttpRequest object
        console.log(err.context);
    })

    sslSocket.value.on('error', (error) => {
        toast.add({
            title: 'Error',
            description: error,
            color: 'red',
            timeout: 5000,
        })
    })


    sslSocket.value.on(SOCKET_EVENTS.UPDATE_SONGS, (data) => {
        console.log('Update songs', data)
    })

    sslSocket.value.on(SOCKET_EVENTS.UPDATE_QUEUE_LIST, async (data) => {
        console.log('Update queue list', data)

        const songsInQueue: any[] = data.list
        const newSongs = songsInQueue.filter((song) => !songRequests.value.list.some((request) => request.song.id === song.song.id))

        if (newSongs.length > 0) {
            toast.add({
                icon: 'i-lucide-guitar',
                title: `<b>${newSongs[0].requests[0].name ?? 'Alguien'}</b> ha pedido una nueva canción`,
                description: `${newSongs[0].song.title} - ${newSongs[0].song.artist}`,
                color: 'blue',
                timeout: 5000,
            })
            SoundManager.getInstance().playSound(Sounds.SLACK_NOTIFICATION)
        }

        await fetchQueue()
    })

    sslSocket.value.connect()
}

onMounted(() => {
    console.log('SonglistUserId', props.songlistUserId)
    connectSocket()
    fetchQueue()
})

onUnmounted(() => {
    if (sslSocket.value) {
        sslSocket.value.emit(SOCKET_EVENTS.LEAVE_ROOM, `26328`)
        sslSocket.value.disconnect()
    }
})

</script>