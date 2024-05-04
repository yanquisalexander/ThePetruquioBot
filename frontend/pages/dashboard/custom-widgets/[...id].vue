<template>
  <div class="mx-auto md:px-4">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        Editor de widgets - {{ widgetId }}
      </h2>
    </div>


    <div v-if="loading" class="flex items-center justify-center p-16">
      <UProgress animation="carousel" />
    </div>

    <div v-if="isMobile" class="flex items-center justify-center p-16">
      <p class="text-red-500 font-weight-bold">Esta página no está disponible en dispositivos móviles.</p>
    </div>

    <div v-if="!loading && !isMobile && !widgetData.json" class="flex items-center justify-center p-16">
      <p class="text-red-500 font-weight-bold">No se pudo cargar el widget.</p>
    </div>

    <div v-if="!loading && !isMobile && widgetData.json" class="mx-auto">
      <div class="flex justify-end mb-4">
        <UButton variant="soft" color="blue" icon="i-mdi-check" @click="saveWidget">
          Guardar cambios
        </UButton>
      </div>
      <!-- Render the widget editor -->
      <div class="grid grid-cols-12 gap-2 mx-auto">
        <!-- Selector de evento y como childs tiene las variaciones (state) -->
        <div class="col-span-3">
          <div class="flex flex-col">
            <UCard :ui="{ body: { padding: 'px-4 py-5 sm:p-4' } }">
              <div class="flex mb-4">
                <h3 class="text-lg font-medium mb-2">
                  Eventos
                </h3>
                <div class="flex-grow"></div>
                <UButton variant="soft" color="blue" icon="i-mdi-plus" @click="addEventModal = true">
                </UButton>
              </div>
              <UAccordion :items="eventsAndVariations" color="violet" class="mb-4" multiple
                :ui="{ wrapper: 'flex flex-col w-full' }" size="lg">
                <template #item="{ item }">
                  <div class="flex items-center justify-between w-full">
                    <div class="flex flex-col">
                      <span class="text-sm font-medium">{{ item.label }}</span>
                      <span class="text-xs text-gray-500">{{ item.variations.length }} variaciones</span>
                      <!-- Bucle correctamente ubicado dentro de la plantilla -->
                      <template v-for="variation in item.variations">
                        <div class="flex items-center justify-between my-2">
                          <span class="text-xs font-medium">{{ variation.label }}</span>
                          <div class="flex-grow"></div>
                          <UButton variant="soft" color="blue" icon="i-mdi-pencil" @click="selectVariation(variation)">
                          </UButton>
                        </div>
                      </template>

                      <div class="mt-2">
                        <UButton variant="soft" color="blue" icon="i-mdi-plus" @click="addVariation(item.label)">
                          Agregar variación
                        </UButton>
                        <UButton variant="soft" color="red" icon="i-mdi-trash-can-outline" class="mt-2"
                          @click="deleteEvent(item.label)">
                          Eliminar evento
                        </UButton>
                      </div>
                    </div>
                  </div>
                </template>
              </UAccordion>
            </UCard>
          </div>
        </div>

        <!-- Preview -->
        <div class="col-span-6 mx-4">
          <h3 class="text-lg font-medium mb-2">Preview</h3>
          <!-- Agrega aquí la sección de preview -->
          <pre>
              <p class="text-md font-medium mb-2">
                {{ JSON.stringify(widgetData.json, null, 2) }}
              </p>
            </pre>
          <div v-if="currentSelectedVariation">
            
            <!-- Puedes mostrar la vista previa según el eventType seleccionado -->
          </div>
        </div>

        <!-- Propiedades -->
        <div class="col-span-3">
          <UCard :ui="{ body: { padding: 'px-4 py-5 sm:p-4' } }">
            <h3 class="text-lg font-medium mb-2">
              Propiedades
            </h3>
            <div v-if="!currentSelectedVariation" class="flex items-center justify-center p-16">
              <p class="text-sm font-medium">Selecciona una variación para ver sus propiedades.</p>
            </div>
            <UAccordion :items="variationProperties" color="orange" class="mb-4" multiple defaultOpen
              :ui="{ wrapper: 'flex flex-col w-full' }" size="lg" v-if="currentSelectedVariation">
              <template #item="{ item }">
                <div class="flex items-center justify-between w-full">
                  <div class="flex flex-col">
                    <UFormGroup label="Variation name" v-if="item.label === 'name'">
                      <!-- Configuración específica para 'text' -->
                      <UInput v-model="currentSelectedVariation.data.name" />
                    </UFormGroup>

                    <template v-for="(setting, key) in item.value" :key="key">
                      <template v-if="item.label !== 'name'">
                        <UFormGroup :label="$t(`widgets.settings.${key}`)" class="mb-4">
                          <template v-if="setting.setting_type === 'slider'">
                            <URange v-model="setting.value" :min="setting.min" :max="setting.max" :step="setting.step" />
                            <span class="text-xs text-gray-500">{{ setting.value }}</span>
                          </template>
                          <template v-else-if="setting.setting_type === 'color'">
                            <UColorPicker v-model="setting.value" />
                          </template>
                          <template v-else-if="setting.setting_type === 'font'">
                            <USelect v-model="setting.value" :options="['Arial', 'Roboto', 'Jost']" />
                          </template>
                          <template v-else-if="setting.setting_type === 'text'">
                            <UInput v-model="setting.value" />
                          </template>
                          <template v-else-if="setting.setting_type === 'upload'">
                            <UInput v-model="setting.src" />
                            <!--
                              At the moment, we don't have a way to upload files to the server.
                            -->
                          </template>


                        </UFormGroup>
                      </template>
                    </template>

                  </div>
                </div>
              </template>
              <template #conditions>
                <UButton variant="soft" color="blue" icon="i-mdi-plus" @click="manageConditionsModal = true">
                  Administrar condiciones

                </UButton>
              </template>
            </UAccordion>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Modal para manejar condiciones
          Las condiciones deben ser algo como
                              "conditions": {
                        "amount": {
                            ">=": 500
                        }
                    },


          O,

          "conditions": {
                        "rewardId": {
                            "===": "5f6f7f5e-5b7a-4f3e-8f2a-5d8b3e1a2b3c"
                        }
                    },

    
    -->
    <UModal v-model="manageConditionsModal" :ui="{ wrapper: 'w-full' }" prevent-close>
      <UCard :ui="{ body: { base: 'max-h-96 overflow-y-auto' } }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium mb-2">
              Condiciones
            </h3>
            <div class="flex-grow"></div>
            <UButton variant="soft" color="blue" icon="i-mdi-plus" @click="addConditionModal = true">
              Agregar condición
            </UButton>
          </div>
        </template>
        <div class="flex flex-col">
          <div v-for="(condition, index) in currentSelectedVariation.data.conditions" :key="index">
            <UFormGroup label="Propiedad">
              <USelect v-model="condition.property" :options="['amount', 'rewardId', 'rewardName']" />
            </UFormGroup>
            <UFormGroup label="Operador">
              <USelect v-model="condition.operator" :options="['>=', '===']" />
            </UFormGroup>
            <UFormGroup label="Valor">
              <UInput v-model="condition.value" />
            </UFormGroup>
            <UDivider color="gray" class="my-4" />
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-end">
            <UButton variant="soft" color="blue" icon="i-mdi-check" @click="manageConditionsModal = false">
              Guardar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal para agregar condición -->

    <UModal v-model="addConditionModal" :ui="{ wrapper: 'w-full' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium mb-2">
              Agregar condición
            </h3>
          </div>
        </template>
        <div class="flex flex-col">
          <UFormGroup label="Propiedad">
            <USelect v-model="conditionToAdd.property" :options="['amount', 'rewardId', 'rewardName']" />
          </UFormGroup>
          <UFormGroup label="Operador">
            <USelect v-model="conditionToAdd.operator" :options="['>=', '===']" />
          </UFormGroup>
          <UFormGroup label="Valor">
            <UInput v-model="conditionToAdd.value" />
          </UFormGroup>
        </div>
        <template #footer>
          <div class="flex items-center justify-end">
            <UButton variant="soft" color="blue" icon="i-mdi-check" @click="addCondition">
              Guardar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal para agregar evento -->

    <UModal v-model="addEventModal" :ui="{ wrapper: 'w-full' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium mb-2">
              Agregar evento
            </h3>
          </div>
        </template>
        <div class="flex flex-col">
          <UFormGroup label="Evento">
            <USelect v-model="eventToAdd.event_type" :options="['rewardRedeemed', 'amountDonated', 'follow']" />
          </UFormGroup>
        </div>
        <template #footer>
          <div class="flex items-center justify-end">
            <UButton variant="soft" color="blue" icon="i-mdi-check" @click="addEvent">
              Guardar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

  </div>
