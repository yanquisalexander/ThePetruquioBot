<template>
  <div id="_petruquio">
    <div id="emotesplash" v-if="emoteSheet" ref="emoteSplash"
      class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center z-[1001]">
      <span :style="`
            background-image: url(${emoteSheet.data.emoteSheet});
            `" class="b-intro__emote b-intro__emote-anim b-intro__emote-changer"></span>
      <span class="mt-52 animate-fade-up animate-delay-[100ms]">
        <h1 class="flex text-white items-center justify-center flex-col animation-pulse">
          <span class="text-xl">
            {{ getSplashMessage() }}
          </span>
          <a :href="`https://twitch.tv/${channelName}`" target="_blank">
            <span class="text-purple-300">twitch.tv/{{ channelName }}</span>
          </a>

        </h1>
      </span>
    </div>
    <main class="animate-fade animate-duration-300" v-if="!showingSplash">
      <header
        :class="`flex items-center sticky top-0 w-full z-[900] py-2 px-6 shadow-sm h-12 ${getColorAndMessage().color}`">
        <NuxtLink :to="`/c/${channelName}`" class="flex items-center">
          <TwitchIcon color="white" class="w-8 h-8 mr-2" /> <span class="text-white font-medium">
            / {{ channelName }}
          </span>
        </NuxtLink>
        <div class="flex-1"></div>
        <div class="flex items-center">

          <ul class="flex items-center">
            <template v-for="(item, index) in headerItems" :key="index">
              <li class="mx-2">
                <v-btn :to="item.to" variant="text" class="font-jost" @click="buttonClick">
                  <v-icon color="white" class="mr-1">{{ item.icon }}</v-icon>
                  <span class="hidden lg:inline text-sm text-white">{{ item.text }}</span>
                </v-btn>
              </li>
            </template>
          </ul>
        </div>
      </header>
      <slot />
    </main>
  </div>
</template>
  
<script setup lang="ts">
import SoundManager, { Sounds } from '@/utils/SoundManager';
import { TwitchIcon } from 'lucide-vue-next';

const { data: userData, signIn } = useAuth()
let user = userData.value?.user

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const emoteSplash = ref();

const showingSplash = ref(true)

const channelName = ref(route.params.channel_name).value

if (!channelName) {
  router.push('/')
}

const headerItems = ref([
  {
    to: `/c/${channelName}/map`,
    text: 'Mapa',
    icon: 'mdi-map-marker',
  },
  {
    to: `/c/${channelName}/ranking`,
    text: 'Ranking',
    icon: 'mdi-trophy-variant',
  },
])

const soundManager = SoundManager.getInstance();

const buttonClick = () => {
  soundManager.playSound(Sounds.BUTTON_CLICK);
}

const { data: emoteSheet } = await useFetch(`${API_ENDPOINT}/worldmap/${channelName}/splash.json`)

onMounted(() => {
  if (process.client) {
    setTimeout(async () => {
      try {
        emoteSplash.value.classList.add('removing');
        setTimeout(() => {
          showingSplash.value = false
          emoteSplash.value.remove();
        }, 1000);
      } catch (error) {
        console.log(error)
      }
    }, 2000)
  }
})

const getSplashMessage = () => {
  const path = route.fullPath.split('/').pop()
  switch (path) {
    case 'map':
      return 'Loading Community Map...'
    case 'ranking':
      return 'Loading Ranking...'
    case 'books':
      return 'Loading Community Books...'
    default:
      return `Loading...`
  }
}

const getColorAndMessage = () => {
  const path = route.fullPath.split('/').pop()
  switch (path) {
    case 'map':
      return {
        color: 'bg-green-500',
        message: `Mapa de ${channelName}`
      }
    case 'ranking':
      return {
        color: 'bg-blue-500',
        message: `Ranking de ${channelName}`
      }
    case 'books':
      return {
        color: 'bg-blue-500',
        message: `Libros de ${channelName}`
      }
    default:
      return {
        color: 'bg-pink-500',
        message: channelName
      }
  }
}


useHead({
  titleTemplate: '%s | Petruquio.LIVE',
  bodyAttrs: {
    'data-current-path': route.path,
  },
})
</script>