import { AxiosError } from "axios";
import { defineStore } from 'pinia';
import { useStorage } from "@vueuse/core";

interface StreamManagerConfig {
    showStreamPreview: boolean;
    showChat: boolean;
    notificationSound: keyof typeof Sounds;
    copilotVoice: string;
}

const defaultConfig: StreamManagerConfig = {
    showStreamPreview: true,
    showChat: true,
    notificationSound: 'SLACK_NOTIFICATION',
    copilotVoice: 'Enrique'
};


export const useStreamManager = () => {
    const toast = useToast();
    const client = useAuthenticatedRequest();
    const currentConfig = useStorage('sm-config', defaultConfig, null, {
        mergeDefaults: true
    })


    const getStream = async () => {
        try {
            const response = await client(`${API_ENDPOINT}/stream-manager/stream`);
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch stream information');
        }
    }

    const generateClip = async () => {
        try {
            const response = await client.post(`${API_ENDPOINT}/stream-manager/clip`);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new Error(error.response.data?.error || 'Failed to generate clip');
            }
        }
    }

    const handleSocketEvent = async (event: string, data: any) => {
        switch (event) {
            case 'channel-point-redemption':
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
                SoundManager.getInstance().playSound(Sounds[configuration.value.notificationSound])
                break;
            case 'title-change':
                console.log('title-change', data)
                toast.add({
                    id: 'title-change',
                    color: 'blue',
                    title: 'Título de la transmisión actualizado',
                    description: `El título de la transmisión se ha actualizado a: <b>${data.title}</b>`,
                    icon: 'i-lucide-pencil',
                    timeout: 6000,
                })
                SoundManager.getInstance().playSound(Sounds[configuration.value.notificationSound])
                break;
            case 'chat-cleared':
                console.log('chat-cleared', data)
                toast.add({
                    title: 'Chat despejado',
                    color: 'green',
                    description: 'Un moderador limpió el chat de tu stream.',
                    icon: 'i-lucide-sword',
                    timeout: 5000
                })
                SoundManager.getInstance().playSound(Sounds[configuration.value.notificationSound])
                break;
            default:
                break;
        }
    }

    const updateConfiguration = (config: Partial<StreamManagerConfig>) => {
        currentConfig.value = {
            ...currentConfig.value,
            ...config
        }
    }


    const configuration = computed({
        get: () => currentConfig.value,
        set: (value: Partial<StreamManagerConfig>) => {
            updateConfiguration(value);
        }
    })


    watch(configuration, (config) => {
        console.log('Configuration updated', config);
    }, { deep: true, immediate: true });





    return {
        getStream,
        generateClip,
        handleSocketEvent,
        configuration
    }
}