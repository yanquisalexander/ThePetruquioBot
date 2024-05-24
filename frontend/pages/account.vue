<template>
  <div class="container mx-auto max-w-full">
    <div class="px-6 py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-poppins mb-4">
        Mi Cuenta
      </h2>
    </div>
    <div class="mt-2 bg-white rounded-md pt-4 px-4 w-full mb-8">
      <div class="flex usercard">
        <img :src="user.avatar" class="rounded-full h-24 w-24">
        <div class="ml-4 flex flex-col justify-center items-left">
          <h3 class="text-lg font-medium">
            {{ user.display_name || user.email }}
          </h3>
          <p class="text-gray-500 text-ellipsis whitespace-nowrap">
            {{ user.email }}
          </p>
        </div>
      </div>
    </div>

    <!--RouterView /-->

    <UContainer v-if="accountData" class="my-8">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-lg font-medium flex items-center">
            Seguridad
            <UIcon name="i-mdi-lock-outline" class="ml-2" />
          </div>
        </template>
        <UAlert color="red" variant="subtle" class="mt-4 mb-4" title="¡Atención!" icon="i-mdi-alert-outline">
          <template #description>
            <p>
              El token de acceso personal es una clave privada que te permite acceder a la API de Petruquio.LIVE, y
              realizar
              acciones en tu nombre.<br><br>
              <strong>¡No compartas este token con nadie!</strong>
            </p>
          </template>
        </UAlert>
        <UFormGroup label="Token de Acceso Personal">
          <div class="flex items-center w-full">
            <UInput v-model="accountData.security.api_token" :type="showApiToken ? 'text' : 'password'" size="lg"
              class="flex-grow" readonly />
            <div class="flex items-center">
              <UButton color="gray" variant="ghost" :icon="showApiToken ? 'i-mdi-eye-off-outline' : 'i-mdi-eye-outline'"
                @click="toggleApiToken" />
              <UButton color="primary" variant="soft" icon class="ml-2" @click="copyToken">
                <UIcon name="i-mdi-content-copy" />
                Copiar
              </UButton>
            </div>
          </div>
          <div class="mt-2 flex justify-end">
            <UButton color="orange" variant="soft" icon class="ml-2" @click="regenerateTokenModal = true">
              <UIcon name="i-mdi-refresh" />
              Regenerar
            </UButton>
          </div>
        </UFormGroup>
      </UCard>
      <div class="my-4" />
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-lg font-medium flex items-center">
            Cuentas vinculadas
            <UIcon name="i-mdi-link-variant" class="ml-2" />
          </div>
        </template>

        <div id="connected-accounts" class="mt-6 mb-12">
          <div class="mx-4">
            <template v-for="provider in providers" :key="provider">
              <!-- Variable to check if the provider is linked -->
              <div v-if="isProviderLinked(provider)">
                <!-- Loop for linked accounts -->
                <div v-for="account in user.linkedAccounts" :key="account.provider">
                  <div v-if="account.provider === provider"
                    class="py-4 border-b-2 border-gray-100 last-of-type:border-0">
                    <div class="flex items-center">
                      <UIcon :name="getLogoUrl(provider).icon" class="text-2xl"
                        :style="{ color: getLogoUrl(provider).color }" />


                      <div class="ml-4 flex flex-col justify-center items-left">
                        <h3 class="text-lg font-medium">
                          {{ getProvider(provider) }}
                        </h3>
                        <p class="text-gray-500 text-ellipsis whitespace-nowrap">
                          {{ account.account_id }}
                        </p>
                      </div>
                    </div>
                    <div class="flex justify-end">
                      <!-- Botón "Desvincular" -->
                      <button class="btn btn-secondary" @click="unlinkAccount(provider)">
                        <span class="text-sm font-medium text-gray-500">
                          Desvincular
                        </span>
                      </button>
                    </div>
                    <UAlert v-if="provider === 'patreon'" color="orange" variant="subtle" class="ml-4"
                      title="Tu cuenta de Patreon está vinculada" icon="i-mdi-star-outline">
                      <template #description>
                        <p>
                          Si eres un patrocinador de Petruquio.LIVE,
                          tendrás acceso a funciones exclusivas y anticipadas.
                        </p>
                      </template>
                    </UAlert>
                  </div>
                </div>
              </div>
              <!-- Display "Vincular" button if the provider is not linked -->
              <div v-else>
                <div class="py-4 border-b-2 border-gray-100 last-of-type:border-0">
                  <div class="flex items-center">
                    <font-awesome-icon :icon="['fa-brands', getLogoUrl(provider).icon]"
                      :style="{ color: getLogoUrl(provider).color }" class="text-2xl" />

                    <div class="ml-4 flex flex-col justify-center items-left">
                      <h3 class="text-lg font-medium">
                        {{ getProvider(provider) }}
                      </h3>
                      <p class="text-gray-500 text-ellipsis whitespace-nowrap">
                        No vinculado
                      </p>
                    </div>
                  </div>
                  <div class="flex justify-end">
                    <!-- Botón "Vincular" -->
                    <button class="btn btn-secondary" @click="linkAccount(provider)">
                      <span class="text-sm font-medium text-gray-500">
                        Vincular
                      </span>
                    </button>
                  </div>
                  <UAlert v-if="provider === 'patreon'" color="blue" variant="subtle" class="ml-4"
                    title="¿Sabías que...?" icon="i-mdi-information-outline">
                    <template #description>
                      <p>
                        Vinculando tu cuenta de Patreon puedes acceder a características exclusivas de Petruquio.LIVE
                      </p>
                    </template>
                  </UAlert>
                </div>
              </div>
            </template>
          </div>
        </div>
      </UCard>
    </UContainer>
    <div v-else-if="!accountData">
      <div class="flex justify-center items-center h-64">
        <UIcon name="i-mdi-loading" class="animate-spin text-4xl" />
      </div>
    </div>

    <UModal v-model="regenerateTokenModal">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="text-lg font-medium flex items-center">
            ¿Estás seguro?
          </div>
        </template>
        Regenerar el token de acceso personal es una acción irreversible.
        Si regeneras el token, las integraciones que lo estén utilizando dejarán de funcionar.
        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" variant="ghost" icon leading-icon="i-mdi-close" @click="regenerateTokenModal = false">
              Cancelar
            </UButton>
            <UButton color="primary" variant="soft" icon leading-icon="i-mdi-check" @click="regenerateToken">
              Regenerar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>


