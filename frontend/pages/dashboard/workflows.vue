<template>
  <div class="mx-auto md:px-4 mb-16">
    <UAlert
      color="orange"
      icon="i-mdi-flask"
      variant="soft"
      title="¡Atención!"
      description="Los workflows son una funcionalidad avanzada y experimental. Recomendamos no utilizarla a menos que sepas lo que estás haciendo."
    />

    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        Workflows
      </h2>
    </div>
    <UBreadcrumb
      :links="breadcrum"
      class="mt-2 mx-auto"
    />

    <div class="flex w-full my-4 space-x-2">
      <UInput
        v-model="search"
        placeholder="Buscar workflow"
        size="lg"
        leading-icon="i-heroicons-magnifying-glass-20-solid"
      />
      <div class="flex-grow" />
      <UButton
        color="gray"
        variant="ghost"
        icon
        leading-icon="i-mdi-file-document-multiple"
        @click="fetchLogs"
      >
        Ver logs
      </UButton>
      <UButton
        color="primary"
        :disabled="loading"
        :loading="loading"
        icon
        leading-icon="i-mdi-plus"
        @click="showAddDialog"
      >
        Añadir workflow
      </UButton>
    </div>

    <UTable
      :rows="filteredRows"
      :columns="headers"
      sort-asc-icon="i-heroicons-arrow-up-20-solid"
      class="border-[1px] border-gray-300 border-solid rounded-md mt-2 mx-auto"
      sort-desc-icon="i-heroicons-arrow-down-20-solid"
      :sort-button="{ icon: 'i-heroicons-sparkles-20-solid', color: 'primary', variant: 'outline', size: '2xs', square: false, ui: { rounded: 'rounded-full' } }"
    >
      <template #script-data="{ row }">
        <code
          class="block bg-gray-100 p-2 text-sm text-black max-w-64 md:max-w-screen-sm max-h-64 whitespace-pre-wrap overflow-auto"
        >
          {{ row.script }}
        </code>
      </template>


      <template #actions-data="{ row }">
        <div class="flex space-x-2">
          <UTooltip
            text="Editar workflow"
            placement="bottom"
          >
            <UButton
              color="primary"
              variant="soft"
              icon
              leading-icon="mdi-pencil"
              @click="showEditDialog(row)"
            >
              Editar
            </UButton>
          </UTooltip>
          <UTooltip
            text="Eliminar workflow"
            placement="bottom"
          >
            <UButton
              color="red"
              variant="soft"
              icon
              leading-icon="mdi-trash-can"
              @click="showDeleteDialog(row)"
            >
              Eliminar
            </UButton>
          </UTooltip>
        </div>
      </template>
    </UTable>

    <UModal v-model="deleteDialog">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            Eliminar workflow
          </div>
        </template>
        ¿Estás seguro de que quieres eliminar el workflow <b>{{ selectedWorkflow.event_type }}</b>?
        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="primary"
              @click="deleteDialog = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="red"
              @click="deleteWorkflow(selectedWorkflow.id)"
            >
              Eliminar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal
      v-model="addDialog"
      :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800', width: 'sm:max-w-screen-sm md:max-w-screen-md' }"
      prevent-close
    >
      <UCard>
        <template #header>
          <div class="text-h5">
            Añadir workflow
          </div>
        </template>
        <USelect
          v-model="newWorkflow.event_type"
          :options="workflowData.event_types"
          size="lg"
          placeholder="Selecciona un evento"
          icon="i-heroicons-sparkles-20-solid"
          class="my-2"
        />
        <div
          v-if="newWorkflow.event_type === 'ON_WEBHOOK'"
          class="flex items-center space-x-2"
        >
          <UInput
            v-model="webhookUrl"
            readonly
            label="URL de webhook"
            disabled
            size="lg"
            class="flex-1"
          />
          <UTooltip
            text="Copiar URL de webhook"
            placement="bottom"
          >
            <UButton
              color="primary"
              icon
              leading-icon="i-mdi-content-copy"
              @click="copyWebhookUrl"
            >
              Copiar
            </UButton>
          </UTooltip>
        </div>


        <UAlert
          v-if="newWorkflow.event_type === 'ON_WEBHOOK'"
          color="blue"
          icon="i-mdi-flask"
          title="¡Atención!"
          class="my-4"
          variant="subtle"
        >
          <template #description>
            <span class="font-jost font-normal">
              Por motivos de seguridad, Petruquio.LIVE no procesará los datos del webhook entrante, deberás
              procesarlos aquí en el script.
              <br>Puedes acceder a los datos mediante la variable <UKbd
                class="bg-gray-100 cursor-pointer text-black"
                @click="newWorkflow.script = newWorkflow.script + 'data'"
              >data</UKbd>.
            </span>
          </template>
        </UAlert>

        <UAlert
          v-if="newWorkflow.event_type === 'ON_WEBHOOK'"
          color="purple"
          icon="i-mdi-swap-vertical"
          title="Para tener en cuenta"
          class="my-4"
          variant="subtle"
        >
          <template #description>
            <span class="font-jost font-normal">
              Petruquio.LIVE siempre devolverá un <UKbd class="bg-gray-100">HTTP OK (200)
              </UKbd> a las solicitudes entrantes incluso si el script falla.
            </span>
          </template>
        </UAlert>


        <vue-monaco-editor
          :value="newWorkflow.script"
          language="javascript"
          theme="vs-dark"
          :options="{
            minimap: {
              enabled: false,
            },
          }"
          height="350px"
          width="100%"
          @update:value="newWorkflow.script = $event"
        />
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="addDialog = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              @click="addWorkflow"
            >
              Añadir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal
      v-model="editDialog"
      :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800', width: 'sm:max-w-screen-sm md:max-w-screen-md' }"
      prevent-close
    >
      <UCard>
        <template #header>
          <div class="text-h5">
            Editar workflow
          </div>
        </template>
        <vue-monaco-editor
          :value="selectedWorkflow.script"
          language="javascript"
          theme="vs-dark"
          :options="{
            minimap: {
              enabled: false,
            },
          }"
          height="350px"
          width="100%"
          @update:value="selectedWorkflow.script = $event"
        />
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              @click="editDialog = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              @click="editWorkflow"
            >
              Editar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal
      v-model="experimentalAndAdvancedWarning"
      :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }"
    >
      <UCard>
        <template #header>
          <div class="text-h5">
            ¡Atención!
          </div>
        </template>
        <div class="text-sm">
          Los workflows son una funcionalidad avanzada y experimental.<br>
          Recomendamos no utilizarla a menos que sepas lo que estás haciendo.
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="primary"
              @click="closeWarning"
            >
              Entendido
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal
      v-model="logsDialog"
      prevent-close
      :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800', width: 'sm:max-w-screen-sm md:max-w-screen-md' }"
    >
      <UCard>
        <template #header>
          <div class="text-h5">
            Logs
          </div>
        </template>
        <div class="h-5/6 overflow-auto">
          <UTable
            :rows="displayedLogs"
            :columns="[
              { label: 'Fecha', key: 'createdAt' },
              { label: 'Evento', key: 'eventType' },
              { label: 'Exitoso', key: 'success' },
              { label: 'Acciones', key: 'actions', sortable: false },
            ]"
            class="border-[1px] border-gray-300 border-solid rounded-md mt-2 mx-auto"
            sort-asc-icon="i-heroicons-arrow-up-20-solid"
            sort-desc-icon="i-heroicons-arrow-down-20-solid"
            :sort-button="{ icon: 'i-heroicons-sparkles-20-solid', color: 'primary', variant: 'outline', size: '2xs', square: false, ui: { rounded: 'rounded-full' } }"
          >
            <template #success-data="{ row }">
              <span
                v-if="row.success"
                class="text-green-500"
              >Sí</span>
              <span
                v-else
                class="text-red-500"
              >No</span>
            </template>
            <template #createdAt-data="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
            <template #actions-data="{ row }">
              <div class="flex space-x-2">
                <UTooltip
                  text="Ver registro"
                  placement="bottom"
                >
                  <UButton
                    color="primary"
                    variant="soft"
                    icon
                    leading-icon="mdi-file-document-edit"
                    @click="showLog(row)"
                  >
                    Ver
                  </UButton>
                </UTooltip>
                <UTooltip
                  text="Eliminar registro"
                  placement="bottom"
                >
                  <UButton
                    color="red"
                    variant="soft"
                    icon
                    leading-icon="mdi-trash-can"
                    @click="deleteLog(row)"
                  >
                    Eliminar
                  </UButton>
                </UTooltip>
              </div>
            </template>
          </UTable>
          <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
            <UPagination
              v-model="logsCurrentPage"
              :total="logs?.length"
              :page-count="6"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="primary"
              @click="logsDialog = false"
            >
              Cerrar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal
      v-model="singleLogDialog"
      :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800', width: 600 }"
    >
      <UCard>
        <template #header>
          <div class="text-h5 flex flex-col space-y-2">
            Visor de logs
            <span class="text-sm text-gray-500">
              Execution ID: {{ singleLog.executionId }}
            </span>
            <span class="text-sm text-gray-500">
              Evento: {{ singleLog.eventType }}
            </span>
            <span class="text-sm text-gray-500">
              Fecha: {{ new Date(singleLog.createdAt).toLocaleString() }}
            </span>
            <span class="text-sm text-gray-500">
              Exitoso: {{ singleLog.success ? 'Sí' : 'No' }}
            </span>
          </div>
        </template>

        <code
          class="block bg-gray-100 p-2 text-sm text-black max-w-64 md:max-w-screen-sm max-h-64 whitespace-pre-wrap overflow-auto"
        >
          {{ singleLog.executionLog }}
        </code>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="primary"
              @click="singleLogDialog = false"
            >
              Cerrar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
  
