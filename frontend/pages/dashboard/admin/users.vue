<template>
  <div class="mx-auto md:px-4 mb-16">
    <UAlert
      color="violet"
      icon="i-mdi-wrench-outline"
      variant="subtle"
      title="¡Cudado con lo que haces!"
    >
      <template #description>
        <p>
          Como administrador, puedes visualizar los datos de los usuarios, así como tomar acciones en su
          nombre.<br>
          Te recomendamos que tengas cuidado con lo que haces, ya que podrías causar daños irreparables.
        </p>
      </template>
    </UAlert>
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        {{ $t('admin.users.title') }}
      </h2>
    </div>
    <UBreadcrumb
      :links="breadcrum"
      class="mt-2 mx-auto"
    >
      <template #default="{ link, isActive, index }">
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
      v-if="users"
      class="mt-2 bg-white rounded-md pt-4 px-4 w-full"
    >
      <UTable
        :rows="displayedUsers"
        :columns="[
          { label: 'ID', key: 'twitchId' },
          { label: 'Nombre', key: 'displayName' },
          { label: 'Email', key: 'email' },
          { label: 'Acciones', key: 'actions', sortable: false },
        ]"
      >
        <template #email-data="{ row }">
          <div class="flex items-center space-x-2">
            <div class="flex-grow">
              <span v-if="row.showEmail">{{ row.email || 'No establecido' }}</span>
              <span v-else>**********</span>
            </div>
            <UButton
              size="xs"
              variant="soft"
              color="green"
              @click="toggleEmailVisibility(row)"
            >
              {{ row.showEmail ? 'Ocultar' : 'Mostrar' }}
            </UButton>
          </div>
        </template>
        <template #actions-data="{ row }">
          <div class="flex space-x-2">
            <UTooltip
              text="Ver detalles"
              placement="top"
            >
              <UButton
                size="xs"
                variant="soft"
                color="primary"
                :to="`/dashboard/users/${row.twitchId}`"
                icon="i-mdi-eye-outline"
              >
                Ver detalles
              </UButton>
            </UTooltip>
            <UTooltip
              text="Eliminar usuario"
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
            <UTooltip
              v-if="!row.admin"
              text="Impersonar usuario"
              placement="top"
            >
              <UButton
                v-if="!row.admin"
                size="xs"
                variant="soft"
                color="violet"
                icon="i-mdi-account-switch-outline"
                @click="showImpersonateDialog(row)"
              >
                Impersonar
              </UButton>
            </UTooltip>
            <UTooltip
              text="Actualizar Token"
              placement="top"
            >
              <UButton
                size="xs"
                variant="soft"
                color="orange"
                icon="i-mdi-refresh"
                @click="refreshToken(row)"
              >
                Actualizar Token
              </UButton>
            </UTooltip>
          </div>
        </template>
      </UTable>
      <div class="flex items-center justify-center mt-4">
        <UPagination
          v-model="currentUsersPage"
          :total="filteredUsers.length"
        />
      </div>
    </div>

    <UModal v-model="deleteDialog">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            {{ $t('dashboard.admin.delete_user') }}
          </div>
        </template>
        <p class="text-sm">
          {{ $t('dashboard.admin.delete_user_text', { username: selectedUser.displayName }) }}
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
              @click="deleteUser(selectedUser.twitchId)"
            >
              {{ $t('dashboard.admin.delete') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal v-model="impersonateDialog">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-h5">
            {{ $t('dashboard.admin.impersonate_user') }}
          </div>
        </template>
        <p class="text-sm">
          {{ $t('dashboard.admin.impersonate_user_text', { username: selectedUser.displayName }) }}
        </p>
        <template #footer>
          <div class="flex justify-end">
            <UButton
              variant="text"
              color="gray"
              @click="closeImpersonateDialog"
            >
              {{ $t('dashboard.admin.cancel') }}
            </UButton>
            <UButton
              color="primary"
              @click="impersonateUser(selectedUser.twitchId)"
            >
              {{ $t('dashboard.admin.impersonate') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
  
<script setup>
import axios from 'axios';
import { useI18n } from 'vue-i18n';
definePageMeta({
    middleware: 'auth',
    layout: 'dashboard',
    title: 'Admin',
    robots: 'noindex,nofollow'
})

const i18n = useI18n()

const currentUser = useCurrentUser()

const toast = useToast()

const users = ref(null)
const deleteDialog = ref(false)
const selectedUser = ref({})
const snackbar = ref(false)
const snackbarText = ref('')
const search = ref('')

const currentUsersPage = ref(1)

const breadcrum = [{
        label: 'Dashboard',
        icon: 'i-mdi-view-dashboard-outline',
        to: '/dashboard',
    },
    {
        label: 'Admin',
        icon: 'i-mdi-account-cog-outline',
        to: '/dashboard/admin',
    },
    {
        label: 'Usuarios',
        icon: 'i-mdi-account-multiple-outline',
        to: '/dashboard/admin/users',
    },
]

const filteredUsers = computed(() => {
    if (!search.value) return users.value

    return users.value.filter((user) => {
        return user.displayName.toLowerCase().includes(search.value.toLowerCase())
    })
})

const displayedUsers = computed(() => {
    return filteredUsers.value.slice((currentUsersPage.value - 1) * 10, currentUsersPage.value * 10)
})

const fetchUsers = async () => {
    const response = await axios.get(`${API_ENDPOINT}/admin/users`, {
        headers: {
            Authorization: `Bearer ${currentUser.getToken()}`,
        }
    })
    users.value = response.data.data.users.map(user => ({ ...user, showEmail: false }))
}

const showDeleteDialog = (user) => {
    selectedUser.value = user
    deleteDialog.value = true
}

const deleteUser = async (userId) => {
    try {
        const response = await axios.delete(`${API_ENDPOINT}/admin/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            }
        })
        // Remove the deleted user from the users list
        users.value = users.value.filter(user => user.twitchId !== userId)
        deleteDialog.value = false
        showSnackbar('Usuario eliminado correctamente')
    } catch (error) {
        console.error(error)
        // Handle error here
        deleteDialog.value = false
        showSnackbar('Error al eliminar el usuario')
    }
}

const showSnackbar = (text) => {
    snackbarText.value = text
    snackbar.value = true
}

const impersonateUser = async (userId) => {
    try {
        const response = await axios.post(`${API_ENDPOINT}/admin/users/${userId}/impersonate`, null, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            }
        })
        if (window.localStorage) {
            // Save the impersonated user token in the local storage
            window.localStorage.setItem('impersonated-user', response.data.token)
            window.location.href = '/dashboard'
        }
    } catch (error) {
        console.error(error)
        impersonateDialog.value = false
        toast.add({
            color: 'red',
            title: 'Error al impersonar el usuario',
            description: error.response.data.error,
        });
    }
}

const refreshToken = async (user) => {
    try {
        const response = await axios.post(`${API_ENDPOINT}/admin/users/${user.twitchId}/refresh-token`, null, {
            headers: {
                Authorization: `Bearer ${currentUser.getToken()}`,
            }
        })
        toast.add({
            color: 'green',
            title: 'Token actualizado',
            description: 'El token del usuario ha sido actualizado correctamente',
        });
    } catch (error) {
        console.error(error)
        toast.add({
            color: 'red',
            title: 'Error al actualizar el token',
            description: error.response.data.error,
        });
    }
}

const toggleEmailVisibility = (user) => {
    user.showEmail = !user.showEmail
}

const impersonateDialog = ref(false)

const showImpersonateDialog = (user) => {
    selectedUser.value = user
    impersonateDialog.value = true
}

const closeImpersonateDialog = () => {
    impersonateDialog.value = false
}

await fetchUsers()
</script>
  