<template>
  <div class="bg-white rounded-xl shadow-sm border p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <NuxtLink
            v-if="!hideCodeLink"
            :to="detailUrl"
            class="text-sm font-mono text-primary-600 hover:underline"
          >{{ issue.code }}</NuxtLink>
          <span v-else class="text-sm font-mono text-gray-500">{{ issue.code }}</span>
          <span :class="'px-2 py-0.5 rounded text-xs font-medium ' + STATUS_COLORS[issue.status]">{{ STATUS_LABELS[issue.status] }}</span>
          <span :class="'text-xs font-medium ' + PRIORITY_COLORS[issue.priority]">● {{ PRIORITY_LABELS[issue.priority] }}</span>
          <span class="text-xs text-gray-500">{{ issue.category }}</span>
          <span v-if="issue.published" class="text-xs text-green-600">[已公示]</span>
        </div>
        <h3 v-if="!hideTitle" class="mt-1.5 text-lg font-semibold text-gray-900">
          <NuxtLink :to="detailUrl" class="hover:text-primary-700">{{ issue.title }}</NuxtLink>
        </h3>
        <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ issue.description }}</p>
        <div class="mt-3 flex items-center gap-3 flex-wrap text-xs text-gray-500">
          <span v-if="issue.community">社区：{{ issue.community }}</span>
          <span v-if="issue.gridNo">网格：{{ issue.gridNo }}</span>
          <span v-if="issue.location">📍 {{ issue.location }}</span>
          <span>🕒 {{ fmtDateTime(issue.createdAt) }}</span>
          <span v-if="issue.handler">负责人：{{ issue.handler }}</span>
          <span v-if="issue._count?.votes != null">🗳️ {{ issue._count.votes }}票</span>
          <span v-if="issue._count?.rectifications != null">🔧 整改{{ issue._count.rectifications }}条</span>
          <span v-if="issue._count?.reviews != null">✅ 复查{{ issue._count.reviews }}次</span>
          <span v-if="issue._count?.gridEvents != null">📡 网格事件{{ issue._count.gridEvents }}</span>
        </div>
      </div>
      <div class="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden border bg-gray-50 grid place-items-center">
        <img v-if="coverUrl" :src="coverUrl" class="w-full h-full object-cover" />
        <span v-else class="text-5xl text-gray-300">📷</span>
      </div>
    </div>
    <div v-if="showPhotos && issue.photos?.length" class="mt-4 flex gap-2 overflow-x-auto py-1">
      <div v-for="p in issue.photos" :key="p.id" class="w-20 h-20 flex-shrink-0 rounded overflow-hidden border">
        <img :src="p.url" class="w-full h-full object-cover cursor-zoom-in" @click="$emit('preview', p.url)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Issue } from '~/types'
const props = defineProps<{
  issue: Issue
  showPhotos?: boolean
  hideCodeLink?: boolean
  hideTitle?: boolean
  admin?: boolean
}>()
defineEmits(['preview'])
const detailUrl = computed(() => props.admin ? `/admin/issue/${props.issue.id}` : `/issue/${props.issue.id}`)
const coverUrl = computed(() => props.issue.photos?.[0]?.url)
</script>
