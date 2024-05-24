<template>
  <div>
    <div v-if="currentUser.isLoggedIn()">
      <!-- Button for current user menu (Dropdown) -->
      <UPopover :popper="{ placement: 'bottom-start', arrow: false }">
        <UButton class="flex items-center" variant="soft" color="twitch">
          <UAvatar :src="currentUser.getAvatar()" :alt="currentUser.getDisplayName()" />
          <span class="hidden md:block ml-2">{{ currentUser.getDisplayName() }}</span>
        </UButton>

        <template #panel>
          <ul class="px-1 py-2 w-48">
            <template v-for="(link, index) in LINKS" :key="index">
              <li v-if="link.type === 'link'"
                class="flex px-4 py-2 hover:bg-gray-100 text-black rounded-md transition-colors duration-200 dark:hover:bg-gray-800 dark:text-white">
                <nuxt-link :to="link.href" class="font-gabarito w-full">
                  {{ link.name }}
                </nuxt-link>
              </li>
              <li v-else
                class="flex px-4 py-2 hover:bg-gray-100 text-black rounded-md transition-colors duration-200 dark:hover:bg-gray-800 dark:text-white cursor-pointer"
                @click="link.callback">
                <span class="font-gabarito w-full">
                  {{ link.name }}
                </span>
              </li>
            </template>
            <UDivider v-if="currentUser.isAdmin()" label="Admin actions" />
            <div class="py-2" v-if="currentUser.isAdmin()">
              <li class="flex px-4 py-2 hover:bg-gray-100 text-black rounded-md transition-colors duration-200">
                <nuxt-link to="/admin" class="font-gabarito w-full">
                  Admin panel
                </nuxt-link>
              </li>
              <UButton v-if="currentUser.isImpersonating()" color="red" block variant="soft"
                @click="currentUser.stopImpersonating()">
                Stop impersonating
              </UButton>
            </div>
          </ul>
        </template>
      </UPopover>
    </div>

    <div v-else>
      <!-- Button for login -->
      <UButton @click="login" size="lg" variant="soft" color="twitch" icon="i-fa6-brands-twitch" :loading="loadingAuth">
        <span>
          Login <span class="hidden md:inline">with Twitch</span>
        </span>
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { signIn, signOut } = useAuth()
const currentUser = useCurrentUser()
const loadingAuth = ref(false)

const login = async () => {
  loadingAuth.value = true
  await signIn('twitch')
  loadingAuth.value = false
}

const LINKS = ref([
  { name: 'Dashboard', href: '/dashboard', type: 'link' },
  { name: 'Settings', href: '/dashboard/settings', type: 'link' },
  { name: 'Logout', callback: () => signOut({ callbackUrl: '/' }), type: 'button' }
])
</script>
