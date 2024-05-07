<template>
    <custom-widget-root v-if="widget">
        <div id="custom-widget-container" v-html="widget.custom_html" />
        <!-- renderizar custom_js aqui -->
        <component :is="'script'" v-if="clientMounted" type="module">
            {{ widget.custom_js }}
        </component>
        <!-- renderizar custom_css aqui -->
        <component :is="'style'">
            {{ widget.custom_css }}
        </component>
    </custom-widget-root>
</template>

<script lang="ts" setup>
import axios, { AxiosError } from "axios";
import io from 'socket.io-client'
import { Howl, Howler } from "howler";

const route = useRoute()
const token = ref(route.params.token)
const widgetId = ref(route.params.widgetId)
const user = ref(null)
const widget = ref(null)
const clientMounted = ref(false)

const socket = ref<typeof io.Socket | null>(null)

const fetchUser = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/accounts/me`, {
            headers: {
                Authorization: `Bearer ${token.value}`,
            },
        })
        user.value = response.data.user
    } catch (error) {
        console.error('Error fetching user', error)
        throw createError({
            statusCode: 401,
            message: 'Error fetching user. Maybe the token is invalid?',
            fatal: true,
        })
    }
}

const fetchWidget = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/custom-widgets/${widgetId.value}`, {
            headers: {
                Authorization: `Bearer ${token.value}`,
            },
        })
        widget.value = response.data.data.widget
    } catch (error) {
        console.error('Error fetching widget', error)
        throw createError({
            statusCode: (error as AxiosError).response.status,
            message: 'Error fetching widget.Maybe the widget ID is invalid?',
            fatal: true,

        })
    }
}



const createSocket = () => {
    socket.value = io(SOCKET_ENDPOINT, {
        transports: ['websocket']
    })

    socket.value.on('connect', () => {
        console.log('Connected to Petruquio.LIVE socket')
    })

    socket.value.emit('subscribeChannel', `events:channel.${user.value.twitchId}`)

    socket.value.on('widgets:updated', () => {
        location.reload()
    })

    // @ts-ignore
    globalThis.socket = socket.value

    // Inject custom widget properties into globalThis
    // Also inject Howler for sound effects
    // @ts-ignore 
    globalThis.Howler = Howler
    // @ts-ignore
    globalThis.widgetCustomData = { ...widget.value.properties }
    clientMounted.value = true
}

try {
    await fetchUser()
    await fetchWidget()
} catch (error) {
    console.error('Error fetching user or widget', error)
}

onMounted(async () => {
    createSocket()
})

definePageMeta({
    layout: 'empty'
})


useHead({
    title: `Custom Widget ${widgetId.value}`,
    script: [
        widget.value.properties?.includeTailwind ? {
            src: 'https://cdn.tailwindcss.com',
        } : null,
    ],
})
</script>