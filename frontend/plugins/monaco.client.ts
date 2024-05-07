import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import { configureMonacoTailwindcss, tailwindcssData } from 'tailwind-monaco-integration'

import * as monaco from "monaco-editor"
import { loader } from "@guolao/vue-monaco-editor"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
import tailwindcssWorker from "monaco-tailwindcss/tailwindcss.worker?worker"

export default defineNuxtPlugin((nuxtApp) => {

    import('monaco-themes/themes/Dracula.json').then((theme) => {
        // @ts-ignore
        monaco.editor.defineTheme('Dracula', theme.default)
        monaco.editor.setTheme('Dracula')
    })

    self.MonacoEnvironment = {
        getWorker(_, label) {
            if (label === "json") {
                return new jsonWorker()
            }
            if (label === "css" || label === "scss" || label === "less") {
                return new cssWorker()
            }
            if (label === "html" || label === "handlebars" || label === "razor") {
                return new htmlWorker()
            }
            if (label === "typescript" || label === "javascript") {
                return new tsWorker()
            }
            if (label === "tailwindcss") {
                return new tailwindcssWorker()
            }
            return new editorWorker()
        }
    }

    monaco.languages.css.cssDefaults.setOptions({
        data: {
            dataProviders: {
                tailwindcssData,
            },
        },
    });

    loader.config({
        monaco
    })



    nuxtApp.vueApp.use(VueMonacoEditorPlugin)

    configureMonacoTailwindcss(monaco)




    /*     nuxtApp.vueApp.use((app) => {
            app.use(VueMonacoEditorPlugin)
    
        }) */
})