<template>
    <div id="widget" class="h-screen w-screen flex flex-col justify-center items-center">
        <div id="alert-box" class="h-full w-full flex flex-col justify-center items-center">
            <div id="wrap" class="flex flex-col justify-center items-center">
                <template v-if="currentVariation">
                    {{ currentVariation.alert_settings }}
                    <div id="alert-image-wrap">
                        <div id="alert-image">
                            <template v-if="isImage">
                                <img :src="currentVariation.alert_settings.image_or_video.src" />
                            </template>
                            <template v-else-if="isVideo">
                                <video :src="currentVariation.alert_settings.image_or_video.src" autoplay loop />
                            </template>
                        </div>
                    </div>
                    <div id="alert-text-wrap">
                        <div id="alert-text" class="text-center">
                            <div id="alert-message"
                                :style="{ color: currentVariation.text_settings.font_color.value, fontSize: currentVariation.text_settings.font_size.value + 'px', fontWeight: currentVariation.text_settings.font_weight.value }">
                                <p>Test Alert</p>
                            </div>
                            <div id="alert-user-message">
                                <p>Test User</p>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <!-- Condicionalmente mostrar imagen / video / texto -->
            <div v-if="currentVariation">
                <h2>{{ currentVariation }}</h2>
                <!-- Agrega más lógica según el tipo de contenido que deseas mostrar -->
                <div v-if="currentVariation.text_settings">
                    <p>{{ currentVariation.text_settings.text.value }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import SoundManager from '@/utils/SoundManager';


const soundManager = SoundManager.getInstance()


definePageMeta({
    layout: 'empty',
});

const route = useRoute();
const widgetId = ref(route.params.id[0]);
const socket: Ref<Socket | null> = ref(null);
const widget = ref(null);
const fetchError = ref(null);
const eventsQueue = ref([]);
let eventTimeout;
const currentVariation = ref(null);

const initializeSocket = async () => {
    socket.value = io(SOCKET_ENDPOINT, {
        transports: ['websocket'],
    });

    socket.value.on('connect', () => {
        console.log('[Socket] Connected to socket server');
        socket.value?.emit('subscribeChannel', `events:channel.${widget.value.channel_id}`);
    });

    socket.value.on('event', (event) => {
        console.log('[Socket] Event received', event);

        if(event.type === 'widget.update') {
            fetchWidget()
            return
        }

        // Encolar eventos para procesarlos
        eventsQueue.value.push(event);

        // Si no hay un temporizador en curso, procesar el próximo evento de inmediato
        if (!eventTimeout) {
            processNextEvent();
        }
    });
};

const isVideo = computed(() => {
    const formats = [
        'mp4',
        'webm'
    ]
    console.log('Format: ', currentVariation.value.alert_settings.image_or_video.src.split('.').pop())
    return formats.includes(currentVariation.value.alert_settings.image_or_video.src.split('.').pop())
})

const isImage = computed(() => {
    const formats = [
        'png',
        'jpg',
        'jpeg',
        'gif',
        'webp'
    ]
    console.log('Format: ', currentVariation.value.alert_settings.image_or_video.src.split('.').pop())
    return formats.includes(currentVariation.value.alert_settings.image_or_video.src.split('.').pop())
})


if (!widgetId.value) {
    createError({
        statusCode: 404,
        message: 'Widget not found',
    });
}

const fetchWidget = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/widgets/${widgetId.value}`);
        if (response.status === 200) {
            widget.value = response.data.data;
        } else {
            widget.value = null;
        }
    } catch (error) {
        fetchError.value = error.message;
    }
};

const processNextEvent = () => {
    if (eventsQueue.value.length > 0) {
        // Obtener el próximo evento en la cola
        const nextEvent = eventsQueue.value.shift();

        // Procesar el evento aquí
        console.log('[Processing Event]:', nextEvent);

        // Aplicar condiciones y seleccionar la variación
        currentVariation.value = selectVariation(nextEvent);

        // Reproducir sonido
        soundManager.playSound(currentVariation.value.alert_settings.sound_href.src, currentVariation.value.alert_settings.sound_volume.value / 100 || 1)

        // Configurar el temporizador para el próximo evento después de alert_duration
        eventTimeout = setTimeout(async () => {
            // Reiniciar el temporizador
            eventTimeout = null;

            currentVariation.value = null;
            await new Promise((resolve) => setTimeout(resolve, 5000));
            processNextEvent();
        }, currentVariation.value.alert_settings.alert_duration.value * 1000);

    } else {
        // No hay más eventos en la cola, restablecer la variación actual
        currentVariation.value = null;
        console.log('[Processing Event]: No more events in queue');
    }
};

const selectVariation = (event) => {
    const eventType = event.type;

    // Obtener la variación correspondiente al evento actual
    const variations = widget.value.json.configStates.find((configState) => configState.event_type === eventType)?.states;

    // Seleccionar la primera variación (puedes ajustar esta lógica según tus necesidades)
    return variations ? variations[0] : null;
};



onMounted(async () => {
    await fetchWidget();
    await initializeSocket();
});
</script>