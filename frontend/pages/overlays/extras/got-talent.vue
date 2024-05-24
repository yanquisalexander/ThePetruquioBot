<template>
  <div class="!bg-transparent">
    <div class="!bg-transparent flex flex-col items-center" id="got-talent-overlay"
      v-if="gotTalentConfig && crosses && !companionMode">
      <!-- Esta es una superposición para OBS que simula cruces de un talent show -->
      <section id="got-talent-crosses" class="grid gap-24 z-[1000] mt-4" v-if="crosses"
        :class="`${getCols()} md:${getCols()}`">
        <!-- Itera sobre cada cruz y su nombre -->
        <div v-for="(judge, index) in gotTalentConfig.data.judges" :key="index" class="text-center">
          <!-- Cruz SVG -->
          <button @click="toggleColor(index)">
            <X class="w-28 h-28 mb-2" stroke-width="4" :style="{
              'filter':
                crosses[index]?.colored ? 'drop-shadow(0 0 0.75rem rgba(255, 0, 0, 0.7))' :
                  (goldenBuzzerActivated ? 'drop-shadow(0 0 0.75rem rgb(255, 215, 0))' : 'drop-shadow(0 0 0.75rem rgba(0, 0, 0, 0.7))'),
              'transition': 'filter 0.2s ease-in-out, transform 0.2s ease-in-out',
              'transform': crosses[index]?.colored ? 'scale(1.1)' : 'scale(1)',
            }" :class="{
  'text-red-500': crosses[index]?.colored,
  'text-white': !crosses[index]?.colored && !goldenBuzzerActivated,
  'text-yellow-400': goldenBuzzerActivated,
}" />
          </button>

          <div
            class="border-[3px] border-black bg-[#fff] text-black font-bold text-2xl py-2 px-7 rounded-lg font-gabarito uppercase tracking-wider shadow-md shadow-black overflow-hidden truncate"
            :class="{ '!bg-red-500 text-white': crosses[index]?.colored, 'bg-yellow-500 text-white': goldenBuzzerActivated }">
            {{ judge.judge_name || judge.username }}
          </div>
        </div>
      </section>



      <transition name="overlay-fade" mode="out-in">
        <div v-if="showRedOverlay" key="red-overlay" class="fixed inset-0 bg-red-500 bg-opacity-25 z-[50] animate-pulse">
          <div class="flex flex-col w-full h-full items-center justify-center">
            <h2 class="text-6xl font-bold font-gabarito text-white animate-bounce">
              ¡Detente!
            </h2>
            <span class="text-2xl font-bold font-gabarito text-red-900">
              El jurado ha decidido detener la actuación.
            </span>
          </div>
        </div>
      </transition>

      <transition name="overlay-fade" mode="out-in">
        <div v-if="showGoldenBuzzerOverlay" key="golden-buzzer-overlay" class="fixed bottom-8">
          <div class="flex flex-col items-center">
            <h2 class="text-6xl font-bold font-gabarito text-white animate-bounce [text-shadow:_8px_2px_16px_#FFD700]">
              ¡Pase de Oro!
            </h2>
            <span class="text-2xl font-bold font-gabarito text-yellow-600">
              Un miembro del jurado ha decidido darle el pase de oro a este participante.
            </span>
          </div>
        </div>
      </transition>

    </div>
    <div
      v-if="companionMode && gotTalentConfig && status === 'authenticated' && gotTalentConfig.data.judges.find((judge: { twitch_id: any; }) => judge.twitch_id === user.user.channel.twitchId)">
      <div class="flex flex-col items-center h-full justify-center bg-black">
        <!-- Muestra las x en versión miniatura -->
        <section id="got-talent-crosses" class="grid gap-8 z-[1000] mt-8 mb-8 grid-cols-2 md:grid-cols-4" v-if="crosses">
          <!-- Itera sobre cada cruz y su nombre -->
          <div v-for="(judge, index) in gotTalentConfig.data.judges" :key="index" class="text-center">
            <!-- Cruz SVG -->
            <button @click="clearJudgeCrosses(judge)">
              <X class="w-16 h-16 mb-2" stroke-width="4" :style="{
                'filter':
                  crosses[index]?.colored ? 'drop-shadow(0 0 0.75rem rgba(255, 0, 0, 0.7))' :
                    (goldenBuzzerActivated ? 'drop-shadow(0 0 0.75rem rgb(255, 215, 0))' : 'drop-shadow(0 0 0.75rem rgba(0, 0, 0, 0.7))'),
                'transition': 'filter 0.2s ease-in-out, transform 0.2s ease-in-out',
                'transform': crosses[index]?.colored ? 'scale(1.1)' : 'scale(1)',
              }" :class="{
  'text-red-500': crosses[index]?.colored,
  'text-white': !crosses[index]?.colored && !goldenBuzzerActivated,
  'text-yellow-400': goldenBuzzerActivated,
}" />
            </button>

            <div
              class="border-[3px] border-black bg-[#fff] text-black font-bold py-1 px-2 rounded-lg font-gabarito uppercase tracking-wider shadow-md shadow-black overflow-hidden truncate"
              :class="{ '!bg-red-500 text-white': crosses[index]?.colored, 'bg-yellow-500 text-white': goldenBuzzerActivated }">
              {{ judge.judge_name || judge.username }}
            </div>
          </div>
        </section>


        <h2 class="text-2xl font-bold font-gabarito mb-4 text-center">
          <span>
            ¡Hola {{ user.user.username }}!

          </span>

        </h2>
        <p class="text-lg font-bold font-gabarito mb-16 text-center">
          ¡Puedes usar esta página para darle tu voto a los participantes!
        </p>
        <p class="text-lg font-bold font-gabarito mb-16 text-center">
          Eres parte del jurado de este canal ({{ gotTalentConfig.data.channel.username }}).
        </p>
        <section class="buttons-to-judge flex space-x-12">
          <div class="flex flex-col items-center">
            <button
              class="w-32 h-32 rounded-full bg-red-500 text-white font-bold text-3xl flex items-center justify-center uppercase tracking-wider shadow-md shadow-black mb-4"
              @click="sendRedButton">
              <X class="w-24 h-24" stroke-width="4" />
            </button>
            <div class="text-center">
              <h2 class="text-2xl font-bold font-gabarito">
                <span>
                  Botón Rojo
                </span>
              </h2>
            </div>
          </div>

          <div class="flex flex-col items-center">
            <button
              class="w-32 h-32 rounded-full bg-yellow-500 text-white font-bold text-3xl uppercase tracking-wider shadow-md shadow-black mb-4"
              @click="sendGoldenBuzzer">
              <v-icon>mdi-star</v-icon>
            </button>
            <div class="text-center">
              <h2 class="text-2xl font-bold font-gabarito">
                <span>
                  Botón Dorado
                </span>
              </h2>
            </div>
          </div>
        </section>

        <section class="session-control mb-8" v-if="gotTalentConfig.data.channel.username === user.user.username">
          <div class="flex flex-col items-center mt-16">
            <h2 class="text-2xl font-gabarito mb-4 text-center">
              <span>
                Controles de administrador
              </span>
            </h2>
            <v-btn color="red" @click="clearCrosses">Limpiar cruces</v-btn>
            <span class="mt-2">
              <b>Nota:</b> Para limpiar la X de un juez, haz clic en ella.
            </span>
          </div>
        </section>
      </div>
    </div>
    <div
      v-else-if="companionMode && gotTalentConfig && status === 'authenticated' && !gotTalentConfig.data.judges.find((judge: { twitch_id: any; }) => judge.twitch_id === user.user.channel.twitchId)">
      <div class="flex flex-col items-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold font-gabarito">Got Talent</h1>
        </div>
        <div class="text-center">
          <h2 class="text-2xl font-bold font-gabarito">
            Actualmente no eres parte del jurado de este canal.
          </h2>
        </div>
      </div>
    </div>
    <div v-else-if="companionMode && gotTalentConfig && status === 'unauthenticated'">
      <div class="flex flex-col items-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold font-gabarito">Got Talent</h1>
        </div>
        <div class="text-center">
          <h2 class="text-2xl font-bold font-gabarito">
            Debes iniciar sesión para poder usar esta página.
          </h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SoundManager, { Sounds } from '../../../utils/SoundManager';
