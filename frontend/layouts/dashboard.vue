<template>
  <div class="flex flex-col w-full">
    <DashboardBanners />
    <div class="bg-muted-100 dark:bg-muted-900 relative min-h-screen w-full transition-all duration-300"
      :class="{ 'xl:max-w-[calc(100%_-_280px)] xl:ms-[280px]': sidebar.sidebarVisible, 'xl:max-w-full xl:ms-0': !sidebar.sidebarVisible }"
      :data-sidebar-opened="sidebar.sidebarVisible">
      <DashboardDrawer />
      <!-- Button to close sidebar on mobile, also, is a backdrop -->
      <button v-if="sidebar.sidebarVisible && $device.isMobile"
        class="z-[14] fixed top-0 start-0 w-full h-full bg-[#000] bg-opacity-25"
        :class="{ 'hidden': !sidebar.sidebarVisible }" @click="sidebar.toggleSidebar()" />

      <div class="mx-auto w-full">
        <div class="flex flex-col flex-1 w-full">
          <DashboardHeader />
          <main class="flex-1 w-full relative z-0 xl:px-10 px-4 max-w-7xl mx-auto">
            <slot />
          </main>
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const sidebar = useSidebar();

</script>