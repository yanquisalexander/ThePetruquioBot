<template>
  <div
    id="HOMEPAGE"
    class="w-full"
  >
    <HomeHero :stats="stats.data" />
    <LazyHomeFeatures />
    <HomeKawaiiTextMarquee />
    <!--     <HomeStreamersUsing />
 -->
  </div>
</template>

<script lang="ts" setup>

const { data: stats } = useFetch<any>(`${API_ENDPOINT}/stats`)

useHead({
  title: 'Home'
})
</script>