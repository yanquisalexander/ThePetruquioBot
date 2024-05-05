import { createI18n, useI18n } from 'vue-i18n'
import { usePreferredLanguages } from '@vueuse/core'
import es from '../lang/es.json'
import en from '../lang/en.json'

export default defineNuxtPlugin(({ vueApp }) => {
    const cookie = useCookie('language')
    const browserLanguage = usePreferredLanguages().value[0].split('-')[0];

    const i18n = createI18n({
        legacy: false,
        globalInjection: true,
        locale: cookie.value || browserLanguage || 'en',
        messages: {
            en,
            es
        }
    })

    vueApp.use(i18n)
})
