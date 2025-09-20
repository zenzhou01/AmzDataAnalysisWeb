<template>
  <transition name="fade">
    <div v-if="visible" :class="['custom-toast', typeClass]">
      <div class="toast-content">
        <component v-if="icon" :is="icon" class="toast-icon" />
        <span class="toast-text">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  icon: { type: [Object, Function], default: null },
  duration: { type: Number, default: 2000 }
})

const visible = ref(true)   // 默认显示，而不是 false
const typeClass = computed(() => `toast-${props.type}`)

// 方法：显示 toast
function showToast() {
  visible.value = true
  setTimeout(() => {
    visible.value = false
  }, props.duration)
}

// ✅ 在 <script setup> 中暴露方法给父组件或外部调用
defineExpose({ showToast })
</script>

<style scoped>
.custom-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px 12px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
  z-index: 9999;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toast-icon {
  width: 16px;
  height: 16px;
}

.toast-text {
  font-size: 14px;
}

.toast-error { border-color: #f56c6c; background-color: #fff0f0; }
.toast-success { border-color: #67c23a; background-color: #f0fff0; }
.toast-info { border-color: #909399; background-color: #f5f7fa; }
.toast-warning { border-color: #e6a23c; background-color: #fdf6ec; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>