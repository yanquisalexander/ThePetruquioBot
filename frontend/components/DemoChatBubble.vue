<template>
    <div class="flex items-center space-x-2">
        <div class="flex-shrink-0">
            <slot name="avatar" />
        </div>
        <div class="flex flex-col">
            <div class="flex items-center space-x-2">
                <span class="font-medium" v-if="role === 'copilot'">Copilot</span>
                <span class="font-medium" v-else>User</span>

            </div>
            <div class="bg-black text-white p-2 rounded-full w-max-content" :class="messageClasses"
                v-if="message && message.length > 0">
                <div v-html="md.render(message)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import MarkdownIt from "markdown-it";
const md = new MarkdownIt();

const { message, role } = defineProps({
    message: String,
    role: {
        type: String as PropType<'user' | 'copilot'>,
        default: 'user'
    }
})

const messageClasses = computed(() => {
    return {
        'bg-blue-200 text-blue-950': role === 'copilot',
    }
})
</script>