<template>
  <div class="bg-white">
    <div class="px-6 pt-8 pb-16 mx-auto flex flex-col">
      <h2 class="text-2xl font-medium text-center">
        Estadísticas
      </h2>

      <div id="bot-stats" v-if="stats" class="px-6">
        <template v-if="stats === null">
          <h3 class="text-lg font-medium ml-6 mt-6">No se han podido cargar las estadísticas.</h3>
        </template>
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <!-- Primera columna: Mensajes procesados -->
            <div class="bg-white p-4 flex flex-col justify-center items-center">
              <div class="bg-blue-500 rounded-full p-3 flex items-center justify-center">
                <UIcon name="i-lucide-message-circle" class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium">Mensajes procesados</h3>
                <p class="text-sm font-medium text-center">{{ stats.messages }}</p>
              </div>
            </div>

            <!-- Segunda columna: Cantidad de usuarios -->
            <div class="bg-white p-4 flex flex-col justify-center items-center">
              <div class="bg-pink-500 rounded-full p-3 flex items-center justify-center">
                <UIcon name="i-lucide-users" class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium">Usuarios</h3>
                <p class="text-sm font-medium text-center">{{ stats.users }}</p>
              </div>
            </div>

            <!-- Tercera columna: Tiempo en línea -->
            <div class="bg-white p-4 flex flex-col justify-center items-center">
              <div class="bg-green-500 rounded-full p-3 flex items-center justify-center">
                <UIcon name="i-lucide-clock-4" class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium">Tiempo en línea</h3>
                <p class="text-sm font-medium text-center">{{ formattedBotUptime }}</p>
              </div>
            </div>

            <div class="bg-white p-4 flex flex-col justify-center items-center mx-auto mt-6">
              <div class="bg-orange-500 rounded-full p-3 flex items-center justify-center">
                <UIcon name="i-lucide-video" class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium">Canales en Directo</h3>
                <p class="text-sm font-medium text-center">{{ liveChannels.length }}</p>
              </div>
            </div>
          </div>
        </template>
        <div class="mt-8 h-56 flex justify-center w-full">
          <StatsChart v-if="chartData" :chartData="chartData" chartType="line" :chartOptions="chartOptions"
            class="w-full" />
        </div>

        <div class="flex justify-center items-center">
          <span class="text-xs text-center text-gray-500 ml-6 mt-4">
            {{ stats.average_messages_per_day.toFixed(3) }} mensajes en promedio por día
          </span>
        </div>
      </div>

      <div v-else class="flex justify-center items-center w-2/4 mx-auto mt-6">
        <UProgress indeterminate color="blue" />
      </div>


      <div id="live-channels" class="py-8">
        <template v-if="!liveChannels">
          <h3 class="text-lg font-medium ml-6 mt-6">Cargando canales en directo...</h3>
        </template>
        <template v-else>
          <template v-if="liveChannels.length === 0">
            <h3 class="text-lg font-medium ml-6 mt-6">No hay canales en directo.</h3>
          </template>
          <template v-else>
            <h3 class="text-lg font-medium ml-6 mt-6">Los siguientes canales están en directo:</h3>
            <ul class="mt-2 mx-6">
              <!-- Card with screenshot on grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                <li v-for="channel in liveChannels" :key="channel.username"
                  class="flex items-center justify-between mb-4 cursor-pointer">
                  <a :href="getTwitchChannelUrl(channel)" target="_blank" class="bg-twitch-500">
                    <div
                      class="hover:translate-x-2 hover:-translate-y-2 delay-50 duration-100 hover:bg-white hover:shadow-lg transform transition cursor-pointer overflow-hidden group">
                      <img :src="channel.thumbnail_url.replace('{width}', '320').replace('{height}', '180')"
                        class="w-full h-40 object-cover" />
                      <div class="p-4 text-white group-hover:text-black">
                        <h3 class="text-lg font-medium group-hover:text-twitch-500">{{ channel.display_name }}</h3>
                        <p class="text-sm font-medium">{{ channel.title }}</p>
                      </div>
                      <div class="flex flex-wrap p-2 space-x-2 items-center space-y-2">
                        <span class="tag bg-green-600 text-white py-1 px-2 rounded-full text-xs">{{ channel.game_name
                          }}</span>
                        <span class="tag bg-purple-500 text-white py-1 px-2 rounded-full text-xs">{{ channel.viewers }}
                          espectadores</span>
                      </div>
                      <div class="stream-tags flex flex-wrap p-2 space-x-2" v-if="channel.tags.length > 0">
                        <span v-for="tag in channel.tags" :key="tag"
                          class="tag bg-blue-500 text-white py-1 px-2 rounded-full text-xs">{{ tag }}</span>
                      </div>
                    </div>
                  </a>
                </li>
              </div>
            </ul>
          </template>

        </template>


      </div>

      <div id="joined-channels" class="py-8" v-if="joinedChannels && stats">
        <template v-if="joinedChannels.length === 0 && !filterChannels">
          <h3 class="text-lg font-medium ml-6 mt-6">Parece que el bot no está en ningún canal.</h3>
        </template>
        <template v-else>
          <div class="items-center md:flex">
            <h3 class="text-lg font-medium ml-6">El bot está conectado a los siguientes canales:</h3>
            <div class="md:ml-auto md:w-1/4 mt-2 md:mt-0">
              <UInput v-model="filterChannels" :placeholder="`Filtrar canales`" size="lg"
                leading-icon="i-heroicons-magnifying-glass-20-solid" />
            </div>
          </div>
          <ul class="mt-2 flex flex-col md:flex-row md:flex-wrap">
            <template v-for="(c, index) in joinedChannels" :key="c.username">
              <StatsJoinedChannel :joinedChannels="joinedChannels" :liveChannels="liveChannels" :index="index" />
            </template>
          </ul>
        </template>
        <div class="flex items-center justify-center mt-4 flex-col md:flex-row">
          <span class="text-xs text-gray-500">
            {{ stats.channels.length }} {{ `canal${stats.channels.length === 1 ? '' : 'es'} en total` }}
          </span>
          <UIcon name="i-lucide-dot" class="w-4 h-4 text-gray-500 mx-2" />
          <NuxtLink to="/login" target="_blank">
            <div class="text-xs text-gray-500 flex items-center cursor-pointer">
              <UIcon name="i-lucide-external-link" class="w-4 h-4 mr-2" />
              ¿Te gustaría que el bot esté en tu canal?
            </div>
          </NuxtLink>
        </div>

      </div>
      <div v-else class="flex justify-center items-center w-2/4 mx-auto mt-6">
        <UProgress indeterminate color="blue" />
      </div>
    </div>
    <div class="fixed bottom-0 right-0 mb-4 mr-4 bg-black rounded-full p-2 px-3 cursor-pointer" @click="updateStats">
      <template v-if="nextUpdateIn > 0">
        <span class="text-white text-xs font-medium">Actualizando en {{ nextUpdateIn }}s</span>
      </template>
      <template v-else>
        <span class="text-white text-xs font-medium">Actualizando...</span>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ExternalLinkIcon } from 'lucide-vue-next';


