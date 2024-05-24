<template>
  <div id="donate" class="min-h-screen">
    <div role="alert" class="alert rounded-none bg-green-400" v-if="donated">
      <CheckCircleIcon class="w-6 h-6 mr-2 inline-block" />
      <span class="font-gabarito">
        <strong>Thank you!</strong> Your donation helps keep Petruquio.LIVE running!
      </span>
    </div>
    <section class="mt-24 max-w-5xl mx-auto px-4">
      <h1 class="text-3xl font-medium font-gabarito">
        <HeartHandshakeIcon class="w-8 h-8 mr-2 inline-block" />
        Donate
      </h1>
      <p class="text-lg font-gabarito">
        If you like Petruquio.LIVE, consider donating to help keep it running!
      </p>
      <div class="flex flex-col md:flex-row mt-8">
        <a href="https://www.buymeacoffee.com/alexitoo"
          class="flex px-4 py-2 rounded-md bg-yellow-400 animate-fade-down animate-delay-[120ms] mb-2 md:mb-0 md:mr-2 group hover:shadow-lg transition-all duration-200 ease-in-out hover:bg-black hover:text-white">
          <ArrowTopRightOnSquareIcon
            class="w-5 h-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-200 ease-in-out" />
          Buy me a coffee
        </a>
        <a href="https://paypal.me/alexitoouy" class="flex px-4 py-2 rounded-md bg-blue-500 text-white animate-fade-down animate-delay-[120ms] mb-2 md:mb-0 md:mr-2 group hover:shadow-lg transition-all duration-200 ease-in-out hover:bg-black">
          <ArrowTopRightOnSquareIcon
            class="w-5 h-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-200 ease-in-out" />
          Donate with PayPal
        </a>
      </div>
      <UDivider label="OR" />

      <div class="flex flex-col mt-8">
        <!-- ¿Estás en Uruguay -->
        <h2 class="text-2xl font-medium font-gabarito">
          ¿Estás en Uruguay?
        </h2>
        <p class="text-lg font-gabarito">
          Podés donar mediante MercadoPago
        </p>
        <div class="flex flex-col md:flex-row mt-8">
          <a href="https://link.mercadopago.com.uy/alexitoo"
            class="flex px-4 py-2 rounded-md bg-blue-500 text-white animate-fade-down animate-delay-[120ms] mb-2 md:mb-0 md:mr-2 group hover:shadow-lg transition-all duration-200 ease-in-out hover:bg-black">
            <ArrowTopRightOnSquareIcon
              class="w-5 h-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-200 ease-in-out" />
            Donar con MercadoPago
          </a>

          
        </div>
      </div>
    </section>



  </div>
</template>

<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { HeartHandshakeIcon, CheckCircleIcon } from 'lucide-vue-next'

const donated = ref(false)

const addListenerToAllButtons = () => {
  const buttons = document.querySelectorAll('a.btn')
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      donated.value = true
    })
  })
}

onMounted(() => {
  //addListenerToAllButtons()
})

useHead({
  title: 'Donate',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: 'Donate to Petruquio.LIVE to help keep it running!',
    },
  ],
})

</script>

<style></style>