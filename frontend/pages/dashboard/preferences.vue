<template>
  <DashboardPageContainer>
    <DashboardPageHeader title="settings.title" />

    <UAlert icon="i-heroicons-sparkles-solid" color="orange" variant="subtle" title="¡Novedades!">
      <template #description>
        <span class="block">
          Los mensajes de Follow ahora se pueden personalizar e incluir variaciones.
        </span>
      </template>
    </UAlert>

    <UAlert v-if="currentUser.isAdmin()" icon="i-heroicons-lock-open" color="blue" variant="subtle" class="my-4"
      title="Tienes acceso a todas las funciones">
      <template #description>
        <span class="block">
          Como administrador, puedes acceder a todas las funciones de la aplicación incluso si no eres un patrocinador
          en Patreon.
        </span>
      </template>
    </UAlert>

    <UContainer v-if="!settings && !fetchError" class="text-center p-16">
      <UProgress animation="carousel" />
    </UContainer>

    <UContainer v-else-if="fetchError" class="text-center">
      <p class="text-red-500 font-weight-bold">
        Error al obtener la configuración de módulos.
      </p>
      <p>{{ fetchError }}</p>
    </UContainer>


    <div v-else class="mt-8">
      <UContainer>
        <!-- Filter -->
        <UInput v-model="filter" color="gray" variant="outline" size="lg" placeholder="Search settings"
          icon="i-heroicons-magnifying-glass-16-solid" class="mb-8 w-full" />

        <template v-for="(setting, settingKey) in settings" :key="settingKey">
          <UCard v-if="!setting.hidden" class="mb-8 elevation-10">
            <template #header>
              <h3 class="text-xl font-semibold">
                {{ $t(`settings.${settingKey}.title`) }}
              </h3>
              <span class="flex text-gray-500 !font-normal whitespace-pre-wrap">{{
                $t(`settings.${settingKey}.description`) }}</span>
              <UBadge v-if="setting.patreon_required" color="orange" class="mt-2">
                <UIcon name="i-lucide-patreon" class="text-white mr-1" />
                <span class="text-sm font-medium">{{ $t('settings.patreon_exclusive') }}</span>
              </UBadge>
            </template>

            <template v-if="setting.field_type === 'boolean'">
              <label class="relative inline-flex items-center me-5 mt-4 cursor-pointer">
                <UToggle v-model="settings[settingKey].value" on-icon="i-heroicons-check-20-solid"
                  off-icon="i-heroicons-x-mark-20-solid" color="blue" size="lg" />
                <span class="ms-3 text-sm font-medium text-gray-900">
                  {{ settings[settingKey].value ? $t('settings.enabled') : $t('settings.disabled') }}
                </span>
              </label>
            </template>
            <template v-else-if="setting.field_type === 'text'">
              <UTextarea :id="`${settingKey}-value`" v-model="settings[settingKey].value" autoresize
                :placeholder="$t(`settings.${settingKey}.title`)" class="mt-2" />
            </template>
            <template v-else-if="setting.field_type === 'number'">
              <UInput :id="`${settingKey}-value`" v-model="settings[settingKey].value" variant="outline" size="lg"
                type="number" step="1" min="0" :placeholder="$t(`settings.${settingKey}.title`)" class="mt-2" />
            </template>
            <template v-else-if="setting.field_type === 'input'">
              <UInput :id="`${settingKey}-value`" v-model="settings[settingKey].value" variant="outline" size="lg"
                :placeholder="$t(`settings.${settingKey}.title`)" class="mt-2" />
            </template>
            <template v-else-if="setting.field_type === 'channel_point' && channelPointRewards">
              <USelectMenu v-model="settings[settingKey].value" searchable
                :popper="{ offsetDistance: 0, placement: 'bottom-start' }" size="lg"
                :ui-menu="{ select: 'cursor-pointer', option: { base: '!cursor-pointer' }, trigger: 'cursor-pointer' }"
                value-attribute="id" :options="channelPointRewards">
                <template #label>
                  <div class="flex items-center cursor-pointer">
                    <div :style="{ backgroundColor: getChannelPoint(settings[settingKey].value).backgroundColor }"
                      class="flex items-center justify-center p-1 w-10 h-10 rounded mr-2">
                      <img :src="getChannelPoint(settings[settingKey].value).icon">
                    </div>
                    <span class="text-sm font-medium">{{ getChannelPoint(settings[settingKey].value).title }}</span>
                  </div>
                </template>
                <template #option="{ option: reward }">
                  <div class="flex items-center cursor-pointer w-full">
                    <div :style="{ backgroundColor: reward.backgroundColor }"
                      class="flex items-center justify-center p-1 w-10 h-10 rounded mr-2">
                      <img :src="reward.icon">
                    </div>
                    <span class="text-sm font-medium">{{ reward.title }}</span>
                  </div>
                </template>
              </USelectMenu>
            </template>
            <template v-else-if="setting.field_type === 'list'">
              <!-- This is to add multiple values, for example, multiple Follow messages -->
              <template v-for="(value, index) in settings[settingKey].value" :key="index">
                <UButton variant="soft" color="blue" :label="value" class="mt-2 ml-2"
                  @click="settings[settingKey].value.splice(index, 1)">
                  <template #trailing>
                    <UIcon name="i-heroicons-x-mark-20-solid" />
                  </template>
                </UButton>
              </template>

              <UInput :id="`${settingKey}-value`" v-model="settings[settingKey].newValue" variant="outline" size="lg"
                :placeholder="$t(`settings.${settingKey}.title`)" class="mt-2" @keyup.enter="addToList(settingKey)" />
              <UButton color="blue" :label="$t('settings.add')" class="mt-2" @click="addToList(settingKey)" />
            </template>

            <div v-if="setting.experimental" class="flex w-full justify-end">
              <span class="mb-4 mr-4 items-center bg-blue-500 text-white text-sm rounded-full px-2 text-center">
                Experimental
              </span>
            </div>
          </UCard>
        </template>


        <div class="flex justify-end mb-8">
          <UButton size="lg" color="blue" :label="$t('settings.save')" class="mt-2" @click="updateChannelSettings" />
        </div>
      </UContainer>
    </div>
  </DashboardPageContainer>
