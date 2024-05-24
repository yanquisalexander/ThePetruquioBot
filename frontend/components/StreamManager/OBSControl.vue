<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between flex-col md:flex-row">
        <h2 class="text-xl font-medium font-jost">Control de OBS Studio</h2>
        <div class="flex items-center gap-2 flex-col md:flex-row">
          <UTooltip text="Uso de CPU" placement="bottom">
            <UButton variant="soft" icon="i-lucide-cpu">
              {{ stats?.cpuUsage?.toFixed(2) }}%
            </UButton>
          </UTooltip>

          <UTooltip text="FPS activos">
            <UButton variant="soft" icon="i-lucide-gauge">
              {{ stats?.activeFps?.toFixed(2) }} FPS
            </UButton>
          </UTooltip>

          <UButton class="hidden" @click="toggleConnection"
            :icon="isConnected ? 'i-lucide-screen-share-off' : 'i-lucide-screen-share'"
            :color="isConnected ? 'red' : 'green'">
            {{ isConnected ? 'Desconectar' : 'Conectar' }}
          </UButton>
        </div>
      </div>

    </template>

    <div class="w-full">
      <StatsChart :chartData="statsChartData" :chartOptions="chartOptions" class="mb-4 h-56" />
    </div>

    <UFormGroup label="Escenas">
      <!-- Grid de 3 -->
      <div class="grid grid-cols-3 gap-4">
        <UButton v-for="scene in scenes" :key="scene.sceneUuid" @click="changeScene(scene.sceneUuid)"
          :color="scene.sceneUuid === sceneState.currentProgramSceneUuid ? 'blue' : 'gray'">
          {{ scene.sceneName }}
        </UButton>
      </div>
    </UFormGroup>
  </UCard>
</template>

<script setup lang="ts">
import OBSManager from "@/services/OBSManager";

const obsManager = new OBSManager();
const toast = useToast();

const isConnected = ref(false);
const statsInterval = ref<NodeJS.Timeout | null>(null);
const scenes = ref([]);
const stats = ref({});
const previousStats = ref([]); // Array de stats anteriores, máximo 100
const sceneState = ref({
  currentPreviewSceneName: '',
  currentProgramSceneName: '',
  currentPreviewSceneUuid: '',
  currentProgramSceneUuid: '',
});

const pollObsStats = async () => {
  try {
    const response = await obsManager.getStats();
    // Add a timestamp to the stats object
    stats.value = { ...response, timestamp: Date.now() };
    previousStats.value = [...previousStats.value, stats.value].slice(-30);
  } catch (error) {
    console.error('Error fetching OBS stats', error);
  }
};

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
      display: true,
    },
  }
});

const statsChartData = computed(() => {
  const allStats = previousStats.value;

  // Generar etiquetas basadas en la marca de tiempo de cada estadística
  const labels = allStats.map((stat) => {
    const date = new Date(stat.timestamp);
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  });

  // Datos para el uso de CPU
  const cpuUsageData = allStats.map((stat) => stat.cpuUsage.toFixed(2));

  // Datos para FPS (promedio por minuto)
  const groupedFps = [];
  let minute = 0;
  let sum = 0;
  let count = 0;

  allStats.forEach((stat, index) => {
    const currentMinute = Math.floor(index / 60);

    if (currentMinute === minute) {
      sum += stat.activeFps
      count++;
    } else {
      if (count !== 0) {
        groupedFps.push(sum / count);
      } else {
        groupedFps.push(0);
      }

      minute = currentMinute;
      sum = stat.activeFps
      count = 1;
    }
  });

  if (count !== 0) {
    groupedFps.push(sum / count);
  } else {
    groupedFps.push(0);
  }

  // Formatear los datos de FPS para que tengan la misma longitud que las etiquetas
  const fpsData = Array(allStats.length).fill(null).map((_, i) => groupedFps[Math.floor(i / 60)]);

  return {
    labels,
    datasets: [
      {
        label: 'Uso de CPU (%)',
        data: cpuUsageData,
        type: 'line',
        backgroundColor: '#e0d0f7',
        borderColor: '#9146FF',
        borderWidth: 1,
        fill: true,
        tension: 0.2,
      },
      {
        label: 'FPS',
        data: fpsData,
        backgroundColor: '#09f',
        type: 'line',
        borderColor: '#0bf',
        borderWidth: 1,
        fill: true,
        tension: 0.2,
      },
    ],
  };
});






onMounted(async () => {
  try {
    await obsManager.connect();
    await fetchScenes();
    obsManager.getObsInstance().on('CurrentProgramSceneChanged', fetchScenes);
    obsManager.getObsInstance().on('InputVolumeChanged', console.log);
    statsInterval.value = setInterval(pollObsStats, 5000);
    isConnected.value = true;
  } catch (error) {
    console.error('Error connecting to OBS Studio', error);
    toast.add({
      icon: 'i-lucide-screen-share-off',
      title: 'Error',
      description: 'No se pudo conectar a OBS Studio',
      callback: () => {
        isConnected.value = false;
      },
      color: 'red',
    })
  }
});

onUnmounted(() => {
  obsManager.disconnect();
  clearInterval(statsInterval.value);
});

const toggleConnection = async () => {
  if (isConnected.value) {
    obsManager.disconnect();
    isConnected.value = false;
  } else {
    try {
      await obsManager.connect();
      isConnected.value = true;
    } catch (error) {
      console.error('Error connecting to OBS Studio', error);
      toast.add({
        icon: 'i-lucide-screen-share-off',
        title: 'Error',
        description: 'No se pudo conectar a OBS Studio',
        callback: () => {
          isConnected.value = false;
        },
        color: 'red',
      })
    }
  }
};


const fetchScenes = async () => {
  try {
    const response = await obsManager.fetchScenes();
    scenes.value = response.scenes;
    sceneState.value = {
      currentPreviewSceneName: response.currentPreviewSceneName,
      currentProgramSceneName: response.currentProgramSceneName,
      currentPreviewSceneUuid: response.currentPreviewSceneUuid,
      currentProgramSceneUuid: response.currentProgramSceneUuid,
    };
  } catch (error) {
    console.error('Error fetching scenes', error);
  }
};

const changeScene = async (sceneUuid: string) => {
  try {
    await obsManager.changeScene(sceneUuid);
  } catch (error) {
    console.error('Error changing scene', error);
  }
};
</script>