import { defineStore } from 'pinia'

export const useSnackbar = defineStore({
  id: 'snackbarStore',
  state: () => ({
    snackbar: false,
    snackbarText: ''
  }),
  getters: {
    getSnackbar: (state) => state.snackbar,
    getSnackbarText: (state) => state.snackbarText,
  },
  actions: {
    showSnackbar(text: string) {
      this.snackbarText = text
      this.snackbar = true
    },
    setVisible(visible: boolean) {
      this.snackbar = visible
      setTimeout(() => {
        this.snackbar = false
      }, 3000)
    }
  },
})
