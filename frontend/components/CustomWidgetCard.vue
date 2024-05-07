<template>
    <UCard>
        <template #header>
            <h2 class="text-xl font-medium font-jost">
                {{ props.widget.name }}
            </h2>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton color="blue" :to="`/dashboard/custom-widgets/${props.widget.id}`" variant="soft"
                    icon="i-lucide-edit">
                    Editar widget
                </UButton>

            </div>
        </template>

    </UCard>
</template>

<script lang="ts" setup>
const props = defineProps<{
    widget: any;
}>()
</script>