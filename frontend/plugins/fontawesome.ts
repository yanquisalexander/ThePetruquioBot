import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { faTwitch, faSpotify, faDiscord, faPatreon } from "@fortawesome/free-brands-svg-icons"

config.autoAddCss = false

library.add(faTwitch, faSpotify, faDiscord, faPatreon)

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon)
})