const formattedBotUptime = ref(null);

const stats = ref(null);
const liveChannels = ref(null);
const joinedChannels = ref(null);
const filterChannels = ref('');
const nextUpdateIn = ref(0);
const chartData = ref(null);
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
  plugins: {
    legend: {
      display: false,
    },
  }
});


const getBotUptime = () => {
  const uptimeInSeconds = Math.floor((Date.now() - stats.value.booted_at) / 1000);
  const days = Math.floor(uptimeInSeconds / 86400);
  const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = uptimeInSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};


const fetchStats = async () => {
  try {
    stats.value = (await $fetch(`${API_ENDPOINT}/stats?tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`));
    stats.value = stats.value.data;
    joinedChannels.value = stats.value.channels;
    liveChannels.value = stats.value.live_channels;
    formattedBotUptime.value = '...' // To avoid mismatch warning on hydration
    nextUpdateIn.value = 60
    chartData.value = createChartData({
      data: stats.value.last_30_days_messages,
      title: 'Mensajes procesados',
      color: '#e0d0f7',
      counterPropertie: 'message_count',
    });
  } catch (error) {
    console.error(error);
    stats.value = null;
    joinedChannels.value = [];
    liveChannels.value = [];
  }
};


const computeDarkColor = (color) => {
  // In normal value, instead of 20% we set 20, instead of 50% we set 50, and so on
  const darkPercentage = 60
  // Receives a color in hex format and returns a ${percentage}% darker color

  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);

  const newR = Math.round(r * (1 - darkPercentage / 100));
  const newG = Math.round(g * (1 - darkPercentage / 100));
  const newB = Math.round(b * (1 - darkPercentage / 100));
  return `rgb(${newR}, ${newG}, ${newB})`;
};

const createChartData = ({ data, title, color, counterPropertie }) => {
  const labels = data.map((d) => {
    return new Date(d.day).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  });
  const mappedData = data.map((d) => {
    return d[counterPropertie];
  });

  return {
    labels,
    datasets: [{
      label: title,
      data: mappedData,
      backgroundColor: color,
      borderColor: computeDarkColor(color),
      borderWidth: 1,
      fill: true,
      tension: 0.2,
    }],
  };
};


await fetchStats();

const updateStats = async () => {
  nextUpdateIn.value = 0
  await fetchStats();
  nextUpdateIn.value = 60
}

onMounted(async () => {
  setInterval(() => {
    if (getBotUptime() === 'NaNs') {
      formattedBotUptime.value = '--';
      return;
    }
    formattedBotUptime.value = getBotUptime();
  }, 1000);

  setInterval(async () => {
    nextUpdateIn.value -= 1;
    if (nextUpdateIn.value === 0) {
      await fetchStats();
    }
  }, 1000);
});

watch(filterChannels, (newValue) => {
  if (newValue === '') {
    joinedChannels.value = stats.value.channels;
  } else {
    joinedChannels.value = stats.value.channels.filter((c) => {
      return c.username.toLowerCase().includes(newValue.toLowerCase());
    });
  }
});


const getTwitchChannelUrl = (channel) => {
  return `https://www.twitch.tv/${channel.username}`;
};


useHead({
  title: `Estadísticas`,
  meta: [{
    name: 'description',
    content: `Estadísticas`
  }]
})

</script>