<template>
    <div class="extras--got-talent">
        <section>
            <h1 class="text-2xl font-semibold">
                <v-icon class="mr-2">mdi-star</v-icon>
                <nuxt-link to="/dashboard/extras" class="hover:underline">
                    Extras
                </nuxt-link> / Got Talent
            </h1>
            <p class="text-gray-500">
                ¿Listo para encontrar a los mejores talentos de tu comunidad?
            </p>
        </section>
        <section class="mt-16">
            <h2 class="text-xl font-semibold">
                ¿Como funciona?
            </h2>
            <p class="text-gray-500">
                El Overlay de Got Talent te permite crear un concurso de talentos en tu canal de Twitch. Los espectadores
                pueden votar por los participantes y los jueces pueden darles una X si no les gusta la actuación.
            </p>

            <!-- Campo de v-text con botón para copiar url de overlay, y otro con el link para jurado -->
            <div class="mt-8">
                <v-row>
                    <v-col cols="12" md="6">
                        <v-card elevation="10">

                            <v-card-title>
                                <h2 class="text-xl font-semibold">
                                    URL de overlay
                                </h2>
                            </v-card-title>
                            <v-card-text>
                                <p class="text-gray-500">
                                    Inserta esta URL en tu OBS para mostrar el overlay a tus espectadores
                                </p>
                                <v-text-field label="URL para espectadores" outlined dense readonly class="mt-4"
                                    :model-value="`https://petruquio.live/overlays/extras/got-talent?channel=${user.user.username}`"
                                    append-icon="mdi-content-copy" @click:append="copyUrl(false)"></v-text-field>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-card elevation="10">
                            <v-card-title>
                                <h2 class="text-xl font-semibold">
                                    URL para jurado
                                </h2>
                            </v-card-title>
                            <v-card-text>
                                <p class="text-gray-500">
                                    Esta URL permite a los jueces presionar los botones de X en sus dispositivos
                                    móviles.<br /><br />
                                    <b>Nota:</b> Por seguridad, los miembros del jurado deben iniciar sesión en
                                    Petruquio.LIVE
                                </p>
                                <v-text-field label="URL para jurado" outlined dense readonly class="mt-4"
                                    :model-value="`https://petruquio.live/overlays/extras/got-talent?channel=${user.user.username}&companion=true`"
                                    append-icon="mdi-content-copy" @click:append="copyUrl(true)"></v-text-field>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

            </div>


        </section>
        <section class="mt-8">
            <h2 class="text-xl font-semibold">Jurado</h2>
            <p class="text-gray-500">
                Aquí puedes agregar a los jueces que evaluarán a los participantes.
            </p>
            <div class="mt-4">
                <v-text-field v-model="judgeToAdd" label="Nombre de usuario" outlined dense class="w-full"
                    placeholder="Nombre de usuario"></v-text-field>
                <v-btn @click="addJudge" class="mt-4" color="primary">
                    Agregar
                </v-btn>
            </div>
            <div class="mt-4">
                <table class="table-auto w-full border-1 border-gray-200">
                    <thead>
                        <tr>
                            <th class="px-4 py-2">

                            </th>
                            <th class="px-4 py-2">Avatar</th>
                            <th class="px-4 py-2">Nombre a mostrar</th>
                            <th class="px-4 py-2">Usuario</th>
                            <th class="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <draggable tag="tbody" v-model="judges" group="judges" @end="onEnd" handle=".handle" item-key="judges.">
                        <template #item="{ element, index }">
                            <tr class="border-b border-gray-200 hover:bg-gray-100 v-data-table__tr"
                                :key="element.twitch_id">
                                <td class="v-data-table__td v-data-table-column--align-start">
                                    <v-btn icon class="handle" variant="text" small>
                                        <v-icon small>mdi-menu</v-icon>
                                    </v-btn>
                                </td>
                                <td class="v-data-table__td v-data-table-column--align-start">
                                    <v-avatar size="32">
                                        <img :src="element.avatar" />
                                    </v-avatar>
                                </td>
                                <td class="v-data-table__td v-data-table-column--align-start">
                                    <span class="font-semibold">{{ element.judge_name || element.username }}</span>
                                </td>
                                <td class="v-data-table__td v-data-table-column--align-start">
                                    <span>{{ element.username }}</span>
                                </td>
                                <td class="v-data-table__td v-data-table-column--align-start">
                                    <v-btn size="small" variant="text" color="error" @click="openDeleteDialog(element)">
                                        Eliminar
                                    </v-btn>
                                    <v-btn size="small" variant="text" color="primary" @click="showEditDialog(element)">
                                        Editar
                                    </v-btn>
                                </td>
                            </tr>
                        </template>
                    </draggable>
                </table>
            </div>
            <v-dialog v-model="deleteDialog" max-width="400">
                <v-card>
                    <v-card-title class="text-h5">Eliminar juez</v-card-title>
                    <v-card-text>
                        ¿Estás seguro de que quieres eliminar al juez <b>{{ selectedJudge.username }}</b>?
                    </v-card-text>
                    <v-card-actions>
                        <v-btn variant="text" @click="closeDeleteDialog">Cancelar</v-btn>
                        <v-btn color="error" @click="deleteJudge">Eliminar</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <v-dialog v-model="editDialog" max-width="400">
                <v-card>
                    <v-card-title class="text-h5">Editar juez</v-card-title>
                    <v-card-text>
                        <v-text-field variant="outlined" v-model="editJudgeName" label="Nombre del juez" />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn variant="text" @click="editDialog = false">Cancelar</v-btn>
                        <v-btn color="primary" @click="editJudge">Editar</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </section>
        <section class="mt-4 actual-session">
            <!-- Muestra a los jueces, con botón de limpiar la x -->
            <!-- También debe haber otro botón aparte para limpiar todas las x -->

            <h2 class="text-xl font-semibold">Sesión actual</h2>
            <p class="text-gray-500">
                Aquí puedes ver la sesión actual y limpiarla.
            </p>

            <div class="mt-4">
                <v-btn @click="clearCrosses" color="primary">
                    Limpiar todas las X
                </v-btn>
                <v-btn @click="reloadOverlay" color="primary" class="ml-4">
                    Recargar overlay
                </v-btn>
            </div>

            <div class="mt-4">
                <v-data-table :headers="headers" :items="judges" :items-per-page="10" class="elevation-1">
                    <template v-slot:item.avatar="{ item }">
                        <v-avatar size="32">
                            <img :src="item.avatar" />
                        </v-avatar>
                    </template>
                    <template v-slot:item.judge_name="{ item }">
                        <span class="font-semibold">{{ item.judge_name || item.username }}</span>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn size="small" variant="text" color="error" @click="clearJudgeCrosses(item)">
                            Eliminar X
                            <v-tooltip activator="parent" location="bottom">
                                Limpiar X de {{ item.judge_name || item.username }}
                            </v-tooltip>
                        </v-btn>
                    </template>
                </v-data-table>
            </div>

        </section>
    </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import draggable from 'vuedraggable'
