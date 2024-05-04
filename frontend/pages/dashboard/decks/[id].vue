<template>
  <UContainer>
    <div v-if="deck.pages && deck.pages.length > 0">
      <h1 class="text-xl font-inter font-medium text-center mt-4 mb-4 text-black">
        Editando deck "{{ deck.name }}"
      </h1>

      <div v-if="deck.pages[currentPage]">
        <div>

          <div class="flex w-full items-center justify-center">
            <h2 class="text-lg font-medium font-jost">
              Página {{ currentPage + 1 }} / {{ deck.pages.length }}
            </h2>
          </div>
          <!-- Grid de botones, de deck.rows x deck.cols -->
          <div class="grid gap-4 mx-auto mt-8 bg-black bg-opacity-85 rounded-xl p-6 max-w-3xl"
            :style="{ gridTemplateColumns: `repeat(${deck.cols}, 1fr)` }" v-if="deck.pages[currentPage]">
            <template v-for="(row, rowIndex) in buttonsGrid">
              <template v-for="(button, buttonIndex) in row">
                <div class="flex flex-col gap-2 mx-auto">
                  <div class="flex gap-2">
                    <div @click="showEditButtonModal = true; currentButton = editButton(currentPage, button.deckButtonId)"
                      @dragstart="dragStart(buttonIndex)" @dragenter="dragEnter" @dragover="dragOver"
                      @dragleave="dragLeave" @drop="drop(buttonIndex)" @dragend="dragEnd" draggable="true"
                      :style="{ backgroundImage: button?.icon ? 'url(' + button?.icon + ')' : '', backgroundSize: 'cover', backgroundPosition: 'center' }"
                      class="border-2 border-gray-400 w-24 h-24 rounded-lg hover:border-blue-500 hover:scale-105 transition-all cursor-pointer duration-200 ease-in-out">
                      <div class="flex flex-col items-center justify-center h-full">
                        <span class="text-white text-lg text-center font-jost font-medium w-full break-all">{{
                          button?.text }}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </template>
            </template>
          </div>

          <!-- Cambiador de página -->
          <div class="flex gap-2">
            <UButton @click="changePage(-1)" icon="i-mdi-chevron-left" class="mt-4" />
            <UButton @click="changePage(1)" icon="i-mdi-chevron-right" class="mt-4" />
          </div>

          <!-- Botón para crear una nueva página -->
          <div class="flex gap-2">
            <UButton @click="createNewPage" icon="i-mdi-plus-circle-outline" class="mt-4">
              {{ $t('dashboard.create_page') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="flex flex-col items-center justify-center">
        <UIcon name="i-mdi-cards-outline" class="w-16 h-16 text-gray-400" />
        <h3 class="text-gray-400 text-lg mt-4">
          {{ $t('dashboard.no_decks_pages') }}
        </h3>
        <p class="text-gray-400 text-lg mt-4">
          {{ $t('dashboard.no_decks_pages_description') }}
        </p>

        <!-- Botón para crear una nueva página cuando no hay páginas -->
        <UButton @click="createNewPage" icon="i-mdi-plus-circle-outline" class="mt-4">
          {{ $t('dashboard.create_page') }}
        </UButton>
      </div>
    </div>
    <UModal v-model="showEditButtonModal">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-lg font-medium font-jost">
            {{ $t('dashboard.edit_button') }}
          </h3>
        </template>

        <div class="flex flex-col gap-4">
          <UInput v-model="currentButton.text" :placeholder="$t('dashboard.button_text')" />
          <UInput v-model="currentButton.icon" :placeholder="$t('dashboard.button_icon')" />
          <!-- Actions -->
          <!-- Las acciones se añaden de modo secuencial en button[actions] (Es un array dinámico)-->
          <div v-for="(action, index) in currentButton.actions" :key="index">
            <h3>{{ action.name }}</h3>
            <div v-for="attribute in action.attributes" :key="attribute.name">
              <UInput v-model="currentButton.actions[index][attribute.name]"
                :placeholder="`${action.name} ${attribute.name}`" />
            </div>
          </div>

          <div>
            <UButton @click="addNewAction">Añadir Acción</UButton>
          </div>
        </div>
        <template #footer>
          <div class="flex gap-2">
            <UButton @click="showEditButtonModal = false">
              {{ $t('dashboard.cancel') }}
            </UButton>
            <UButton @click="saveButton" :loading="editingButton">
              {{ $t('dashboard.edit') }}
            </UButton>
            <div class="flex-1"></div>
            <UButton @click="deleteButton" :loading="editingButton" class="bg-red-500">
              {{ $t('dashboard.delete') }}
            </UButton>
          </div>
        </template>

      </UCard>
    </UModal>

  </UContainer>
</template>

<script setup>
import axios from "axios";

const route = useRoute()

const deckId = ref(route.params.id);
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
const currentUser = useCurrentUser();
const toast = useToast();

const deck = ref({});
const currentPage = ref(0);
const showEditButtonModal = ref(false);
const currentButton = ref({});
const editingButton = ref(false);
const isDragging = ref(false);
const draggedButtonIndex = ref(-1);

const buttonsGrid = computed(() => {
  const grid = [];
  for (let i = 0; i < deck.value.rows; i++) {
    grid.push([]);
    for (let j = 0; j < deck.value.cols; j++) {
      grid[i].push(deck.value.pages[currentPage.value].buttons[i * deck.value.cols + j]);
    }
  }
  return grid;
});

const editButton = (pageIdx, buttonId) => {
  console.log(pageIdx, buttonId);
  if (!deck.value.pages[pageIdx]) return null;
  if (!deck.value.pages[pageIdx].buttons) return null;
  return Object.assign({}, deck.value.pages[pageIdx].buttons.find(b => b.deckButtonId === buttonId));
};

const saveButton = async () => {
  try {
    editingButton.value = true;
    // if buttonId is null, then it's a new button
    if (currentButton.value.deckButtonId) {
      await axios.put(`${API_ENDPOINT}/decks/${deckId.value}/${deck.value.pages[currentPage.value].deckPageId}/button/${currentButton.value.deckButtonId}`, {
        text: currentButton.value.text,
        icon: currentButton.value.icon,
        actions: JSON.stringify(currentButton.value.actions),
      }, {
        headers: {
          Authorization: `Bearer ${currentUser.getToken()}`
        }
      });
    } else {
      console.log
      await axios.post(`${API_ENDPOINT}/decks/${deckId.value}/${deck.value.pages[currentPage.value].deckPageId}/button`, {
        text: currentButton.value.text,
        icon: currentButton.value.icon,
        actions: JSON.stringify(currentButton.value.actions),
      }, {
        headers: {
          Authorization: `Bearer ${currentUser.getToken()}`
        }
      });
    }
    showEditButtonModal.value = false;
    fetchDeck();
  } catch (error) {
    console.error(error);
  } finally {
    editingButton.value = false;
  }
};

const deleteButton = async () => {
  try {
    editingButton.value = true;
    await axios.delete(`${API_ENDPOINT}/decks/${deckId.value}/${deck.value.pages[currentPage.value].deckPageId}/button/${currentButton.value.deckButtonId}`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    });
    showEditButtonModal.value = false;
    fetchDeck();
  } catch (error) {
    console.error(error);
  } finally {
    editingButton.value = false;
  }
};

// Lógica para ordenar los botones mediante drag and drop

const dragStart = (buttonIndex) => {
  isDragging.value = true;
  draggedButtonIndex.value = buttonIndex;
};

const dragEnter = (event) => {
  event.preventDefault();
};

const dragOver = (event) => {
  event.preventDefault();
};

const dragLeave = (event) => {
  event.preventDefault();
};

const drop = async (buttonIndex) => {
  if (isDragging.value) {
    if (!deck.value.pages[currentPage.value].buttons[draggedButtonIndex.value]) {
      toast.add({
        icon: 'i-mdi-alert-circle-outline',
        title: 'Error',
        description: 'El botón que estás intentando mover no existe',
        color: 'red',
      });
      return;
    }

    try {
      const draggedButton = deck.value.pages[currentPage.value].buttons[draggedButtonIndex.value];
      const droppedButton = deck.value.pages[currentPage.value].buttons[buttonIndex];

      // Construye el nuevo orden de los botones
      const updatedButtonsOrder = deck.value.pages[currentPage.value].buttons.map(b => b.deckButtonId);

      // Intercambia los identificadores de los botones para reflejar el nuevo orden
      [updatedButtonsOrder[draggedButtonIndex.value], updatedButtonsOrder[buttonIndex]] =
        [updatedButtonsOrder[buttonIndex], updatedButtonsOrder[draggedButtonIndex.value]];

      // Envia la solicitud PUT al servidor para actualizar el orden
      await axios.put(`${API_ENDPOINT}/decks/${deckId.value}/${deck.value.pages[currentPage.value].deckPageId}/buttons/update-positions`, {
        buttonsOrder: updatedButtonsOrder,
      }, {
        headers: {
          Authorization: `Bearer ${currentUser.getToken()}`
        }
      });

      // Recarga el deck después de la actualización
      fetchDeck();
    } catch (error) {
      console.error(error);
    } finally {
      isDragging.value = false;
      draggedButtonIndex.value = -1;
    }
  }
};






const changePage = (amount) => {
  if (currentPage.value + amount >= 0 && currentPage.value + amount < deck.value.pages.length) {
    currentPage.value += amount;
  }
};

const fetchDeck = async () => {
  try {
    const { data } = await axios.get(`${API_ENDPOINT}/decks/${route.params.id}`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    });
    deck.value = data.data.deck;
    useHead({
      title: `Editando deck "${deck.value.name}"`,
    });
  } catch (error) {
    console.error(error);
  }
};

