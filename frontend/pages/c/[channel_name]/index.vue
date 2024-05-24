<template>
  <div>
    <div data-channel-overview>
      
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'channel-overview',
})

const route = useRoute()
const { data: user } = useAuth()

useHead({
  title: `${route.params.channel_name}`,
})
</script>