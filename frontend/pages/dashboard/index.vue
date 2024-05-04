<template>
  <div v-if="dashboardData && dashboardData.bot" class="mx-auto md:px-4">
    <UAlert v-if="!dashboardData.bot.joined" color="orange" icon="i-mdi-robot-off-outline" variant="soft"
      title="Petruquio.LIVE no está conectado">
      <template #description>
        <div class="flex items-center font-jost">
          <div class="flex-1">
            <span class="block">
              Para que el bot funcione, debe estar conectado a tu canal. Puedes conectarlo desde la configuración.
            </span>
          </div>
        </div>
      </template>
    </UAlert>

    <section class="section-header mb-8">
      <div class="py-4 rounded-md mt-2 mx-auto">
        <h2 class="text-2xl font-medium font-jost mb-4">
          {{ $t('dashboard.title') }}
        </h2>
      </div>
      <DashboardBreadcrumb />
    </section>


    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Estado del bot -->
      <div v-if="dashboardData.bot" class="col-span-1 md:col-span-2 lg:col-span-1">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex items-center">
              <BotIcon class="w-8 mr-2" />
              <h4 class="font-medium text-xl">
                Estado del bot
              </h4>
            </div>
          </template>
          <p class="font-roobert">
            <UAlert v-if="!dashboardData.bot.joined" color="orange" variant="subtle" icon="i-mdi-power-plug-off-outline"
              title="Petruquio.LIVE no está conectado">
              <template #description>
                <div class="flex items-center font-jost">
                  <div class="flex-1">
                    <span class="block">
                      Para que el bot funcione, debe estar conectado a tu canal.
                    </span>
                  </div>
                </div>
              </template>
            </UAlert>
            <UAlert v-else color="green" variant="subtle" title="Petruquio.LIVE está conectado"
              icon="i-mdi-check-circle-outline">
              <template #description>
                <div class="flex items-center font-jost">
                  <div class="flex-1">
                    <span class="block">
                      Parece que todo está en orden. El bot está conectado a tu canal y funcionando correctamente.
                    </span>
                  </div>
                </div>
              </template>
            </UAlert>
          </p>
          <p v-if="dashboardData.bot.muted" class="text-sm text-gray-500">
            Parece que el bot está silenciado en tu canal. Puedes desmutearlo desde la configuración.
          </p>
          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton variant="soft" :color="dashboardData.bot.muted ? 'blue' : 'orange'" @click="toggleBotMute">
                {{ dashboardData.bot.muted ? 'Desmutear' : 'Mutear' }}
              </UButton>
              <UButton :color="dashboardData.bot.joined ? 'red' : 'green'" @click="toggleConnection">
                {{ dashboardData.bot.joined ? 'Desconectar' : 'Conectar' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </div>


      <!-- Enviar Mensaje -->
      <div class="col-span-1 md:col-span-1 lg:col-span-2">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex items-center">
              <MessageCircleIcon class="w-8 mr-2" />
              <h4 class="font-medium text-xl">
                Enviar Mensaje
              </h4>
            </div>
          </template>
          <p class="font-roobert">
            Envía un mensaje desde la cuenta del bot a tu canal de Twitch.
          </p>
          <UFormGroup label="Mensaje">
            <UTextarea v-model="messageToSend" autoresize maxlength="500" color="gray" placeholder="Escribe un mensaje"
              :rows="3" :disabled="!dashboardData.bot.joined" />
            <span class="text-sm text-gray-400" :class="messageToSend.length >= 500 ? 'text-red-500' : ''">
              {{ messageToSend.length }} / 500
            </span>
          </UFormGroup>
          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton variant="soft" color="violet" :disabled="!dashboardData.bot.joined" icon="i-mdi-send-outline"
                @click="sendMessage">
                Enviar
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
      <div class="col-span-1 md:col-span-2 lg:col-span-2 my-4">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex items-center">
              <h4 class="font-medium text-xl flex items-center">
                <UIcon name="i-lucide-bar-chart-2" class="w-8 mr-2" />
                Estadísticas
              </h4>
            </div>
          </template>
          <p class="font-roobert">
            Estadísticas de los últimos 30 días.
          </p>
          <div class="flex w-full h-56">
            <StatsChart v-if="chartData" class="w-full" :chart-data="chartData" :chart-options="chartOptions"
              chart-type="line" height="100%" />
          </div>
        </UCard>
      </div>
      <!-- chat embeded -->
      <!-- Chat Embedido -->
      <div class="col-span-1 md:col-span-2 lg:col-span-1 my-4">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <template #header>
            <div class="flex items-center">
              <h4 class="font-medium text-xl flex items-center">
                <UIcon name="i-lucide-message-square" class="w-8 mr-2" />
                Chat Incrustado
              </h4>
            </div>
          </template>
          <iframe class="w-full h-svh"
            :src="`https://www.twitch.tv/embed/${currentUser.getUsername()}/chat?parent=${FRONTEND_URL}`"
            frameborder="0" scrolling="no" allowfullscreen="true" />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { BarChart2 } from 'lucide-vue-next';
import { UserIcon, MessageCircleIcon, VolumeXIcon, Volume2Icon } from 'lucide-vue-next';
import { BotIcon } from 'lucide-vue-next';
const currentUser = useCurrentUser();
const toast = useToast();

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
});

