<template>
  <nav v-if="pagination && pagination.links && pagination.links.length > 3" class="flex items-center justify-center gap-1">
    <a v-for="(link, i) in pagination.links" :key="i"
       @click="link.url && $emit('change', link.url)"
       :class="['px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer select-none',
                link.active
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-100'
                : link.url
                ? 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed']"
       v-html="link.label.replace('&laquo;', '←').replace('&raquo;', '→')"></a>
  </nav>
</template>

<script setup>
defineProps({
  pagination: { type: Object, default: () => ({ links: [] }) }
});
defineEmits(['change']);
</script>
