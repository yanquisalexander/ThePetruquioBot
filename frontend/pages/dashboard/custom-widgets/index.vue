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
        <div class="flex w-full justify-end gap-4 my-2">
          <UButton color="gray" variant="soft" @click="showTemplateSearch = true" icon="i-lucide-book-dashed">
            Plantillas
          </UButton>
          <UButton color="blue" variant="soft" @click="router.push('/dashboard/custom-widgets/new')"
            icon="i-lucide-plus">
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
    <CustomWidgetTemplateSearch v-model="showTemplateSearch" />
  </DashboardPageContainer>
</template>

<script lang="ts" setup>
const { rawUser } = useCurrentUser()
const { fetchWidgets } = useCustomWidgets()

const loading = ref(false)
const widgets = ref<any[]>([])
const userApiKey = ref(null)
const showTemplateSearch = ref(false)

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Custom Widgets'
})

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

onMounted(async () => {
  await fetchCustomWidgets()
})
</script>