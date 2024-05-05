<template>
    <UPopover :popper="{ placement: 'bottom-start' }">
        <template #default="{ open }">
            <UButton color="gray" variant="ghost" square :class="[open && 'bg-gray-50 dark:bg-gray-800']">
                <UIcon name="i-lucide-ellipsis" class="w-5 h-5" />
            </UButton>
        </template>
        <template #panel="{ close }">
            <div class="p-2 flex flex-col gap-2">
                <span class="text-sm font-semibold">Comando: {{ props.command.name }}</span>
                <div class="flex flex-row items-center gap-2 px-2">
                    <UToggle v-model="props.command.enabled" on-icon="i-heroicons-check-20-solid"
                        @update:model-value="emit('toggleCommandEnabled', props.command)"
                        off-icon="i-heroicons-x-mark-20-solid" color="blue" />
                    <span class="text-sm font-semibold">{{ $props.command.enabled ? 'Activo' : 'Inactivo' }}</span>
                </div>
                <UDivider />
                <UButton color="white" variant="soft" label="Editar este comando"
                    @click="handleClick('editCommand', close)" icon="i-lucide-edit" />
                <UButton color="red" variant="soft" label="Eliminar" @click="handleClick('deleteCommand', close)"
                    icon="i-lucide-trash" />
            </div>
        </template>
    </UPopover>
</template>

<script lang="ts" setup>

const props = defineProps<{
    command: any;
}>();


const emit = defineEmits(["editCommand", "deleteCommand", "toggleCommandEnabled"]);

const handleClick = (action: string, close: () => void) => {
    emit(action as any, props.command);
    close();
};
</script>