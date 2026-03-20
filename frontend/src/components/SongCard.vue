<template>
  <div class="song-card" @click="$emit('click', song)">
    <div class="card-inner">
      <div class="song-title">{{ song.title }}</div>
      <div class="song-artist">{{ song.artist }}</div>
      <div class="song-tags" v-if="song.tags?.length">
        <span v-for="tag in song.tags" :key="tag" class="tag-pill">{{ tag }}</span>
      </div>
    </div>
    <div class="card-glow"></div>
  </div>
</template>

<script setup>
defineProps({ song: { type: Object, required: true } })
defineEmits(['click'])
</script>

<style scoped>
.song-card {
  position: relative;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.32s ease;
  animation: fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
}

html.dark .song-card {
  background: #18181c;
  border: 1px solid #2a2a30;
}
html:not(.dark) .song-card {
  background: #fff;
  border: 1px solid #e5e5ea;
}

.song-card:hover {
  transform: translateY(-6px) scale(1.01);
}
html.dark .song-card:hover {
  box-shadow: 0 12px 40px rgba(124,92,252,0.18), 0 0 0 1px rgba(124,92,252,0.25);
}
html:not(.dark) .song-card:hover {
  box-shadow: 0 12px 40px rgba(108,92,231,0.12), 0 0 0 1px rgba(108,92,231,0.18);
}

.card-inner { position: relative; z-index: 1; padding: 20px; }

.song-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 6px;
  line-height: 1.3;
}
html.dark .song-title { color: rgba(255,255,255,0.92); }
html:not(.dark) .song-title { color: #1a1a1a; }

.song-artist {
  font-size: 0.92rem;
  margin-bottom: 12px;
}
html.dark .song-artist { color: rgba(255,255,255,0.48); }
html:not(.dark) .song-artist { color: #888; }

.song-tags { display: flex; flex-wrap: wrap; gap: 6px; }

.tag-pill {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  transition: background 0.2s;
}
html.dark .tag-pill {
  background: rgba(124,92,252,0.15);
  color: #a78bfa;
}
html:not(.dark) .tag-pill {
  background: rgba(108,92,231,0.1);
  color: #6c5ce7;
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  border-radius: 14px;
}
html.dark .card-glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.08) 0%, transparent 70%);
}
.song-card:hover .card-glow { opacity: 1; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
