<template>
  <div class="bg-white">
    <div class="map-parent">
      <MapWelcomeDialog ref="welcomeDialog" :channelName="channelName" />
      <div id="map" class="map-container" v-if="mapMarkers.length > 0"></div>
      <div v-else class="flex items-center justify-center h-[calc(100vh-48px)] w-full text-gray-500 text-2xl font-medium">
        <span class="animate-pulse">Cargando mapa...</span>
      </div>
      <div id="map-actions" v-if="mapMarkers.length > 0"
          :class="`mx-auto z-[1999] fixed flex justify-center bottom-8 items-center w-full duration-700 transition-all ${!showMapActions ? 'translate-y-24' : ''} ${(snackbar && !playingFindViewerGame) ? '-translate-y-14' : ''}`">
          <button class="pixelated-btn is-icon" @click="getRandomMarker">
            <DicesIcon />
            <v-tooltip class="rounded-none" activator="parent" location="top">
              Al azar
            </v-tooltip>
          </button>
          <button class="pixelated-btn featured" @click="reloadMap">
            <RefreshCwIcon />
            Recargar mapa
          </button>
          <v-menu>
            <template v-slot:activator="{ props }">
              <button class="pixelated-btn is-icon" v-bind="props" @click="Sounds.buttonClick">
                <MoreHorizontalIcon />
                <v-tooltip class="rounded-none" activator="parent" location="top">
                  Más
                </v-tooltip>
              </button>
            </template>
            <v-list>
              <v-list-item href="https://twitch.tv/alexitoo_uy" target="_blank">
                <template v-slot:prepend>
                  <v-avatar :size="28">
                    <img
                      :src="`https://static-cdn.jtvnw.net/jtv_user_pictures/42194d28-626c-4242-b5c7-6d71d07a1511-profile_image-300x300.jpeg`" />
                  </v-avatar>
                </template>
                <v-list-item-title>
                  Creado por Alexitoo_UY
                </v-list-item-title>
              </v-list-item>
              <v-list-item href="https://www.yanquisalexander.me/contact" target="_blank">
                <template v-slot:prepend>
                  <v-icon color="black">
                    mdi-bug
                  </v-icon>
                </template>
                <v-list-item-title>
                  Reportar un error
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

        </div>
    </div>
    <aside>
      <v-navigation-drawer v-model="showMarkerInfo" permanent location="left"
        class="ml-4 !h-5/6 my-auto !shadow-md !shadow-gray-400">
        <button class="absolute top-0 right-0 mt-2 mr-2"
          @click="showMarkerInfo = false; currentSelectedMarker = null; soundManager.playSound(Sounds.BUTTON_CLICK)">
          <v-icon>mdi-close</v-icon>
        </button>
        <template v-if="!currentSelectedMarker">
          <div class="flex flex-col items-center justify-center h-full">
            <span class="text-gray-500 text-2xl font-medium">Selecciona un marcador</span>
            <span class="text-gray-500 text-sm font-medium">Haz click en un marcador para ver más información</span>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col h-full">
            <section class="userinfo flex justify-center flex-col items-center mt-4">
              <img :src="currentSelectedMarker.user_avatar" class="w-16 h-16 rounded-full" />
              <h3 class="text-lg font-gabarito font-semibold pt-2">
                {{ currentSelectedMarker.user_display_name }}
              </h3>
              <a class="text-sm text-gray-500 hover:underline"
                :href="`https://twitch.tv/${currentSelectedMarker.user_username}`" target="_blank">
                <span class="text-twitch">twitch.tv/</span>{{ currentSelectedMarker.user_username }}
              </a>
              <span v-if="currentSelectedMarker.last_seen" class="text-sm text-gray-500">
                Última vez visto: {{ $moment(currentSelectedMarker.last_seen).fromNow() }}
              </span>
              <span v-if="currentSelectedMarker.pin_message" v-html="currentSelectedMarker.pin_message"
                class="text-sm text-gray-500 mt-2 inline-block mx-auto w-10/12"></span>

              <span v-if="currentSelectedMarker.isStreamer"
                class="text-sm bg-blue-500 text-white rounded-full px-2 py-1 mt-2 flex items-center">
                <BadgeCheckIcon class="w-4 h-4 inline-block mr-1" />
                Pin del streamer
              </span>
            </section>
            <section class="user-card" v-if="currentSelectedMarkerInfo">
              <div class="song-requests p-2"
                v-if="currentSelectedMarkerInfo.song_requests && currentSelectedMarkerInfo.song_requests.length > 0">
                <h3 class="text-lg font-gabarito font-medium pt-2 text-center">
                  Canciones pedidas
                </h3>
                <div class="song-requests-list">
                  <template v-for="(song, index) in currentSelectedMarkerInfo.song_requests" :key="index">
                    <div class="song-request flex items-center">
                      <div class="song-info flex flex-col ml-2 py-2">
                        <span class="text-sm font-medium">{{ song.title }}</span>
                        <span class="text-xs text-gray-500">{{ song.artist }}</span>
                      </div>
                    </div>
                  </template>
                </div>

              </div>
            </section>
            <template v-else>
              <div class="flex flex-col items-center justify-center h-full animation-pulse">
                <span class="text-black font-medium">Cargando información...</span>
                <v-progress-circular indeterminate color="deep-purple-darken-1" size="32"></v-progress-circular>
              </div>
            </template>

          </div>
        </template>
      </v-navigation-drawer>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import SoundManager, { Sounds } from '../../../utils/SoundManager';
