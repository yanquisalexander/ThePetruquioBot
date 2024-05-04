<template>
  <aside
    class="pointer-events-none fixed start-0 top-0 !z-[15] flex h-full xl:z-10 transition-transform duration-300"
    :class="{ 'translate-x-0': sidebar.sidebarVisible, '-translate-x-full': !sidebar.sidebarVisible }"
  >
    <div
      class="border-muted-200 pointer-events-auto relative z-10 h-full w-[280px] border-r bg-white transition-all duration-300"
    >
      <div class="flex h-screen flex-col">
        <div class="relative h-full w-full overflow-y-auto">
          <div
            class="cursor-pointer mx-2 mt-4 bg-gray-100 py-2 mb-4 px-4 border border-gray-300"
            @click="moderationNotAvailable"
          >
            <div class="flex items-center">
              <img
                :src="currentUser.getAvatar()"
                class="flex-wrap h-8 w-8 rounded-full"
              >
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
                  <li
                    v-if="route.enabled"
                    class="mb-2"
                  >
                    <NuxtLink
                      :to="route.to"
                      class="w-full px-2 py-2.5 rounded-md flex items-center gap-6 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ease-in-out"
                      active-class="bg-blue-50 !text-blue-500"
                    >
                      <div class="w-10 text-2xl flex items-center justify-center">
                        <UIcon :name="route.icon" />
                      </div>
                      <span class="text-sm font-jost">{{ route.label }}</span>
                      <span
                        v-if="route.newFeature"
                        class="bg-blue-500 text-white text-xs rounded-full px-2 py-1 flex items-center uppercase"
                      >
                        <UIcon
                          name="i-mdi-stars-outline"
                          class="w-4 h-4 inline-block mr-1"
                        /> Nuevo
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
                    <NuxtLink
                      :to="route.to"
                      class="w-full px-2 py-2.5 rounded-md flex items-center gap-6 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ease-in-out"
                      active-class="bg-blue-50 !text-blue-500"
                    >
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
  </aside>
</template>

<script lang="ts" setup>
const currentUser = useCurrentUser()
const sidebar = useSidebar()
const toast = useToast()

import axios from "axios";


const menuCategories = ref([
  {
    name: 'Principal',
    routes: [
      {
        label: 'Dashboard',
        icon: 'i-ph-grid-four',
        to: '/dashboard',
        enabled: true
      },
      {
        label: 'Comandos',
        icon: 'i-ph-chats',
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
        label: 'Widgets',
        icon: 'i-ph-swatches',
        to: '/dashboard/widgets',
        enabled: process.env.NODE_ENV === 'development',
        newFeature: true
      },
      {
        label: 'Configuración del Bot',
        icon: 'i-ph-gear',
        to: '/dashboard/preferences',
        enabled: true,
      },
      {
        label: 'Workflows',
        icon: 'i-ph-brackets-curly',
        to: '/dashboard/workflows',
        enabled: true,
        newFeature: true
      },
      {
        label: 'Community',
        icon: 'i-ph-circles-three',
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
        icon: 'i-ph-shield-check',
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
const moderationNotAvailable = () => {
  toast.add({
    title: 'Función no disponible',
    description: 'La moderación de otros canales no está disponible en este momento.',
    icon: 'i-heroicons-information-circle-20-solid',
    color: 'orange'
  })
}

const getModeratedChannels = async () => {
  const { data } = await axios.get(`${API_ENDPOINT}/moderated-channels`, {
    headers: {
      Authorization: `Bearer ${currentUser.getToken()}`
    }
  })
  console.log(data)
  return data
}

onMounted(async () => {
  await getModeratedChannels()
})
</script>

