<template>
    <UModal v-bind="$attrs">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <h2 class="text-xl font-medium font-jost">
                    {{ $t('dashboard.moderator_account_chooser.title') }}
                </h2>
            </template>

            <!-- Lista de canales -->
            <div class="grid grid-cols-1 gap-4">
                <div v-for="channel in props.moderatedChannels" :key="channel.id"
                    class="flex items-center justify-between py-4">
                    <div class="flex items-center gap-4">
                        <img :src="channel.avatar" alt="Channel profile image" class="w-10 h-10 rounded-full">
                        <div>
                            <h3 class="text-lg font-medium font-jost">{{ channel.displayName }}</h3>
                            <p class="text-sm text-gray-500">{{ channel.name }}</p>
                        </div>
                    </div>
                    <UButton @click="() => emit('chooseAccount', channel.id)" color="blue" variant="soft"
                        icon="i-lucide-checkmark">
                        {{ $t('dashboard.moderator_account_chooser.choose') }}
                    </UButton>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-4">
                    <UButton @click="() => emit('chooseAccount', null)" color="red" variant="soft"
                        icon="i-lucide-x-mark">
                        {{ $t('dashboard.moderator_account_chooser.cancel') }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script lang="ts" setup>
const emit = defineEmits(["chooseAccount"])
const props = defineProps<{
    moderatedChannels: any[]
}>()


</script>