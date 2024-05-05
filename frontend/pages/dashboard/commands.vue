<template>
  <div class="mx-auto md:px-4">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        Comandos
      </h2>
    </div>
    <DashboardBreadcrumb />
    <div class="flex py-3.5 w-full">
      <UInput v-model="search" :placeholder="$t('commands.search')" size="lg"
        leading-icon="i-heroicons-magnifying-glass-20-solid" />
      <div class="flex-grow" />
      <UButton color="blue" leading-icon="i-heroicons-plus-20-solid" @click="showAddDialog">
        Añadir comando
      </UButton>
    </div>
    <UTable :rows="filteredRows" :columns="headers" sort-asc-icon="i-heroicons-arrow-up-20-solid"
      class="border-[1px] border-gray-300 border-solid rounded-md mt-2 mx-auto"
      sort-desc-icon="i-heroicons-arrow-down-20-solid"
      :sort-button="{ icon: 'i-heroicons-sparkles-20-solid', color: 'primary', variant: 'outline', size: '2xs', square: false, ui: { rounded: 'rounded-full' } }">
      <template #actions-data="{ row }">
        <LazyDashboardCommandsContextualMenu :command="row" @editCommand="showEditDialog"
          @deleteCommand="showDeleteDialog" @toggle-command-enabled="toggleCommandEnabled" />
      </template>

      <template #response-data="{ row }">
        <div class="max-w-md md:max-w-[500px]">
          <p class="truncate" :title="row.response">
            {{ row.response }}
          </p>
        </div>
      </template>
    </UTable>

    <UModal v-model="deleteDialog">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            Eliminar comando
          </div>
        </template>
        ¿Estás seguro de que quieres eliminar el comando <b>{{ selectedCommand.name }}</b>?
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="ghost" @click="deleteDialog = false">
              Cancelar
            </UButton>
            <UButton color="red" @click="deleteCommand(selectedCommand.id)">
              Eliminar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>


    <UModal v-model="addDialog" prevent-close>
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            {{ $t('commands.add') }}
          </div>
        </template>
        <template #default>
          <div class="flex flex-col space-y-2">
            <UInput v-model="newCommand.name" placeholder="Nombre del comando" size="lg" />
            <UFormGroup label="Respuesta" label-position="top">
              <UTextarea v-model="newCommand.response" placeholder="Respuesta del comando" />
              <div class="flex justify-end">
                <UButton color="blue" class="mt-2" leading-icon="i-mdi-open-in-new" variant="soft"
                  @click="variableInjectorOpened = true">
                  Variables
                </UButton>
              </div>
            </UFormGroup>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="ghost" @click="addDialog = false">
              Cancelar
            </UButton>
            <UButton color="blue" @click="addCommand">
              Añadir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal v-model="editDialog" prevent-close>
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center space-x-2">
            <div class="text-h5">
              Editar comando
            </div>
            <div class="flex-grow" />
            <label class="flex items-center space-x-2 cursor-pointer">
              <UToggle v-model="selectedCommand.enabled" />
              <div class="text-h6">
                {{ selectedCommand.enabled ? 'Habilitado' : 'Deshabilitado' }}
              </div>
            </label>
          </div>
        </template>
        <div class="space-y-2">
          <UInput v-model="selectedCommand.name" placeholder="Nombre del comando" size="lg" />
          <UTextarea ref="editCommandResponse" v-model="selectedCommand.response" autoresize
            placeholder="Respuesta del comando" />
          <div class="flex justify-end">
            <UButton color="blue" class="mt-2" leading-icon="i-mdi-open-in-new" variant="soft"
              @click="variableInjectorOpened = true">
              Variables
            </UButton>
          </div>
          <UDivider :label="$t('commands.alias')" class="py-2" />
          <template v-for="(value, index) in selectedCommand.preferences?.aliases" :key="index">
            <UButton variant="soft" color="blue" :label="value" class="mt-2 ml-2"
              @click="selectedCommand.preferences?.aliases.splice(index, 1)">
              <template #trailing>
                <UIcon name="i-heroicons-x-mark-20-solid" />
              </template>
            </UButton>
          </template>
          <UInput v-model="alias" :placeholder="$t('commands.alias')" size="lg" @keyup.enter="addAlias" />
          <UButton color="blue" :label="$t('commands.add_alias')" class="mt-2" @click="addAlias" />
          <UDivider :label="$t('commands.cooldowns.title')" class="py-2" />

          <UFormGroup :label="$t('commands.cooldowns.global')" label-position="top">
            <UInput v-model="selectedCommand.preferences.globalCooldown" :placeholder="$t('commands.cooldowns.global')"
              size="lg" type="number" step="1" />
          </UFormGroup>
          <UFormGroup :label="$t('commands.cooldowns.user')" label-position="top">
            <UInput v-model="selectedCommand.preferences.userCooldown" :placeholder="$t('commands.cooldowns.user')"
              size="lg" type="number" step="1" />
          </UFormGroup>
          <UDivider :label="$t('commands.permissions')" class="py-2" />
          <UAlert v-if="selectedCommand.permissions.includes('everyone')" color="blue"
            :title="$t('commands.permissions_everyone_warn.title')" icon="i-mdi-information-outline" variant="soft">
            <template #description>
              <i18n-t keypath="commands.permissions_everyone_warn.description">
                <template #command>
                  <UBadge color="white" variant="solid">
                    !{{ selectedCommand.name }}
                  </UBadge>
                </template>
                <template #everyone>
                  <b>everyone</b>
                </template>
              </i18n-t>
            </template>
          </UAlert>
          <template v-for="permission in Object.values(CommandPermission)">
            <div class="flex items-center">
              <UCheckbox v-model="selectedCommand.permissions" color="primary" :value="permission" :label="permission"
                :disabled="selectedCommand.permissions.includes('everyone') && permission !== 'everyone'" />
              <UTooltip v-if="permission === 'viewer'">
                <template #text>
                  Todo usuario que no sea follower, subscriber, vip, moderator o broadcaster
                </template>
                <UIcon name="i-mdi-information-outline" class="text-blue-400 cursor-pointer ml-2" />
              </UTooltip>
            </div>
          </template>
        </div>
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="ghost" @click="closeEditDialog">
              Cancelar
            </UButton>
            <UButton color="blue" @click="editCommand">
              Editar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- CommandPalette para inyectar variables desde AvailableVariables 
        
            Debe mostrar un select con las variables disponibles y un botón para añadirlas al textarea en la posición del cursor
        -->


    <UModal v-model="variableInjectorOpened">
      <UCommandPalette :groups="AvailableVariables" @update:model-value="injectVariable($event)">
        <template #variables-command="{ command }">
          <div class="flex flex-col">
            <div class="text-sm font-medium">
              {{ command.label }}
            </div>
            <div class="text-xs text-gray-500">
              {{ command.description }}
            </div>
          </div>
        </template>
      </UCommandPalette>
    </UModal>
  </div>
