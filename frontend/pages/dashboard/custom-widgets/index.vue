<template>
  <DashboardPageContainer>
    <DashboardPageHeader title="Custom Widgets" />

    <UContainer>
      <template v-if="loading">
        <UProgress indeterminate />
      </template>

      <template v-else-if="!loading && widgets">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <template v-for="widget in widgets" :key="widget.id">
            <CustomWidgetCard :widget="widget" />
          </template>
        </div>
      </template>
    </UContainer>

  </DashboardPageContainer>
</template>

<script lang="ts" setup>
const { rawUser } = useCurrentUser()
const { fetchWidgets } = useCustomWidgets()

const loading = ref(false)
const widgets = ref<any[]>([])

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
    loading.value = false
  } catch (error) {

  }
}

onMounted(async () => {
  await fetchCustomWidgets()
})
</script>