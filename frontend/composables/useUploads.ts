import { useI18n } from "vue-i18n";

export const useUploads = () => {
    const toast = useToast();
    const client = useAuthenticatedRequest();
    const i18n = useI18n();

    const fetchUploads = async () => {
        try {
            const response = await client(`${API_ENDPOINT}/uploads`);
            return response.data;
        } catch (error) {
            toast.add({
                title: 'Error',
                description: 'Failed to fetch uploads',
                icon: 'i-heroicons-information-circle',
                color: 'red',
            });
            throw new Error('Failed to fetch uploads');
        }
    }

    const uploadFile = async (file: File) => {
        try {
            console.log(file)
            const formData = new FormData();
            formData.append('file', file);
            const response = await client.post(`${API_ENDPOINT}/uploads`, formData);
            return response.data;
        } catch (error) {
            toast.add({
                title: 'Error',
                description: 'Failed to upload file',
                icon: 'i-heroicons-information-circle',
                color: 'red',
            });
            throw new Error('Failed to upload file');
        }
    }

    return {
        fetchUploads,
        uploadFile,
    };
}