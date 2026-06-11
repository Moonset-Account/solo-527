<script setup>
import { Link } from '@inertiajs/vue3'

defineProps({
  links: Array,
})
</script>

<template>
  <div v-if="links && links.length > 3" class="flex items-center gap-1">
    <template v-for="(link, i) in links" :key="i">
      <Link
        v-if="link.url"
        :href="link.url"
        :class="[
          link.active
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
          'inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors'
        ]"
        v-html="link.label"
      />
      <span
        v-else
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-md cursor-not-allowed"
        v-html="link.label"
      />
    </template>
  </div>
</template>
