<template>
  <div v-if="breadcrumbs.length > 0" class="flex gap-2">
    <UBreadcrumb :links="breadcrumbs" class="mt-2" />
  </div>
  <div v-else class="py-4 rounded-md mt-2 mx-auto">
    <UAlert color="red" icon="i-mdi-alert-circle-outline" variant="soft" title="BREADCRUMBS_ERROR">
      <template #description>
        <p class="text-sm font-medium">
          Cannot render breadcrumbs for this page.
        </p>
      </template>
    </UAlert>
  </div>
</template>

<script lang="ts" setup>
import { DASHBOARD_BREADCRUMBS } from "@/data/dashboardBreadcrumbs";
const route = useRoute();
const currentPath = route.path

console.log('currentPath', currentPath)

const getBreadcrumbs = () => {
  const breadcrumbs = DASHBOARD_BREADCRUMBS.find(entry => entry.path === currentPath);
  return breadcrumbs ? breadcrumbs.crumbs : [];
}

const breadcrumbs = ref(getBreadcrumbs())

console.log('breadcrumbs', breadcrumbs)

watch(() => route.path, () => {
  breadcrumbs.value = getBreadcrumbs()
})

watch(breadcrumbs, (newVal) => {
  console.log('breadcrumbs', newVal)
})
</script>

<style></style>