import axios from "axios"
import { defineStore } from 'pinia'
import { type User } from '../utils/interfaces'

export const useCurrentUser = defineStore({
  id: 'currentUserStore',
  state: () => ({
    currentUser: null,
  }),
  getters: {
    getCurrentUser: (state) => state.currentUser,
  },
  actions: {
    getToken(): string {
      const { data: user } = useAuth()
      // @ts-ignore
      return user.value?.user?.token
    },
    getUsername(): string {
      const { data: user } = useAuth()
      // @ts-ignore
      return user.value?.user?.username
    },
    getDisplayName(): string {
      const { data: user } = useAuth()
      // @ts-ignore
      return user.value?.user?.displayName || this.getUsername()
    },
    getAvatar(): string {
      const { data: user } = useAuth()
      // @ts-ignore
      return user.value?.user?.avatar
    },
    isAdmin(): boolean {
      const { data: user } = useAuth()
      // @ts-ignore
      return user.value?.user?.admin
    },
    isLoggedIn(): boolean {
      const { status } = useAuth()
      return status.value === 'authenticated'
    },
    rawUser(): User {
      const { data: user } = useAuth()
      return user.value.user as User
    },
    isImpersonating(): boolean {
      const { data: user } = useAuth()
      // @ts-ignore
      return user.value?.user?.session?.impersonatedUserId !== null
    },
    async stopImpersonating(): Promise<void> {
      await axios.delete(`${API_ENDPOINT}/admin/users/impersonate`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      })
      if (process.client) {
        window.location.reload()
      }

    },
  }
})