const createNewPage = async () => {
  try {
    const { data } = await axios.post(`${API_ENDPOINT}/decks/${route.params.id}/page`, {}, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    });
    fetchDeck();
  } catch (error) {
    console.error(error);
  }
};

// SEND_MESSAGE, PLAY_SOUND, CHANGE_OBS_SCENE
/**
 * 
 * SEND_MESSAGE: attributes: message
 * PLAY_SOUND: attributes: sound, volume
 * CHANGE_OBS_SCENE: attributes: scene
 */
const actionsTemplate = [
  {
    name: 'SEND_MESSAGE',
    attributes: [
      {
        name: 'message',
        type: 'string',
      }
    ]
  },
  {
    name: 'PLAY_SOUND',
    attributes: [
      {
        name: 'sound',
        type: 'string',
      },
      {
        name: 'volume',
        type: 'number',
      }
    ]
  },
  {
    name: 'CHANGE_OBS_SCENE',
    attributes: [
      {
        name: 'scene',
        type: 'obs_scene',
      }
    ]
  }
];

const addNewAction = () => {
  try {
    const defaultAction = actionsTemplate[0];
    console.log('defaultAction:', defaultAction);
    console.log('currentButton:', currentButton.value);

    if (!Array.isArray(currentButton.value.actions)) {
      currentButton.value.actions = [];
    }

    currentButton.value.actions.push({
      name: defaultAction.name,
      // Add attributes with value:
      attributes: defaultAction.attributes.reduce((acc, attribute) => {
        acc[attribute.name] = '';
        return acc;
      }, {})
    });

    console.log('currentButton after adding action:', currentButton.value);
  } catch (error) {
    console.error('Error in addNewAction:', error);
  }
};



onMounted(() => {
  fetchDeck();
});
</script>