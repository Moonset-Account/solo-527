<template>
  <div class="pets-list-page space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">宠物档案</h1>
        <p class="text-sm text-gray-500 mt-1">管理所有宠物的健康档案与服务记录</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small" type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon>
              <AddSharp />
            </n-icon>
          </template>
          新增宠物
        </n-button>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 16px 20px 20px;">
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div class="flex-1 w-full md:max-w-sm">
          <n-input
            v-model:value="petsStore.searchKeyword"
            placeholder="搜索宠物名称、品种或主人..."
            clearable
            size="medium"
          >
            <template #prefix>
              <n-icon>
                <SearchSharp />
              </n-icon>
            </template>
          </n-input>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <n-select
            v-model:value="petsStore.filterSpecies"
            :options="petsStore.speciesOptions"
            size="medium"
            style="width: 140px;"
            placeholder="物种筛选"
          />
          <n-select
            v-model:value="petsStore.filterGender"
            :options="petsStore.genderOptions"
            size="medium"
            style="width: 120px;"
            placeholder="性别筛选"
          />
          <n-button size="medium" text @click="resetFilters">
            重置筛选
          </n-button>
        </div>
      </div>
    </n-card>

    <div class="flex items-center justify-between text-sm text-gray-500">
      <span>共找到 <span class="font-medium text-gray-700">{{ petsStore.filteredPets.length }}</span> 只宠物</span>
    </div>

    <div v-if="petsStore.filteredPets.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="pet in petsStore.filteredPets"
        :key="pet.id"
        class="group cursor-pointer"
        @click="goToDetail(pet.id)"
      >
        <n-card class="!rounded-2xl !border-0 hover:!shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full" content-style="padding: 0;">
          <div class="relative">
            <div class="aspect-square overflow-hidden bg-gray-100">
              <img
                :src="pet.avatar"
                :alt="pet.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div class="absolute top-3 right-3">
              <n-tag :type="petsStore.getHealthStatusType(pet.healthStatus)" size="small" round>
                {{ petsStore.getHealthStatusLabel(pet.healthStatus) }}
              </n-tag>
            </div>
            <div class="absolute bottom-3 left-3 flex gap-1.5">
              <n-tag size="small" round style="background: rgba(255,255,255,0.95); border: none;">
                <n-icon size="14" :color="getSpeciesIconColor(pet.species)">
                  <component :is="getSpeciesIcon(pet.species)" />
                </n-icon>
                <span class="ml-1">{{ petsStore.getSpeciesLabel(pet.species) }}</span>
              </n-tag>
              <n-tag size="small" round style="background: rgba(255,255,255,0.95); border: none;">
                <n-icon size="14" :color="pet.gender === 'male' ? '#3B82F6' : '#EC4899'">
                  <MaleSharp v-if="pet.gender === 'male'" />
                  <FemaleSharp v-else />
                </n-icon>
                <span class="ml-1">{{ petsStore.getGenderLabel(pet.gender) }}</span>
              </n-tag>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-800">{{ pet.name }}</h3>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ pet.breed }}</p>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div class="flex items-center gap-1.5 text-sm text-gray-500">
                <n-icon size="14" color="#6B7280">
                  <TimeSharp />
                </n-icon>
                <span>{{ pet.age }}{{ pet.ageUnit === 'year' ? '岁' : '个月' }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-sm text-gray-500">
                <n-icon size="14" color="#6B7280">
                  <PersonSharp />
                </n-icon>
                <span>{{ pet.owner.name }}</span>
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <n-button size="small" block type="primary" ghost @click.stop="goToDetail(pet.id)">
                查看档案
              </n-button>
              <n-button size="small" @click.stop="showQuickView(pet)">
                快速查看
              </n-button>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <div v-else class="py-20 text-center">
      <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <n-icon size="36" color="#9CA3AF">
          <PawSharp />
        </n-icon>
      </div>
      <p class="text-gray-500">暂无符合条件的宠物</p>
      <n-button class="mt-4" type="primary" size="small" @click="resetFilters">
        重置筛选条件
      </n-button>
    </div>

    <n-modal
      v-model:show="quickViewVisible"
      preset="card"
      :title="quickViewPet?.name || '宠物详情'"
      style="width: 480px;"
      class="!rounded-2xl"
    >
      <div v-if="quickViewPet" class="space-y-4">
        <div class="flex gap-4">
          <img
            :src="quickViewPet.avatar"
            :alt="quickViewPet.name"
            class="w-28 h-28 rounded-xl object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-bold text-gray-800">{{ quickViewPet.name }}</h3>
              <n-tag :type="petsStore.getHealthStatusType(quickViewPet.healthStatus)" size="small" round>
                {{ petsStore.getHealthStatusLabel(quickViewPet.healthStatus) }}
              </n-tag>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ quickViewPet.breed }}</p>
            <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div class="flex items-center gap-1.5 text-gray-600">
                <n-icon size="14" color="#6B7280">
                  <TimeSharp />
                </n-icon>
                <span>{{ quickViewPet.age }}{{ quickViewPet.ageUnit === 'year' ? '岁' : '个月' }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-gray-600">
                <n-icon size="14" :color="quickViewPet.gender === 'male' ? '#3B82F6' : '#EC4899'">
                  <MaleSharp v-if="quickViewPet.gender === 'male'" />
                  <FemaleSharp v-else />
                </n-icon>
                <span>{{ petsStore.getGenderLabel(quickViewPet.gender) }}</span>
              </div>
              <div v-if="quickViewPet.weight" class="flex items-center gap-1.5 text-gray-600">
                <n-icon size="14" color="#6B7280">
                  <ScaleSharp />
                </n-icon>
                <span>{{ quickViewPet.weight }} kg</span>
              </div>
              <div v-if="quickViewPet.sterilized !== undefined" class="flex items-center gap-1.5 text-gray-600">
                <n-icon size="14" color="#6B7280">
                  <CheckmarkCircleSharp v-if="quickViewPet.sterilized" />
                  <CloseCircleSharp v-else />
                </n-icon>
                <span>{{ quickViewPet.sterilized ? '已绝育' : '未绝育' }}</span>
              </div>
            </div>
          </div>
        </div>

        <n-divider class="!my-3" />

        <div>
          <div class="text-sm font-medium text-gray-700 mb-2">主人信息</div>
          <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <n-icon size="20" color="#1A8A7D">
                <PersonSharp />
              </n-icon>
            </div>
            <div>
              <div class="font-medium text-gray-800">{{ quickViewPet.owner.name }}</div>
              <div class="text-sm text-gray-500">{{ quickViewPet.owner.phone }}</div>
            </div>
          </div>
        </div>

        <div v-if="quickViewPet.description">
          <div class="text-sm font-medium text-gray-700 mb-2">备注</div>
          <p class="text-sm text-gray-600 p-3 rounded-xl bg-gray-50">{{ quickViewPet.description }}</p>
        </div>

        <div>
          <div class="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span>最近健康记录</span>
            <span class="text-xs text-gray-400">{{ quickViewPet.healthRecords.length }} 条</span>
          </div>
          <div class="space-y-2 max-h-32 overflow-y-auto pr-1">
            <div
              v-for="record in quickViewPet.healthRecords.slice(0, 3)"
              :key="record.id"
              class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="getHealthRecordIconBg(record.type)"
              >
                <n-icon size="16" :color="getHealthRecordIconColor(record.type)">
                  <component :is="getHealthRecordIcon(record.type)" />
                </n-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-800 truncate">{{ record.title }}</div>
                <div class="text-xs text-gray-500">{{ record.date }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <n-button block type="primary" @click="goToDetail(quickViewPet.id)">
            查看完整档案
          </n-button>
        </div>
      </div>
    </n-modal>

    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      title="新增宠物档案"
      style="width: 560px;"
      class="!rounded-2xl"
    >
      <div class="space-y-4">
        <div class="text-center py-4">
          <div class="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <n-icon size="40" color="#9CA3AF">
              <PawSharp />
            </n-icon>
          </div>
          <p class="text-sm text-gray-500">新增宠物功能开发中...</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" disabled>确定创建</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Pet, PetSpecies, HealthRecord } from '~/stores/pets'
import {
  SearchSharp,
  AddSharp,
  PawSharp,
  TimeSharp,
  PersonSharp,
  MaleSharp,
  FemaleSharp,
  ScaleSharp,
  CheckmarkCircleSharp,
  CloseCircleSharp,
  HeartSharp,
  MedicalSharp,
  BandageSharp,
  BodySharp,
  FlowerSharp,
} from '@vicons/ionicons5'

const petsStore = usePetsStore()
const router = useRouter()

const quickViewVisible = ref(false)
const quickViewPet = ref<Pet | null>(null)
const showCreateModal = ref(false)

function goToDetail(id: string) {
  router.push(`/pets/${id}`)
}

function showQuickView(pet: Pet) {
  quickViewPet.value = pet
  quickViewVisible.value = true
}

function resetFilters() {
  petsStore.setSearchKeyword('')
  petsStore.setFilterSpecies('')
  petsStore.setFilterGender('')
}

function getSpeciesIcon(species: PetSpecies) {
  switch (species) {
    case 'dog': return PawSharp
    case 'cat': return PawSharp
    case 'rabbit': return PawSharp
    case 'bird': return FlowerSharp
    default: return PawSharp
  }
}

function getSpeciesIconColor(species: PetSpecies) {
  switch (species) {
    case 'dog': return '#F97316'
    case 'cat': return '#8B5CF6'
    case 'rabbit': return '#EC4899'
    case 'bird': return '#10B981'
    default: return '#6B7280'
  }
}

function getHealthRecordIcon(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return MedicalSharp
    case 'deworm': return BodySharp
    case 'checkup': return HeartSharp
    case 'treatment': return BandageSharp
    case 'surgery': return MedicalSharp
    default: return HeartSharp
  }
}

function getHealthRecordIconBg(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return 'bg-blue-50'
    case 'deworm': return 'bg-green-50'
    case 'checkup': return 'bg-teal-50'
    case 'treatment': return 'bg-orange-50'
    case 'surgery': return 'bg-red-50'
    default: return 'bg-gray-50'
  }
}

function getHealthRecordIconColor(type: HealthRecord['type']) {
  switch (type) {
    case 'vaccine': return '#3B82F6'
    case 'deworm': return '#10B981'
    case 'checkup': return '#1A8A7D'
    case 'treatment': return '#F97316'
    case 'surgery': return '#EF4444'
    default: return '#6B7280'
  }
}
</script>

<style scoped>
.pets-list-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