<script setup>
import axios from 'axios';
const currentUser = useCurrentUser();
const toast = useToast()

const search = ref('');

const logsCurrentPage = ref(1);

const loading = ref(true);
const workflowData = ref([]);
const deleteDialog = ref(false);
const experimentalAndAdvancedWarning = ref();
const addDialog = ref(false);
const editDialog = ref(false);
const selectedWorkflow = ref(null);
const logs = ref(null);

const logsDialog = ref(false);
const singleLogDialog = ref(false);
const singleLog = ref(null);

const showLog = (log) => {
    singleLog.value = log;
    singleLogDialog.value = true;
};

const displayedLogs = computed(() => {
    return logs.value.slice((logsCurrentPage.value - 1) * 6, logsCurrentPage.value * 6);
});

const breadcrum = [{
    label: 'Dashboard',
    icon: 'i-mdi-view-dashboard-outline',
    to: '/dashboard',
},
{
    label: 'Workflows',
    icon: 'i-mdi-code-braces',
}]


onMounted(() => {
    experimentalAndAdvancedWarning.value = true;
});

const closeWarning = () => {
    experimentalAndAdvancedWarning.value = false;
};

const newWorkflow = ref({
    event_type: '',
    script: '',
});

const headers = [
    { label: 'Evento', key: 'eventType' },
    { label: 'Script', key: 'script' },
    { label: 'Acciones', key: 'actions', sortable: false },
];


