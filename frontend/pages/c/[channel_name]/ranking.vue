<template>
  <div class="ranking">
    <!-- titulo sin tabs -->
    <header class="flex flex-col items-center my-8 font-outfit">
      <h2 class="text-2xl font-bold">
        Ranking del canal
      </h2> 
      <p class="text-sm text-zinc-500">
        Canjes realizados en total: {{ ranking.map((item) => parseInt(item.redemption_count)).reduce((a, b) => a + b, 0) }}
      </p>
    </header>
    <div
      v-if="ranking.length > 0 && !loadingRanking"
      class="max-w-5xl mx-auto mb-16 flex flex-col md:flex-row mt-4 space-y-4 md:space-y-0 md:space-x-16 justify-between"
    >
      <!-- Podio -->
      <ChannelRankingPodium
        :data="podium"
      />

      <ul class="mt-4 space-y-4 w-full md:w-1/2 flex flex-col items-center">
        <li
          v-for="(item, index) in limitedRanking.slice(3) "
          :key="item.user_id"
          class="w-full"
        >
          <ChannelRankingUser
            :index="index"
            :data="
              item"
          />
        </li>
      </ul>
    </div>
    <div
      v-else-if="loadingRanking"
      class="max-w-lg mx-auto"
    >
      <!-- Show 5 skeletons -->
      <template v-for=" i in 5 ">
        <v-skeleton-loader type="list-item-avatar" />
      </template>
    </div>
  </div>
</template>
  
<script setup lang="ts">
const loadingRanking = ref(false)

const tab = ref(0)


definePageMeta({
  layout: 'channel-overview',
})
const route = useRoute()
const { data: user } = useAuth()


const channelName = ref<string>(route.params.channel_name)



const ranking = ref([])
const historicalRedemptions = ref([])
const podium = ref([])

const selectedMonth = ref(0)
const selectedYear = ref(0)

const months = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 },
]

// Asumiendo que el rango de años permitido es desde 2020 hasta el año actual
const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 2019 }, (_, index) => currentYear - index)

const getRanking = async () => {
  try {
    loadingRanking.value = true
    const { data } = await useFetch(`${API_ENDPOINT}/rankings/${channelName.value}`)
    ranking.value = data.value.data.redemptions
    historicalRedemptions.value = data.value.data.historical
    loadingRanking.value = false
    sortRanking()
  } catch (error) {
    console.error(error)
    loadingRanking.value = false
  }
}


const filterRanking = async () => {
  // Dependiendo de la pestaña seleccionada, filtra los datos correspondientes
  if (tab.value === 0) {
    await getRanking()
  } else if (tab.value === 1) {
    // Filtrar los datos para "Este año"
    const currentYear = new Date().getFullYear();

    ranking.value = historicalRedemptions.value.filter((item) => {
      const redemptionDate = new Date(item.redemption_date);
      const redemptionYear = redemptionDate.getFullYear();

      return redemptionYear === currentYear;
    });
  } else {
    // No se aplica ningún filtro para "Siempre"
    ranking.value = historicalRedemptions.value;
  }

  // Vuelve a ordenar el ranking después de aplicar el filtro
  sortRanking();
};

watch(tab, () => {
  filterRanking();
});


onBeforeMount(() => {
  filterRanking();
});

const sortRanking = () => {
  const sortedRanking = ranking.value.sort((a, b) => {
    return b.count - a.count
  })

  podium.value = sortedRanking.slice(0, 3)

  return sortedRanking
}

const limitedRanking = computed(() => {
  return ranking.value.slice(0, 10)
})


</script>
  
