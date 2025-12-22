<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1>記事管理</h1>
    
    <!-- Controls -->
    <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
      <button 
        @click="fetchRss" 
        :disabled="fetchingRss"
        style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        {{ fetchingRss ? '取得中...' : 'RSS取得' }}
      </button>
      <button 
        @click="fetchItems" 
        :disabled="loading"
        style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        {{ loading ? '読み込み中...' : '再読み込み' }}
      </button>
      
      <label style="display: flex; align-items: center; gap: 5px;">
        ステータス:
        <select 
          v-model="filters.status" 
          @change="fetchItems"
          style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px;"
        >
          <option value="">すべて</option>
          <option value="new">新規</option>
          <option value="drafted">下書き</option>
          <option value="used">使用済み</option>
          <option value="skipped">スキップ</option>
        </select>
      </label>
      
      <label style="display: flex; align-items: center; gap: 5px;">
        並び順:
        <select 
          v-model="filters.sort" 
          @change="fetchItems"
          style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px;"
        >
          <option value="published_at">公開日時</option>
          <option value="score">スコア</option>
        </select>
      </label>
    </div>

    <!-- Error Message -->
    <div v-if="error" style="padding: 10px; background: #f8d7da; color: #721c24; border-radius: 4px; margin-bottom: 20px;">
      {{ error }}
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">タイトル/リンク</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">ステータス</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">スコア</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">公開日時</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0 && !loading">
          <td colspan="5" style="padding: 20px; text-align: center; color: #666;">
            記事が見つかりません
          </td>
        </tr>
        <tr v-for="item in items" :key="item.id" style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; border: 1px solid #ddd;">
            <div>
              <a 
                v-if="item.link"
                :href="item.link"
                target="_blank"
                style="color: #007bff; text-decoration: none; cursor: pointer;"
                @mouseover="$event.target.style.textDecoration = 'underline'"
                @mouseout="$event.target.style.textDecoration = 'none'"
              >
                {{ item.title || 'タイトルなし' }}
              </a>
              <span v-else>{{ item.title || 'タイトルなし' }}</span>
            </div>
            <div v-if="item.link" style="font-size: 12px; color: #666;">
              {{ item.link }}
            </div>
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <span style="padding: 4px 8px; background: #e9ecef; border-radius: 4px; font-size: 12px;">
              {{ item.status }}
            </span>
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">{{ item.score || 0 }}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            {{ item.published_at ? new Date(item.published_at).toLocaleString() : '-' }}
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
              <button 
                @click="handleAction('draft', item.id)"
                :disabled="actionLoading[item.id]"
                style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              >
                下書き
              </button>
              <button 
                @click="handleAction('skip', item.id)"
                :disabled="actionLoading[item.id]"
                style="padding: 4px 8px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              >
                スキップ
              </button>
              <button 
                @click="handleAction('use', item.id)"
                :disabled="actionLoading[item.id]"
                style="padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              >
                使用済み
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination Info -->
    <div v-if="items.length > 0" style="margin-top: 20px; color: #666; font-size: 14px;">
      {{ items.length }}件表示中 (ページ {{ page }}, 1ページあたり {{ pageSize }}件)
    </div>
  </div>
</template>

<script setup lang="ts">
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

const filters = ref({
  status: '',
  sort: 'published_at'
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
    error.value = err.message || 'Failed to fetch items'
    console.error('Error fetching items:', err)
  } finally {
    loading.value = false
  }
}

const handleAction = async (action: 'draft' | 'skip' | 'use', itemId: string) => {
  actionLoading.value[itemId] = true
  
  try {
    if (action === 'draft') {
      // Special handling for draft action
      const response = await $fetch<{ ok: boolean; created?: number; typefully?: number }>(
        `/api/items/${itemId}/${action}`,
        { method: 'POST' }
      )
      
      if (response.ok) {
        const created = response.created || 0
        const typefully = response.typefully || 0
        alert(`下書きを作成しました。\n生成数: ${created}件\nTypefully作成数: ${typefully}件`)
        // Refresh items after action
        await fetchItems()
      }
    } else {
      const response = await $fetch<{ ok: boolean }>(
        `/api/items/${itemId}/${action}`,
        { method: 'POST' }
      )
      
      if (response.ok) {
        // Refresh items after action
        await fetchItems()
      }
    }
  } catch (err: any) {
    const errorMessage = err.data?.error || err.data?.message || err.message || `Failed to ${action} item`
    const errorCode = err.data?.code || ''
    const errorDetails = err.data?.details || err.data?.hint || ''
    const errorHint = err.data?.hint || ''
    const fullErrorMessage = errorCode || errorDetails || errorHint 
      ? `${errorMessage}\n\nコード: ${errorCode}\n詳細: ${errorDetails}\nヒント: ${errorHint}` 
      : errorMessage
    error.value = errorMessage
    alert(`エラー: ${fullErrorMessage}`)
    console.error(`Error ${action}ing item:`, err)
    console.error('Error details:', err.data)
    console.error('Full error object:', JSON.stringify(err, null, 2))
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
      alert(`${response.inserted}件の記事を追加しました`)
      // Refresh items after fetching RSS
      await fetchItems()
    }
  } catch (err: any) {
    error.value = err.message || 'RSS取得に失敗しました'
    console.error('Error fetching RSS:', err)
    alert(`エラー: ${err.message || 'RSS取得に失敗しました'}`)
  } finally {
    fetchingRss.value = false
  }
}

// Fetch items on mount
onMounted(() => {
  fetchItems()
})
</script>
