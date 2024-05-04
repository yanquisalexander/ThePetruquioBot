<template>
  <UModal v-model="isOpen">
    <UCommandPalette :placeholder="t('dashboard.command_palette.search_placeholder')" :groups="groups"
      :autoselect="false" @update:model-value="onCommand">
    </UCommandPalette>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const isOpen = ref(false)
const router = useRouter()
const { t } = useI18n()

const actions = [
  {
    id: 'go-home',
    label: 'Go Home',
    icon: 'i-lucide-home',
    click: () => {
      router.push('/dashboard')
    }
  }
]

const selected = ref([])

const groups = computed(() => {
  return [
    {
      key: 'actions',
      label: 'Actions',
      commands: actions
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