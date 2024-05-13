<template>
    <UCard class="smart-assistant" :ui="{ body: { padding: '!px-0 !pt-0' } }">
        <UAlert v-if="!recognition.isListening.value" color="blue" variant="soft" class="p-4">
            <template #description>
                <div class="flex items-center">
                    <UIcon name="i-lucide-mic-off" class="mr-2" />
                    <span>
                        Copilot is not listening. Click the button below to start the voice recognition.
                    </span>
                    <div class="flex-1" />
                    <div class="flex items-center">
                        <UButton @click="recognition.start" color="blue" class="ml-2">
                            <UIcon name="i-lucide-mic" class="mr-2" />
                            Start
                        </UButton>
                    </div>
                </div>
            </template>
        </UAlert>
        <div class="smart-assistant__header p-4">
            <h2 class="text-white inline-block bg-blue-500 rounded-full py-1 px-2">
                <CopilotLogo class="h-5 w-5 inline-block" />
                Copilot
            </h2>
        </div>
        <div class="smart-assistant__content p-4">
            <span :class="{ 'text-gray-500': !isFinal, 'text-black': isFinal }" v-if="currentTranscript">
                <p class="mt-4">You:</p>
                <p class="bg-gray-50 p-2 rounded-md w-max-content" v-html="md.render(currentTranscript)"></p>
            </span>

            <span class="block text-gray-500" v-if="copilotResponse" :class="{ '!text-black': isCopilotResponseFinal }">
                <p class="mt-4">Copilot:</p>
                <p class="bg-gray-50 p-2 rounded-md w-max-content" v-html="md.render(copilotResponse)"></p>
            </span>
        </div>


        <footer class="flex justify-end px-4">
            <span class="block text-gray-500">
                Powered by <span class="font-medium">Google</span> Gemini
                <GeminiLogo class="h-5 w-5 inline-block animate-float animate-pulsing animate-duration-[5000ms]"
                    style="animation-iteration-count: infinite;" />
            </span>
        </footer>
    </UCard>
</template>

<script lang="ts" setup>
import { useNavigatorLanguage } from '@vueuse/core'
import { useSpeechRecognition } from '@vueuse/core'
import MarkdownIt from "markdown-it";
import Bumblebee from "bumblebee-hotword";
import { alexa } from "@/hotwords/alexa";
import { copilot } from "@/hotwords/copilot";


const bumblebee = new Bumblebee()




const md = new MarkdownIt();

const { language } = useNavigatorLanguage()

const currentIndex = ref(0)
const currentTranscript = ref('')
const finalTranscript = ref('')
const isFinal = ref(false)
const copilotResponse = ref('')
const isCopilotResponseFinal = ref(false)
const recognition = useSpeechRecognition({
    lang: language.value,
    continuous: true,
    interimResults: true,
})

const typewriter = (text: string) => {
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

const sendToStreamCopilot = (transcript: string) => {
    const client = useAuthenticatedRequest()
    isCopilotResponseFinal.value = false
    copilotResponse.value = ''

    client.post('/stream-manager/smart-assistant', {
        message: transcript,
    }).then((res) => {
        console.log('Message sent to Stream Copilot', res.data)
        typewriter(res.data.data.response)
        const voice = fetch(`https://api.streamelements.com/kappa/v2/speech?voice=Mia&text=${res.data.data.response}`)
        voice.then((response) => {
            return response.blob()
        }).then((blob) => {
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audio.play()
        })



    }).catch((error) => {
        console.error('Error sending message to Stream Copilot:', error)
        typewriter('Copilot is not available at the moment. Please try again later.')
        const voice = fetch(`https://api.streamelements.com/kappa/v2/speech?voice=Mia&text=Copilot is not available at the moment. Please try again later.`)
        voice.then((response) => {
            return response.blob()
        }).then((blob) => {
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audio.play()
        })
    })
}

const processResult = (event: any) => {
    // Stop the bumblebee hotword detection while processing the speech recognition
    bumblebee.stop()
    currentIndex.value = event.resultIndex
    isFinal.value = event.results[currentIndex.value].isFinal
    const recognitionResult = event.results[currentIndex.value]

    currentTranscript.value = recognitionResult[0].transcript



    if (isFinal.value) {
        finalTranscript.value = currentTranscript.value
        sendToStreamCopilot(finalTranscript.value)
        recognition.stop()
        bumblebee.start()
    }

    console.log('Transcript:', currentTranscript.value)


}




onMounted(() => {
    recognition.recognition.onresult = processResult
    //recognition.start()

    bumblebee.setWorkersPath('/bumblebee-workers/')
    bumblebee.addHotword('alexa')
    bumblebee.addHotword('ok_google')

    bumblebee.setSensitivity(1);

    bumblebee.on('hotword', function (hotword) {
        // YOUR CODE HERE
        console.log('hotword detected:', hotword);
        SoundManager.getInstance().playSound(Sounds.NEW_NOTIFICATION)
        recognition.start()
    });



    bumblebee.start()
})


</script>