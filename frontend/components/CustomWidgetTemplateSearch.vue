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

            <template v-if="searching">
                <UProgress indeterminate class="my-4" />
            </template>

            <template v-else-if="templates">
                <div class="flex flex-col gap-4 my-4 max-h-96 overflow-y-scrol">
                    <template v-for="template in templates" :key="template.id">
                        <UCard>
                            <template #header>
                                <div class="flex items-center gap-2">
                                    <h3 class="text-lg font-medium font-jost">{{ template.widget_name }}</h3>
                                    <UBadge v-if="VERIFIED_PUBLISHERS.includes(template.published_by.username)"
                                        :ui="{ rounded: 'rounded-full' }" color="twitch" variant="soft" class="ml-2">
                                        <UIcon name="i-lucide-shield-check" class="mr-1" />
                                        Autor verificado
                                    </UBadge>

                                    <UBadge v-if="OFFICIAL_PUBLISHERS.includes(template.published_by.username)"
                                        :ui="{ rounded: 'rounded-full' }" color="blue" variant="soft" class="ml-2">
                                        <UIcon name="i-lucide-shield-check" class="mr-1" />
                                        Oficial
                                    </UBadge>
                                </div>
                            </template>
                            <div class="flex justify-between items-end gap-2">
                                <div class="flex flex-col gap-2">
                                    <p class="text-sm">{{ template.widget_description }}</p>
                                    <span class="text-xs text-gray-500">
                                        Publicado {{ moment(template.created_at).fromNow() }}
                                    </span>
                                </div>

                                <UButton color="blue" variant="soft" @click="handleSelect(template)"
                                    icon="i-lucide-copy">
                                    Clonar
                                </UButton>
                            </div>
                            <template #footer v-if="template.published_by">
                                <div class="flex items-center gap-2">
                                    <UAvatar :src="template.published_by.avatar" />
                                    <span class="text-sm text-gray-500">
                                        Creado por {{ template.published_by.displayName }}
                                    </span>
                                </div>
                            </template>
                        </UCard>
                    </template>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script lang="ts" setup>
import moment from "moment";
import { watchDebounced } from '@vueuse/core'
const { searchTemplates } = useCustomWidgets()
const emit = defineEmits(['select'])

const searching = ref(false)
const search = ref('')
const templates = ref(null)

const VERIFIED_PUBLISHERS = [
    'alexitoo_uy'
]

const OFFICIAL_PUBLISHERS = [
    'petruquiolive'
]


const handleSearch = async () => {
    searching.value = true
    const { data } = await searchTemplates(search.value)
    templates.value = data.widgets
    searching.value = false
}

const handleSelect = (template: any) => {
    emit('select', template)
}


watchDebounced(search, handleSearch, {
    debounce: 500
})
</script>