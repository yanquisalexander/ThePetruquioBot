<template>
    <UModal v-bind="$attrs">
        <UCard>
            <template #header>
                <h2 class="text-xl font-medium font-jost">
                    Crear widget personalizado
                </h2>
            </template>

            <UFormGroup label="Nombre del widget">
                <UInput v-model="widgetName" />
            </UFormGroup>

            <UFormGroup label="Descripción del widget">
                <UTextarea v-model="widgetDescription" />
            </UFormGroup>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton color="gray" variant="soft" @click="$emit('close')">
                        Cancelar
                    </UButton>
                    <UButton color="blue" @click="create">
                        Crear
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script lang="ts" setup>

const widgetName = ref('')
const widgetDescription = ref('')
const { createWidget } = useCustomWidgets()

const emit = defineEmits(['widgetCreated'])

const create = async () => {
    await createWidget({
        widget_name: widgetName.value,
        widget_description: widgetDescription.value
    })
    emit('widgetCreated')
    widgetName.value = ''
    widgetDescription.value = ''
}

</script>