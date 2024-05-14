<template>
    <div class="space-y-4 max-w-3xl mx-auto">
        <template v-for="changelog in changelogs">
            <ContentRenderer :value="changelog">
                <h2 class="text-2xl font-semibold">
                    {{ changelog.title }}
                </h2>
                <div class="text-gray-500 mb-4">
                    {{ new Date(changelog.date).toLocaleDateString() }}
                </div>

                <ContentRendererMarkdown :value="changelog" />
                <template #empty>
                    <p>
                        This changelog is empty.
                    </p>
                </template>
            </ContentRenderer>
        </template>
    </div>
</template>

<script lang="ts" setup>
const { pending, data: changelogs } = await useAsyncData("changelogs", async () =>
    queryContent("/changelog").find()
);</script>