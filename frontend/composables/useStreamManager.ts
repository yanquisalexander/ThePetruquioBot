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
            if(error instanceof AxiosError) {
                throw new Error(error.response.data?.error || 'Failed to generate clip');
            }
        }
    }

    return {
        getStream,
        generateClip
    }
}