<template>
  <div>
    <template v-for="(banner, index) in banners" :key="index">
      <UAlert :color="banner.color" :icon="banner.icon" :dark="true" :outlined="true" closable class="!rounded-none"
        :variant="banner.variant || ''">
        <div class="flex items-center font-inter">
          <div class="flex-1">
            <span class="font-medium">{{ banner.title }}</span>
            <span class="block font-normal">{{ banner.message }}</span>
          </div>
        </div>
      </UAlert>
    </template>
  </div>
</template>

<script lang="ts" setup>
const banners = ref([

]);
</script>