<script setup>
import axios from 'axios';
const currentUser = useCurrentUser()
const toast = useToast()
const route = useRoute()
const callbackRes = ref([])

const accountData = ref(null)
const regenerateTokenModal = ref(false)

const user = currentUser.rawUser()

const showApiToken = ref(false)

const copyToken = () => {
  navigator.clipboard.writeText(accountData.value.security.api_token)
  toast.add({
    title: '¡Copiado!',
    description: 'El token de acceso personal se ha copiado correctamente.',
    color: 'green',
    icon: 'i-mdi-check',
  })
}

const toggleApiToken = () => {
  showApiToken.value = !showApiToken.value
}

callbackRes.value = route.query

useHead({
  title: 'Mi Cuenta',
})
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const clearBanner = () => {
  callbackRes.value = null
  route.query = ''
  navigateTo('/account', {
    replace: true,
  })
}



const getLogoUrl = (provider) => {
  if (!provider) return null
  switch (provider) {
    case 'discord':
      return {
        icon: 'i-fa6-brands-discord',
        color: '#7289da',
      }
    case 'spotify':
      return {
        icon: 'i-fa6-brands-spotify',
        color: '#1db954',
      }
    case 'patreon':
      return {
        icon: 'i-fa6-brands-patreon',
        color: '#f96854',
      }
    default:
      return null
  }
}

const providers = ref([
  'discord',
  'spotify',
  'patreon'
])

const isProviderLinked = (provider) => {
  return user.linkedAccounts.some(account => account.provider === provider);
};




const getProvider = (provider) => {
  if (!provider) return null
  return provider?.charAt(0).toUpperCase() + provider.slice(1)
}

const linkAccount = async (provider) => {
  const response = await axios.get(`${API_ENDPOINT}/external-accounts/${provider}/link`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  })
  navigateTo(response.data.redirectUrl, {
    external: true,
  })
}

const unlinkAccount = async (provider) => {
  if (confirm(`¿Estás seguro que quieres desvincular tu cuenta de ${getProvider(provider)}?`)) {
    await axios.post(`${API_ENDPOINT}/external-accounts/${provider}/unlink`, {}, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
    toast.add({
      color: 'green',
      title: '¡Listo!',
      description: `Tu cuenta de ${getProvider(provider)} se ha desvinculado correctamente.`,
      icon: 'i-mdi-check',
    });
    window.location.reload()
  }

}

const fetchAccount = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/account`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    })
    accountData.value = response.data
  } catch (error) {
    console.log(error)
    toast.add({
      color: 'red',
      title: 'Error fetching account data',
      description: error.message,
    });
  }
}

const regenerateToken = async () => {
  try {
    const response = await axios.post(`${API_ENDPOINT}/account/generate-api-token`, {}, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    })
    regenerateTokenModal.value = false
    toast.add({
      color: 'green',
      title: '¡Listo!',
      description: 'El token de acceso personal se ha regenerado correctamente.',
      icon: 'i-mdi-check',
    });
    accountData.value = null
    await fetchAccount()
  } catch (error) {
    console.log(error)
    toast.add({
      color: 'red',
      title: 'Error regenerating token',
      description: error.message,
    });
  }
}

onMounted(() => {
  fetchAccount()
})
</script>