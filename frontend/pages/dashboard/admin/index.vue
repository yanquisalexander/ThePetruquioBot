<template>
    <div class="px-6 py-4 rounded-md mt-2 mx-auto">
        <div id="log-viewer">
            <h2 class="text-xl font-medium font-poppins mb-4">
                Registros del Sistema
            </h2>
            <v-text-field class="mb-4" v-model="logFilter" placeholder="Filtrar registros" />
            <div class="bg-black font-mono text-white overflow-y-scroll h-96 overscroll-x-scroll p-4">
                <div v-for="log in filteredLogs">
                    {{ log }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import axios from 'axios';

const { data } = useAuth()
const config = useRuntimeConfig()
const user = data.value.user

const dashboardData = ref({})
const filteredLogs = ref([])
const logFilter = ref('')
const longPoller = ref()

/* Long-poll API for new data */

const fetchDashboardData = async () => {
    const response = await axios.get(`${API_ENDPOINT}/admin/dashboard`, {
        headers: {
            Authorization: `Bearer ${user.token}`
        }
    })

    dashboardData.value = response.data
    if(logFilter.value.length > 0) {
        const filtered = dashboardData.value.data.system.logs.filter((log) => {
            return log.includes(logFilter.value)
        })
        filteredLogs.value = filtered
    } else {
        filteredLogs.value = dashboardData.value.data.system.logs
    }
}

watch(logFilter, (value) => {
    if (value.length > 0) {
        const filtered = dashboardData.value.data.system.logs.filter((log) => {
            return log.includes(value)
        })
        filteredLogs.value = filtered
    } else {
        filteredLogs.value = dashboardData.value.data.system.logs
    }
})

onMounted(async () => {
    await fetchDashboardData()
    longPoller.value = setInterval(async () => {
        await fetchDashboardData()
    }, 10000)
})




definePageMeta({
    middleware: 'auth',
    layout: 'dashboard',
    title: 'Panel de Control',
    description: 'Panel de control de Petruquio.LIVE',
    image: 'https://petruquio.live/img/logo.png',
    url: 'https://petruquio.live/dashboard',
    robots: 'noindex,nofollow'
})

onBeforeUnmount(() => {
    clearInterval(longPoller.value)
})
</script>