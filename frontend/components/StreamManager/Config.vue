<template>
    <UModal v-bind="$attrs">
        <UCard>
            <template #header>
                <h2 class="text-xl font-medium font-jost">
                    Configuración de stream
                </h2>
            </template>

            <UFormGroup label="Mostrar vista previa">
                <UToggle v-model="configuration.showStreamPreview"
                    @update:modelValue="handleConfigChange('showStreamPreview', $event)" />
            </UFormGroup>



            <template #footer>
                <div class="flex justify-end gap-4">
                    <UButton @click="emit('close')" color="gray" variant="soft">
                        Cerrar
                    </UButton>
                    <UButton color="blue" variant="soft" icon="i-lucide-save">
                        Guardar
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
</script>
