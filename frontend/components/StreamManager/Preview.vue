<template>
    <div class="md:col-span-8">
        <UCard>
            <template #header>
                <h2 class="text-xl font-medium font-jost">
                    Vista previa
                </h2>
            </template>

            <iframe :src="`https://player.twitch.tv/?channel=${currentUser.getUsername()}&parent=${FRONTEND_URL}`"
                frameborder="0" scrolling="no" allowfullscreen="true" class="w-full h-96"></iframe>

            <template #footer>
                <div class="flex justify-end gap-4">
                    <UButton @click="console.log" color="blue" variant="soft" icon="i-lucide-play" disabled>
                        Iniciar stream
                    </UButton>
                    <UButton @click="createClip" color="twitch" variant="soft" icon="i-lucide-clapperboard"
                        :loading="state.isCreatingClip">
                        Generar clip
                    </UButton>
                </div>
            </template>
        </UCard>
    </div>
</template>

<script lang="ts" setup>
const currentUser = useCurrentUser()
const { generateClip, configuration } = useStreamManager()
const toast = useToast()

const state = ref({
    isCreatingClip: false,
})

const createClip = async () => {
    try {
        state.value.isCreatingClip = true
        await generateClip()
        toast.add({
            icon: 'i-lucide-clapperboard',
            title: 'Clip generado',
            color: 'green',
            timeout: 5000,
        })
    } catch (error) {
        toast.add({
            icon: 'i-lucide-clapperboard',
            title: 'Error al generar clip',
            description: (error as Error).message,
            color: 'red',
            timeout: 5000,
        })
    } finally {
        state.value.isCreatingClip = false
    }
}

</script>