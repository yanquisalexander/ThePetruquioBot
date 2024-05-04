<template>
  <div class="mx-4">
    <UAlert
      v-if="showAnnouncement"
      color="twitch"
      variant="subtle"
      icon="i-mdi-hand-heart-outline"
      class="mb-4 rounded"
      title="¡We need your help!"
      :actions="actions"
    >
      <template #description>
        Petruquio.LIVE needs your support to continue providing streaming tools for free. If you like this project, please
        consider donating to help us keep it alive 💖
      </template>
    </UAlert>
  </div>
</template>

<script lang="ts" setup>
const showAnnouncement = ref(true)
const router = useRouter()
const actions = ref([
  {
    variant: 'solid',
    color: 'orange',
    label: 'Go to donation page',
    icon: 'i-mdi-heart',
    click: () => {
      router.push('/donate')
    }
  },
  {
    variant: 'ghost',
    color: 'gray',
    label: 'Close',
    icon: 'i-mdi-close',
    click: () => {
      showAnnouncement.value = false
    }
  }
])
</script>
