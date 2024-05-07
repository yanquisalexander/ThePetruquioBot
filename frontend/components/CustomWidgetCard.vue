<template>
    <UCard>
        <template #header>
            <h2 class="text-xl font-medium font-jost">
                {{ props.widget.name }}
            </h2>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton color="blue" @click="copyWidgetUrl" variant="soft" icon="i-lucide-copy">
                    Copiar URL
                </UButton>
                <UButton color="blue" :to="`/dashboard/custom-widgets/${props.widget.id}`" variant="soft"
                    icon="i-lucide-edit">
                    Editar widget
                </UButton>

            </div>
        </template>

    </UCard>
</template>

<script lang="ts" setup>
const toast = useToast()
const props = defineProps<{
    widget: any;
    userApiKey: string;
}>()

const copyWidgetUrl = () => {
    const url = `${window.location.origin}/custom-widget/${props.userApiKey}/${props.widget.id}`
    navigator.clipboard.writeText(url)
    toast.add({
        icon: 'i-lucide-check',
        title: 'URL copiada',
        description: 'La URL del widget ha sido copiada al portapapeles',
        color: 'green',
        timeout: 5000,
    })
}
</script>