const showSnackbar = (text) => {
    snackbarText.value = text;
    snackbar.value = true;
};

const webhookUrl = computed(() => {
    return `https://api.petruquio.live/v2/webhooks/${workflowData.value?.user_api_token}`;
});

const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl.value);
    toast.add({
        title: 'URL de webhook copiada',
        description: 'La URL de webhook ha sido copiada al portapapeles',
        type: 'success',
        icon: 'i-mdi-check-circle',
    })
};

definePageMeta({
    middleware: 'auth',
    layout: 'dashboard',
})

const canCloseAddDialog = computed(() => {
    return newWorkflow.value.event_type !== '' && newWorkflow.value.script !== '';
});

const fetchWorkflows = async () => {
    loading.value = true;
    try {
        const response = await useFetch(`${API_ENDPOINT}/workflows`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        });
        workflowData.value = response.data.value.data;
    } catch (error) {
        console.error('Error fetching workflows:', error);
    } finally {
        loading.value = false;
    }
};

const deleteWorkflow = async (id) => {
    try {
        await axios.delete(`${API_ENDPOINT}/workflows/${selectedWorkflow.value.eventType}`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        });
        deleteDialog.value = false;
        toast.add({
            title: 'Workflow eliminado',
            description: 'El workflow ha sido eliminado correctamente',
            color: 'green',
            icon: 'i-mdi-check-circle',
        })
        fetchWorkflows();
    } catch (error) {
        console.error('Error deleting workflow:', error);
        toast.add({
            title: 'Error eliminando el workflow',
            description: error.response.data.error,
            color: 'red',
            icon: 'i-mdi-alert-circle',
        })
    }
};

