import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DictionaryItem } from '~/types'
import { getAllDictionaries } from '~/api/system'

export const useDictStore = defineStore('dict', () => {
  const dictionaries = ref<Record<string, DictionaryItem[]>>({})

  async function loadAllDictionaries() {
    try {
      const res = await getAllDictionaries()
      if (res.code === 200) {
        dictionaries.value = res.data
      }
    } catch (e) {
      console.error('加载字典失败:', e)
    }
  }

  function getDict(code: string): DictionaryItem[] {
    return dictionaries.value[code] || []
  }

  function getDictLabel(code: string, value: string): string {
    const items = dictionaries.value[code]
    if (!items) return value
    const item = items.find(i => i.value === value)
    return item?.label || value
  }

  function getDictColor(code: string, value: string): string {
    const items = dictionaries.value[code]
    if (!items) return 'default'
    const item = items.find(i => i.value === value)
    return item?.color || 'default'
  }

  return {
    dictionaries,
    loadAllDictionaries,
    getDict,
    getDictLabel,
    getDictColor,
  }
})
