<template>
    <UModal v-bind="$attrs">
        <UCard>
            <template #header>
                <h2 class="text-xl font-medium font-jost">
                    Buscar plantilla de widget
                </h2>
            </template>

            <UFormGroup label="Buscar plantilla">
                <UInput v-model="search" />
            </UFormGroup>

            {{ templates }}
        </UCard>
    </UModal>
</template>

<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'
const { searchTemplates } = useCustomWidgets()
const emit = defineEmits(['select'])

const searching = ref(false)
const search = ref('')
const templates = ref(null)


const handleSearch = async () => {
    searching.value = true
    templates.value = await searchTemplates(search.value)
    searching.value = false
}

const handleSelect = (template: any) => {
    emit('select', template)
}


watchDebounced(search, handleSearch, {
    debounce: 500
})
</script>