import { X } from 'lucide-vue-next';
import SadFace from '~/assets/sad.json';
import axios from "axios";
import { io, Socket } from 'socket.io-client';
import { confetti } from '@tsparticles/confetti'

const route = useRoute();
const { data: user, status } = useAuth();

const soundManager = SoundManager.getInstance();
const gotTalentConfig = ref(null);
const crosses = ref([]);
const showRedOverlay = ref(false);
const goldenBuzzerActivated = ref(false);
const showGoldenBuzzerOverlay = ref(false);
const companionMode = ref(route.query.companion === 'true');

const socket: Ref<Socket | null> = ref(null);



const fetchConfig = async () => {
  try {
    const { data } = await useFetch(`${API_ENDPOINT}/extras/${route.query.channel}/got-talent`);
    gotTalentConfig.value = data.value;
    crosses.value = Array.from({ length: data.value.data?.judges?.length || 0 }, () => ({ colored: false }));
  } catch (error) {
    console.error('Error fetching Got Talent config:', error);
  }
};

await fetchConfig();

if (!gotTalentConfig.value) {
  createError({
    statusCode: 404,
    message: 'No se encontró la configuración de Got Talent',
  });
}

definePageMeta({
  layout: 'empty',
});

const toggleColor = (index: number) => {
  if (goldenBuzzerActivated.value) return;
  if (crosses.value[index].colored) {
    soundManager.playSound(Sounds.GOT_TALENT_RED_BUTTON);
    // Allow to give "multiple" red buttons
    return;
  }
  crosses.value[index].colored = !crosses.value[index]?.colored;

  if (crosses.value.every((cross) => cross.colored)) {
    showRedOverlay.value = true;
    soundManager.playSound(Sounds.GOT_TALENT_RED_BUTTON_BACKDROP, 0.8);





    setTimeout(() => {
      showRedOverlay.value = false;
    }, 5000);
  }

  soundManager.playSound(Sounds.GOT_TALENT_RED_BUTTON);
};

