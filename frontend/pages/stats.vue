<template>
  <div class="bg-white">
    <div class="px-6 pt-8 pb-16 mx-auto flex flex-col">
      <h2 class="text-2xl font-medium text-center font-gabarito">
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
              <div class="bg-blue-500 rounded-full p-3">
                <MessageCircleIcon class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium font-gabarito">Mensajes procesados</h3>
                <p class="text-sm font-medium text-center font-gabarito">{{ stats.messages }}</p>
              </div>
            </div>

            <!-- Segunda columna: Cantidad de usuarios -->
            <div class="bg-white p-4 flex flex-col justify-center items-center">
              <div class="bg-pink-500 rounded-full p-3">
                <UserIcon class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium font-gabarito">Usuarios</h3>
                <p class="text-sm font-medium text-center font-gabarito">{{ stats.users }}</p>
              </div>
            </div>

            <!-- Tercera columna: Tiempo en línea -->
            <div class="bg-white p-4 flex flex-col justify-center items-center">
              <div class="bg-green-500 rounded-full p-3">
                <Clock4Icon class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium font-gabarito">Tiempo en línea</h3>
                <p class="text-sm font-medium text-center font-gabarito">{{ formattedBotUptime }}</p>
              </div>
            </div>

            <div class="bg-white p-4 flex flex-col justify-center items-center mx-auto mt-6">
              <div class="bg-orange-500 rounded-full p-3">
                <VideoIcon class="w-6 h-6 text-white" />
              </div>
              <div class="mt-2">
                <h3 class="text-lg font-medium font-gabarito">Canales en Directo</h3>
                <p class="text-sm font-medium text-center font-gabarito">{{ liveChannels.length }}</p>
              </div>
            </div>
          </div>
        </template>
        <StatsChart v-if="chartData" :chartData="chartData" chartType="line" :chartOptions="chartOptions"
          class="mt-8 h-96 flex justify-center" />
        <div class="flex justify-center items-center">
          <span class="text-xs text-center text-gray-500 ml-6 mt-4">
            {{ stats.average_messages_per_day.toFixed(3) }} mensajes en promedio por día
          </span>
        </div>
      </div>

      <div v-else class="flex justify-center items-center w-2/4 mx-auto mt-6">
        <v-progress-circular indeterminate color="blue"></v-progress-circular>
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
                  <a :href="getTwitchChannelUrl(channel)" target="_blank" class="bg-blue-200">
                    <div
                      class="hover:translate-x-2 hover:-translate-y-2 delay-50 duration-100 hover:bg-white hover:shadow-lg transform transition cursor-pointer overflow-hidden">
                      <img :src="channel.thumbnail_url.replace('{width}', '320').replace('{height}', '180')"
                        class="w-full h-40 object-cover" />
                      <div class="p-4">
                        <h3 class="text-lg font-medium font-gabarito">{{ channel.username }}</h3>
                        <p class="text-sm font-medium font-gabarito">{{ channel.title }}</p>
                      </div>
                      <div class="metadata p-2 space-x-2">
                        <span class="tag bg-green-600 text-white py-1 px-2 rounded-full text-xs">{{ channel.game_name
                        }}</span>
                        <span class="tag bg-purple text-white py-1 px-2 rounded-full text-xs">{{ channel.viewers }}
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
            <h3 class="text-lg font-medium ml-6 font-gabarito">El bot está conectado a los siguientes canales:</h3>
            <div class="md:ml-auto md:w-1/4 mt-2 md:mt-0">
              <UInput v-model="filterChannels" :placeholder="`Filtrar canales`" size="lg"
                leading-icon="i-heroicons-magnifying-glass-20-solid" />
            </div>
          </div>
          <ul class="mt-2 flex flex-col md:flex-row md:flex-wrap">
            <div v-for="(c, index) in joinedChannels" :key="c.username" class="flex flex-col md:flex-row md:items-center">

              <li
                class="flex cursor-pointer font-gabarito items-center mx-2 my-1 hover:bg-gray-100 transition-all duration-150 hover:text-blue-500 rounded-full px-2 py-1">
                      <a :href="`https://www.twitch.tv/${c.username}`" target="_blank" class="flex items-center">
                        <div class="user flex items-center">
                          <img :src="c.profile_image_url" class="w-8 h-8 rounded-full" />
                          <div class="flex flex-col">
                            <span class="ml-2">{{ c.display_name }}</span>
                            <span v-if="liveChannels.find(lc => lc.username === c.username)"
                              class="ml-2 text-xs text-green-500">
                              <VideoIcon class="w-4 h-4 inline-block" />
                              En directo
                            </span>
                            <span v-if="c.username === 'petruquiolive'"
                              class="ml-2 text-xs text-blue-500 flex items-center">
                              <BotIcon class="w-4 h-4 inline-block mr-1" />
                              Canal del bot
                            </span>

                          </div>
                        </div>
                      </a>
                    <template>
                      <p>
                        {{ c.description || `Looks like ${c.display_name} doesn't have a description, but we are sure that
                        he/she is a great streamer!` }}
                      </p>
                    </template>
              </li>
              <div class="rounded-full h-1 w-1 bg-gray-300 mx-2 hidden md:block"
                v-if="!(index === joinedChannels.length - 1)" />






            </div>
          </ul>
        </template>
        <div class="flex items-center justify-center mt-4 flex-col md:flex-row">
          <span class="text-xs text-gray-500 ml-6 mt-4">
            {{ stats.channels.length }} {{ `canal${stats.channels.length === 1 ? '' : 'es'} en total` }}
          </span>
          <span class="rounded-full h-1 w-1 bg-gray-300 mx-2 mt-4 block" />
          <span class="text-xs text-gray-500 mt-4">
            <NuxtLink to="/login" target="_blank">
              <ExternalLinkIcon class="w-4 h-4 inline-block mr-1" />
              ¿Te gustaría que el bot esté en tu canal?
            </NuxtLink>
          </span>
        </div>

      </div>
      <div v-else class="flex justify-center items-center w-2/4 mx-auto mt-6">
        <v-progress-circular indeterminate color="blue"></v-progress-circular>
      </div>
    </div>
    <div class="fixed bottom-0 right-0 mb-4 mr-4 bg-black rounded-full p-2 px-3 cursor-pointer font-gabarito"
      @click="updateStats">
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
import { Clock4Icon } from 'lucide-vue-next';
import { BotIcon } from 'lucide-vue-next';
import { VideoIcon } from 'lucide-vue-next';
import { UserIcon } from 'lucide-vue-next';
import { MessageCircleIcon } from 'lucide-vue-next';
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
    stats.value = (await $fetch(`https://api.petruquio.live/v2/stats?tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`));
    stats.value = stats.value.data;
    joinedChannels.value = stats.value.channels;
    liveChannels.value = stats.value.live_channels;
    formattedBotUptime.value = '...' // To avoid mismatch warning on hydration
    nextUpdateIn.value = 60
    setChartData();
  } catch (error) {
    console.error(error);
    stats.value = null;
    joinedChannels.value = [];
    liveChannels.value = [];
  }
};

const setChartData = () => {
  const labels = stats.value.last_30_days_messages.map((d) => {
    return new Date(d.day).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  });
  const data = stats.value.last_30_days_messages.map((d) => {
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
  