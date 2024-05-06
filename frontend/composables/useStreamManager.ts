import { AxiosError } from "axios";
import { defineStore } from 'pinia';

interface StreamManagerConfig {
    showStreamPreview: boolean;
}

const defaultConfig: StreamManagerConfig = {
    showStreamPreview: true,
};

export const useStreamManagerStore = defineStore({
    id: 'stream-manager',
    state: () => ({
        config: { ...defaultConfig },
    }),
    getters: {
        configuration: (state) => state.config,
    },
    actions: {
        initializeConfigFromLocalStorage() {
            const localStorageValue = localStorage.getItem('sm-config');
            try {
                const parsedLocalStorage = JSON.parse(localStorageValue || '{}');
                console.log('Parsed localStorage:', parsedLocalStorage);

                this.config = { ...this.config, ...parsedLocalStorage };
            } catch (error) {
                console.error('Error parsing localStorage value:', error);
                this.config = { ...defaultConfig, ...this.config };
            }
        },
        saveConfigToLocalStorage() {
            console.log('Saving config to localStorage', this.config);
            localStorage.setItem('sm-config', JSON.stringify(this.config));
            console.log('Saved to localStorage');
        },
        updateConfig(newConfig: Partial<StreamManagerConfig>) {
            console.log('Updating config', newConfig);
            this.config = { ...this.config, ...newConfig };
            this.saveConfigToLocalStorage();
        },
    },
});

export const useStreamManager = () => {
    const toast = useToast();
    const client = useAuthenticatedRequest();


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
                SoundManager.getInstance().playSound(Sounds.SLACK_NOTIFICATION)
                break;
            default:
                break;
        }
    }



    const { updateConfig, configuration } = useStreamManagerStore();


    return {
        getStream,
        generateClip,
        handleSocketEvent,
        updateConfig,
        configuration
    }
}