import { useRoute } from "vue-router";
import "leaflet/dist/leaflet.css";
import { clearError, createError, useFetch } from "nuxt/app";
import { BadgeCheckIcon, DicesIcon, RefreshCwIcon, MoreHorizontalIcon } from "lucide-vue-next";
const soundManager = SoundManager.getInstance();
const { $moment } = useNuxtApp();
import { io, Socket } from 'socket.io-client';
import type { LatLngExpression, LayerGroup, Marker, Map } from "leaflet";
const { showSnackbar, snackbar } = useSnackbar();
const { fetchMapData, createMap, createTileLayer, createMarker: createMarkerInstance } = useCommunityMap();



definePageMeta({
  layout: "channel-overview",
})

const map: Ref<Map | null> = ref(null);
const center: Ref<LatLngExpression> = ref([0, 0]);
const zoom = ref(2);
const socket: Ref<Socket | null> = ref(null);

const mapMarkers = ref([]);
const markerLayer: Ref<LayerGroup | null> = ref(null);
const centeredOnBroadcaster = ref(false);

const showMapActions = ref(true);
const welcomeDialog = ref(null);

const currentSelectedMarker = ref(null);
const currentSelectedMarkerInfo = ref(null);
const showMarkerInfo = ref(false);

const playingFindViewerGame = ref(false);

const route = useRoute();
const channelName = route.params.channel_name;

const fetchMap = async () => {
  try {
    const response = await fetchMapData(channelName.toString())
    // @ts-ignore
    
    const data = response.data;
    console.log(data);
    mapMarkers.value = data.worldMap;
    if (!data) {
      throw new Error('No se pudo obtener el mapa');
    }

  } catch (error) {
    handleError((error as Error));
  }
};

/* First load, from server */
await fetchMap();

const initializeMap = async () => {
  if (!process.client) {
    console.error('Map can\'t be initialized on server side');
    return;
  }

  if (!mapMarkers.value) {
    await fetchMap();
  }

  let resizeHandler: any = null;

  if (mapMarkers.value) {
    if(!map.value) {
      map.value = await createMap(document.getElementById('map') as HTMLElement)
    }
    
    map.value.setView(center.value, zoom.value);
    map.value.whenReady(() => {
      console.log('[Map] Petroquio.LIVE Map ready');
    });
    map.value.getContainer().classList.add('petruquio-community-map');
    const tileLayer = await createTileLayer(map.value);
   
    if (!map.value) return;

    map.value.on('moveend', (e: any) => {
      // Keep markers in the map bounds
      // @ts-ignore
      let longshift = map.value.getCenter().lng - 180;
      // @ts-ignore
      Object.keys(markerLayer.value._layers).forEach((key) => {
        try {
          // @ts-ignore
          let lng = parseFloat(markerLayer.value._layers[key]._latlng.lng);
          if (lng < longshift) lng += 360;
          if (lng > longshift + 360) lng -= 360;
          // @ts-ignore
          markerLayer.value._layers[key].setLatLng([markerLayer.value._layers[key]._latlng.lat, lng]);
        } catch (error) {

        }
      });
    })

    markerLayer.value = L.layerGroup();
    markerLayer.value.addTo(map.value);
    createMarkers();

    const onResize = () => {
      clearTimeout(resizeHandler);
      resizeHandler = setTimeout(() => {
        const windowHeight = window.innerHeight - 48;
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        mapContainer.style.height = `${windowHeight}px`;
        if (map.value) {
          map.value.invalidateSize();
        }
      }, 100);
    };

    window.addEventListener('resize', onResize);
    onResize();
  }
};

