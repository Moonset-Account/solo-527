<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="container mx-auto px-4 py-6">
      <NuxtPage />
    </main>
    <footer class="border-t bg-white mt-8 py-4 text-center text-gray-500 text-sm">
      居民议题闭环看板 © {{ new Date().getFullYear() }} · 为减少口头确认、提升处置效率而建
    </footer>
  </div>
</template>
