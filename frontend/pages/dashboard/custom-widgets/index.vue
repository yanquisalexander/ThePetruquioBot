<template>
  <div class="mx-auto md:px-4">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        Widgets
      </h2>
    </div>
    <UBreadcrumb
      :links="breadcrum"
      class="mt-2 mx-auto"
    >
      <template #default="{ link, isActive, index }">
        <NuxtLink
          :to="link.to"
          class="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          {{ link.label }}
        </NuxtLink>
      </template>
    </UBreadcrumb>
    <div class="flex py-3.5 w-full">
      <UInput
        v-model="search"
        :placeholder="$t('widgets.search')"
        size="lg"
        leading-icon="i-heroicons-magnifying-glass-20-solid"
      />
      <div class="flex-grow" />
      <UButton
        color="blue"
        leading-icon="i-heroicons-plus-20-solid"
        @click="showAddDialog"
      >
        {{ $t('widgets.create') }}
      </UButton>
    </div>

    <div
      v-if="filteredWidgets.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
    >
      <template
        v-for="widget in filteredWidgets"
        :key="widget.id"
      >
        <UCard class="hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <template #header>
            {{ widget.name }}
          </template>
          <img
            :src="widget.preview"
            class="w-full h-48 object-cover rounded-t-md"
          >
          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton
                color="blue"
                :to="`/dashboard/widgets/${widget.id}`"
              >
                {{ $t('widgets.configure') }}
              </UButton>
              <UButton
                color="red"
                @click="deleteWidget(widget.id)"
              >
                {{ $t('widgets.delete') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </div>
    <div
      v-else
      class="flex items-center justify-center"
    >
      <div class="flex flex-col items-center justify-center">
        <UIcon
          name="i-heroicons-search-20-solid"
          class="w-12 h-12 text-gray-400"
        />
        <p class="text-gray-500 text-lg font-medium mt-4">
          {{ $t('widgets.noResults') }}
        </p>
      </div>
    </div>


    <UModal
      v-model="addDialog"
      :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }"
      prevent-close
    >
      <UCard>
        <template #header>
          <div class="text-h5">
            {{ $t('widgets.create') }}
          </div>
        </template>
        <UInput
          v-model="newWidget.name"
          :placeholder="$t('widgets.name')"
        />

        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              color="gray"
              @click="addDialog = false"
            >
              {{ $t('widgets.cancel') }}
            </UButton>
            <UButton
              color="blue"
              @click="createWidget"
            >
              {{ $t('widgets.create') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { useI18n } from 'vue-i18n';
const currentUser = useCurrentUser()
const toast = useToast()
const i18n = useI18n()


definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Widgets',
})

const breadcrum = [{
  label: 'Dashboard',
  icon: 'i-mdi-view-dashboard-outline',
  to: '/dashboard',
},
{
  label: 'Widgets',
  icon: 'i-mdi-widgets-outline',
}]

const search = ref('')

const widgets = ref<any[]>([])

const filteredWidgets = computed(() => {
  if (!search.value) return widgets.value

  return widgets.value.filter((widget) => {
    return widget.name.toLowerCase().includes(search.value.toLowerCase())
  })
})


const addDialog = ref(false)
const newWidget = ref({
  name: '',
})

const showAddDialog = () => {
  addDialog.value = true
}

const createWidget = async () => {
  try {
    const { data } = await axios.post(`${API_ENDPOINT}/channel/widgets`, {
      name: newWidget.value.name,
    }, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    })
    toast.add({
      color: 'green',
      title: i18n.t('widgets.created'),
      description: i18n.t('widgets.createdMessage'),
      icon: 'i-mdi-check-circle-outline',
    })
    addDialog.value = false
    await fetchWidgets()
  } catch (error) {
    toast.add({
      color: 'red',
      title: i18n.t('widgets.error'),
      description: i18n.t('widgets.errorCreating'),
      icon: 'i-mdi-close-circle-outline',
    })
  }
}

const fetchWidgets = async () => {
  try {
    const response = await axios(`${API_ENDPOINT}/channel/widgets`, {
      headers: {
        'Authorization': `Bearer ${currentUser.getToken()}`,
      },
    })
    widgets.value = response.data.data
  } catch (error) {
    console.error('Error fetching widgets:', error)
    toast.add({
      color: 'red',
      title: i18n.t('widgets.error'),
      description: i18n.t('widgets.errorFetching'),
      icon: 'i-mdi-close-circle-outline',
    })
  }
}

onMounted(async () => {
  await fetchWidgets()
})

</script>
