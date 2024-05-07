<template>
  <DashboardPageContainer>
    <DashboardPageHeader title="Edit widget" disableBreadcrumb />

    <UContainer>
      <template v-if="loading">
        <UProgress indeterminate />
      </template>

      <div v-else-if="!loading && widget">
        <h2 class="text-xl font-medium font-jost">
          {{ widget.widget_name }}
        </h2>
        <div class="flex flex-col items-center justify-center gap-2">
          <UTabs :items="sections" class="w-full" v-model="currentTab">
            <template #default="{ item, index, selected }">
              <div class="flex items-center gap-2 relative truncate">
                <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />

                <span class="truncate">{{ item.label }}</span>

                <span v-if="selected"
                  class="absolute -right-4 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
              </div>
            </template>
          </UTabs>

          <template v-if="currentTab === 0">
            <div class="w-full">
              <vue-monaco-editor :value="widget.custom_html" language="html" theme="vs-dark" :options="{
                minimap: {
                  enabled: false,
                },
              }" height="350px" width="100%" @update:value="widget.custom_html = $event" />


            </div>
          </template>

          <template v-else-if="currentTab === 1">
            <div class="w-full">
              <vue-monaco-editor :value="widget.custom_css" language="css" theme="vs-dark" :options="{
                minimap: {
                  enabled: false,
                },
              }" height="350px" width="100%" @update:value="widget.custom_css = $event" />
            </div>
          </template>

          <template v-else-if="currentTab === 2">
            <div class="w-full">
              <vue-monaco-editor :value="widget.custom_js" language="javascript" theme="vs-dark" :options="{
                minimap: {
                  enabled: false,
                },
              }" height="350px" width="100%" @update:value="widget.custom_js = $event" />
            </div>
          </template>

          <template v-else-if="currentTab === 3">


            <div class="w-full">
              <vue-monaco-editor :value="widget.properties" language="json" theme="vs-dark" :options="{
                minimap: {
                  enabled: false,
                },
              }" height="350px" width="100%" @update:value="widget.properties = $event" />



            </div>
          </template>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton color="gray" variant="soft" to="/dashboard/custom-widgets">
            Cancel
          </UButton>
          <UButton color="blue" variant="soft" @click="updateWidget(widget)">
            Save
          </UButton>
        </div>
      </div>
    </UContainer>
  </DashboardPageContainer>
</template>

<script lang="ts" setup>
const { rawUser } = useCurrentUser()
const { fetchWidget, updateWidget } = useCustomWidgets()
const route = useRoute()

const loading = ref(false)
const widget = ref(null)
const currentTab = ref(0)

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Edit widget'
})

const sections = [{
  label: 'HTML',
  icon: 'i-mdi-language-html5',
}, {
  label: 'CSS',
  icon: 'i-mdi-language-css3',
}, {
  label: 'Javascript',
  icon: 'i-mdi-language-javascript',
}, {
  label: 'Preferences',
  icon: 'i-mdi-cog',

}]

const fetchCustomWidget = async () => {
  try {
    loading.value = true
    const { data } = await fetchWidget(route.params.id.toString())
    widget.value = data.widget
    loading.value = false
  } catch (error) {

  }
}

onMounted(async () => {
  await fetchCustomWidget()
})
</script>