const duration = 10 * 1000

const defaults = {
  spread: 360,
  ticks: 60,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
  shapes: ["star"],
  colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
};
function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}


const activateGoldenBuzzer = () => {
  if (goldenBuzzerActivated.value) return;
  goldenBuzzerActivated.value = true;
  showGoldenBuzzerOverlay.value = true;

  crosses.value.forEach((cross) => (cross.colored = false));

  let animationEnd = Date.now() + duration

  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 30 * (timeLeft / duration);

    // since particles fall down, start a bit higher than random
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    );
  }, 250);

  soundManager.playSound(Sounds.GOLDEN_BUZZER_BACKDROP, 0.8);
  soundManager.playSound(Sounds.GOLDEN_BUZZER);

  setTimeout(() => {
    crosses.value.forEach((cross) => (cross.colored = false));
    showGoldenBuzzerOverlay.value = false;
  }, 16000);
};

const sendGoldenBuzzer = async () => {
  try {
    const { data } = await axios.post(
      `${API_ENDPOINT}/extras/${route.query.channel}/got-talent/golden-buzzer`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user.value.user.token}`,
        },
      }
    );

  } catch (error) {
    console.error(error);
  }
};

const getCols = () => {
  switch (gotTalentConfig.value.data.judges.length) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-3';
    case 4:
      return 'grid-cols-4';
    default:
      return 'grid-cols-4';
  }
}

const sendRedButton = async () => {
  try {
    const { data } = await axios.post(
      `${API_ENDPOINT}/extras/${route.query.channel}/got-talent/red-button`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user.value.user.token}`,
        },
      }
    );

    const judge = gotTalentConfig.value.data.judges.find(
      (judge: { twitch_id: any; }) => judge.twitch_id === user.value.user.twitchId
    );

    if (judge) {
      const index = gotTalentConfig.value.data.judges.indexOf(judge);
      toggleColor(index);
    }
  } catch (error) {
    console.error(error);
  }
};


