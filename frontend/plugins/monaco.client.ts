import { loader, install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import { configureMonacoTailwindcss, tailwindcssData } from 'monaco-tailwindcss'

import * as monaco from "monaco-editor"


export default defineNuxtPlugin((nuxtApp) => {

    import('monaco-themes/themes/Dracula.json').then((theme) => {
        // @ts-ignore
        monaco.editor.defineTheme('Dracula', theme.default)
        monaco.editor.setTheme('Dracula')
    })




    /*     monaco.languages.css.cssDefaults.setOptions({
            data: {
                dataProviders: {
                    tailwindcssData,
                },
            },
        });
     */
    loader.config({
        monaco
    })



    nuxtApp.vueApp.use(VueMonacoEditorPlugin)

    // configureMonacoTailwindcss(monaco)




    /*     nuxtApp.vueApp.use((app) => {
            app.use(VueMonacoEditorPlugin)
    
        }) */
})