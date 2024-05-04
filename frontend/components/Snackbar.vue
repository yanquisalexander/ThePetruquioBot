<template>
  <VSnackbar v-model="snack.snackbar">
    {{ snack.snackbarText }}
    <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snack.setVisible(false)">
          Cerrar
        </v-btn>
      </template>
  </VSnackbar>
</template>

<script lang="ts" setup>
import { useSnackbar } from '~/stores/snackbar';


const snack = useSnackbar()
</script>