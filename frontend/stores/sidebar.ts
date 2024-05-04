import { defineStore } from 'pinia'

export const useSidebar = defineStore({
  id: 'sidebarStore',
  state: () => ({
    sidebarVisible: false,
  }),
  getters: {
    getSidebarVisibility: (state) => state.sidebarVisible,
  },
  actions: {
    showSidebar() {
      this.sidebarVisible = true
    },
    hideSidebar() {
      this.sidebarVisible = false
    },
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible
      console.log(this.sidebarVisible)
    },
  },
})
