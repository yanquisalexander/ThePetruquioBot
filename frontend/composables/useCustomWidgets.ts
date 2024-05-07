import { AxiosError, type AxiosResponse } from "axios";

export const useCustomWidgets = () => {
    const toast = useToast();
    const client = useAuthenticatedRequest();


    const fetchWidgets = async () => {
        try {
            const response = await client(`${API_ENDPOINT}/custom-widgets`);
            return response.data;
        } catch (error) {
            toast.add({
                title: 'Error',
                description: 'Failed to fetch custom widgets',
                icon: 'i-heroicons-information-circle',
                color: 'red',
            });
            throw new Error('Failed to fetch custom widgets');
        }
    }

    const fetchWidget = async (id: string) => {
        try {
            const response = await client(`${API_ENDPOINT}/custom-widgets/${id}`);
            return response.data;
        } catch (error) {
            toast.add({
                title: 'Error',
                description: 'Failed to fetch custom widget',
                icon: 'i-lucide-information-circle',
                color: 'red',
            });
            throw new Error('Failed to fetch custom widget');
        }
    }

    const createWidget = async (widget: any) => {
        try {
            const response = await client.post(`${API_ENDPOINT}/custom-widgets`, widget);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    const updateWidget = async (widget: any) => {
        try {
            const response = await client.put(`${API_ENDPOINT}/custom-widgets/${widget.id}`, widget);
            toast.add({
                title: 'Success',
                description: 'Widget updated successfully',
                icon: 'i-lucide-check',
                color: 'green',
            });
            return response.data;
        } catch (error) {
            console.error(error);
            toast.add({
                title: 'Error',
                description: 'Failed to update widget',
                icon: 'i-lucide-information-circle',
                color: 'red',
            });
        }
    }

    const deleteWidget = async (widget: any) => {
        try {
            const response = await client.delete(`${API_ENDPOINT}/custom-widgets/${widget.id}`);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    return {
        fetchWidgets,
        fetchWidget,
        createWidget,
        updateWidget,
        deleteWidget,
    }
}