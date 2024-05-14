<template>
    <UModal v-bind="$attrs">
        <UCard>
            <template #header>
                <h2 class="text-xl font-medium font-jost">
                    Configuración del Stream Manager
                </h2>
            </template>

            <div class="flex justify-end mb-4">
                <UAlert color="blue" variant="soft" class="p-4"
                    description="Los cambios en la configuración se guardarán automáticamente." />
            </div>

            <UFormGroup label="Mostrar vista previa">
                <UToggle v-model="configuration.showStreamPreview"
                    @update:modelValue="handleConfigChange('showStreamPreview', $event)" />
            </UFormGroup>

            <UFormGroup label="Mostrar chat">
                <UToggle v-model="configuration.showChat" @update:modelValue="handleConfigChange('showChat', $event)" />
            </UFormGroup>

            <UFormGroup label="Sonido de notificaciones">
                <USelect v-model="configuration.notificationSound"
                    @update:modelValue="handleConfigChange('notificationSound', $event)"
                    :options="soundsForNotifications" />

            </UFormGroup>


            <template #footer>
                <div class="flex justify-end gap-4">
                    <UButton color="blue" variant="soft" icon="i-lucide-check" @click="close">
                        Cerrar
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script lang="ts" setup>
const emit = defineEmits(['close'])

const { configuration } = useStreamManager()

const handleConfigChange = (key: string, value: any) => {
    (configuration.value as Record<string, any>)[key] = value
}



const soundsForNotifications = [
    {
        label: 'Ninguno',
        value: 'none',
    },
    {
        label: 'Slack',
        value: 'SLACK_NOTIFICATION',
    },
    {
        label: 'New',
        value: 'NEW_NOTIFICATION'
    }
]

const close = () => {
    emit('close')
}
</script>
