<template>
    <UCard>
        <template #header>
            <h2 class="text-xl font-medium font-jost">
                Chat de mi stream
            </h2>
        </template>

        <iframe :src="`https://www.twitch.tv/embed/${currentUser.getUsername()}/chat?parent=${FRONTEND_URL}`"
            frameborder="0" scrolling="no" allowfullscreen="true" class="w-full h-svh"></iframe>
    </UCard>
</template>

<script lang="ts" setup>
const currentUser = useCurrentUser()
</script>