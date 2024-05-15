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
                    @update:modelValue="handleConfigChange('notificationSound', $event); previewNotificationSound()"
                    :options="soundsForNotifications" />
            </UFormGroup>

            <UFormGroup label="Voz de Copilot">
                <USelect v-model="configuration.copilotVoice" :options="voicesForCopilot"
                    @update:modelValue="handleConfigChange('copilotVoice', $event); previewCopilotVoice()" />
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
const audioInstance = ref<HTMLAudioElement | null>(null)

const getAudio = async (text: string): Promise<void> => {
    if (audioInstance.value && !audioInstance.value.ended) {
        audioInstance.value.pause()
        audioInstance.value = null
    }
    const voice = await fetch(`https://api.streamelements.com/kappa/v2/speech?voice=${configuration.value.copilotVoice}&text=${text}`)
    const blob = await voice.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => {
        audioInstance.value = null
    }
    audioInstance.value = audio
}

const { configuration } = useStreamManager()

const handleConfigChange = (key: string, value: any) => {
    (configuration.value as Record<string, any>)[key] = value
}

const previewNotificationSound = () => {
    SoundManager.getInstance().playSound(Sounds[configuration.value.notificationSound])
}

const previewCopilotVoice = async () => {
    await getAudio('Hola, soy Copilot')
    audioInstance.value?.play()
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

const voicesForCopilot = [
    {
        label: 'Mia',
        value: 'Mia',
    },
    {
        label: 'Enrique',
        value: 'Enrique',
    },
    {
        label: 'Conchita',
        value: 'Conchita',
    },
    {
        label: 'Miguel',
        value: 'Miguel',
    },
    {
        label: 'Ricardo',
        value: 'Ricardo',
    },
    {
        label: 'pt-PT-Wavenet-A',
        value: 'pt-PT-Wavenet-A',
    },
    {
        label: 'pt-PT-Wavenet-B',
        value: 'pt-PT-Wavenet-B',
    }
]

const close = () => {
    emit('close')
}
</script>
