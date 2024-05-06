<template>
    <StatsChart :chartData="chartData" chartType="line" :chartOptions="chartOptions" class="mb-4 h-56" />
</template>

<script lang="ts" setup>
const props = defineProps<{
    dashboardData: any;
}>()

const chartOptions = ref({
    scales: {
        y: {
            beginAtZero: true,
        },
    },
    interaction: {
        intersect: false,
        mode: 'index',
    },
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
    }
});

const chartData = computed(() => {
    if (!props.dashboardData) return null
    const labels = props.dashboardData.stats.last_30_days_redemptions.map((d: any) => {
        return new Date(d.day).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        });
    }) as string[];
    const data = props.dashboardData.stats.last_30_days_redemptions.map((d: any) => {
        return d.redemption_count
    });

    return {
        labels,
        datasets: [{
            label: `Canjes con Puntos del canal`,
            data,
            backgroundColor: '#e0d0f7',
            borderColor: '#9146FF',
            borderWidth: 1,
            fill: true,
            tension: 0.2,
        }],
    };

})
</script>