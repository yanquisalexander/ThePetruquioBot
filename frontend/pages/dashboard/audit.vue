<template>
  <div class="mx-auto md:px-4 mb-16">
    <UAlert color="violet" icon="i-mdi-shield-check-outline" variant="soft" title="¡Nos importa tu seguridad!">
      <template #description>
        <p>
          Los registros de auditoría son una herramienta que te permite conocer las acciones que se realizan en tu
          cuenta y configuración de la plataforma.
        </p>
      </template>
    </UAlert>
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        {{ $t('audit.title') }}
      </h2>
    </div>
    <UBreadcrumb :links="breadcrum" class="mt-2 mx-auto" />
    <div class="flex py-3.5 w-full">
      <UInput v-model="search" :placeholder="$t('audit.search')" size="lg"
        leading-icon="i-heroicons-magnifying-glass-20-solid" />
      <div class="flex-grow" />
    </div>
    <UTable :rows="displayedAudits" :columns="[
      { label: 'Fecha', key: 'createdAt' },
      { label: 'Usuario', key: 'user' },
      { label: 'Acción', key: 'type' },
      { label: 'Acciones', key: 'actions', sortable: false },
    ]" class="border-[1px] border-gray-300 border-solid rounded-md mt-2 mx-auto"
      sort-asc-icon="i-heroicons-arrow-up-20-solid" sort-desc-icon="i-heroicons-arrow-down-20-solid"
      :sort-button="{ icon: 'i-heroicons-sparkles-20-solid', color: 'primary', variant: 'outline', size: '2xs', square: false, ui: { rounded: 'rounded-full' } }">
      <template #user-data="{ row }">
        <div class="flex items-center space-x-2">
          <div class="flex-shrink-0">
            <UAvatar :src="row.avatar" size="sm" />
          </div>
          <div class="flex-grow flex-col flex">
            <span>{{ row.displayName || row.username }}</span>
            <span v-if="row.username === 'petruquiolive'">
              <UTooltip text="This is a System Account" placement="top">
                <UBadge color="primary" variant="soft" class="text-xs">
                  <UIcon name="i-mdi-shield-check-outline" size="xs" class="mr-1" />
                  System
                </UBadge>
              </UTooltip>
            </span>
          </div>
        </div>
      </template>
      <template #createdAt-data="{ row }">
        <span>{{ $moment(row.createdAt).fromNow() }}</span>
      </template>
      <template #actions-data="{ row }">
        <div class="flex space-x-2">
          <UTooltip text="Ver detalles" placement="top">
            <UButton color="primary" variant="soft" icon leading-icon="i-mdi-eye-outline" @click="showAudit(row)">
              Ver detalles
            </UButton>
          </UTooltip>
        </div>
      </template>
      <template #type-data="{ row }">
        <div class="flex items-center space-x-2">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center w-8 h-8 rounded-full"
              :class="getAuditType(row.type).colorClass">
              <UIcon :name="getAuditType(row.type).icon" size="sm" class="text-lg" />
            </div>
          </div>

          <div class="flex-grow">
            <span>
              {{ $t(`audit.actions.${row.type}`) }}
            </span>
            <p class="text-xs text-gray-500">
              {{ getActionDescription(row.type) }}
            </p>
          </div>
        </div>
      </template>
    </UTable>
    <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <UPagination v-model="auditsCurrentPage" :total="filteredAudits.length" page-count="8" />
    </div>
    <UModal v-model="auditDetailsModal">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            Detalles de la auditoría
          </div>
        </template>
        <div class="flex flex-col">
          <!--
                        Detalles de la auditoría (fecha, usuario, acción, detalles)
                    -->
          <div class="text-sm font-medium text-gray-500">
            Fecha
          </div>
          <div class="text-sm font-medium text-gray-700">
            {{ $moment(selectedAudit.createdAt).format('DD/MM/YYYY HH:mm:ss') }}
          </div>
          <div class="text-sm font-medium text-gray-500">
            Usuario
          </div>
          <div class="text-sm font-medium text-gray-700">
            {{ selectedAudit.displayName || selectedAudit.username }}
          </div>
          <div class="text-sm font-medium text-gray-500">
            Acción
          </div>
          <div class="text-sm font-medium text-gray-700">
            {{ $t(`audit.actions.${selectedAudit.type}`) }}
          </div>
          <div class="text-sm font-medium text-gray-500">
            Detalles
          </div>
          <pre class="text-sm font-medium text-gray-700 overflow-x-auto">
        {{ JSON.stringify(selectedAudit.data, null, 2) }}
      </pre>
        </div>
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="primary" variant="soft" @click="auditDetailsModal = false">
              Cerrar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { $moment } = useNuxtApp();
const toast = useToast();
const currentUser = useCurrentUser();
const i18n = useI18n();
const { getAuditType, getActionDescription } = useAudits();



const breadcrum = ref([
  {
    label: 'Dashboard',
    icon: 'i-mdi-view-dashboard-outline',
    to: '/dashboard'
  },
  {
    label: 'Auditoría',
    icon: 'i-mdi-shield-check-outline',
    to: '/dashboard/audit',
  },
])

const auditories = ref([])

const auditsCurrentPage = ref(1);
const search = ref('');
const selectedAudit = ref(null);
const auditDetailsModal = ref(false);



const showAudit = (audit) => {
  selectedAudit.value = audit
  auditDetailsModal.value = true
}


definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: i18n.t('audit.title'),
})

const fetchAudits = async () => {
  try {
    const response = await useFetch(`${API_ENDPOINT}/audits`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      }
    })
    auditories.value = response.data.value.data.audits
  } catch (error) {
    console.log(error)
    toast.add({
      color: 'red',
      title: 'Error fetching audits',
      description: error.message,
    });
  }
}

const filteredAudits = computed(() => {
  return auditories.value.filter((audit) => {
    const searchData = JSON.stringify(audit.data).toLowerCase();
    const searchTerm = search.value.toLowerCase();
    return audit.username.toLowerCase().includes(searchTerm) ||
      audit.type.toLowerCase().includes(searchTerm) ||
      searchData.includes(searchTerm);
  });
});


const displayedAudits = computed(() => {
  return filteredAudits.value.slice((auditsCurrentPage.value - 1) * 8, auditsCurrentPage.value * 8)
});

await fetchAudits()


</script>