<template>
  <div class="min-h-screen">
    <div class="flex flex-col items-center justify-center min-h-screen">
      <a href="/" title="Go to homepage">
        <h1 class="font-inter text-lg md:text-xl font-medium my-4" translate="no">
          Petruquio.<span class="text-blue-500 font-bold" translate="no">LIVE</span>
        </h1>
      </a>
      <img :src="getImagePath()" :alt="`Error ${error.statusCode}`" class="h-32 md:h-64">
      <h1 class="text-4xl font-bold">
        {{ error.statusCode }}
      </h1>
      <p class="text-lg text-center">
        {{ error.message }}
      </p>

      <div class="mt-4 text-center px-2 md:px-0">
        <FunArrow class="w-8 h-8 inline-block rotate-[130deg] my-2" />
        <p class="text-lg">
          Here's a random cat fact:
        </p>
        <p class="text-sm">
          {{ randomCatFact?.fact }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface CatFact {
  fact: string;
  length: number;
}
const error = useError();

useHead({
  title: error.value.statusCode
    ? `Error ${error.value.statusCode}`
    : "Error",
})

console.log("--- 🚀 error ---")
console.warn("Stack trace:", error.value.stack || "No stack trace available")

const { data: randomCatFact } = useFetch<CatFact>("https://catfact.ninja/fact?max_length=50");

const getImagePath = () => {
  const showThisIsFineErrors = [
    404,
    503,
    521
  ]

  if (showThisIsFineErrors.includes(error.value.statusCode)) {
    return "/this-is-fine.webp"
  }

  return "https://httpcats.com/" + error.value.statusCode + ".jpg"
}

</script>
