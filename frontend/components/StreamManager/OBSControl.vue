<template>
  <UCard v-if="isConnected">
    <template #header>
      <h2 class="text-xl font-medium font-jost">
        Control de OBS Studio
      </h2>
    </template>

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
const scenes = ref([]);
const sceneState = ref({
  currentPreviewSceneName: '',
  currentProgramSceneName: '',
  currentPreviewSceneUuid: '',
  currentProgramSceneUuid: '',
});

onMounted(async () => {
  try {
    await obsManager.connect();
    await fetchScenes();
    obsManager.getObsInstance().on('CurrentProgramSceneChanged', fetchScenes);
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
});

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
    await fetchScenes();
  } catch (error) {
    console.error('Error changing scene', error);
  }
};
</script>