useHead({
  title: 'Panel de control'
})


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


const chartData = ref<any[]>([]);
const dialog = ref(false);
const dashboardData = ref<any>({});
const totalMessagesLast30Days = ref(0);
const messageToSend = ref('');


const setChartData = () => {
  const labels = dashboardData.value.stats.last_30_days_messages.map((d: any) => {
    return new Date(d.day).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }) as string[];
  const data = dashboardData.value.stats.last_30_days_messages.map((d: any) => {
    return d.message_count;
  });

  chartData.value = {
    labels,
    datasets: [{
      label: `Mensajes procesados`,
      data,
      backgroundColor: '#e0d0f7',
      borderColor: '#9146FF',
      borderWidth: 1,
      fill: true,
      tension: 0.2,
    }],
  };
}

const fetchDashboardData = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/dashboard?tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    });
    dashboardData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

const toggleConnection = () => {
  if (dashboardData.value.bot.joined) {
    partChannel();
  } else {
    joinChannel();
  }
};

const partChannel = async () => {
  try {
    await axios.post(`${API_ENDPOINT}/dashboard/part`, null, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    });
    toast.add({
      color: 'green',
      title: 'Bot desconectado',
      description: 'El bot ha sido desconectado de tu canal.',
      icon: 'i-mdi-check-circle-outline',
    });
  } catch (error) {
    console.error('Error disconnecting bot:', error);
    toast.add({
      color: 'red',
      title: 'Error desconectando el bot',
      description: error.response?.data?.error || error.message,
      icon: 'i-mdi-close-circle-outline',
    });
  } finally {
    await fetchDashboardData();
  }
};

const joinChannel = async () => {
  try {
    await axios.post(`${API_ENDPOINT}/dashboard/join`, null, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    });
    dialog.value = true;
    toast.add({
      color: 'green',
      title: 'Bot conectado',
      description: 'El bot ha sido conectado a tu canal.',
      icon: 'i-mdi-check-circle-outline',
    });
  } catch (error) {
    console.error('Error connecting bot:', error);
    toast.add({
      color: 'red',
      title: 'Error conectando el bot',
      description: error.response?.data?.error || error.message,
      icon: 'i-mdi-close-circle-outline',
    });
  } finally {
    await fetchDashboardData();
  }
};

const sendMessage = async () => {
  if (!messageToSend.value || messageToSend.value.trim() === '') {
    toast.add({
      color: 'yellow',
      title: 'Mensaje vacío',
      description: 'Debes escribir un mensaje para poder enviarlo.',
      icon: 'i-mdi-warning-outline',
    });
    return;
  }
  if (messageToSend.value.length > 500) {
    toast.add({
      color: 'yellow',
      title: 'Mensaje muy largo',
      description: 'El mensaje no puede tener más de 500 caracteres.',
      icon: 'i-mdi-warning-outline',
    });
    return;
  }
  try {
    await axios.post(`${API_ENDPOINT}/dashboard/send-message`, {
      message: messageToSend.value,
    }, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    });
    messageToSend.value = '';
    toast.add({
      color: 'green',
      title: 'Mensaje enviado',
      description: 'El mensaje ha sido enviado exitosamente.',
      icon: 'i-mdi-check-circle-outline',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    toast.add({
      color: 'red',
      title: 'Error enviando el mensaje',
      description: error.response?.data?.error || error.message,
      icon: 'i-mdi-close-circle-outline',
    });
  } finally {
    await fetchDashboardData();
  }
};

const toggleBotMute = async () => {
  if (!dashboardData.value.bot.joined) {
    toast.add({
      color: 'yellow',
      title: 'Bot desconectado',
      description: 'Debes conectar el bot a tu canal para poder silenciarlo.',
      icon: 'i-mdi-warning-outline',
    });
    return;
  }
  try {
    await axios.post(`${API_ENDPOINT}/dashboard/toggle-mute`, null, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    });
    toast.add({
      color: 'green',
      title: dashboardData.value.bot.muted ? 'Bot silenciado' : 'Bot desmutado',
      description: dashboardData.value.bot.muted ? 'El bot ha sido silenciado.' : 'El bot ha sido desmutado.',
      icon: 'i-mdi-check-circle-outline',
    });
  } catch (error) {
    console.error('Error muting bot:', error);
    toast.add({
      color: 'red',
      title: 'Error silenciando el bot',
      description: error.response?.data?.error || error.message,
      icon: 'i-mdi-close-circle-outline',
    });
  } finally {
    await fetchDashboardData();
  }
};

await fetchDashboardData();
setChartData();
</script>

<style scoped>
.elevation-10 {
  box-shadow: #919eab4d 0 0 2px, #919eab1f 0 12px 24px -4px !important;
}
</style>