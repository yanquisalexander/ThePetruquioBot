<template>
  <div class="mx-auto md:px-4">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        Widgets
      </h2>
    </div>
    <UBreadcrumb :links="breadcrum" class="mt-2 mx-auto">
      <template #default="{ link, isActive, index }">
        <NuxtLink :to="link.to" class="text-sm font-medium text-gray-500 hover:text-gray-700">
          {{ link.label }}
        </NuxtLink>
      </template>
    </UBreadcrumb>

    <div id="widgets-banner" class="mt-6 px-4 py-4 bg-blue-50 rounded-md relative border border-blue-200">
      <UIcon name="i-mdi-widgets-outline"
        class="text-5xl text-blue-500 rotate-6 absolute -top-4 -right-4 [text-shadow:_0_1px_0_var(--tw-shadow-color)]" />
      <h3 class="text-xl font-medium font-jost text-blue-500">Core Widgets</h3>
      <p class="text-gray-500">
        Pre-designed widgets that you can use in your stream overlay.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 mt-8">


      <template v-for="widget in AVAILABLE_CORE_WIDGETS" :key="widget.widget_type">
        <UCard class="hover:shadow-xl transition-shadow duration-200 ease-in-out">
          <template #header>
            {{ widget.widgetType }}
          </template>
          <UIcon :name="widget.icon" class="text-5xl text-gray-500" />
          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton color="blue" @click="addCoreWidget(widget.widgetType)"
                v-if="!coreWidgets.find((coreWidget) => coreWidget.widgetType === widget.widgetType)">
                Add
              </UButton>
              <UButton color="blue"
                @click="editCoreWidget(coreWidgets.find((coreWidget) => coreWidget.widgetType === widget.widgetType))"
                v-if="coreWidgets.find((coreWidget) => coreWidget.widgetType === widget.widgetType)">
                Configure
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </div>

    <UModal v-model="editDialog" :title="selectedWidget?.widgetType" :width="800">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            {{ selectedWidget?.widgetType }}
          </div>
        </template>
        <div class="p-4">
          <pre>{{ selectedWidget }}</pre>

          <UForm v-if="selectedWidget" :model="selectedWidget.preferences">
            <UInput v-model="selectedWidget.preferences.messageDisplayDuration" label="Message Display Duration" />
            <UInput v-model="selectedWidget.preferences.messageLimit" label="Message Limit" />
            <UTextarea v-model="selectedWidget.preferences.customCss" label="Custom CSS" />
          </UForm>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="blue" @click="editDialog = false">
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

interface CoreWidget {
  id: string;
  widgetType: string;
  preferences: Record<string, any>;
}

export interface CommandBannerRotatorPreferences {
  banners: Array<{
    command: string
    html: string
    javascript?: string
    css?: string
    duration: number
  }>
}

export interface ChatWidgetPreferences {
  messageDisplayDuration: number
  messageLimit: number
  customCss?: string
}


definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const breadcrum = ref([{
  label: 'Dashboard',
  icon: 'i-mdi-view-dashboard-outline',
  to: '/dashboard',
},
{
  label: 'Widgets',
  icon: 'i-mdi-widgets-outline',
}])

const currentUser = useCurrentUser()

const coreWidgets = ref<CoreWidget[]>([])

const editDialog = ref(false)
const selectedWidget = ref<CoreWidget | null>(null)



const editCoreWidget = (widget: CoreWidget) => {
  selectedWidget.value = widget
  editDialog.value = true
}



const AVAILABLE_CORE_WIDGETS = [
  {
    widgetType: 'CHAT_WIDGET',
    icon: 'i-mdi-chat-processing-outline',
    preferences: {
      messageDisplayDuration: 5000,
      messageLimit: 10,
      customCss: ''
    }
  }
]

const fetchCoreWidgets = async () => {
  try {
    const { data } = await axios.get(`${API_ENDPOINT}/widgets/core`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    })

    coreWidgets.value = data.data
  } catch (error) {
    console.error(error)
  }
}

const addCoreWidget = async (widgetType: string) => {
  try {
    const { data } = await axios.post(`${API_ENDPOINT}/widgets/core`, {
      widget_type: widgetType
    }, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    })

    console.log(data)
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  await fetchCoreWidgets()
})




</script>