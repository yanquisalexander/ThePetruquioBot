<template>
    <UCard class="smart-assistant" :ui="{ body: { padding: '!px-0 !pt-0' } }">
        <div class="bg-blue-500 text-white p-2 rounded-t-md text-center shadow-md">
            <h2 class="flex items-center justify-center">
                <UIcon name="i-lucide-verified" class="mr-2" />
                You have been granted access to Copilot Beta
            </h2>
        </div>
        <UAlert v-if="!porcupine.state.isListening && !recognition.isListening.value" color="orange" variant="soft"
            class="p-4">
            <template #description>
                <div class="flex items-center">
                    <UIcon name="i-lucide-mic-off" class="mr-2" />
                    <span>
                        Copilot has stopped listening. Press the mic button to start listening again.
                    </span>

                    <UButton @click="startListening" color="blue" class="ml-4">
                        Start Listening
                    </UButton>
                </div>
            </template>
        </UAlert>
        <UAlert v-if="isThinking" color="gray" variant="soft" class="p-4">
            <template #description>
                <div class="flex items-center">
                    <UIcon name="i-lucide-loader" class="mr-2 animate-spin animate-duration-[1000ms]" />
                    <span>
                        Copilot is thinking...
                    </span>
                </div>
            </template>
        </UAlert>
        <UAlert v-if="recognition.isListening.value" color="blue" variant="soft" class="p-4">
            <template #description>
                <div class="flex items-center">
                    <UIcon name="i-lucide-mic" class="mr-2" />
                    <span>
                        Listening...
                    </span>
                </div>
            </template>
        </UAlert>
        <div class="smart-assistant__header p-4 flex items-center justify-between">
            <h2
                class="text-xl font-medium font-jost inline-block bg-gradient-to-r from-blue-600 via-red-500 to-purple-600 text-transparent bg-clip-text">
                Stream Copilot
            </h2>

            <div class="flex items-center space-x-4">
                <UButton variant="soft" :ui="{ rounded: 'rounded-full' }" icon="i-lucide-settings" color="blue" />
            </div>
        </div>
        <div class="smart-assistant__content p-4 md:w-3/4 space-y-4">
            <CopilotChatMessage v-if="currentTranscript" :message="currentTranscript" :isCopilot="false"
                :messageClasses="{
                    'text-gray-500': !isFinal,
                    'text-black': isFinal
                }" />

            <CopilotChatMessage v-if="copilotResponse" :message="copilotResponse" isCopilot :messageClasses="{
                'text-gray-500': !isCopilotResponseFinal,
                'text-black': isCopilotResponseFinal
            }" />
        </div>

        <CopilotRichContext :context="copilotContext" />

        <div class="smart-assistant__footer p-4 flex items-center justify-between">
            <UInput placeholder="Type or say 'Hey Copilot'" class="w-full mr-4" v-model="finalTranscript"
                :disabled="isThinking" />
            <UButton @click="sendToCopilot" color="blue" :disabled="isThinking" icon="i-lucide-send">
                Send
            </UButton>

        </div>


        <footer class="flex justify-end px-4">
            <span class="block text-gray-500">
                Powered by <span class="font-medium">Google</span> Gemini
                <span class="animate-float" style="animation-iteration-count: infinite;">
                    <GeminiLogo class="h-5 w-5 inline-block animate-pulsing animate-duration-[5000ms]"
                        style="animation-iteration-count: infinite;" />
                </span>
            </span>
        </footer>
    </UCard>
</template>

<script lang="ts" setup>
import { useNavigatorLanguage } from '@vueuse/core'
import { useSpeechRecognition } from '@vueuse/core'
import { usePorcupine } from '@picovoice/porcupine-vue';
import { heyCopilot } from "@/hotwords/hey_copilot";
import { porcupineParams } from "@/hotwords/porcupine_params";
const { configuration } = useStreamManager()

const PicoVoiceKey = 'u74TuYeZioAXjQRwzhrl1hA+RPQeaA3rZWejOriAeS2y/4Qun/Ezaw=='
const porcupine = usePorcupine()
const { language } = useNavigatorLanguage()

