<template>
  <div v-if="feedback">
    <div
      class="w-16 h-16 rounded-full overflow-hidden group-hover:ring-4 transition-all duration-250 group-hover:ring-twitch-500"
      :style="{ viewTransitionName: `feedback-img-${feedback.user}` }"
    >
      <img
        :src="feedback.avatar"
        :alt="feedback.user"
      >
    </div>
    <h3
      class="text-lg font-semibold text-center"
      :style="{ viewTransitionName: `
            feedback-${feedback.user}`
      }"
    >
      {{ feedback.user }}
    </h3>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const route = useRoute();
import FEEDBACKS from "@/FEEDBACKS.json";

const streamerName = route.params.streamer_name;

// find if the streamer is in the feedbacks list
const feedback = FEEDBACKS.find((feedback) => feedback.user === streamerName);

if (!feedback) {
  router.push("/");
}
</script>