const { showSnackbar } = useSnackbar();
definePageMeta({
    layout: 'dashboard',
    middleware: 'auth',
})


const { data: user } = useAuth();
const judges = ref([]);
const judgeToAdd = ref('');
const deleteDialog = ref(false);
const selectedJudge = ref(null);
const editJudgeName = ref('');
const editDialog = ref(false);

const headers = ref([
    { title: 'Avatar', key: 'avatar' },
    { title: 'Nombre a Mostrar', key: 'judge_name' },
    { title: 'Usuario', key: 'username' },
    { title: 'Acciones', key: 'actions' },
]);


const fetchJudges = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/channel/extras/got-talent/judges`, {
            headers: {
                Authorization: `Bearer ${user.value.user.token}`,
            },
        });

        if (response.status === 200) {
            judges.value = response.data.data.judges;
        }
    } catch (error) {
        console.error(error);
    }
};

const addJudge = async () => {
    try {
        const response = await axios.post(
            `${API_ENDPOINT}/channel/extras/got-talent/judges`,
            {
                username: judgeToAdd.value,
            },
            {
                headers: {
                    Authorization: `Bearer ${user.value.user.token}`,
                },
            }
        );

        if (response.status === 200) {
            judgeToAdd.value = '';
            showSnackbar('Juez agregado correctamente');
            await fetchJudges();
        }
    } catch (error) {
        console.error(error);
    }
};

const deleteJudge = async () => {
    try {
        const response = await axios.delete(`${API_ENDPOINT}/channel/extras/got-talent/judges`, {
            data: {
                twitchId: selectedJudge.value.twitch_id,
            },
            headers: {
                Authorization: `Bearer ${user.value.user.token}`,
            },
        });

        if (response.status === 200) {
            await fetchJudges();
            showSnackbar('Juez eliminado correctamente');
            closeDeleteDialog();
        }
    } catch (error) {
        console.error(error);
    }
};

const clearCrosses = async () => {
    try {
        const response = await axios.post(`${API_ENDPOINT}/channel/extras/got-talent/clear-crosses`, null, {
            headers: {
                Authorization: `Bearer ${user.value.user.token}`,
            },
        });

        if (response.status === 200) {
            showSnackbar('Todas las X han sido eliminadas');
            await fetchJudges();
        }
    } catch (error) {
        console.error(error);
    }
};

const reloadOverlay = async () => {
    try {
        const response = await axios.post(`${API_ENDPOINT}/channel/extras/got-talent/reload-overlay`, null, {
            headers: {
                Authorization: `Bearer ${user.value.user.token}`,
            },
        });

        if (response.status === 200) {
            showSnackbar('Overlay recargado');
        }
    } catch (error) {
        console.error(error);
    }
};

const copyUrl = (judge: Boolean = false) => {
    navigator.clipboard.writeText(
        `https://petruquio.live/overlays/extras/got-talent?channel=${user.value.user.username}${judge ? '&companion=true' : ''}`
    );
    showSnackbar('URL copiada al portapapeles');
};



