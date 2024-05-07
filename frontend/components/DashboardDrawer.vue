<template>
  <aside class="pointer-events-none fixed start-0 top-0 !z-[15] flex h-full xl:z-10 transition-transform duration-300"
    :class="{ 'translate-x-0': sidebar.sidebarVisible, '-translate-x-full': !sidebar.sidebarVisible }">
    <div
      class="border-muted-200 pointer-events-auto relative z-10 h-full w-[280px] border-r bg-white transition-all duration-300">
      <div class="flex h-screen flex-col">
        <div class="relative h-full w-full overflow-y-auto">
          <div class="cursor-pointer mx-2 mt-4 bg-gray-100 py-2 mb-4 px-4 border border-gray-300"
            @click="showModeratorAccountChooser = true">
            <div class="flex items-center">
              <img :src="currentUser.getAvatar()" class="flex-wrap h-8 w-8 rounded-full">
              <div class="ml-2">
                <p class="text-gray-500 text-xs">
                  Moderando
                </p>
                <p class="text-gray-700 text-sm">
                  {{ currentUser.getDisplayName() }}
                </p>
              </div>
            </div>
          </div>
          <div class="px-2 pb-8">
            <template v-for="c in menuCategories">
              <h3 class="text-xs text-gray-400 font-thin mb-2">
                {{ c.name }}
              </h3>
              <ul class="mb-8">
                <template v-for="route in c.routes">
                  <li v-if="route.enabled" class="mb-2">
                    <NuxtLink :to="route.to"
                      class="w-full px-2 py-2.5 rounded-md flex items-center gap-6 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ease-in-out"
                      active-class="bg-blue-50 !text-blue-500">
                      <div class="w-10 text-2xl flex items-center justify-center">
                        <UIcon :name="route.icon" />
                      </div>
                      <span class="text-sm font-jost">{{ route.label }}</span>
                      <span v-if="route.newFeature"
                        class="bg-blue-500 text-white text-xs rounded-full px-2 py-1 flex items-center uppercase">
                        <UIcon name="i-mdi-stars-outline" class="w-4 h-4 inline-block mr-1" /> Nuevo
                      </span>
                    </NuxtLink>
                  </li>
                </template>
              </ul>
            </template>
            <template v-if="currentUser.isAdmin()">
              <h3 class="text-xs text-gray-400 font-thin mb-2">
                Administración
              </h3>
              <ul class="mb-8">
                <template v-for="route in adminRoutes">
                  <li class="mb-2">
                    <NuxtLink :to="route.to"
                      class="w-full px-2 py-2.5 rounded-md flex items-center gap-6 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ease-in-out"
                      active-class="bg-blue-50 !text-blue-500">
                      <div class="w-10 text-2xl flex items-center justify-center">
                        <UIcon :name="route.icon" />
                      </div>
                      <span class="text-sm font-jost">{{ route.label }}</span>
                    </NuxtLink>
                  </li>
                </template>
              </ul>
            </template>
          </div>
        </div>
      </div>
    </div>
    <DashboardModeratorAccountChooser :moderatedChannels="moderatedChannels" @chooseAccount="chooseAccount"
      v-model="showModeratorAccountChooser" />
  </aside>
</template>

<script lang="ts" setup>
const { getSession } = useAuth()
const currentUser = useCurrentUser()
const sidebar = useSidebar()
const toast = useToast()
const moderatedChannels = ref([])
const showModeratorAccountChooser = ref(false)

import axios from "axios";


const menuCategories = ref([
  {
    name: 'Principal',
    routes: [
      {
        label: 'Dashboard',
        icon: 'i-lucide-layout-panel-top',
        to: '/dashboard',
        enabled: true
      },
      {
        icon: 'i-lucide-clapperboard',
        label: 'Stream Manager',
        to: '/dashboard/stream-manager',
        enabled: process.env.NODE_ENV === 'development',
        newFeature: true
      },
      {
        label: 'Comandos',
        icon: 'i-lucide-bot-message-square',
        to: '/dashboard/commands',
        enabled: true
      },
      {
        label: 'Decks',
        icon: 'i-mdi-view-grid-plus-outline',
        to: '/dashboard/decks',
        enabled: false
      },
      {
        label: 'Timers',
        icon: 'i-mdi-clock-fast',
        to: '/dashboard/timers',
        enabled: false
      },
      {
        label: 'Custom Widgets',
        icon: 'i-lucide-package-open',
        to: '/dashboard/custom-widgets',
        enabled: true,
        newFeature: true
      },
      {
        label: 'Configuración del Bot',
        icon: 'i-lucide-settings-2',
        to: '/dashboard/preferences',
        enabled: true,
      },
      {
        label: 'Workflows',
        icon: 'i-lucide-git-branch',
        to: '/dashboard/workflows',
        enabled: true,
      },
      {
        label: 'Community',
        icon: 'i-lucide-users-round',
        to: '/dashboard/community',
        enabled: currentUser.rawUser()?.admin
      }
    ]
  },
  {
    name: 'Moderación',
    routes: [
      {
        label: 'Auditoría',
        icon: 'i-lucide-shield-check',
        to: '/dashboard/audit',
        enabled: true
      }
    ]
  }
])

const adminRoutes = ref([
  {
    label: 'Panel de Control',
    icon: 'i-ph-wrench',
    to: '/dashboard/admin'
  },
  {
    label: 'Consola',
    icon: 'i-ph-terminal',
    to: '/dashboard/admin/console'
  },
  {
    label: 'Usuarios',
    icon: 'i-ph-users',
    to: '/dashboard/admin/users'
  }
])

const chooseAccount = async (channelId: string) => {
  console.log('Channel ID:', channelId)
  try {
    await axios.post(`${API_ENDPOINT}/dashboard/moderate/${channelId}`, {}, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    })
    toast.add({
      icon: 'i-lucide-shield-check',
      title: 'Cuenta de moderador seleccionada',
      description: `Ahora estás moderando el canal de ${moderatedChannels.value.find(c => c.id === channelId)?.displayName}`,
      color: 'green',
      timeout: 5000
    })
    await getSession()
    showModeratorAccountChooser.value = false

  } catch (error) {
    toast.add({
      title: 'Error al seleccionar cuenta de moderador',
      description: (error as Error).message,
      color: 'red',
      timeout: 5000
    })
  }
}

const getModeratedChannels = async () => {
  const { data } = await axios.get(`${API_ENDPOINT}/dashboard/moderated-channels`, {
    headers: {
      Authorization: `Bearer ${currentUser.getToken()}`
    }
  })
  return data.data
}

onMounted(async () => {
  moderatedChannels.value = await getModeratedChannels()
})
</script>
