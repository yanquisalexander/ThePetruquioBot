<template>
    <div class="mx-auto md:px-4 mb-16">
        <UAlert variant="subtle" color="gray" icon="i-mdi-flask" class="mb-4" title="Experimental feature">
            <template #description>
                <p>
                    Las funcionalidades de comunidad son una característica experimental.
                    <br>
                    Esto significa que pueden no funcionar correctamente y que pueden cambiar en cualquier momento.
                </p>
            </template>
        </UAlert>
        <div class="py-4 rounded-md mt-2 mx-auto">
            <h2 class="text-2xl font-medium font-jost mb-4">
                {{ $t('dashboard.community.title') }}
            </h2>
        </div>
        <div class="mt-2 bg-white rounded-md w-full">
            <div class="tab-nav flex flex-row">
                <nuxt-link :to="`/dashboard/community`"
                    class="tab-nav-item text-center py-2 px-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    active-class="tab-active">
                    {{ $t('dashboard.community.tabs.home') }}
                </nuxt-link>
                <nuxt-link :to="`/dashboard/community/shoutouts`"
                    class="tab-nav-item text-center py-2 px-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    active-class="tab-active">
                    {{ $t('dashboard.community.tabs.shoutouts') }}
                </nuxt-link>

            </div>
            <div class="px-4">
                <UAlert title="¡Formemos una comunidad!" variant="solid" class="bg-twitch my-2 bg-opacity-15 text-twitch">
                    <template #title="{ title }">
                        <h2 class="text-center font-medium text-lg flex items-center justify-center">
                            <UIcon name="i-mdi-sparkles" class="mr-2" />
                            {{ title }}
                        </h2>
                    </template>

                    <template #description>
                        <p class="text-center text-pretty text-base">
                            Encontrá en esta sección las nuevas funcionalidades de comunidad que hemos preparado para ti,
                            como los Shoutouts a tus amigos y los #Teams.
                        </p>
                    </template>
                </UAlert>



                <!-- grid con las nuevas funciones dentro de cards con bordes redondeados -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 mb-4">
                    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
                        <template #header>
                            <div class="text-lg font-medium flex items-center">
                                Shoutouts a tus amigos
                                <UIcon name="i-mdi-megaphone-outline" class="ml-2" />
                            </div>
                        </template>
                        <div class="text-sm text-gray-500">
                            <p>
                                Menciona a tus amigos en el chat con un mensaje especial, y permite que Petruquio.LIVE invite
                                a tus espectadores a unirse a su comunidad.
                            </p>
                        </div>
                        <template #footer>
                            <div class="flex items-center justify-end">
                                <UButton color="primary" variant="soft" icon to="/dashboard/community/shoutouts"
                                    leading-icon="i-mdi-cog-outline">
                                    Configurar
                                </UButton>
                            </div>
                        </template>
                    </UCard>

                    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
                        <template #header>
                            <div class="text-lg font-medium flex items-center">
                                Equipos de streamers
                                <UIcon name="i-mdi-account-group-outline" class="ml-2" />
                            </div>
                        </template>
                        <div class="text-sm text-gray-500">
                            <p>
                                Crea equipos de streamers con tus amigos, y permite que tus espectadores puedan verlos
                                fácilmente.
                            </p>
                        </div>
                        <template #footer>
                            <div class="flex items-center justify-end">
                                <UButton color="primary" variant="soft" icon @click="teamsInfo"
                                    leading-icon="i-mdi-information-outline">
                                    Más información
                                </UButton>
                            </div>
                        </template>
                    </UCard>



                </div>

            </div>
        </div>
    </div>
</template>
  
<script setup>
import { useI18n } from "vue-i18n";
const toast = useToast()

const i18n = useI18n()

definePageMeta({
    layout: 'dashboard',
})

const teamsInfo = () => {
    toast.add({
        title: '¡Pronto!',
        description: 'Esta funcionalidad estará disponible muy pronto.',
        color: 'gray',
        icon: 'i-mdi-clock-outline',
    })
}

</script>
  