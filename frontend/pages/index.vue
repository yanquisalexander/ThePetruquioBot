<template>
  <div id="HOMEPAGE" class="w-full">
    <HomeHero v-if="stats" :stats="stats" />
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