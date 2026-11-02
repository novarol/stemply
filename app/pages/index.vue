<template>
  <section>
    <h1 class="text-2xl font-semibold tracking-tight">
      Scan
    </h1>
    <p class="mt-2 text-gray-600 dark:text-gray-400">
      Camera scanner and engine selector will live here in a later step.
    </p>

    <div class="mt-8">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 class="text-lg font-medium tracking-tight">
          Recent
        </h2>
        <NuxtLink
          to="/history"
          class="text-sm text-gray-600 underline-offset-2 hover:underline dark:text-gray-400"
        >
          View all
        </NuxtLink>
      </div>
      <RecentScansList :limit="5" />
    </div>
  </section>
</template>
