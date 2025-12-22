<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Items</h1>
            <p class="mt-1 text-sm text-gray-500">RSSから取得した投稿候補を管理します</p>
          </div>
          <div class="flex gap-3">
            <button
              @click="fetchRss"
              :disabled="fetchingRss"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="fetchingRss"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ fetchingRss ? '取得中...' : 'Fetch RSS' }}
            </button>
            <button
              @click="fetchItems"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ loading ? '読み込み中...' : 'Reload' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <select
              v-model="filters.status"
              @change="fetchItems"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">すべて</option>
              <option value="new">新規</option>
              <option value="drafted">下書き</option>
              <option value="favorite">あとで読む</option>
              <option value="skipped">スキップ</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">並び順</label>
            <select
              v-model="filters.sort"
              @change="fetchItems"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="published_at">公開日時</option>
              <option value="score">スコア</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">タイトル検索</label>
            <input
              v-model="filters.search"
              @input="debouncedSearch"
              type="text"
              placeholder="タイトルで検索..."
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Table Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  タイトル/リンク
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  スコア
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  公開日時
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="filteredItems.length === 0 && !loading">
                <td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">
                  記事が見つかりません
                </td>
              </tr>
              <tr
                v-for="(item, index) in filteredItems"
                :key="item.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'bg-gray-50': index % 2 === 1 }"
              >
                <td class="px-6 py-4 text-sm">
                  <div>
                    <a
                      v-if="item.link"
                      :href="item.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {{ item.title || 'タイトルなし' }}
                    </a>
                    <span v-else class="text-gray-900 font-medium">{{ item.title || 'タイトルなし' }}</span>
                  </div>
                  <div v-if="item.link" class="mt-1 text-xs text-gray-500 truncate max-w-md">
                    {{ item.link }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ item.score || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.published_at ? formatDate(item.published_at) : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="handleAction('favorite', item.id)"
                      :disabled="actionLoading[item.id]"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        v-if="actionLoading[item.id]"
                        class="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      あとで読む
                    </button>
                    <button
                      @click="handleAction('draft', item.id)"
                      :disabled="actionLoading[item.id]"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        v-if="actionLoading[item.id]"
                        class="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      下書き
                    </button>
                    <button
                      @click="handleAction('skip', item.id)"
                      :disabled="actionLoading[item.id]"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        v-if="actionLoading[item.id]"
                        class="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      スキップ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Info -->
      <div v-if="filteredItems.length > 0" class="mt-6 text-sm text-gray-500">
        {{ filteredItems.length }}件表示中
        <span v-if="items.length !== filteredItems.length">
          (全{{ items.length }}件中)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

interface Item {
  id: string
  title?: string
  link?: string
  status: string
  score?: number
  published_at?: string
  [key: string]: any
}

const items = ref<Item[]>([])
const loading = ref(false)
const fetchingRss = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)
const actionLoading = ref<Record<string, boolean>>({})
const { success, error: showError } = useToast()

const filters = ref({
  status: '',
  sort: 'published_at',
  search: ''
})

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    // Search is handled by computed property
  }, 300)
}

// Filtered items based on search
const filteredItems = computed(() => {
  if (!filters.value.search) {
    return items.value
  }
  const searchLower = filters.value.search.toLowerCase()
  return items.value.filter(item =>
    item.title?.toLowerCase().includes(searchLower)
  )
})

const fetchItems = async () => {
  loading.value = true
  error.value = null
  
  try {
    const queryParams = new URLSearchParams()
    if (filters.value.status) {
      queryParams.append('status', filters.value.status)
    }
    queryParams.append('sort', filters.value.sort)
    queryParams.append('page', page.value.toString())
    queryParams.append('pageSize', pageSize.value.toString())
    
    const response = await $fetch<{ ok: boolean; data: Item[]; page: number; pageSize: number }>(
      `/api/items?${queryParams.toString()}`
    )
    
    if (response.ok) {
      items.value = response.data
      page.value = response.page
      pageSize.value = response.pageSize
    }
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to fetch items'
    error.value = errorMessage
    showError(errorMessage)
    console.error('Error fetching items:', err)
  } finally {
    loading.value = false
  }
}

const handleAction = async (action: 'draft' | 'skip' | 'favorite', itemId: string) => {
  actionLoading.value[itemId] = true
  
  try {
    if (action === 'draft') {
      const response = await $fetch<{ ok: boolean; created?: number; typefully?: number }>(
        `/api/items/${itemId}/${action}`,
        { method: 'POST' }
      )
      
      if (response.ok) {
        const created = response.created || 0
        const typefully = response.typefully || 0
        success(`下書きを作成しました。生成数: ${created}件、Typefully作成数: ${typefully}件`)
        await fetchItems()
      }
    } else {
      const response = await $fetch<{ ok: boolean }>(
        `/api/items/${itemId}/${action}`,
        { method: 'POST' }
      )
      
      if (response.ok) {
        const actionLabels: Record<string, string> = {
          skip: 'スキップ',
          favorite: 'あとで読む'
        }
        success(`${actionLabels[action]}に設定しました`)
        await fetchItems()
      }
    }
  } catch (err: any) {
    const errorMessage = err.data?.error || err.data?.message || err.message || `Failed to ${action} item`
    error.value = errorMessage
    showError(errorMessage)
    console.error(`Error ${action}ing item:`, err)
  } finally {
    actionLoading.value[itemId] = false
  }
}

const fetchRss = async () => {
  fetchingRss.value = true
  error.value = null
  
  try {
    const response = await $fetch<{ ok: boolean; inserted: number }>(
      '/api/items/fetch',
      { method: 'POST' }
    )
    
    if (response.ok) {
      success(`${response.inserted}件の記事を追加しました`)
      await fetchItems()
    }
  } catch (err: any) {
    const errorMessage = err.message || 'RSS取得に失敗しました'
    error.value = errorMessage
    showError(errorMessage)
    console.error('Error fetching RSS:', err)
  } finally {
    fetchingRss.value = false
  }
}

const copyId = async (id: string) => {
  try {
    await navigator.clipboard.writeText(id)
    success('IDをコピーしました')
  } catch (err) {
    showError('IDのコピーに失敗しました')
  }
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    drafted: 'bg-yellow-100 text-yellow-800',
    favorite: 'bg-yellow-100 text-yellow-800',
    skipped: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new: '新規',
    drafted: '下書き',
    favorite: 'あとで読む',
    skipped: 'スキップ'
  }
  return labels[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

// Fetch items on mount
onMounted(() => {
  fetchItems()
})
</script>