const currentIndex = ref(0)
const currentTranscript = ref('')
const finalTranscript = ref('')
const isFinal = ref(false)
const copilotContext = ref({})
const copilotResponse = ref('')
const isCopilotResponseFinal = ref(false)
const isThinking = ref(false)
const audioInstance = ref<HTMLAudioElement | null>(null)
const recognition = useSpeechRecognition({
    lang: language.value,
    continuous: true,
    interimResults: true,
})

const typewriter = (text: string) => {
    isCopilotResponseFinal.value = false
    let index = 0

    // use requestAnimationFrame to animate the typing
    const animate = () => {
        if (index < text.length) {
            copilotResponse.value += text[index]
            index++
            requestAnimationFrame(animate)
        }
    }

    animate()
    setTimeout(() => {
        isCopilotResponseFinal.value = true
    }, text.length * 50)
}

const getAudio = async (text: string): Promise<void> => {
    const voice = await fetch(`https://api.streamelements.com/kappa/v2/speech?voice=${configuration.value.copilotVoice}&text=${text}`)
    const blob = await voice.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => {
        audioInstance.value = null
    }
    audioInstance.value = audio
}

const sendToCopilot = async () => {
    SoundManager.getInstance().playSound(Sounds.COPILOT_LISTENED, 0.2)
    const client = useAuthenticatedRequest()
    isThinking.value = true
    recognition.stop()
    porcupine.start()
    copilotResponse.value = ''
    copilotContext.value = {}
    try {
        const res = await client.post('/stream-manager/smart-assistant', {
            message: finalTranscript.value
        })

        console.log('Message received from Stream Copilot', res.data)
        await getAudio(res.data.data.response)
        copilotContext.value = res.data.data.context
        await audioInstance.value?.play()
        typewriter(res.data.data.response)
        isThinking.value = false
    } catch (error) {
        console.error('Error sending message to Stream Copilot:', error)
        typewriter('Copilot is not available at the moment. Please try again later.')
        await getAudio('Copilot is not available at the moment. Please try again later.')
        await audioInstance.value?.play()
    } finally {
        isThinking.value = false
    }
}





const startListening = () => {
    if (audioInstance.value && !audioInstance.value.ended) {
        audioInstance.value.pause()
    }
    porcupine.stop()
    SoundManager.getInstance().playSound(Sounds.NEW_NOTIFICATION)
    recognition.start()
}

const processResult = async (event: any) => {
    // Stop the hotword detection while processing the speech recognition
    porcupine.stop()
    currentIndex.value = event.resultIndex
    isFinal.value = event.results[currentIndex.value].isFinal
    const recognitionResult = event.results[currentIndex.value]

    currentTranscript.value = recognitionResult[0].transcript



    if (isFinal.value) {
        finalTranscript.value = currentTranscript.value
        await sendToCopilot()
    }

    console.log('Transcript:', currentTranscript.value)


}




onMounted(async () => {
    recognition.recognition.onresult = processResult
    //recognition.start()

    await porcupine.init(PicoVoiceKey, [
        {
            base64: heyCopilot.file.data,
            label: "Hey Copilot",
            forceWrite: true,
        }
    ],
        {
            base64: porcupineParams.file.data,
            forceWrite: true,
        },
    )



    try {
        await porcupine.start()
        console.log('Porcupine started')
    } catch (error) {
        console.error('Error starting Porcupine', error)
    }

})



watch(() => porcupine.state.keywordDetection, (value) => {
    if (value) {
        startListening()
    }
})

watch(() => porcupine.state.isListening, (value) => {
    console.log('Porcupine is listening', value)
})

watch(() => recognition.error.value, (value) => {
    if (value.error === 'no-speech') {
        SoundManager.getInstance().playSound(Sounds.COPILOT_ERROR)
    }
})

watch(() => porcupine.state.error, (value) => {
    console.error('Porcupine error', value)
})

onBeforeUnmount(() => {
    recognition.stop()
    porcupine.stop()
})


</script>