const clearJudgeCrosses = async (judge) => {
    try {
        const response = await axios.put(
            `${API_ENDPOINT}/channel/extras/got-talent/clear-cross`,
            {
                twitchId: judge.twitch_id,
            },
            {
                headers: {
                    Authorization: `Bearer ${user.value.user.token}`,
                },
            }
        );

        if (response.status === 200) {
            showSnackbar(`X de ${judge.judge_name || judge.username} eliminada`);
            await fetchJudges();
        }
    } catch (error) {
        console.error(error);
    }
};

const openDeleteDialog = (judge) => {
    selectedJudge.value = judge;
    deleteDialog.value = true;
};

const closeDeleteDialog = () => {
    deleteDialog.value = false;
};

const showEditDialog = (judge) => {
    selectedJudge.value = judge;
    editJudgeName.value = judge.judge_name;
    editDialog.value = true;
};

const editJudge = async () => {
    try {
        let newName = editJudgeName.value
        if (newName && newName.trim() === '') {
            newName = null;
        }

        const response = await axios.put(
            `${API_ENDPOINT}/channel/extras/got-talent/update-name`,
            {
                twitchId: selectedJudge.value.twitch_id,
                name: newName,
            },
            {
                headers: {
                    Authorization: `Bearer ${user.value.user.token}`,
                },
            }
        );

        if (response.status === 200) {
            editDialog.value = false;
            showSnackbar('Nombre del juez actualizado');
            await fetchJudges();
        }
    } catch (error) {
        console.error(error);
    }
};


const onEnd = async (evt: any) => {
    const updatedJudgesOrder = judges.value.map(judge => judge.twitch_id);

    try {
        const response = await axios.put(
            `${API_ENDPOINT}/channel/extras/got-talent/update-positions`,
            {
                judgesOrder: updatedJudgesOrder,
            },
            {
                headers: {
                    Authorization: `Bearer ${user.value.user.token}`,
                },
            }
        );

        if (response.status === 200) {
            showSnackbar('Orden de los jueces actualizado correctamente');
            // Re-fetch judges after successful update
            await fetchJudges();
        }
    } catch (error) {
        console.error(error);
    }
};

await fetchJudges();
</script>
  
<style scoped>
.elevation-10 {
    box-shadow: #919eab4d 0 0 2px, #919eab1f 0 12px 24px -4px !important;
}
</style>