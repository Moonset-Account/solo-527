<template>
  <div class="mobile-members">
    <van-search
      v-model="keyword"
      placeholder="搜索姓名/手机号"
      shape="round"
      @search="loadMembers"
    />
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <van-cell
          v-for="member in members"
          :key="member.id"
          :title="member.name"
          :label="member.phone_display || member.phone"
          :value="`积分: ${member.points}`"
          is-link
          @click="goToDetail(member.id)"
        >
          <template #icon>
            <van-tag :type="levelTagType(member.level)" size="small" style="margin-right: 8px;">
              {{ member.level_name }}
            </van-tag>
          </template>
        </van-cell>
      </van-list>
    </van-pull-refresh>
    
    <van-fab
      v-if="canCreate"
      icon="plus"
      type="primary"
      @click="goToCreate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'
import { api } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')
const members = ref([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)

const canCreate = computed(() => userStore.isManager)

const levelTagType = (level) => {
  const types = { 1: 'default', 2: 'primary', 3: 'warning', 4: 'danger' }
  return types[level] || 'default'
}

const loadMembers = async (isRefresh = false) => {
  if (isRefresh) page.value = 1
  try {
    const { data } = await api.get('/members/members/', {
      params: { page: page.value, page_size: 20, search: keyword.value }
    })
    if (isRefresh) {
      members.value = data.results
    } else {
      members.value = [...members.value, ...data.results]
    }
    finished.value = !data.next
    page.value++
  } catch (e) {
    showToast('加载失败')
  }
}

const onLoad = () => {
  loadMembers()
  loading.value = false
}

const onRefresh = () => {
  finished.value = false
  loadMembers(true)
  refreshing.value = false
}

const goToDetail = (id) => {
  router.push(`/m/members/${id}`)
}

const goToCreate = () => {
  router.push('/m/members/create')
}

onMounted(() => {
  loadMembers()
})
</script>

<style lang="scss" scoped>
.mobile-members {
  padding-bottom: 60px;
}
</style>
