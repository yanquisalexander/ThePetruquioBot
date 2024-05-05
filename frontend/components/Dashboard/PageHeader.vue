<template>
    <div class="py-4 rounded-md mt-2 mx-auto">
        <div class="pb-4">
            <h2 class="text-2xl font-medium font-jost mb-4">
                {{ t(title) }}
            </h2>
        </div>
        <DashboardBreadcrumb />
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    title: string
}>()

const { t } = useI18n()

</script>