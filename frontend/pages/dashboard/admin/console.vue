<template>
    <v-container class="mx-auto max-w-full">
      <div class="px-6 py-4 rounded-md mt-2 mx-auto">
        <h2 class="text-2xl font-medium font-poppins mb-4">{{ t('dashboard.admin.console') }}</h2>
      </div>
  
      <div id="terminal">
        <div class="bg-black font-mono text-white overflow-y-scroll h-96 overscroll-x-scroll p-4">
          <div v-for="output in outputs" :key="output">{{ output }}</div>
        </div>
        <v-text-field
          class="mb-4"
          v-model="command"
          placeholder="Escriba un comando"
          @keyup.enter="postCommand(command)"
          @keyup.tab="autocompleteCommand"
        />
      </div>
  
      <v-snackbar v-model="snackbar">
        {{ snackbarText }}
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="snackbar = false">Cerrar</v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </template>
  
  <script setup>
  import axios from 'axios';
  import { ref, onMounted } from 'vue';
  const config = useRuntimeConfig();
  const { t } = useI18n();
  const { status, data, signOut } = useAuth();
  const { user } = data.value;
  
  const snackbar = ref(false);
  const snackbarText = ref('');
  const command = ref('');
  const outputs = ref([]);
  
  definePageMeta({
    middleware: 'auth',
    layout: 'dashboard',
    title: 'Panel de Control',
    description: 'Panel de control de Petruquio.LIVE',
    image: 'https://petruquio.live/img/logo.png',
    url: 'https://petruquio.live/dashboard',
    robots: 'noindex,nofollow',
  });
  
  const postCommand = async () => {
    outputs.value.push(`> ${command.value}`);
    const response = await axios.post(`${config.public.API_URL}/admin/console`, {
      command: command.value,
    }, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    command.value = '';
  
    if (response.status === 200) {
      outputs.value.push(response.data.data.output);
    } else {
      snackbarText.value = 'Error al ejecutar el comando';
      snackbar.value = true;
    }
  };
  
  const autocompleteCommand = () => {
    // Implement autocomplete logic here
  };
  
  onMounted(() => {
    // Set focus on the text field when the component is mounted
    const textField = document.querySelector('.v-text-field__input');
    if (textField) {
      textField.focus();
    }
  });
  </script>
  