const filteredRows = computed(() => {
    // workflows are found in workflowData.value.workflows
    return workflowData.value.workflows.filter((workflow) => {
        return workflow.eventType.toLowerCase().includes(search.value.toLowerCase()) || workflow.script.toLowerCase().includes(search.value.toLowerCase());
    });
});


const addWorkflow = async () => {
    if (!newWorkflow.value.event_type) {
        toast.add({
            title: 'Error',
            description: 'You must select an event type',
            color: 'red',
            icon: 'i-mdi-alert-circle',
        })
        return;
    }
    try {
        await axios.post(`${API_ENDPOINT}/workflows`, newWorkflow.value, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        });
        addDialog.value = false;
        toast.add({
            title: 'Workflow añadido',
            description: 'El workflow ha sido añadido correctamente',
            color: 'green',
            icon: 'i-mdi-check-circle',
        })
        fetchWorkflows();
    } catch (error) {
        console.error('Error adding workflow:', error);
        toast.add({
            title: 'Error añadiendo el workflow',
            description: error.response.data.error,
            color: 'red',
            icon: 'i-mdi-alert-circle',
        })
    }
};

const editWorkflow = async () => {
    try {
        await axios.put(`${API_ENDPOINT}/workflows/${selectedWorkflow.value.eventType}`, {
            script: selectedWorkflow.value.script,
        }, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        });
        editDialog.value = false;
        toast.add({
            title: 'Workflow editado',
            description: 'El workflow ha sido editado correctamente',
            color: 'green',
            icon: 'i-mdi-check-circle',
        })
        fetchWorkflows();
    } catch (error) {
        console.error('Error editing workflow:', error);
        toast.add({
            title: 'Error editando el workflow',
            description: error.response.data.error,
            color: 'red',
            icon: 'i-mdi-alert-circle',
        })
    }
};

const fetchLogs = async () => {
    logs.value = null;
    logsCurrentPage.value = 1;
    toast.add({
        title: 'Fetching logs',
        description: 'Fetching logs, please wait...',
        color: 'blue',
        icon: 'i-mdi-information-circle',
    })
    try {
        const response = await axios.get(`${API_ENDPOINT}/workflows/logs`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        });
        logs.value = response.data.data.logs;
        logsDialog.value = true;
    } catch (error) {
        console.error('Error fetching logs:', error);
        toast.add({
            title: 'Error fetching logs',
            description: error.response.data.error,
            color: 'red',
            icon: 'i-mdi-alert-circle',
        })
    }
};

const deleteLog = async (log) => {
    console.log(log);
    if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
        await axios.delete(`${API_ENDPOINT}/workflows/logs/${log.id}`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        });
        toast.add({
            title: 'Registro eliminado',
            description: 'El registro de ejecución ha sido eliminado correctamente',
            color: 'green',
            icon: 'i-mdi-check-circle',
        })
        await fetchLogs();
    } catch (error) {
        console.error('Error deleting log:', error);
        toast.add({
            title: 'Error eliminando el registro',
            description: error.response.data.error,
            color: 'red',
            icon: 'i-mdi-alert-circle',
        })
    }
};

const showAddDialog = () => {
    addDialog.value = true;
    newWorkflow.value = {
        event_type: '',
        script: '',
    };
};

const showEditDialog = (item) => {
    selectedWorkflow.value = JSON.parse(JSON.stringify(item));
    editDialog.value = true;
};

const showDeleteDialog = (item) => {
    selectedWorkflow.value = item
    deleteDialog.value = true;
};

await fetchWorkflows()

</script>
  