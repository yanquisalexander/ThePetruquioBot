<template>
    <div>
        <UCard>
            <UTitle>Obs Remote</UTitle>
            <UButton @click="connectSocket">Connect</UButton>
        </UCard>
    </div>
</template>

<script lang="ts" setup>
import type { obsstudio } from '@types/obs-studio'
import axios from "axios";
import io from 'socket.io-client'

definePageMeta({
    layout: 'empty'
});

useHead({
    title: 'OBS Remote'
});

const route = useRoute();
const token = route.query.token;
const user = ref<any>(null);

if (!token) {
    throw createError('You must provide a token to use OBS Remote')
}

const socket = ref<typeof io.Socket | null>(null)

const fetchUser = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/accounts/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        user.value = response.data.user
    } catch (error) {
        console.error('Error fetching user', error)
        throw createError('Error fetching user. Maybe the token is invalid?')
    }
}

const connectSocket = () => {
    if (!window.obsstudio) {
        throw createError({
            statusCode: 400,
            message: 'This page must be opened in an OBS Studio browser source',
            fatal: true, // Render the error page
        })
    }

    socket.value = io(SOCKET_ENDPOINT, {
        transports: ['websocket'],
        query: {
            token,
        },
    })

    socket.value.on('connect', () => {
        console.log('Connected to socket')
        socket.value.emit('subscribeChannel', `obs-remote:${user.value.twitchId}`)
    })

    socket.value.on('disconnect', () => {
        console.log('Disconnected from socket')
        socket.value.close()

    })

    socket.value.on('error', (error: any) => {
        console.error('Socket error', error)
    })
}

onMounted(async () => {
    await fetchUser()
    connectSocket()
})

onBeforeUnmount(() => {
    if (socket.value) {
        socket.value.close()
    }
})

</script>