</template>


<script setup lang="ts">
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const currentUser = useCurrentUser();
const toast = useToast();
const i18n = useI18n();
const route = useRoute();
const { isMobile } = useDevice();

const loading = ref(true);
const widgetId = ref(route.params.id[0]);
const widgetData = ref<any>({});
const currentSelectedVariation = ref(null);

const manageConditionsModal = ref(false);
const addConditionModal = ref(false);
const addEventModal = ref(false);

const eventToAdd = ref({
  event_type: '',
});

const conditionToAdd = ref({
  property: '',
  operator: '',
  value: '',
});

const addEvent = () => {
  if (!widgetData.value.json?.configStates) widgetData.value.json.configStates = [];
  // Si ya existe el evento, no lo agrega
  if (widgetData.value.json?.configStates?.find((configState) => configState.event_type === eventToAdd.value.event_type)) {
    toast.add({
      color: 'red',
      description: 'Ya existe un evento con ese nombre',
      title: 'Error',
      icon: 'i-mdi-alert-circle-outline',
    });
    return;
  }

  widgetData.value.json.configStates.push({
    event_type: eventToAdd.value.event_type,
    states: [],
  });
  addEventModal.value = false;
};

const addCondition = () => {
  console.log(currentSelectedVariation.value.data.conditions);
  currentSelectedVariation.value.data.conditions.push({
    ...conditionToAdd.value,
  });
  addConditionModal.value = false;
};

