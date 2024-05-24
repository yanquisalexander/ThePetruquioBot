<template>
  <div class="mx-auto md:px-4 mb-16">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        {{ $t('community.shoutouts') }}
      </h2>
      <div class="flex justify-end">
        <UButton
          color="blue"
          @click="openNewDialog"
        >
          {{ $t('community.shoutouts.new_shoutout') }}
        </UButton>
      </div>
      <UBreadcrumb
        :links="breadcrum"
        class="mt-2 mx-auto"
      >
        <template #default="{ link }">
          <NuxtLink
            :to="link.to"
            class="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {{ link.label }}
          </NuxtLink>
        </template>
      </UBreadcrumb>
      <div class="flex py-3.5 w-full">
        <UInput
          v-model="search"
          :placeholder="$t('users.search')"
          size="lg"
          leading-icon="i-heroicons-magnifying-glass-20-solid"
        />
        <div class="flex-grow" />
      </div>
      <div
        v-if="shoutouts"
        class="mt-2 bg-white rounded-md pt-4 px-4 w-full"
      >
        <UTable
          :rows="displayedShoutouts"
          :columns="[
            { label: 'Canal', key: 'channel' },
            { label: 'Mensajes', key: 'messages' },
            { label: 'Acciones', key: 'actions', sortable: false },
          ]"
        >
          <template #channel-data="{ row }">
            <div class="flex items-center space-x-2">
              <img
                :src="row.avatar"
                :alt="row.display_name"
                class="w-8 h-8 rounded-full"
              >
              <span class="ml-2">{{ row.display_name }}</span>
            </div>
          </template>
          <template #messages-data="{ row }">
            <div class="flex flex-col space-y-2 max-w-sm">
              <template
                v-for="(message, index) in row.messages"
                :key="index"
              >
                <div class="flex items-center space-x-2 text-sm text-gray-500 w-full">
                  <div class="flex items-center space-x-1">
                    <UIcon name="i-mdi-message-text-outline" />
                  </div>
                  <span class="flex-grow truncate">{{ message }}</span>
                </div>
              </template>
            </div>
          </template>
          <template #actions-data="{ row }">
            <div class="flex space-x-2">
              <UTooltip
                text="Editar shoutout"
                placement="top"
              >
                <UButton
                  size="xs"
                  variant="soft"
                  color="blue"
                  icon="i-mdi-pencil-outline"
                  @click="editShoutout(row)"
                >
                  Editar
                </UButton>
              </UTooltip>
           
              <UTooltip
                text="Eliminar shoutout"
                placement="top"
              >
                <UButton
                  size="xs"
                  variant="soft"
                  color="red"
                  icon="i-mdi-delete-outline"
                  @click="showDeleteDialog(row)"
                >
                  Eliminar
                </UButton>
              </UTooltip>
            </div>
          </template>
        </UTable>
        <div class="flex items-center justify-center mt-4">
          <UPagination
            v-if="filteredShoutouts"
            v-model="currentShoutoutsPage"
            :total="filteredShoutouts.length"
          />
        </div>

        <UModal v-model="editDialog">
          <UCard
            v-if="selectedShoutout"
            :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }"
          >
            <template #header>
              <div class="text-h5 flex justify-between items-center">
                <div>
                  {{ $t('community.shoutouts.edit_shoutout') }}
                </div>
                <div
                  class="flex items-center space-x-2"
                >
                  <UToggle
                    v-model="selectedShoutout.enabled"
                    color="blue"
                  />
                </div>
              </div>
            </template>
            <UForm>
              <div class="p-4">
                <template
                  v-for="(message, index) in selectedShoutout.messages"
                  :key="index"
                >
                  <div class="flex my-2 space-x-2 w-full">
                    <UInput
                      v-model="selectedShoutout.messages[index]"
                      class="flex-grow"
                      :placeholder="$t('community.shoutouts.message')"
                      size="lg"
                    />
                    <UButton
                      v-if="selectedShoutout.messages.length > 1"
                      color="red"
                      variant="soft"
                      @click="removeMessageFromShoutout(index)"
                    >
                      <UIcon name="i-mdi-delete-outline" />
                    </UButton>
                  </div>
                </template>
                <div class="flex justify-end mt-4">
                  <UButton
                    v-if="selectedShoutout.messages.length < 3"
                    variant="soft"
                    color="blue"
                    icon="i-mdi-plus"
                    @click="addMessageToShoutout"
                  >
                    {{ $t('community.shoutouts.add_message') }}
                  </UButton>
                </div>
                <UAlert
                  v-if="selectedShoutout.messages.length === 3"
                  color="orange"
                  variant="soft"
                  icon="i-mdi-alert-circle-outline"
                >
                  <template #description>
                    <div class="text-sm">
                      Solo puedes tener hasta 3 mensajes por shoutout.<br>
                      Suscríbete a PetruquioLIVE+ para tener mensajes ilimitados.
                    </div>
                  </template>
                </UAlert>
              </div>
            </UForm>
            <template #footer>
              <div class="flex justify-end">
                <UButton
                  variant="text"
                  color="gray"
                  @click="cancelEdit"
                >
                  {{ $t('dashboard.admin.cancel') }}
                </UButton>
                <UButton
                  color="blue"
                  @click="updateShoutout"
                >
                  {{ $t('dashboard.admin.save') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </UModal>

        <UModal v-model="deleteDialog">
          <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
              <div class="text-h5">
                {{ $t('community.shoutouts.delete_shoutout') }}
              </div>
            </template>
            <p class="text-sm">
              {{ $t('community.shoutouts.delete_shoutout_for_channel', { username: selectedShoutout.display_name }) }}
            </p>
            <template #footer>
              <div class="flex justify-end">
                <UButton
                  variant="text"
                  color="gray"
                  @click="deleteDialog = false"
                >
                  {{ $t('dashboard.admin.cancel') }}
                </UButton>
                <UButton
                  color="red"
                  @click="deleteShoutout"
                >
                  {{ $t('dashboard.admin.delete') }}
                </UButton>
              </div>
            </template>
          </UCard>
        </UModal>

        <UModal v-model="newDialog">
          <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
              <div class="text-h5">
                {{ $t('community.shoutouts.new_shoutout') }}
              </div>
            </template>
            <UForm>
              <div class="p-4">
                <div class="flex my-2 space-x-2 w-full">
                  <UInput
                    v-model="newShoutout.username"
                    disabled
                    class="flex-grow"
                    :placeholder="$t('community.shoutouts.username')"
                    size="lg"
                  />
                </div>

                <!-- Lista que carga usuarios y que permite seleccionar -->

                <div class="flex flex-col my-2 space-x-2 w-full">
                  <UInput
                    v-if="!newShoutout.username"
                    v-model="searchForUser"
                    class="flex-grow"
                    :placeholder="$t('users.search')"
                    size="lg"
                  />
                  <div
                    v-if="loadingUsers"
                    class="flex items-center space-x-2 mt-2"
                  >
                    <UProgress
                      color="blue"
                      size="sm"
                      indeterminate
                    />
                    <span>{{ $t('users.loading') }}</span>
                  </div>
                  <div
                    v-if="usersResult.length > 0"
                    class="flex flex-col space-y-2 max-w-sm mt-4 max-h-60 overflow-y-auto"
                  >
                    <template
                      v-for="(user, index) in usersResult.filter((user) => !shoutouts.find((shoutout) => shoutout.username === user.username))"
                      :key="index"
                    >
                      <div
                        class="flex items-center space-x-2 border rounded-md p-2 cursor-pointer"
                        @click="newShoutout.username = user.username; usersResult = []"
                      >
                        <img
                          :src="user.avatar"
                          :alt="user.displayName"
                          class="w-8 h-8 rounded-full"
                        >
                        <span class="ml-2">{{ user.displayName }}</span>
                      </div>
                    </template>
                  </div>
                
                  <div class="flex justify-end mt-4">
                    <UButton
                      variant="text"
                      color="gray"
                      @click="cancelNew"
                    >
                      {{ $t('dashboard.admin.cancel') }}
                    </UButton>
                    <UButton
                      color="blue"
                      @click="createShoutout"
                    >
                      {{ $t('dashboard.admin.save') }}
                    </UButton>
                  </div>
                </div>
              </div>
            </UForm>
          </UCard>
        </UModal>
      </div>
    </div>
  </div>
</template>
    
<script lang="ts" setup>
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { PetruquioSDK } from "@/utils/petruquio-sdk";

export interface Shoutout {
    username:     string;
    display_name?: string;
    avatar?:       string;
    user_id?:      number;
    messages:     string[];
    enabled:      boolean;
}


const currentUser = useCurrentUser();
const i18n = useI18n();

const currentShoutoutsPage = ref(1)
const search = ref('')
const shoutouts = ref<Shoutout[]>([])
const searchForUser = ref('')
const loadingUsers = ref(false)
const usersResult = ref<User[]>([])

const deleteDialog = ref(false)
const newDialog = ref(false)

const selectedShoutout = ref<Shoutout | null>(null)
const newShoutout = ref<Shoutout | null>(null)

const openNewDialog = () => {
    newShoutout.value = {
        username: '',
        messages: [],
        enabled: true,
    }
    newDialog.value = true
}



const showDeleteDialog = (shoutout: Shoutout) => {
    selectedShoutout.value = shoutout
    deleteDialog.value = true
}

const editDialog = ref(false)

const editShoutout = (shoutout: Shoutout) => {
  // Copy the shoutout to avoid modifying the original object
  selectedShoutout.value = JSON.parse(JSON.stringify(shoutout))
    editDialog.value = true
}

const cancelEdit = () => {
    editDialog.value = false
    selectedShoutout.value = null
}

const cancelNew = () => {
    newDialog.value = false
    newShoutout.value = {
        username: '',
        messages: [],
        enabled: true,
    }
}

const updateShoutout = async () => {
    try {
        await axios.put(`${API_ENDPOINT}/channel/community/shoutouts/${selectedShoutout.value.user_id}`, {
            messages: selectedShoutout.value.messages,
            enabled: selectedShoutout.value.enabled,
        }, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        })
        editDialog.value = false
        await fetchShoutouts()
    } catch (error) {
        console.error(error)
    }
}

const createShoutout = async () => {
    try {
        await axios.post(`${API_ENDPOINT}/channel/community/shoutouts`, {
            target_streamer: newShoutout.value.username,
            messages: newShoutout.value.messages,
            enabled: true,
        }, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        })
        newDialog.value = false
        newShoutout.value = {
            username: '',
            messages: [],
            enabled: true,
        }
        await fetchShoutouts()
    } catch (error) {
        console.error(error)
    }
}

