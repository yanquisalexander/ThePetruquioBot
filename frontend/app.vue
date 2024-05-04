<template>
  <div id="application">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
      <UNotifications />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const isOverlayOrWidgetPath = route.path.startsWith('/overlays') || route.path.startsWith('/widgets');

if (process.client) {
  if (isOverlayOrWidgetPath) {
    document.documentElement.classList.add('!bg-transparent');
    document.body.classList.add('!bg-transparent');
  }
}
</script>