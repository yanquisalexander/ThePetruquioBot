<template>
  <div class="mx-auto md:px-4">
    <div class="py-4 rounded-md mt-2 mx-auto">
      <h2 class="text-2xl font-medium font-jost mb-4">
        ¿Listo para cambiarte a PetruquioLIVE<span class="text-yellow-400 font-bold">+</span>?
      </h2>
      <p class="text-gray-500 max-w-xl text-pretty">
        ¿Tu stream ha mejorado con nuestras herramientas? ¿Quieres apoyar el desarrollo de nuevas funcionalidades? ¡Cámbiate a PetruquioLIVE<span class="text-yellow-400 font-bold">+</span>!
      </p>
    </div>

    <div class="flex flex-col md:flex-row gap-4">
      <div class="w-full mx-auto md:w-1/2">
        <div class="bg-white rounded-md p-4">
          <h3 class="text-xl font-medium font-jost mb-4">
            Beneficios
          </h3>
          <ul class="list-disc list-inside">
            <li>Acceso a nuevas funcionalidades</li>
            <li>Soporte prioritario</li>
            <li>Estadísticas avanzadas</li>
            <li>
              Apoyas a la plataforma <UIcon
                name="i-mdi-heart"
                class="w-4 h-4 inline-block text-twitch-500"
              /> 
            </li>
            <li>Y mucho más...</li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col w-full md:w-1/2">
        <div class="bg-white rounded-md p-4">
          <h3 class="text-xl font-medium font-jost mb-4">
            Precio
          </h3>
          <p class="text-lg font-medium font-jost">
            $1.99/mes
          </p>
          <p class="text-sm text-gray-500">
            Suscripción mensual
          </p>
          <UButton
            :loading="loading"
            color="blue"
            class="mt-4"
            variant="soft"
            @click="startCheckout"
          >
            Cambiarme a PetruquioLIVE<span class="text-yellow-400 font-bold">+</span>
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

const loading = ref(false)

const currentUser = useCurrentUser()
  definePageMeta({
    layout: "dashboard",
    middleware: "auth",
  })

  const startCheckout = async () => {
    loading.value = true
    try {
      const { data } = await axios.post(`${API_ENDPOINT}/billing/create-checkout-session`, {}, {
        headers: {
          Authorization: `Bearer ${currentUser.getToken()}`,
        },
      })

      // rel: approve (PayPal)
      const checkoutUrl = data.links.find((link: any) => link.rel === "approve").href
      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Error starting checkout", error)
    } finally {
      loading.value = false
    }
  }

  

</script>