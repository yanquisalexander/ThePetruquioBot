<template>
  <header :class="scrolled ? 'bg-white shadow-md' : ''"
    class="z-[10] sticky top-0 flex items-center justify-between px-5 py-4 transition-all duration-300 mx-0 mt-0 md:px-10 bg-white border-b">
    <div class="flex-shrink-0 flex items-center">
      <nuxt-link class="items-center" to="/">
        <SiteLogo />
      </nuxt-link>
    </div>
    <div class="flex-shrink hidden md:flex">
      <template v-for="(link, index) in menuLinks" :key="index">
        <nuxt-link :to="link.href"
          :class="`px-4 py-2 rounded-md hover:bg-blue-500 hover:bg-opacity-25 transition-all mx-1`">
          {{ link.name }}
        </nuxt-link>
      </template>
    </div>

    <UserMenu />
  </header>
</template>

<script lang="ts" setup>
const scrolled = ref(false)
const menuLinks = ref([
  {
    name: "Stats",
    href: "/stats"
  },
  {
    name: "Support",
    href: "/support"
  },
  {
    name: "Changelog",
    href: "/changelog"
  },
  {
    name: "Donate",
    href: "/donate"
  }
])

const handleScrolled = () => {
  if (!process.client) return
  scrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScrolled)
})

</script>
