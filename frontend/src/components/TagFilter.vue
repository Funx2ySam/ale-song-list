<template>
  <div class="tags-container">
    <button
      class="tag-btn"
      :class="{ active: selectedTag === '' }"
      @click="$emit('select', '')"
    >全部</button>
    <button
      v-for="tag in tags"
      :key="tag"
      class="tag-btn"
      :class="{ active: selectedTag === tag }"
      @click="$emit('select', tag)"
    >{{ tag }}</button>
  </div>
</template>

<script setup>
defineProps({
  tags: { type: Array, default: () => [] },
  selectedTag: { type: String, default: '' }
})
defineEmits(['select'])
</script>

<style scoped>
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }

.tag-btn {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
}

html.dark .tag-btn {
  background: #1e1e24;
  color: rgba(255,255,255,0.6);
  border-color: #2a2a30;
}
html.dark .tag-btn:hover {
  background: rgba(124,92,252,0.12);
  color: #a78bfa;
  border-color: rgba(124,92,252,0.3);
}
html.dark .tag-btn.active {
  background: #7c5cfc;
  color: #fff;
  border-color: #7c5cfc;
  box-shadow: 0 0 16px rgba(124,92,252,0.3);
}

html:not(.dark) .tag-btn {
  background: #f0f0f5;
  color: #666;
  border-color: #e5e5ea;
}
html:not(.dark) .tag-btn:hover {
  background: rgba(108,92,231,0.08);
  color: #6c5ce7;
  border-color: rgba(108,92,231,0.2);
}
html:not(.dark) .tag-btn.active {
  background: #6c5ce7;
  color: #fff;
  border-color: #6c5ce7;
}
</style>