const createMarkers = async () => {
  if (!map.value) return;
  if (!mapMarkers.value) return;

  const L = (await import('leaflet')).default;
  const longshift = map.value.getCenter().lng - 180;

  mapMarkers.value.forEach(async (m: any) => {
    let lng = parseFloat(m.longitude);
    if (lng < longshift) lng += 360;
    if (lng > longshift + 360) lng -= 360;

    if (!m.latitude || !m.longitude) return;

    m.latitude = parseFloat(m.latitude) + (Math.random() - 0.5) * 0.02;
    m.longitude = lng + (Math.random() - 0.5) * 0.02;

    const marker = await createMarker(L, m);
    if (!marker) return;
    if (!markerLayer.value) return;
    markerLayer.value.addLayer(marker);
  });
};

const createMarker = async (L: any, markerData: any) => {
  const emoteIcon = L.icon({
    iconUrl: markerData.pin_emote || 'https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_e4d464b7b3e945e6b5ef8ed806923fde/2.0',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const marker: Marker = await createMarkerInstance(map.value, markerData.latitude, markerData.longitude)
  marker.setIcon(emoteIcon);
  marker.options
  marker.options.username = markerData.user_username;
  marker.options.user_display_name = markerData.user_display_name;
  marker.options.user_avatar = markerData.user_avatar;
  marker.options.pin_message = markerData.pin_message;
  marker.options.isStreamer = markerData.isStreamer;
  marker.options.last_seen = markerData.last_seen;

  marker.bindTooltip(markerData.user_display_name, { direction: 'top', className: 'text-black rounded-lg py-2 px-4 text-base font-gabarito transition-opacity duration-300', opacity: 1.0 });

  marker.on('click', async (e: any) => {
    showMarkerInfo.value = false;
    currentSelectedMarker.value = null;
    currentSelectedMarkerInfo.value = null;
    soundManager.playSound(Sounds.PIN_CLICK);
    if (!map.value) return;
    map.value.flyTo(marker.getLatLng(), map.value.getZoom());
    await new Promise((resolve) => setTimeout(resolve, 100));
    fetchUserCard(markerData.user_username);
    currentSelectedMarker.value = { ...markerData, ...marker.options };
    showMarkerInfo.value = true;
  });

  if (markerData.user_username === channelName) {
    if (!centeredOnBroadcaster.value) {
      if (!map.value) return;
      map.value.flyTo([markerData.latitude, markerData.longitude], 4);
      marker.setZIndexOffset(1000);
      centeredOnBroadcaster.value = true;
    }
  }

  return marker;
};

const reloadMap = async () => {
  if (!map.value) return;
  if (!markerLayer.value) return;
  centeredOnBroadcaster.value = false;
  currentSelectedMarker.value = null;
  currentSelectedMarkerInfo.value = null;
  showMarkerInfo.value = false;
  soundManager.playSound(Sounds.BUTTON_CLICK);
  map.value.remove();
  map.value = null;
  markerLayer.value = null;
  mapMarkers.value = [];
  await fetchMap();
  await initializeMap();
};

const getRandomMarker = async () => {
  if (!map.value) return;
  if (!markerLayer.value) return;
  soundManager.playSound(Sounds.BUTTON_CLICK);
  if(mapMarkers.value.length === 0) {
    showSnackbar("Good try, but there's no one in the map yet")
    return;
  }


  let randomMarker = mapMarkers.value[Math.floor(Math.random() * mapMarkers.value.length)];
  if (!randomMarker) return;
  while (randomMarker.user_username === currentSelectedMarker.value?.user_username) {
    randomMarker = mapMarkers.value[Math.floor(Math.random() * mapMarkers.value.length)];
  }
  showMarkerInfo.value = false;
  currentSelectedMarker.value = null;
  currentSelectedMarkerInfo.value = null;
  // @ts-ignore
  map.value.flyTo([randomMarker.latitude, randomMarker.longitude], 8, {
    duration: 1.5,
    easeLinearity: 0.25,
  });
  // @ts-ignore
  const targetMarker: Marker | undefined = markerLayer.value?.getLayers().find((marker: any) => marker.options.username === randomMarker.user_username);
  if (!targetMarker) return;
  await new Promise((resolve) => setTimeout(resolve, 100));
  // @ts-ignore
  fetchUserCard(randomMarker.user_username);
  // @ts-ignore
  currentSelectedMarker.value = { ...randomMarker, ...targetMarker.options };
  showMarkerInfo.value = true;
};


const handleError = (error: Error) => {
  console.error(error);
  if (process.client) {
    alert(`Ocurrió un error al obtener el mapa de ${channelName}`);
  }
  clearError({ redirect: '/' });
  mapMarkers.value = [];
};

const fetchUserCard = async (username: string) => {
  try {
    const response = await useFetch(`${API_ENDPOINT}/worldmap/${channelName}/user-card/${username}`);
    // @ts-ignore
    const data = response.data.value?.data;

    if (!data || response.error.value?.statusCode === 404) {
      showSnackbar(`No se pudo obtener la información de ${username}`);
      currentSelectedMarker.value = null;
      currentSelectedMarkerInfo.value = null;
      showMarkerInfo.value = false;
      return;
    }

    currentSelectedMarkerInfo.value = data.user_card;
  } catch (error) {
    handleError((error as Error));
  }
};

const initializeSocket = async () => {
  socket.value = io(SOCKET_ENDPOINT, {
    transports: ['websocket']
  });

  socket.value.on('connect', () => {
    console.log('[Socket] Connected to socket server');
    socket.value?.emit('subscribeChannel', `map:${channelName}`);
  });

  socket.value.on('user-updated', async (data: any) => {
    const L = (await import('leaflet')).default;
    console.log('[Socket] User updated', data);
    // @ts-ignore
    const targetMarker: Marker | undefined = markerLayer.value?.getLayers().find((marker: any) => marker.options.username === data.username);
    if (!targetMarker) {
      console.log('[Socket] User not found in map markers');
    }

    switch (data.type) {
      case 'location':
        if (targetMarker) {
          targetMarker.setLatLng([data.latitude, data.longitude])
          showSnackbar(`📍 ${data.username} se ha movido en el mapa`);
        }
        break;
      case 'emote':
        if (targetMarker) {
          const emoteIcon = L.icon({
            iconUrl: data.emote,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          targetMarker.setIcon(emoteIcon);
          showSnackbar(`📌 ${data.username} ha cambiado su pin`);
        }
        break;
      case 'show':
        if (!targetMarker) {
          const newMarker = await createMarker(L, data);
          if (!newMarker) return;
          if (!markerLayer.value) return;
          markerLayer.value.addLayer(newMarker);
          showSnackbar(`📌 ${data.username} ha aparecido en el mapa`);
        }
        break;
      case 'mask':
        if (targetMarker) {
          markerLayer.value?.removeLayer(targetMarker);
          showSnackbar(`📌 ${data.username} ha desaparecido del mapa`);
        }
        break;
      default:
        break;
    }
  });
}

useHead({
  title: `Mapa de ${channelName}`,
})


onMounted(async () => {
  if(!welcomeDialog.value) {
    return;
  }
  // @ts-ignore
  welcomeDialog.value.openModal();
  if(!mapMarkers.value) {
    await fetchMap();
  }
  await initializeMap();
  await initializeSocket();
});
</script>
