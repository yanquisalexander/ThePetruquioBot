<template>
    <section class="media-requests">
        <h2>Media Requests</h2>
        <div class="media-requests__list">
            <div class="media-requests__item" v-for="request in requests" :key="request.id">
                <div class="media-requests__item__info">
                    <div class="media-requests__item__info__name">{{ request.name }}</div>
                    <div class="media-requests__item__info__type">{{ request.type }}</div>
                </div>

            </div>
        </div>
        <YoutubeVue3 ref="youtube" :videoid="currentMedia.video_id" :width="0" :height="1" @ended="onEnded"
            @paused="onPaused" @played="onPlayed" />
    </section>
</template>

<script lang="ts" setup>
import { YoutubeVue3 } from 'youtube-vue3'

const youtubeRef = ref<typeof YoutubeVue3 | null>(null)

const currentMedia = ref({
    video_id: '',
    user_requester_id: 0,
})

const requests = ref([
    {
        id: 1,
        name: 'Test User',
        type: 'youtube',
        video_id: 'dQw4w9WgXcQ',
    },
    {
        id: 2,
        name: 'Test User 2',
        type: 'youtube',
        video_id: 'dQw4w9WgXcQ',
    },
])


const onEnded = () => {
    console.log('onEnded')
}

const onPaused = () => {
    console.log('onPaused')
}

const onPlayed = () => {
    console.log('onPlayed')
}

onMounted(() => {
    currentMedia.value = {
        video_id: requests.value[0].video_id,
        user_requester_id: requests.value[0].id,
    }
})







</script>