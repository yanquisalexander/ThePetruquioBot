<template>
    <div class="flex items-center justify-center">
        <div class="flex items-center gap-2">
            <UTooltip text="Viewers" placement="bottom">
                <UButton color="blue" variant="soft" @click="toggleViewers">
                    <UIcon name="i-lucide-eye" class="w-5 h-5" />
                    <span class="px-4">{{ stats.viewers }}</span>
                </UButton>
            </UTooltip>
            <UTooltip text="Tiempo de stream" placement="bottom">
                <UButton color="blue" variant="soft">
                    <UIcon name="i-lucide-clock" class="w-5 h-5" />
                    <span class="px-4">{{ stats.uptime }}</span>
                </UButton>
            </UTooltip>

            <UTooltip text="Followers" placement="bottom">
                <UButton color="blue" variant="soft">
                    <UIcon name="i-lucide-heart" class="w-5 h-5" />
                    <span class="px-4">{{ stats.followers }}</span>
                </UButton>
            </UTooltip>
        </div>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    data: any;
}>()

const settings = ref({
    showViewers: true,
})

const formatDuration = (duration: number) => {
    if (duration < 0 || isNaN(duration)) {
        return '00:00:00'
    }
    const hours = Math.floor(duration / 3600000)
    const minutes = Math.floor((duration % 3600000) / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const stats = computed(() => {
    const streamStartDate = new Date(props.data?.stream?.startDate)
    const currentTime = new Date()
    const uptime = formatDuration(currentTime.getTime() - streamStartDate.getTime())

    // Si no se muestra el número de viewers, se muestra '--'
    const viewers = settings.value.showViewers ? (props.data?.stream?.viewers || 0) : '--'
    const followers = props.data?.followers || 0

    return {
        uptime,
        viewers,
        followers,
        subs: 0 // Cálculo de subs
    }
})

const toggleViewers = () => {
    settings.value.showViewers = !settings.value.showViewers
}
</script>
