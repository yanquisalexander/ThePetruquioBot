<template>
  <header class="top-0 z-[8] mb-5 flex h-16 items-center gap-2 sticky px-4 bg-white border-b-[1px] border-gray-200">
    <div
      class="flex items-center"
    >
      <button
        class="btn btn-ghost btn-circle"
        @click="sidebar.toggleSidebar()"
      >
        <AlignLeftIcon class="w-5 h-5 text-black" />
      </button>
    </div>

    <div class="flex-1" />

    <div class="flex items-center">
      <USelect
        v-model="$i18n.locale"
        :options="languages"
        option-attribute="label"
        value-attribute="value"
        class="mr-2"
      >
        <template #leading>
          <UAvatar
            :src="`https://flagcdn.com/16x12/${$i18n.locale}.png`"
            :alt="$t(`application.languages.${$i18n.locale}`)"
            size="3xs"
          />
        </template>
      </USelect>
      <DashboardNotifications />
      <UserMenu />
    </div>
  </header>
</template>

<script lang="ts" setup>
import { AlignLeftIcon } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
const cookie = useCookie('language');
const sidebar = useSidebar();
const i18n = useI18n();

const languages = ref([])

for (const locale of i18n.availableLocales) {
  languages.value.push({
    flag: `https://flagcdn.com/16x12/${locale}.png`,
    label: i18n.t(`application.languages.${locale}`),
    value: locale
  })
}


watch(() => i18n.locale.value, () => {
  cookie.value = i18n.locale.value;
})


</script>
