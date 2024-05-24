<template>
  <DashboardPageContainer>
    <DashboardPageHeader title="Custom Widgets" />

    <UAlert icon="i-heroicons-sparkles-solid" color="twitch" variant="subtle"
      title="¡Los Widgets personalizados han llegado!">
      <template #description>
        <span class="block">
          Crea algo <span class="font-bold">único</span> y <span class="font-bold">especial</span> para tu stream usando
          nuestras herramientas y un poco de HTML, CSS y JavaScript.
        </span>
      </template>
    </UAlert>

    <UContainer class="my-4">
      <template v-if="loading">
        <UProgress indeterminate />
      </template>

      <template v-else-if="!loading && widgets">
        <div class="flex w-full justify-end gap-4 my-4">
          <UButton color="gray" variant="soft" @click="showTemplateSearch = true" icon="i-lucide-book-dashed">
            Plantillas
          </UButton>
          <UButton color="blue" variant="soft" @click="showCreateModal = true" icon="i-lucide-plus">
            Nuevo Widget
          </UButton>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <template v-for="widget in widgets" :key="widget.id">
            <CustomWidgetCard :widget="widget" :userApiKey="userApiKey" />
          </template>
        </div>
      </template>
    </UContainer>
    <CustomWidgetTemplateSearch v-model="showTemplateSearch" @select="handleSelectTemplate" />
    <CustomWidgetCreateModal v-model="showCreateModal" @widgetCreated="onWidgetCreated" />
  </DashboardPageContainer>
</template>

<script lang="ts" setup>
const { rawUser } = useCurrentUser()
const { fetchWidgets, createFromTemplate } = useCustomWidgets()

const loading = ref(false)
const widgets = ref<any[]>([])
const userApiKey = ref(null)
const showTemplateSearch = ref(false)
const showCreateModal = ref(false)

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Custom Widgets'
})

const onWidgetCreated = () => {
  fetchCustomWidgets()
  showCreateModal.value = false
}

const fetchCustomWidgets = async () => {
  try {
    loading.value = true
    const { data } = await fetchWidgets()
    console.log('data', data)
    widgets.value = data.widgets
    userApiKey.value = data.user_api_key
    loading.value = false
  } catch (error) {

  }
}

const handleSelectTemplate = async (template: any) => {
  try {
    console.log('Trying to clone template', template.id)
    await createFromTemplate(template.id)
    await fetchCustomWidgets()
    showTemplateSearch.value = false
  } catch (error) {
    console.error('Error cloning template', error)
  }
}

onMounted(async () => {
  await fetchCustomWidgets()
})
</script>