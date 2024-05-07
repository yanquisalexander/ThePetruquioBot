<template>
  <div v-if="breadcrumbs.length > 0" class="flex gap-2">
    <UBreadcrumb :links="breadcrumbs" class="mt-2" />
  </div>
  <div v-else class="py-4 rounded-md mt-2 mx-auto">
    <UAlert color="red" icon="i-mdi-alert-circle-outline" variant="soft" title="BREADCRUMBS_ERROR">
      <template #description>
        <p class="text-sm font-medium">
          No se pueden mostrar las migas de pan para esta página.
        </p>
      </template>
    </UAlert>
  </div>
</template>

<script lang="ts" setup>
import { useBreadcrumb } from "@/composables/useBreadcrumb";

const route = useRoute();
const currentPath = route.path

const { buildBreadcrumb } = useBreadcrumb()

const breadcrumbs = buildBreadcrumb(currentPath)


</script>

<style></style>