const fetchWidget = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(`${API_ENDPOINT}/channel/widgets/${widgetId.value}`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    });
    widgetData.value = data.data;
    console.log(data);
  } catch (error) {
    console.log(error);
    toast.add({
      color: 'red',
      description: 'No se pudo cargar el widget',
      title: 'Error',
      icon: 'i-mdi-alert-circle-outline',
    });
  } finally {
    loading.value = false;
  }
};

const selectVariation = (variation) => {
  console.log(variation);
  currentSelectedVariation.value = variation;
};

const eventsAndVariations = computed(() => buildEventTree(widgetData.value.json.configStates));

const buildEventTree = (configStates) => {
  if (!configStates) return [];

  return configStates.map((eventType) => ({
    label: eventType.event_type,
    variations: eventType.states.map((state) => ({
      label: state.name,
      data: state,
    })),
  }));
};

const variationProperties = computed(() => buildVariationProperties(currentSelectedVariation.value));


const buildVariationProperties = (variation) => {
  if (!variation) return [];

  return Object.keys(variation.data).map((key) => ({
    label: key,
    value: variation.data[key],
    // only apply slot to condition
    slot: key === 'conditions' ? 'conditions' : undefined,
  }));
};

const deleteEvent = (eventType) => {
  console.log(eventType);
  widgetData.value.json.configStates = widgetData.value.json.configStates.filter((configState) => configState.event_type !== eventType);
};


const settingsModel = ref<any>({
  name: 'Nueva variación',
  alert_settings: {
    image_or_video: {
      setting_type: 'upload',
      src: '', // Propiedad específica para 'upload'
    },
    sound_href: {
      setting_type: 'upload',
      src: '', // Propiedad específica para 'upload'
    },
    sound_volume: {
      setting_type: 'slider',
      value: 0, // Propiedad específica para 'slider'
      min: 0,
      max: 100,
      step: 1,
    },
    alert_duration: {
      setting_type: 'slider',
      value: 0,
      min: 0,
      max: 100,
      step: 1,
    },
  },
  text_settings: {
    text: {
      setting_type: 'text',
      value: '',
    },
    font_size: {
      setting_type: 'slider',
      value: 0,
      min: 0,
      max: 100,
      step: 1,
    },
    font_color: {
      setting_type: 'color',
      value: '',
    },
    highlight_color: {
      setting_type: 'color',
      value: '',
    },
    font_family: {
      setting_type: 'font',
      value: '',
    },
    font_weight: {
      setting_type: 'slider',
      value: 0,
      min: 0,
      max: 900,
      step: 100,
    },
  },
  conditions: [],

});

const addVariation = (eventType) => {
  console.log(eventType);
  widgetData.value.json.configStates = widgetData.value.json.configStates.map((configState) => {
    if (configState.event_type === eventType) {
      configState.states.push({
        ...settingsModel.value,
      });
    }
    return configState;
  });
};

const saveWidget = async () => {
  loading.value = true;
  try {
    const { data } = await axios.put(`${API_ENDPOINT}/channel/widgets/${widgetId.value}`, {
      json: widgetData.value.json,
    }, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`,
      },
    });
    console.log(data);
    toast.add({
      color: 'green',
      description: 'Se guardaron los cambios correctamente',
      title: 'Éxito',
      icon: 'i-mdi-check',
    });
  } catch (error) {
    console.log(error);
    toast.add({
      color: 'red',
      description: 'No se pudo guardar el widget',
      title: 'Error',
      icon: 'i-mdi-alert-circle-outline',
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchWidget();
});
</script>