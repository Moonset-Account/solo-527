declare module '#app' {
  interface NuxtApp {
    $prisma: any
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $prisma: any
  }
}

export {}
