<template>
  <header class="top-0 z-[8] mb-5 flex h-16 items-center gap-2 sticky px-4 bg-white border-b-[1px] border-gray-200">
    <div class="flex items-center">
      <button class="btn btn-ghost btn-circle" @click="sidebar.toggleSidebar()">
        <AlignLeftIcon class="w-5 h-5 text-black" />
      </button>
    </div>

    <div class="flex-1" />

    <div class="flex items-center">
      <USelect v-model="$i18n.locale" :options="languages" option-attribute="label" value-attribute="value"
        @update:model-value="handleLanguageChange" class="mr-2">
        <template #leading>
          <UAvatar :src="currentLanguageFlagUrl" :alt="currentLanguageLabel" size="3xs" />
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
const i18n = useI18n({ useScope: 'global' });
const languages = ref([]);


const FLAGS_MAP = {
  es: 'uy',
  en: 'us',
}

const getLanguageFlagUrl = (language: string) => `https://flagcdn.com/16x12/${FLAGS_MAP[language as keyof typeof FLAGS_MAP]}.png`;


// Calcula la URL de la bandera y la etiqueta del idioma actual
const currentLanguageFlagUrl = computed(() => getLanguageFlagUrl(i18n.locale.value));
const currentLanguageLabel = computed(() => i18n.t(`application.languages.${i18n.locale.value}`));

// Actualiza las opciones del selector de idioma
const updateLanguageOptions = () => {
  languages.value = i18n.availableLocales.map(language => ({
    flag: getLanguageFlagUrl(language),
    label: i18n.t(`application.languages.${language}`),
    value: language
  }));
};

// Maneja el cambio de idioma
const handleLanguageChange = (value?: string) => {
  if (!value) return;
  i18n.locale.value = value;
  cookie.value = value;
};

// Inicialización
onMounted(() => {
  updateLanguageOptions();
  handleLanguageChange(cookie.value);
});
</script>