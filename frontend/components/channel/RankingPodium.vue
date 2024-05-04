<template>
  <div class="podium__wrapper flex flex-col items-center">
    <div class="podium">
      <div
        v-for="( winner, index ) in props.data.slice(0, 3)"
        :key="winner.user_id"
        :class="`winner ${getWinnerClass(index)}`"
      >
        <div class="winner__crown">
          <LucideCrown class="winner__icon text-center mx-auto" />
        </div>
        <div
          class="winner__avatar clickable relative flex items-center justify-center transition-all duration-300"
          :class="index === 0 ? 'cursor-pointer scale-125' : ''"
          @click="index === 0 ? showConfetti() : ''"
        >
          <Vue3Lottie
            v-if="index === 0"
            :animation-data="Confetti"
            :height="150"
            :width="140"
            class="absolute top-0"
          />
          <img
            :src="winner.user_avatar"
            :alt="winner.user_username"
            class="w-16 h-16 rounded-full object-cover mx-auto"
          >
          <div class="winner__rank">
            <span>{{ index + 1 }}</span>
          </div>
        </div>
        <div class="winner__name">
          <!-- Mostrar el nombre de usuario o el nombre, según la prioridad de la configuración -->
          {{ winner.user_display_name }}
        </div>
        <div class="winner__score">
          <!-- Mostrar el puntaje del ganador -->
          {{ winner.redemption_count }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SoundManager, { Sounds } from "@/utils/SoundManager";

import { LucideCrown } from "lucide-vue-next";
import Confetti from '~/assets/confetti.json'
import FullConfetti from '~/assets/fullConfetti.json'

const confettiShowing = ref(false)
const fullConfettiRef = ref(null)


export interface RankingUser {
  user_id: number;
  user_username: string;
  user_avatar: string;
  user_display_name: string;
  redemption_count: number;
}
  const props = defineProps<{
    data: RankingUser[]
  }>()

  const getWinnerClass = (index: number) => {
  return index === 0 ? 'first-place' : index === 1 ? 'second-place' : index === 2 ? 'third-place' : ''
}

const showConfetti = () => {
  SoundManager.getInstance().playSound(Sounds.CONFETTI)
  confettiShowing.value = true
  try {
    fullConfettiRef.value?.stop()
    fullConfettiRef.value?.play()
  } catch (error) {
    console.warn(error, '¿Maybe the ref is not ready?')
  }
}
</script>

<style scoped>
.ranking {
  padding-bottom: 40px;
}

.bg-gold {
  background-color: #ffd700;
}

.bg-silver {
  background-color: #c0c0c0;
}

.bg-bronze {
  background-color: #cd7f32;
}

.bg-gray-100 {
  background-color: #f4f4f4;
}


.podium {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.podium .wrapper {
  background: rgba(var(--tertiary-rgb), 0.1);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.winner {
  overflow: hidden;
  margin: 0 1rem;
}

.winner__crown {
  display: none;
  margin-bottom: 1rem;
  text-align: center;
}

.winner__crown .winner__icon {
  color: #ffd700;
  font-size: 40px;
}

.winner__avatar {
  position: relative;
  margin-bottom: 25px;
}

.winner__avatar img {
  @apply rounded-md border-4;
  border-style: solid;
  box-sizing: border-box;

}

.winner__rank {
  @apply absolute flex font-bold text-lg h-8 w-8 rounded-full bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 items-center justify-center;
}

.winner__name {
  text-align: center;
}

.winner__score {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}

.winner.first-place {
  position: relative;
  z-index: 1;
  order: 2;
}

.winner.first-place .winner__crown {
  display: block;
}

.winner.first-place .winner__avatar img {
  border-color: #ffd700;
  background-color: #ffe46a;
}

.winner.first-place .winner__rank {
  background-color: #ffd700;
}

.winner.second-place {
  order: 1;
  transform: translate(20%, 35%);
}

.winner.second-place .winner__avatar img {
  border-color: #c0c0c0;
  background-color: #d6d6d6;
}

.winner.second-place .winner__rank {
  background-color: #c0c0c0;
}

.winner.third-place {
  order: 3;
  transform: translate(-20%, 35%);
}

.winner.third-place .winner__avatar img {
  border-color: #cd7f32;
  background-color: #dca570;
}

.winner.third-place .winner__rank {
  background-color: #cd7f32;
}
</style>
  