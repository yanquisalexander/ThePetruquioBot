<template>
  <UPopover
    :popper="{ placement: 'bottom-start', arrow: false }"
    @update:open="open = $event"
  >
    <div class="relative">
      <UButton
        color="white"
        variant="soft"
        size="md"
        @click="open = !open"
      >
        <UIcon
          name="i-ph-bell"
          class="text-xl"
        />
      </UButton>
      <div
        v-if="notifications.filter(n => !n.read).length > 0"
        class="absolute top-0 right-0 -mt-2 -mr-2"
      >
        <UBadge
          :ui="{ rounded: 'rounded-full' }"
          variant="soft"
          color="blue"
          size="sm"
        >
          {{ notifications.filter(n => !n.read).length < 10 ? notifications.filter(n => !n.read).length : '9+' }}
        </UBadge>
      </div>
    </div>
    <template #panel>
      <div class="max-w-md max-h-96 overflow-y-auto">
        <div class="w-full flex flex-col ">
          <h3 class="text-lg font-medium p-2 sticky">
            Centro de notificaciones
          </h3>
          <div
            v-if="notifications.length === 0 && !loading"
            class="text-center text-gray-400 w-full p-8"
          >
            No notifications
          </div>
          <div
            v-else-if="!loading && notifications.length > 0"
            class="flex flex-col h-full"
          >
            <template
              v-for="notification in notifications"
              :key="notification.id"
            >
              <div
                class="flex items-center justify-between p-2"
                :class="{
                  'bg-blue-50/30': !notification.read,
                  'opacity-70': notification.read
                }"
              >
                <header class="flex items-center gap-4">
                  <span class="flex items-center justify-center">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="notificationDesign(notification.type).classes"
                    >
                      <UIcon
                        :name="notificationDesign(notification.type).icon"
                      />
                    </div>
                  </span>
                  
                
                  <div class="flex flex-col">
                    <h4 class="text-sm font-medium">
                      {{ notification.title }}
                    </h4>
                    <p class="text-xs">
                      {{ notification.message }}
                    </p>
                  </div>
                </header>
             
                <div class="flex flex-col items-end">
                  <span class="text-xs text-gray-400">
                    {{ moment(notification.createdAt).fromNow() }}
                  </span>
                  <UButton
                    v-if="!notification.read"
                    color="blue"
                    title="Mark as read"
                    size="sm"
                    variant="ghost"
                    icon="i-mdi-check"
                    @click="markAsRead(notification)"
                  />
                </div>
              </div>
            </template>
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center space-y-6 w-full p-8"
          >
            <UProgress
              size="sm"
              animation="carousel"
            />
            <span class="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script lang="ts" setup>
export interface Notification {
  read: boolean | null;
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

import axios from "axios";
import moment from "moment";
const currentUser = useCurrentUser()
const toast = useToast()
const unreadNotificationsCount = ref(0);


const open = ref(false)
const loading = ref(false)
const notifications = ref<Notification[]>([])

const notificationDesign = (type: string) => {
  switch (type) {
    case 'SYSTEM_ALERT':
      return {
        classes: 'bg-blue-100 text-blue-500',
        icon: 'i-lucide-shield-check'
      }
    case 'ACCOUNT_SECURITY':
      return {
        classes: 'bg-yellow-100 text-yellow-500',
        icon: 'i-lucide-key-round'
      }
    case 'NEW_FEATURE':
      return {
        classes: 'bg-orange-100 text-orange-500',
        icon: 'i-lucide-sparkles'
      }
    case 'ANNOUNCEMENT':
      return {
        classes: 'bg-green-100 text-green-500',
        icon: 'i-lucide-party-popper'
      }
    default:
      return {
        classes: 'bg-gray-100 text-gray-500',
        icon: 'i-lucide-bell'
      }
  }
}



const fetchNotifications = async () => {
if (open.value) return;
if (loading.value) return;
  try {
    loading.value = true
    const { data } = await axios(`${API_ENDPOINT}/dashboard/notifications`, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`

      }
    })
    
    notifications.value = data.data


  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/* onMounted(async () => {
  await fetchNotifications() // Initial fetch

  const interval = setInterval(async () => {
    await fetchNotifications()
  }, 10000)

  // On lost focus of the tab, clear the interval, on focus, restart it
  window.addEventListener('blur', () => clearInterval(interval))
  window.addEventListener('focus', () => {
    clearInterval(interval)
    setInterval(async () => {
      await fetchNotifications()
    }, 10000)
  })
})
 */

// Escuchar cada vez que las notificaciones cambien
watch(notifications, (newNotifications) => {
  const newUnreadCount = newNotifications.filter(n => !n.read).length;
  // Verificar si se han agregado nuevas notificaciones no leídas
  if (newUnreadCount > unreadNotificationsCount.value) {
    // Mostrar la notificación
    toast.add({
      title: 'New notification',
      description: 'You have a new notification',
      icon: 'i-ph-bell',
      color: 'blue'
    });

    SoundManager.getInstance().playSound(Sounds.NEW_NOTIFICATION)
  }
  // Actualizar el contador de notificaciones no leídas
  unreadNotificationsCount.value = newUnreadCount;
}, { immediate: true }); // Indicar que se ejecute la primera vez inmediatamente


const markAsRead = async (notification: Notification) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/dashboard/notifications/${notification.id}/mark-as-read`, {}, {
      headers: {
        Authorization: `Bearer ${currentUser.getToken()}`
      }
    })

    if (response.status === 200) {
      notification.read = true
      toast.add({
        title: 'Notification marked as read',
        description: 'The notification has been marked as read',
        icon: 'i-heroicons-information-circle-20-solid',
        color: 'green'
      })
    }
    } catch (error) {
      console.error(error)
      toast.add({
        title: 'Error',
        description: 'An error occurred while marking the notification as read',
        icon: 'i-heroicons-information-circle-20-solid',
        color: 'red'
      })
    }
  }
  

</script>
