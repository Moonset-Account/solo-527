<script setup>
import { Link } from '@inertiajs/vue3'

defineProps({
  links: Array,
})
</script>

<template>
  <div v-if="links && links.length > 3" class="flex items-center gap-1">
    <template v-for="(link, index) in links" :key="index">
      <span
        v-if="!link.url"
        :class="[
          'px-3 py-1.5 text-sm rounded-lg',
          link.active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-400 opacity-50 cursor-not-allowed',
        ]"
        v-html="link.label"
      />
      <Link
        v-else
        :href="link.url"
        :class="[
          'px-3 py-1.5 text-sm rounded-lg transition-colors',
          link.active
            ? 'bg-indigo-50 text-indigo-600 font-medium'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ]"
        v-html="link.label"
      />
    </template>
  </div>
</template>
