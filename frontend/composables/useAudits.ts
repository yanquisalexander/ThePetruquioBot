import { useI18n } from "vue-i18n";

export const useAudits = () => {
    const toast = useToast();
    const client = useAuthenticatedRequest();
    const i18n = useI18n();

    const fetchAudits = async () => {
        try {
            const response = await client(`${API_ENDPOINT}/audits`);
            return response.data;
        } catch (error) {
            toast.add({
                title: 'Error',
                description: 'Failed to fetch audits',
                icon: 'i-heroicons-information-circle',
                color: 'red',
            });
            throw new Error('Failed to fetch audits');
        }
    }

    const getAuditType = (action: string) => {
        switch (action) {
            case 'SETTING_UPDATED':
                return {
                    icon: 'i-lucide-wrench',
                    colorClass: 'text-yellow-600 bg-yellow-100',
                };
            case 'IMPERSONATED_BY_ADMIN':
                return {
                    icon: 'i-lucide-shield-check',
                    colorClass: 'text-green-600 bg-green-100',
                };
            case 'LOGIN_SUCCESS':
                return {
                    icon: 'i-lucide-key-round',
                    colorClass: 'text-green-600 bg-green-100',
                };
            case 'TOKEN_REFRESHED_BY_SYSTEM':
                return {
                    icon: 'i-lucide-arrow-up-down',
                    colorClass: 'text-blue-600 bg-blue-100',
                };
            case 'API_TOKEN_GENERATED':
                return {
                    icon: 'i-lucide-key-round',
                    colorClass: 'text-blue-600 bg-blue-100',
                };
            case 'COMMAND_CREATED':
                return {
                    icon: 'i-lucide-plus',
                    colorClass: 'text-twitch-600 bg-twitch-100',
                };
            case 'IMPERSONATED_MODERATED_CHANNEL':
                return {
                    icon: 'i-lucide-heart-handshake',
                    colorClass: 'text-green-600 bg-green-100',
                };
            case 'IMPERSONATED_BY_MODERATOR':
                return {
                    icon: 'i-lucide-heart-handshake',
                    colorClass: 'text-green-600 bg-green-100',
                };
            default:
                return {
                    icon: 'i-lucide-circle-help',
                    colorClass: 'text-gray-600 bg-gray-100',
                };
        }
    };

    const getActionDescription = (actionType: string) => {
        switch (actionType) {
            case 'IMPERSONATED_BY_ADMIN':
                return i18n.t(`audit.details.${actionType}`)
            case 'TOKEN_REFRESHED_BY_SYSTEM':
                return i18n.t(`audit.details.${actionType}`)
            case 'IMPERSONATED_MODERATED_CHANNEL':
                return i18n.t(`audit.details.${actionType}`)
            case 'IMPERSONATED_BY_MODERATOR':
                return i18n.t(`audit.details.${actionType}`)
            default:
                return "";
        }
    }

    return {
        fetchAudits,
        getAuditType,
        getActionDescription,
    };
}