</template>

<script setup>
import { useCurrentUser } from "~/stores/currentUser";
const toast = useToast();
const variableInjectorOpened = ref(false);
const editCommandResponse = ref();
import { useI18n } from 'vue-i18n';
const i18n = useI18n();
const client = useAuthenticatedRequest();
const { CommandPermission, getCommands, toggleCommand, editCommand: editCommandHook } = useCommands();

useHead({
  title: 'Comandos'
})


const injectVariable = (variable) => {
  if (newCommand.value) {
    newCommand.value.response = (newCommand.value.response || '') + ` ${variable.value}`;
  }

  if (selectedCommand.value) {
    selectedCommand.value.response = (selectedCommand.value.response || '') + ` ${variable.value}`;
  }

  variableInjectorOpened.value = false;
};


const AvailableVariables = ref([{
  key: 'variables',
  label: 'Variables',
  commands: [
    {
      id: 'targetUser',
      label: 'targetUser',
      description: 'Nombre del usuario que ejecuta el comando',
      value: '${targetUser}',
    }
  ]
}]);

const currentUser = useCurrentUser();
const deleteDialog = ref(false);
const selectedCommand = ref();
const addDialog = ref(false);
const editDialog = ref(false);




const alias = ref('');

const newCommand = ref({
  name: '',
  response: '',
});

const search = ref('');

const filteredRows = computed(() => {
  return commands.value.filter((row) => {
    return row.name.toLowerCase().includes(search.value.toLowerCase());
  });
});

const showDeleteDialog = (command) => {
  selectedCommand.value = command;
  deleteDialog.value = true;
};

const closeEditDialog = () => {
  editDialog.value = false;
  alias.value = '';
};

const showEditDialog = (command) => {
  /*
      * We need to make a copy of the command because we don't want to modify the original
  */
  selectedCommand.value = JSON.parse(JSON.stringify(command));
  if (!selectedCommand.value.preferences?.aliases) {
    selectedCommand.value.preferences = {
      aliases: [],
      ...selectedCommand.value.preferences,
    };
  }
  editDialog.value = true;
};

const addAlias = () => {
  if (alias.value.trim().length === 0) return;
  /*
      Si el alias es el mismo que el comando, no lo añadimos
      Si contiene espacios, reemplazamos los espacios por guiones medios
      Si el alias ya existe, no lo añadimos
  */

  if (selectedCommand.value.name.toLowerCase() === alias.value.toLowerCase()) return;
  if (alias.value.includes(' ')) {
    alias.value = alias.value.replaceAll(' ', '-');
  }
  if (selectedCommand.value.preferences.aliases.includes(alias.value)) return;

  selectedCommand.value.preferences.aliases.push(alias.value.toLowerCase());
  alias.value = '';
};

const showAddDialog = () => {
  addDialog.value = true;
  newCommand.value = {
    name: '',
    response: '',
  };

};

const addCommand = async () => {
  const response = await useFetch(`${API_ENDPOINT}/channel/commands`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${currentUser.getToken()}`,
    },
    body: {
      name: newCommand.value.name,
      response: newCommand.value.response,
    },
  });

  if (response.data.value.success) {
    addDialog.value = false;
    await fetchCommands();
  }
};

const toggleCommandEnabled = async (command) => {
  try {
    await toggleCommand(command.id);
    await fetchCommands();

  } catch (error) {
    console.log(error);

    commands.value = commands.value.map((c) => {
      if (c.id === command.id) {
        c.enabled = !c.enabled;
      }
      return c;
    });
  }
};

const editCommand = async () => {
  try {
    await editCommandHook(selectedCommand.value);
    editDialog.value = false;
    await fetchCommands();
  } catch (error) {
    console.log(error);
  }
};


const commands = ref([]);
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
});

const headers = ref([
  {
    label: i18n.t('commands.command'),
    key: 'name',
    sortable: true
  },
  {
    label: i18n.t('commands.message'),
    key: 'response'
  },
  {
    key: 'actions'
  },
])

const fetchCommands = async () => {
  try {
    commands.value = await getCommands()
  } catch (error) {

  }
};

const deleteCommand = async (id) => {
  const response = await useFetch(`${API_ENDPOINT}/channel/commands/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${currentUser.getToken()}`,
    },
  });

  if (response.data.value.success) {
    deleteDialog.value = false;
    toast.add({
      type: 'success',
      title: 'Comando eliminado',
      description: 'El comando se ha eliminado correctamente',
      icon: 'i-heroicons-check-20-solid',
    });
    await fetchCommands();
  }
};

await fetchCommands();
</script>
