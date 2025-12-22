<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1>RSS登録管理</h1>
    
    <!-- Add Source Form -->
    <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 4px; border: 1px solid #ddd;">
      <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">RSS登録</h2>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
        <div style="flex: 1; min-width: 200px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">名前</label>
          <input 
            v-model="form.name"
            type="text"
            placeholder="例: web.dev"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          />
        </div>
        <div style="flex: 2; min-width: 300px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">RSS URL</label>
          <input 
            v-model="form.rss_url"
            type="url"
            placeholder="例: https://web.dev/feed.xml"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          />
        </div>
        <div>
          <button 
            @click="addSource" 
            :disabled="adding || !form.name || !form.rss_url"
            style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;"
          >
            {{ adding ? '追加中...' : '追加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
      <button 
        @click="fetchSources" 
        :disabled="loading"
        style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        {{ loading ? '読み込み中...' : '再読み込み' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" style="padding: 10px; background: #f8d7da; color: #721c24; border-radius: 4px; margin-bottom: 20px;">
      {{ error }}
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" style="padding: 10px; background: #d4edda; color: #155724; border-radius: 4px; margin-bottom: 20px;">
      {{ successMessage }}
    </div>

    <!-- Sources Table -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">名前</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">RSS URL</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">登録日時</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="sources.length === 0 && !loading">
          <td colspan="4" style="padding: 20px; text-align: center; color: #666;">
            RSS登録が見つかりません
          </td>
        </tr>
        <tr v-for="source in sources" :key="source.id" style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; border: 1px solid #ddd;">
            <strong>{{ source.name }}</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <a 
              :href="source.rss_url" 
              target="_blank"
              style="color: #007bff; text-decoration: none; word-break: break-all;"
            >
              {{ source.rss_url }}
            </a>
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            {{ source.created_at ? new Date(source.created_at).toLocaleString() : '-' }}
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <button 
              @click="deleteSource(source.id, source.name)"
              :disabled="deleting[source.id]"
              style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
            >
              {{ deleting[source.id] ? '削除中...' : '削除' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Sources Count -->
    <div v-if="sources.length > 0" style="margin-top: 20px; color: #666; font-size: 14px;">
      合計: {{ sources.length }}件
    </div>
  </div>
</template>

<script setup lang="ts">
interface Source {
  id: string
  name: string
  rss_url: string
  created_at?: string
  [key: string]: any
}

const sources = ref<Source[]>([])
const loading = ref(false)
const adding = ref(false)
const deleting = ref<Record<string, boolean>>({})
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const form = ref({
  name: '',
  rss_url: ''
})

const fetchSources = async () => {
  loading.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch<{ ok: boolean; data: Source[] }>('/api/sources')
    
    if (response.ok) {
      sources.value = response.data
    }
  } catch (err: any) {
    error.value = err.message || 'RSS登録の取得に失敗しました'
    console.error('Error fetching sources:', err)
  } finally {
    loading.value = false
  }
}

const addSource = async () => {
  if (!form.value.name || !form.value.rss_url) {
    error.value = 'Name and RSS URL are required'
    return
  }

  adding.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch<{ ok: boolean; data: Source }>(
      '/api/sources',
      {
        method: 'POST',
        body: {
          name: form.value.name,
          rss_url: form.value.rss_url
        }
      }
    )
    
    if (response.ok) {
      // Reset form
      form.value.name = ''
      form.value.rss_url = ''
      successMessage.value = `"${response.data.name}" を追加しました`
      
      // Refresh sources list
      await fetchSources()
    }
  } catch (err: any) {
    error.value = err.message || 'RSS登録に失敗しました'
    console.error('Error adding source:', err)
  } finally {
    adding.value = false
  }
}

const deleteSource = async (id: string, name: string) => {
  if (!confirm(`"${name}" を削除してもよろしいですか？`)) {
    return
  }

  deleting.value[id] = true
  error.value = null
  successMessage.value = null
  
  try {
    const response = await $fetch<{ ok: boolean }>(
      `/api/sources/${id}`,
      { method: 'DELETE' }
    )
    
    if (response.ok) {
      successMessage.value = `"${name}" を削除しました`
      // Refresh sources list
      await fetchSources()
    }
  } catch (err: any) {
    error.value = err.message || 'RSS登録の削除に失敗しました'
    console.error('Error deleting source:', err)
  } finally {
    deleting.value[id] = false
  }
}

// Fetch sources on mount
onMounted(() => {
  fetchSources()
})
</script>
