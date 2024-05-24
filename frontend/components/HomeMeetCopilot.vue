<template>
    <div class="px-4 py-5 sm:p-6">
        <div class="flex flex-col items-center justify-center">
            <div class="inline-block text-xl text-gray-800 font-medium text-center max-w-[400px] dark:text-gray-200">
                Meet
                <StreamCopilotLogo />, your personal assistant for your stream
                <div class="inline-block !rotate-12 align-middle">
                    <GeminiLogo class="w-6 h-6 animate-float animate-duration-[5000ms]"
                        style="animation-iteration-count: infinite;" />
                </div>
            </div>

            <p class="text-gray-500 text-center max-w-3xl mt-4">
                Copilot was designed to help you manage your stream, interact with your audience, and make your life
                easier.<br />
                Just say "Hey Copilot" and ask for help!
            </p>
        </div>



        <div class="demo-container flex flex-col items-center justify-center space-y-4 mt-4">
            <div class="flex flex-col items-center justify-center space-y-4">
                <div
                    class="flex flex-col justify-center space-y-4 bg-gray-100 p-4 rounded-md min-w-[300px] w-max-content dark:bg-gray-800">
                    <DemoChatBubble :message="currentUserMessage" role="user">
                        <template #avatar>
                            <UIcon name="i-lucide-user" class="w-5 h-5" />
                        </template>
                    </DemoChatBubble>
                    <DemoChatBubble :message="copilotSimulateThinking ? 'Thinking...' : currentCopilotResponse"
                        role="copilot">
                        <template #avatar>
                            <UIcon name="i-lucide-mic" class="w-5 h-5" />
                        </template>
                    </DemoChatBubble>

                </div>

                <div class="flex items-center space-x-4">
                    <UButton @click="prevDemo" color="blue" variant="soft" icon="i-lucide-chevron-left" />
                    <UButton @click="nextDemo" color="blue" variant="soft" icon="i-lucide-chevron-right" />
                </div>

                <em class="text-gray-500 text-center dark:text-gray-400 py-6 text-sm">
                    Copilot requires a microphone and PetruquioLIVE+ subscription to work.
                </em>
            </div>
        </div>

        <footer class="flex justify-end px-4">
            <span class="block text-gray-500">
                Powered by <span class="font-medium">Google</span> Gemini
                <span class="animate-float" style="animation-iteration-count: infinite;">
                    <GeminiLogo class="h-5 w-5 inline-block" />
                </span>
            </span>
        </footer>
    </div>
</template>

<script lang="ts" setup>

const randomToRaid = () => {
    const channels = ['ShuliiPalmi', 'fabi_guille', 'Alexitoo_UY', 'TheGrefg']
    return channels[Math.floor(Math.random() * channels.length)]
}

const DEMOS = ref([
    {
        user: 'Hey Copilot, can you change the title of the stream to "Playing Valorant"? 🎮',
        copilot: 'Sure! The title has been updated to "Playing Valorant". ✅'
    },
    {
        user: 'Hey Copilot, can you change the game to Valorant? 🎯',
        copilot: 'Done! The game has been updated to Valorant. 🆗'
    },
    {
        user: 'Hey Copilot, suggest some channel to raid after the stream ends. 🚀',
        copilot: `I suggest raiding ${randomToRaid()}. They are currently playing Just Chatting with ${Math.floor(Math.random() * 100)} viewers.`
    }
])


const currentUserMessage = ref('')
const currentCopilotResponse = ref('')
const copilotSimulateThinking = ref(false)

const currentIndex = ref(0)
const currentDemo = computed(() => DEMOS.value[currentIndex.value])

const nextDemo = () => {
    currentIndex.value = (currentIndex.value + 1) % DEMOS.value.length
}

const prevDemo = () => {
    currentIndex.value = (currentIndex.value - 1 + DEMOS.value.length) % DEMOS.value.length
}

const animateTyping = (text: string, target: Ref<string>, callback?: () => void) => {
    // using a requestAnimationFrame loop to simulate typing
    const type = (i: number) => {
        if (i <= text.length) {
            target.value = text.slice(0, i)
            requestAnimationFrame(() => type(i + 1))
        } else if (callback) {
            setTimeout(callback, 1000)
        }
    }
    type(0)
}

const simulateTyping = () => {
    currentCopilotResponse.value = ''
    animateTyping(currentDemo.value.user, currentUserMessage, () => {
        copilotSimulateThinking.value = true
        setTimeout(() => {
            copilotSimulateThinking.value = false
            animateTyping(currentDemo.value.copilot, currentCopilotResponse)
        }, 1500)
    })
}

onMounted(() => {
    simulateTyping()
})

watch(currentIndex, () => {
    console.log('Current index changed', currentIndex.value)
    simulateTyping()
})
</script>
