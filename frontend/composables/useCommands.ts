import { AxiosError, type AxiosResponse } from "axios";

export const useCommands = () => {
    const toast = useToast();
    const client = useAuthenticatedRequest();

    const NETWORK_ERRORS = [
        "ECONNABORTED",
        "ERR_NETWORK",
        "ERR_CONNECTION_REFUSED"
    ];

    const CommandPermission = {
        EVERYONE: 'everyone',
        VIEWER: 'viewer',
        FOLLOWER: 'follower',
        SUBSCRIBER: 'subscriber',
        VIP: 'vip',
        MODERATOR: 'moderator',
        BROADCASTER: 'broadcaster',
      }

    const isErrorResponse = (response: AxiosResponse): boolean => {
        return response.status >= 400 && response.status < 600;
    };

    const handleResponseError = (error: Error | AxiosError) => {
        if ("response" in error) {
            const axiosError = error as AxiosError;
            if (NETWORK_ERRORS.includes(axiosError.code)) {
                toast.add({
                    title: 'Error de red',
                    description: 'Hubo un problema de red, por favor intenta de nuevo',
                    icon: 'i-lucide-wifi-off',
                    color: 'orange',
                });
            } else {
                toast.add({
                    title: 'Error del servidor',
                    description: 'Ha ocurrido un error en el servidor, por favor inténtalo más tarde',
                    icon: 'i-lucide-server-network',
                    color: 'red',
                });
            }
            throw error; // Re-lanza el error para que el llamador pueda manejarlo
        } else {
            const genericError = error as Error;
            toast.add({
                title: 'Error',
                description: genericError.message,
                icon: 'i-heroicons-information-circle',
                color: 'red',
            });
            throw genericError;
        }
    };
    

    const getCommands = async () => {
        try {
            const response = await client.get(`${API_ENDPOINT}/channel/commands`);
            if (isErrorResponse(response)) {
                throw new Error('No se pudieron obtener los comandos');
            }
            return response.data.data.commands;
        } catch (error) {
            handleResponseError(error as AxiosError);
        }
    };

    const toggleCommand = async (commandId: string) => {
        try {
            const response = await client.put(`${API_ENDPOINT}/channel/commands/${commandId}/toggle`);
            if (response.data.success && response.status === 200) {
                toast.add({
                    title: 'Comando editado',
                    description: 'El comando se ha editado correctamente',
                    icon: 'i-heroicons-check-20-solid',
                });
                return response.data;
            } else {
                throw new Error('No se ha podido editar el comando');
            }
        } catch (error) {
            handleResponseError(error as AxiosError);
        }
    };

    const editCommand = async (command: any) => {
        try {
            if (command.name === '' || command.response === '') {
                toast.add({
                    title: 'Error',
                    description: 'Command and response cannot be empty',
                    icon: 'i-heroicons-information-circle',
                    color: 'red',
                });
                return;
            }

            let commandPermissions

            if(command.permissions.includes(CommandPermission.EVERYONE)) {
                commandPermissions = [CommandPermission.EVERYONE]
            }
            else {
                commandPermissions = command.permissions
            }

            const response = await client.put(`${API_ENDPOINT}/channel/commands/${command.id}`, {
                name: command.name,
                response: command.response,
                aliases: command.preferences?.aliases,
                permissions: commandPermissions,
                enabled: command.enabled,
            });

            if (response.data.success) {
                toast.add({
                    title: 'Comando editado',
                    description: 'El comando se ha editado correctamente',
                    icon: 'i-heroicons-check-20-solid',
                    color: 'green',
                });
            }
        } catch (error) {
            handleResponseError(error as AxiosError | Error);
        }
    };

    return {
        CommandPermission,
        getCommands,
        toggleCommand,
        editCommand,
    };
};
