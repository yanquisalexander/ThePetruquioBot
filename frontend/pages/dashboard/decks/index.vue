<template>
  <div class="mx-auto md:px-4">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <div class="pb-4">
        <h2 class="text-2xl font-medium font-jost mb-4">
          {{ $t('dashboard.decks') }}
        </h2>
      </div>
      <UBreadcrumb :links="breadcrum" class="mt-2 mx-auto">
        <template #default="{ link, isActive, index }">
          <NuxtLink :to="link.to" class="text-sm font-medium text-gray-500 hover:text-gray-700">
            {{ link.label }}
          </NuxtLink>
        </template>
      </UBreadcrumb>
    </div>

    <UContainer v-if="!decks && loading">
      <UProgress animation="carousel" />
    </UContainer>

    <UContainer v-else-if="decks">
      <div class="flex py-3.5 w-full">
        <UInput v-model="search" :placeholder="$t('decks.search')" size="lg"
          leading-icon="i-heroicons-magnifying-glass-20-solid" />
        <div class="flex-grow"></div>
        <UButton @click="showCreateDeckModal = true">
          {{ $t('dashboard.create_deck') }}
        </UButton>
      </div>
      <template v-if="decks.length === 0">
        <div class="flex flex-col items-center justify-center">
          <UIcon name="i-mdi-cards-outline" class="w-16 h-16 text-gray-400" />
          <h3 class="text-gray-400 text-lg mt-4">
            {{ $t('dashboard.no_decks') }}
          </h3>
          <p class="text-gray-400 text-lg mt-4">
            {{ $t('dashboard.no_decks_description') }}
          </p>
        </div>
      </template>
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <template v-for="(deck, index) in decks" :key="index">
            <NuxtLink :to="`/dashboard/decks/${deck.deck_id}`">
              <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
                <div class="flex flex-col gap-2">
                  <h3 class="text-lg font-medium font-jost">
                    {{ deck.name }}
                  </h3>
                  <div class="flex gap-2">
                    <UIcon name="i-mdi-view-grid-outline" class="w-4 h-4 text-gray-400" />
                    <span class="text-gray-400">
                      {{ deck.rows }}x{{ deck.cols }}
                    </span>
                  </div>
                </div>
              </UCard>
            </NuxtLink>
          </template>
        </div>
      </template>
    </UContainer>
    <UModal v-model="showCreateDeckModal">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-lg font-medium font-jost">
            {{ $t('dashboard.create_deck') }}
          </h3>
        </template>
        <div class="flex flex-col gap-4">
          <UInput v-model="newDeck.name" :placeholder="$t('dashboard.deck_name')" />
          <div class="flex gap-4">
            <UInput v-model="newDeck.rows" :placeholder="$t('dashboard.rows')" />
            <UInput v-model="newDeck.cols" :placeholder="$t('dashboard.cols')" />
          </div>
        </div>
        <template #footer>
          <div class="flex gap-2">
            <UButton @click="showCreateDeckModal = false">
              {{ $t('dashboard.cancel') }}
            </UButton>
            <UButton @click="createDeck" :loading="creatingDeck">
              {{ $t('dashboard.create') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script lang="ts" setup>

const breadcrum = ref([{
  label: 'Dashboard',
  icon: 'i-mdi-view-dashboard-outline',
  to: '/dashboard',
},
{
  label: 'Decks',
  icon: 'i-mdi-view-grid-plus-outline',
}])

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Decks',
})


const currentUser = useCurrentUser()

const loading = ref(false)
const showCreateDeckModal = ref(false)
const creatingDeck = ref(false)

const newDeck = reactive({
  name: '',
  rows: 3,
  cols: 6,
})

const search = ref('')

const decks: Ref<any[] | null> = ref(null)

const fetchDecks = async () => {
  loading.value = true
  try {
    const { data } = await useFetch(`${API_ENDPOINT}/decks`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    })
    decks.value = data.value.data.decks
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const createDeck = async () => {
  creatingDeck.value = true
  try {
    const { data } = await useFetch(`${API_ENDPOINT}/decks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      },
      body: {
        name: newDeck.name,
        rows: newDeck.rows,
        cols: newDeck.cols,
      }
    })
    fetchDecks()
    showCreateDeckModal.value = false
  } catch (error) {
    console.error(error)
  } finally {
    creatingDeck.value = false
  }
}

fetchDecks()

</script>