</template>

<script setup lang="ts">
import axios, { AxiosError } from 'axios'
import { useI18n } from "vue-i18n";
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const currentUser = useCurrentUser()
const toast = useToast()
const i18n = useI18n()

const filter = ref('')

const settings = ref(null)
const fetchError = ref(null)
const channelPointRewards = ref([])

useHead({
  title: i18n.t('settings.title'),
})




const getChannelPointRewards = async () => {
  toast.add({
    id: 'fetching-channel-point-rewards',
    title: 'Wait a moment',
    description: 'Fetching channel point rewards from Twitch.',
    icon: 'i-mdi-circle-multiple-outline',
  })
  try {
    const response = await axios.get(`${API_ENDPOINT}/channel/twitch-channel-points`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    })
    toast.remove('fetching-channel-point-rewards')
    if (response.status === 200) {
      toast.add({
        title: 'Success',
        color: 'green',
        description: 'Channel point rewards fetched successfully.',
        icon: 'i-mdi-check-circle-outline',
      })
      channelPointRewards.value = response.data.data.channelPoints
      console.log(channelPointRewards.value)
    } else {
      channelPointRewards.value = null
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      // @ts-ignore
      description: (error as AxiosError).response?.data.message || 'There was an error fetching channel point rewards.',
      icon: 'i-heroicons-x-mark-20-solid',
      color: 'red',
    })
  }
}

interface ChannelPointReward {
  id: string;
  title: string;
  backgroundColor: string;
  icon: string;
}

const getChannelPoint = (id: string): ChannelPointReward => {
  if (!id) return {
    id: 'none',
    backgroundColor: '#000000',
    icon: 'https://static-cdn.jtvnw.net/custom-reward-images/default-1.png',
    title: 'Sin recompensa seleccionada'
  }
  const selectedReward = channelPointRewards.value.find((reward) => reward.id === id);
  return selectedReward
};

const filterSettings = () => {
  filter.value = filter.value.toLowerCase()
  console.log(filter)
  Object.keys(settings.value).forEach((settingKey) => {
    if (settingKey.toLowerCase().includes(filter.value)) {
      settings.value[settingKey].hidden = false
    } else {
      settings.value[settingKey].hidden = true
    }
  })
}

watch(filter, () => {
  filterSettings()
})

const fetchSettings = async () => {
  toast.add({
    id: 'fetching-settings',
    title: 'Wait a moment',
    description: 'Fetching settings from the server.',
    icon: 'i-mdi-circle-multiple-outline',
  })
  try {
    const response = await axios.get(`${API_ENDPOINT}/channel/preferences`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    })
    toast.remove('fetching-settings')
    settings.value = response.data.data.preferences
  } catch (error) {
    fetchError.value = error.message
  }
}

const addToList = (settingKey) => {
  if (!settings.value[settingKey].newValue) return
  settings.value[settingKey].value.push(settings.value[settingKey].newValue)
  settings.value[settingKey].newValue = ''
}

onMounted(async () => {
  try {
    await getChannelPointRewards()
    await fetchSettings()
  } catch (error) {
    fetchError.value = error.message
  }
})

const updateChannelSettings = async () => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/channel/preferences`, {
      preferences: settings.value,
    }, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    });
    await fetchSettings();

    toast.add({
      title: 'Settings saved',
      description: 'Your settings have been saved.',
      icon: 'i-heroicons-check-20-solid',
    })

  } catch (error) {
    console.log(error);
    toast.add({
      title: 'Error',
      // @ts-ignore
      description: (error as AxiosError).response?.data.message || 'There was an error saving your settings.',
      icon: 'i-heroicons-x-mark-20-solid',
      color: 'red',
    })
  }
};




</script>

<style scoped>
.elevation-10 {
  box-shadow: #919eab4d 0 0 2px, #919eab1f 0 12px 24px -4px !important;
}
</style>