<template>
  <UModal v-model="isOpen">
    <UCommandPalette :placeholder="t('dashboard.command_palette.search_placeholder')" :groups="groups"
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

const protocol = computed(() => window.location.protocol)
const hasCommunityMapEnabled = computed(() => rawUser().channel.preferences.enableCommunityMap)

const actions = computed(() => {
  const baseActions = [
    {
      id: 'go-home',
      label: 'Go Home',
      icon: 'i-lucide-home',
      click: () => {
        router.push('/dashboard');
      }
    }
  ];

  if (hasCommunityMapEnabled.value) {
    baseActions.push({
      id: 'view-map',
      label: 'View Community Map',
      icon: 'i-lucide-map',
      click: () => {
        open(`${protocol.value}//${FRONTEND_URL}/${rawUser().channel.user.username}/map`, '_blank');
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