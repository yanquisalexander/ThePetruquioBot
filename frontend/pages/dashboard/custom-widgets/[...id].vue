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
              <vue-monaco-editor :value="widget.custom_html" language="html" theme="Dracula" :options="MONACO_OPTIONS"
                height="350px" width="100%" @update:value="widget.custom_html = $event" />


            </div>
          </template>

          <template v-else-if="currentTab === 1">
            <div class="w-full">
              <vue-monaco-editor :value="widget.custom_css" language="css" theme="Dracula" :options="MONACO_OPTIONS"
                height="350px" width="100%" @update:value="widget.custom_css = $event" />
            </div>
          </template>

          <template v-else-if="currentTab === 2">
            <div class="w-full">
              <vue-monaco-editor :value="widget.custom_js" language="javascript" theme="Dracula"
                :options="MONACO_OPTIONS" height="350px" width="100%" @update:value="widget.custom_js = $event" />
            </div>
          </template>


          <template v-else-if="currentTab === 3">
            <div class="w-full space-y-4">
              <UFormGroup label="Widget name">
                <UInput v-model="widget.widget_name" />
              </UFormGroup>

              <UFormGroup label="Widget description">
                <UTextarea v-model="widget.widget_description" />
              </UFormGroup>

              <UFormGroup label="Publicar como plantilla" description="Define si el widget se publicará como plantilla">
                <UToggle v-model="widget.published_as_template" />
              </UFormGroup>

              <UFormGroup label="Include Tailwind CSS" description="Esta propiedad incluirá Tailwind CSS en el widget">
                <UToggle v-model="widget.properties.includeTailwind" />
              </UFormGroup>

              <UFormGroup label="Usar archivos cargados"
                description="Esta propiedad permitirá al widget usar archivos que has cargado en Media Manager">
                <UToggle v-model="widget.properties.injectUploads" />
              </UFormGroup>

              <UFormGroup label="Custom properties"
                description="Datos personalizados que se pueden utilizar en el widget">

                <vue-monaco-editor :value="widget.properties.custom_data" language="json" theme="Dracula"
                  :options="MONACO_OPTIONS" height="350px" width="100%"
                  @update:value="widget.properties.custom_data = $event" />
              </UFormGroup>
            </div>
          </template>
        </div>

        <div class="flex justify-end gap-2 my-8">
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

const MONACO_OPTIONS = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
  formatOnType: true,
}


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
  label: 'Properties',
  icon: 'i-mdi-cog',

}]

const fetchCustomWidget = async () => {
  try {
    loading.value = true
    const { data } = await fetchWidget(route.params.id.toString())
    widget.value = data.widget
    loading.value = false
  } catch (error) {
    console.error(error)
  }
}

await fetchCustomWidget()
</script>