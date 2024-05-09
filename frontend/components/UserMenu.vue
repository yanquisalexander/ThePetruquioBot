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
            <li class="flex px-4 py-2 hover:bg-gray-100 text-black rounded-md transition-colors duration-200">
              <nuxt-link to="/dashboard" class="font-gabarito w-full">
                Dashboard
              </nuxt-link>
            </li>
            <li class="flex px-4 py-2 hover:bg-gray-100 text-black rounded-md transition-colors duration-200">
              <nuxt-link to="/dashboard/settings" class="font-gabarito w-full">
                Settings
              </nuxt-link>
            </li>
            <li class="flex px-4 py-2 hover:bg-gray-100  text-black rounded-md transition-colors duration-200">
              <button class="font-gabarito" @click="signOut({ callbackUrl: '/' })">
                Logout
              </button>
            </li>
            <UDivider v-if="currentUser.isAdmin()" label="Admin actions" />
            <div class="py-2">
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
      <button class="btn btn-primary text-white inline-flex items-center" @click="login">
        Login
      </button>
    </div>
  </div>
</template>


<script lang="ts" setup>
const { signIn, signOut } = useAuth()
const currentUser = useCurrentUser()



const login = async () => {
  await signIn('twitch')
}
</script>