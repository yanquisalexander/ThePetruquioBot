<template>
    <div
        class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
        <div
            class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
            <component :is="icon" class="w-6 h-6 text-white"></component>
        </div>
        <div class="p-4 text-right">
            <p class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
                {{ title }}
            </p>
            <h4 class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                {{ value }}
            </h4>
        </div>
        <div class="border-t border-blue-gray-50 p-4">
            <p class="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600" v-if="description">
                {{ description }}
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

const props = defineProps({
    icon: {
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    color: {
        type: String,
        required: false,
        default: 'bg-base-100'
    },
    value: {
        type: String,
        required: false
    },

})

</script>