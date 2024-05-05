<template>
  <UModal v-model="isOpen">
    <UCommandPalette :placeholder="t('dashboard.command_palette.search_placeholder')" :groups="groups" :ui="uiParams"
      :autoselect="false" @update:model-value="onCommand">
    </UCommandPalette>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { rawUser } = useCurrentUser()
const isOpen = ref(false)
const router = useRouter()
const { t } = useI18n()

const hasCommunityMapEnabled = computed(() => rawUser().channel.preferences.enableCommunityMap)

const uiParams = {
  group: {
    command: {
      label: 'text-normal pl-2'
    }
  }
}

const actions = computed(() => {
  const baseActions = [
    {
      id: 'go-home',
      label: 'Go Home',
      icon: 'i-lucide-home',
      click: () => {
        router.push('/dashboard');
      }
    },
    {
      id: 'stream-manager',
      label: 'Stream Manager',
      icon: 'i-lucide-clapperboard',
      click: () => {
        router.push('/dashboard/stream-manager');
      }
    }
  ];

  if (hasCommunityMapEnabled.value) {
    baseActions.push({
      id: 'view-map',
      label: 'View Community Map',
      icon: 'i-lucide-map',
      click: () => {
        open(`/c/${rawUser().username}/map`, '_blank');
      }
    });
  }

  return baseActions;
});


const groups = computed(() => {
  return [
    {
      key: 'actions',
      label: 'Actions',
      commands: actions.value
    }
  ]
})

const onCommand = (command: any) => {
  command.click()
  isOpen.value = false
}

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      isOpen.value = !isOpen.value
    }
  }
})

</script>