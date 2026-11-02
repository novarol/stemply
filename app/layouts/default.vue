<template>
  <div class="min-h-dvh bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <AppHeader />
    <main class="mx-auto max-w-4xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:py-8">
      <slot />
    </main>
  </div>
</template>
