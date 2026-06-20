<template>
  <div v-if="photos?.length" class="space-y-2">
    <h4 class="text-sm font-semibold text-gray-700">{{ title }}</h4>
    <div class="grid grid-cols-4 md:grid-cols-6 gap-2">
      <div
        v-for="p in photos"
        :key="p.id"
        class="aspect-square rounded overflow-hidden border cursor-pointer group relative"
        @click="$emit('preview', p.url)"
      >
        <img :src="p.url" class="w-full h-full object-cover group-hover:scale-105 transition" />
        <span class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
          {{ p.type }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Photo } from '~/types'
defineProps<{ photos?: Photo[] | null; title?: string }>()
defineEmits(['preview'])
</script>
