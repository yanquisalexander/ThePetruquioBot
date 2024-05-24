<template>
    <div>
        <v-dialog v-model="isOpen" @closed="closeModal" overlay-color="black" overlay-opacity="1">


            <div class="w-full max-w-md mx-auto transform overflow-hidden pixel-shadow bg-white p-6 text-left align-middle transition-all"
                v-if="isOpen">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                    ¡Bienvenido al mapa de {{ channelName }}
                </h3>
                <div class="mt-2">
                    <p class="text-sm text-gray-500">
                        Este es el mapa de <strong>{{ channelName }}</strong>, aquí sus espectadores podrán
                        dejar huella, mostrando desde donde lo ven
                        y dejando un mensaje bonito.
                        <br>
                        <br>
                        La ubicación es aproximada y generalizada, por lo que no debes preocuparte por tu
                        privacidad.
                        <br>
                        <br>
                        <strong>¡Esperamos que disfrutes de esta nueva experiencia!</strong>
                    </p>
                </div>

                <div class="mt-8 flex justify-center">
                    <button class="py-2 px-4 bg-black" @click="closeModal">
                        Close
                    </button>

                </div>
            </div>
        </v-dialog>
    </div>
</template>
  
<script setup lang="ts">
import SoundManager, { Sounds } from '@/utils/SoundManager';

const { data } = useAuth()
let user = data.value?.user

const isOpen = ref(false)

const props = defineProps({
    channelName: {
        type: String,
        required: true,
    },
})

const soundManager = SoundManager.getInstance()

function closeModal() {
    isOpen.value = false
    soundManager.playSound(Sounds.BUTTON_CLICK)
}
function openModal() {
    isOpen.value = true
}

defineExpose({
    openModal,
});
</script>
  