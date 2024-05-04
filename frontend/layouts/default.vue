<template>
  <div>
    <div id="_petruquiolive" class="text-white">

      <SiteHeader />
      <LazySiteAnnouncement />

      <main class="w-full flex flex-col gap-10 items-center max-w-5xl px-5 xl:max-w-7xl mt-[2.5rem] mx-auto z-10">
        <NoiseBackground />

        <div class="w-full mx-auto flex flex-col items-center subpixel-antialiased scroll-smooth gap-5 lg:gap-10 mb-10">
          <slot />
        </div>
      </main>
      <SiteFooter />
    </div>
  </div>
</template>