const initializeSocket = async () => {
  socket.value = io(SOCKET_ENDPOINT, {
    transports: ['websocket']
  });

  socket.value.on('connect', () => {
    console.log('[Socket] Connected to socket server');
    socket.value?.emit('subscribeChannel', `got-talent:${route.query.channel}`);

    socket.value?.on('add-cross', async (data: any) => {
      if (goldenBuzzerActivated.value) return;

      const judge = gotTalentConfig.value.data.judges.find(
        (judge: { twitch_id: any; }) => judge.twitch_id === data.twitchId
      );

      if (judge) {
        const index = gotTalentConfig.value.data.judges.indexOf(judge);
        toggleColor(index);
      }
    });

    socket.value?.on('golden-buzzer', async () => {
      activateGoldenBuzzer();
    });

    socket.value?.on('clear-crosses', async () => {
      crosses.value.forEach((cross) => (cross.colored = false));
      goldenBuzzerActivated.value = false;
    });

    socket.value?.on('reload-overlay', async () => {
      if (companionMode.value) return;
      if (process.client) {
        window.location.reload();
      }
    });

    socket.value?.on('clear-cross', async (data: any) => {
      const judge = gotTalentConfig.value.data.judges.find(
        (judge: { twitch_id: any; }) => judge.twitch_id === data.twitchId
      );

      if (judge) {
        const index = gotTalentConfig.value.data.judges.indexOf(judge);
        crosses.value[index].colored = false;
      }
    });

    socket.value?.on('update-judge-name', async (data: any) => {
      const judge = gotTalentConfig.value.data.judges.find(
        (judge: { twitch_id: any; }) => judge.twitch_id === data.twitchId
      );

      if (judge) {
        const index = gotTalentConfig.value.data.judges.indexOf(judge);
        gotTalentConfig.value.data.judges[index].judge_name = data.name;
      }
    });

    socket.value?.on('update-judges', async (data: any) => {
      await fetchConfig();
      crosses.value = [];
      crosses.value = Array.from({ length: gotTalentConfig.value.data?.judges?.length || 0 }, () => ({ colored: false }));
    });
  });
}

const clearJudgeCrosses = async (judge: any) => {
  if(!judge) return;
  if(!user.value.user) return;
  if(gotTalentConfig.value.data.channel.username !== user.value.user.username) return;
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/channel/extras/got-talent/clear-cross`,
      {
        twitchId: judge.twitch_id,
      },
      {
        headers: {
          Authorization: `Bearer ${user.value.user.token}`,
        },
      }
    );
  } catch (error) {
    console.error(error);
  }
};

const clearCrosses = async () => {
  if(!user.value.user) return;
  if(gotTalentConfig.value.data.channel.username !== user.value.user.username) return;
  if(showGoldenBuzzerOverlay.value) return;
  try {
    const response = await axios.post(`${API_ENDPOINT}/channel/extras/got-talent/clear-crosses`, null, {
      headers: {
        Authorization: `Bearer ${user.value.user.token}`,
      },
    });

  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  initializeSocket();
})

</script>

<style scoped>
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s;
}

.overlay-fade-enter,
.overlay-fade-leave-to {
  opacity: 0.5;
}
</style>
