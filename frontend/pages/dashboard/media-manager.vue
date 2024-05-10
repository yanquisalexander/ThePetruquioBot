<template>
    <DashboardPageContainer>
        <DashboardPageHeader title="Media Manager" />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <UCard v-for="upload in uploads" :key="upload.data.id">
                <div class="flex flex-col items-center space-y-2 grow">
                    <component :is="typeToRender(upload.data.mimetype)" :src="getPath(upload.data.path)" :muted="true"
                        autoplay :loop="typeToRender(upload.data.mimetype) === 'video'" controls
                        class="h-32 object-cover"
                        :class="(typeToRender(upload.data.mimetype) === 'video' || typeToRender(upload.data.mimetype) === 'audio') ? 'w-full' : 'w-32'"
                        :alt="upload.data.filename" />
                    <p class="mt-2 text-sm text-gray-600">{{ upload.data.filename }}</p>
                </div>
                <template #footer>
                    <div class="flex">
                        <!-- File info and delete button -->
                        <div class="flex-1 text-sm text-gray-600">
                            {{ upload.data.mimetype }} - {{ (upload.data.size / 1024 / 1024).toFixed(2) }} MB
                        </div>
                        <UButton size="sm" color="red" @click="deleteUpload(upload.data.id)" icon="i-lucide-trash">
                            Delete
                        </UButton>
                    </div>
                </template>
            </UCard>
        </div>

        <div class="mt-4">
            <UFormGroup label="Subir un archivo">
                <UInput type="file" size="md" icon="i-heroicons-folder" @change="handleFileUpload" />
            </UFormGroup>
        </div>


    </DashboardPageContainer>
</template>

<script lang="ts" setup>
const { fetchUploads, uploadFile } = useUploads()

const uploads = ref([])
definePageMeta({
    layout: 'dashboard',
    middleware: 'auth'
})

const getPath = (path: string) => {
    return "https://cdn.petruquio.live/" + path
}

useHead({
    title: 'Media Manager'
})

const handleFileUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    try {
        await uploadFile(file)
        const { data } = await fetchUploads()
        uploads.value = data.uploads
    } catch (error) {
        console.error(error)

    }

}

const typeToRender = (mimetype: string) => {
    switch (mimetype) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
            return 'img'
        case 'video/mp4':
            return 'video'
        case 'audio/mpeg':
            return 'audio'
        default:
            return 'file'
    }
}


onMounted(async () => {
    const { data } = await fetchUploads()
    console.log(data)
    uploads.value = data.uploads
})
</script>