<template>
  <div id="stream-virtual-pet">
    <div class="pet-container fixed bottom-0 left-0">
      <img :src="petImage" class="pet-image" />
      {{ currentPrompt }}<br>
      Listening: {{ petIsListening }}
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'empty'
});

const route = useRoute();
const enableSmartAssistant = ref(true);
const speechRecognition = useSpeechRecognition();
const currentPrompt = ref('');
const petIsListening = ref(false);
const silenceTimer = ref(null);

const pet = ref();
const ACTIVATION_PHRASES = ['hey', 'hello', 'hi', 'yo', 'sup'];

pet.value = route.query.pet;

const PET_ASSETS = {
  cat_white: {
    idle: '/assets/images/pets/cat_white/idle.gif',
    greet: '/assets/images/pets/cat_white/greet.gif',
    sleep: '/assets/images/pets/cat_white/sleep.gif'
  }
};

const getPetAssets = () => PET_ASSETS[pet.value] || PET_ASSETS.cat_white;

const { idle: petIdle, greet: petGreet, sleep: petSleep } = getPetAssets();
const petImage = ref(petIdle);

const petGreetAnimation = () => {
  petImage.value = petGreet;
  setTimeout(() => {
    petImage.value = petIdle;
  }, 2000);
};

const petSleepAnimation = () => {
  petImage.value = petSleep;
  setTimeout(() => {
    petImage.value = petIdle;
  }, 20000);
};

const petIdleAnimation = () => {
  petImage.value = petIdle;
};

const petAnimation = () => petIdleAnimation();

const setupAssistant = async () => {
  if (!speechRecognition.isSupported) {
    enableSmartAssistant.value = false;
    return;
  }

  speechRecognition.recognition.continuous = true;
  speechRecognition.recognition.false = true;
  speechRecognition.recognition.onnomatch = () => {
    console.log('Speech Recognition: no match');
  };
  speechRecognition.recognition.onerror = (event) => {
    console.log('Speech Recognition: error', event.error);

    // Ejemplo: Muestra un mensaje de error específico
    if (event.error === 'no-speech') {
      console.log('No se detectó ningún habla.');
      speechRecognition.start(); // Reinicia el reconocimiento de voz
    } else if (event.error === 'audio-capture') {
      console.log('No se pudo acceder al micrófono.');
    }
    // Puedes agregar más casos según las necesidades
  };
  speechRecognition.recognition.onstart = () => {
    console.log('Speech Recognition: started');
  };
  speechRecognition.start();

  watch(speechRecognition.result, () => {
    if (speechRecognition.isFinal) {
      console.log('Speech Recognition Final Result:', speechRecognition.result.value);
      currentPrompt.value = speechRecognition.result.value.toLowerCase();
    }

    if (petIsListening.value) {
      // If already activated, handle commands
      handleSpeechResult(currentPrompt.value);
    } else if (ACTIVATION_PHRASES.includes(currentPrompt.value)) {
      // If not activated and activation phrase is detected, activate
      petIsListening.value = true;
      petGreetAnimation();
    }

    // Restart the timer on each speech result
    restartSilenceTimer();
  });

  // Clean up when speech ends
  speechRecognition.recognition.onspeechend = () => {
    currentPrompt.value = '';
    petIsListening.value = false;
    // Clear the timer on speech end
    clearSilenceTimer();
  };
};

const handleSpeechResult = (result) => {
  if (result.includes('greet')) {
    petGreetAnimation();
  } else if (result.includes('sleep')) {
    petSleepAnimation();
  }
};

const restartRecognition = () => {
  speechRecognition.recognition.abort();
  speechRecognition.start();
};

const restartSilenceTimer = () => {
  clearSilenceTimer();
  silenceTimer.value = setTimeout(() => {
    console.log('Silence detected for more than 4 seconds');
    currentPrompt.value = '';
    petIsListening.value = false;
    restartRecognition(); // Reinicia el reconocimiento de voz
    // Realiza acciones cuando hay silencio durante más de 4 segundos
  }, 3000);
};

const clearSilenceTimer = () => {
  // Clear the timer if it exists
  if (silenceTimer.value) {
    clearTimeout(silenceTimer.value);
    silenceTimer.value = null;
  }
};

onMounted(() => {
  petAnimation();
  setupAssistant();

  // Log when silence is detected
  watch(speechRecognition.isListening, (isListening) => {
    if (!isListening) {
      console.log('Silence detected');
      // Restart the timer when silence is detected
      restartSilenceTimer();
    }
  });
});
</script>

<style scoped>
* {
  color: #fff!;
}
</style>
