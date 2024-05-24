<template>
  <div id="HOMEPAGE" class="w-full flex flex-col space-y-8">
    <HomeHero v-if="stats" :stats="stats" />
    <HomeMeetCopilot />
    <LazyHomeFeatures />
    <HomeKawaiiTextMarquee />
    <!--     <HomeStreamersUsing />
 -->
  </div>
</template>

<script lang="ts" setup>

const { data } = await fetch(`${API_ENDPOINT}/stats`).then(res => res.json())
const stats = ref(data)


useHead({
  title: 'Home'
})
</script>