const deleteShoutout = async () => {
    try {
        await axios.delete(`${API_ENDPOINT}/channel/community/shoutouts/${selectedShoutout.value.user_id}`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        })
        await fetchShoutouts()
        deleteDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const addMessageToShoutout = () => {
    selectedShoutout.value.messages.push('')
}

const removeMessageFromShoutout = (index: number) => {
    selectedShoutout.value.messages.splice(index, 1)
}

definePageMeta({
    layout: 'dashboard',
    middleware: 'auth',
})

useHead({
    title: i18n.t('community.shoutouts'),
})

watch(searchForUser, async (value) => {
    if (value.length > 2) {
      if (loadingUsers.value) return
        try {
            loadingUsers.value = true
            const { data } = await PetruquioSDK.searchUsers(searchForUser.value)
            usersResult.value = data.users
        } catch (error) {
            console.error(error)
        } finally {
            loadingUsers.value = false
        }
    }
})

const breadcrum = [
  {
    label: i18n.t('dashboard'),
    to: '/dashboard',
  },
  {
    label: i18n.t('community.shoutouts'),
    to: '/dashboard/community/shoutouts',
  },
];

const filteredShoutouts = computed(() => {
    if (!search.value) return shoutouts.value

    return shoutouts.value.filter((user) => {
        return user.display_name.toLowerCase().includes(search.value.toLowerCase())
    })
})

const displayedShoutouts = computed(() => {
    return filteredShoutouts.value.slice((currentShoutoutsPage.value - 1) * 10, currentShoutoutsPage.value * 10)
})

const fetchShoutouts = async () => {
    try {
        const { data } = await axios.get(`${API_ENDPOINT}/channel/community/shoutouts`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            },
        })
        shoutouts.value = data.data.shoutouts
    } catch (error) {
        console.error(error)
    }
}

onMounted(async () => {
    await fetchShoutouts()
})
</script>