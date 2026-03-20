<template>
  <div>
    <div class="form-section">
      <div class="section-title">添加新标签</div>
      <n-space>
        <n-input v-model:value="newTagName" placeholder="输入标签名称" style="width: 200px;" @keyup.enter="addTag" />
        <n-button type="primary" @click="addTag" :loading="tagAdding">添加标签</n-button>
      </n-space>
    </div>

    <div class="form-section">
      <div class="section-title">现有标签</div>
      <div v-for="tag in tagDetails" :key="tag.id" class="tag-item">
        <div>
          <n-text strong>{{ tag.name }}</n-text>
          <div class="tag-stats">使用次数: {{ tag.usage_count }}</div>
        </div>
        <n-space>
          <n-button size="small" @click="openEditTag(tag)">编辑</n-button>
          <n-button size="small" type="error" @click="handleDeleteTag(tag.name)">删除</n-button>
        </n-space>
      </div>
      <n-empty v-if="tagDetails.length === 0" description="暂无标签" />
    </div>

    <n-modal v-model:show="editModal.show" preset="dialog" title="编辑标签">
      <n-input v-model:value="editModal.name" placeholder="标签名称" />
      <template #action>
        <n-space>
          <n-button @click="editModal.show = false">取消</n-button>
          <n-button type="primary" @click="handleUpdateTag">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getTagDetails, createTag, updateTag, deleteTag } from '../../api'

const message = useMessage()
const tagDetails = ref([])
const newTagName = ref('')
const tagAdding = ref(false)
const editModal = reactive({ show: false, id: null, name: '' })

async function load() {
  try {
    const data = await getTagDetails()
    if (data.success) tagDetails.value = data.data || []
  } catch {}
}

async function addTag() {
  if (!newTagName.value.trim()) { message.warning('请输入标签名称'); return }
  tagAdding.value = true
  try {
    const data = await createTag(newTagName.value)
    if (data.success) { newTagName.value = ''; message.success('标签添加成功'); await load() }
    else message.error(data.error || '添加失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('添加失败') }
  finally { tagAdding.value = false }
}

function openEditTag(tag) {
  editModal.show = true
  editModal.id = tag.id
  editModal.name = tag.name
}

async function handleUpdateTag() {
  if (!editModal.name.trim()) { message.warning('请输入标签名称'); return }
  try {
    const data = await updateTag(editModal.id, editModal.name)
    if (data.success) { editModal.show = false; message.success('标签更新成功'); await load() }
    else message.error(data.error || '更新失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('更新失败') }
}

async function handleDeleteTag(name) {
  try {
    const data = await deleteTag(name)
    if (data.success) { message.success('标签删除成功'); await load() }
    else message.error(data.error || '删除失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('删除失败') }
}

async function refresh() { await load() }
defineExpose({ refresh })
onMounted(load)
</script>

<style scoped>
.tag-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 10px; margin-bottom: 8px; transition: background 0.2s, border-color 0.2s; }
html.dark .tag-item { background: #1e1e24; border: 1px solid #2a2a30; }
html:not(.dark) .tag-item { background: #fff; border: 1px solid #e5e5ea; }
.tag-stats { font-size: 0.9rem; }
html.dark .tag-stats { color: rgba(255,255,255,0.38); }
html:not(.dark) .tag-stats { color: #666; }
</style>
