import { AxiosError } from "axios";

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

    return {
        getStream,
        generateClip,
        handleSocketEvent
    }
}