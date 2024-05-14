<template>
    <div class="flex items-center space-x-2">
        <div class="flex-shrink-0">
            <UAvatar :src="avatar" size="sm" />
        </div>
        <div class="flex flex-col">
            <div class="flex items-center space-x-2">
                <span class="font-medium" v-if="props.isCopilot">Copilot</span>
                <span class="font-medium" v-else>{{ rawUser().displayName }}</span>
                <span class="text-gray-500 text-sm">{{ new Date().toLocaleTimeString() }}</span>
            </div>
            <div class="bg-gray-50 p-2 rounded-md w-max-content">
                <div v-html="md.render(props.message)" :class="props.messageClasses" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import MarkdownIt from "markdown-it";
const md = new MarkdownIt();

const { rawUser } = useCurrentUser()
const props = defineProps<{
    message: string
    isCopilot: boolean
    messageClasses?: Record<string, boolean>
}>()

const avatar = computed(() => {
    return props.isCopilot ? 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' : rawUser().avatar
})
</script>