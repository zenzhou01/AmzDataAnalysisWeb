<template>
  <div>
    <h2>任务执行历史</h2>

    <!-- 子导航 -->
    <nav class="sub-navbar">
      <router-link to="/task/tasklist">任务列表</router-link>
      <router-link to="/task/taskhistory">任务执行记录</router-link>
    </nav>

    <!-- 表格容器 -->
    <div class="task-table-wrapper">
      <table class="task-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>任务名称</th>
          <th>参数</th>
          <th>重试参数</th>
          <th>状态</th>
          <th>原因</th>
          <th>首次执行时间</th>
          <th>完成时间</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="task in tasks" :key="task.id">
          <td>{{ task.id }}</td>
          <td>{{ task.taskname }}</td>
          <td><pre>{{ formatArgs(task.args) }}</pre></td>
          <td><pre>{{ formatArgs(task.retry_args) }}</pre></td>
          <td :class="statusClass(task.status)">{{ statusText(task.status) }}</td>
          <td>{{ task.reason || '-' }}</td>
          <td>{{ formatTime(task.create_time) }}</td>
          <td>{{ formatTime(task.update_time) }}</td>
          <td>
            <!-- 执行中刷新按钮 -->
            <button
                :disabled="isLoading(task.id)"
                v-if="task.status === 0"
                @click="refreshTask(task.id)"
            >
              {{ isLoading(task.id) ? '刷新中...' : '刷新' }}
            </button>

            <!-- 执行失败重试按钮 -->
            <button
                :disabled="isLoading(task.id)"
                v-if="task.status === 2"
                @click="retryTask(task.id)"
            >
              {{ isLoading(task.id) ? '重试中...' : '重试' }}
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页器 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GetTaskExcuteHistoryList, GetTaskExcuteHistory, RetryTask } from "@/api/request.js"
import { showGlobalToast } from "@/utils/toastManager.js"
import ErrorIcon from "@/components/icons/ErrorIcon.vue"

// ---------------- 数据 ----------------
const tasks = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loadingTasks = ref([]) // 正在刷新或重试的任务ID

// 总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// ---------------- 工具函数 ----------------
const formatArgs = (args) => JSON.stringify(args, null, 2)
const formatTime = (time) => new Date(time).toLocaleString()
const statusText = (status) => ({0:'执行中',1:'执行成功',2:'执行失败'}[status] || '未知')
const statusClass = (status) => ({
  'status-running': status === 0,
  'status-success': status === 1,
  'status-failed': status === 2
})
const isLoading = (taskId) => loadingTasks.value.includes(taskId)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ---------------- 接口调用 ----------------
// 获取任务列表（分页）
const fetchTasks = async () => {
  try {
    const res = await GetTaskExcuteHistoryList(currentPage.value, pageSize.value)
    const data = res.data
    if (data.errno !== 0) {
      showGlobalToast({ message: data.errmsg || '接口返回错误', type: 'warning', icon: ErrorIcon, duration: 1000 })
    } else {
      tasks.value = data.data.list
      total.value = data.data.total
    }
  } catch (err) {
    showGlobalToast({ message: err.message || '网络请求失败', type: 'error', icon: ErrorIcon, duration: 1000 })
  }
}

// 翻页
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchTasks()
}

// ---------------- 单行刷新 ----------------
const refreshTask = async (taskId) => {

  if (!isLoading(taskId)) loadingTasks.value.push(taskId)

  try {
    console.log("单行刷新",taskId)
    const res = await GetTaskExcuteHistory(taskId)
    const data = res.data
    if (data.errno === 0) {
      const updatedTask = data.data
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = { ...updatedTask } // Vue 响应式更新
      }
    } else {
      showGlobalToast({ message: data.errmsg || '刷新任务失败', type: 'warning', icon: ErrorIcon, duration: 1000 })
    }
  } catch (err) {
    showGlobalToast({ message: err.message || '网络请求失败', type: 'error', icon: ErrorIcon, duration: 1000 })
  } finally {
    loadingTasks.value = loadingTasks.value.filter(id => id !== taskId)
  }
}

// ---------------- 重试任务 ----------------
const retryTask = async (taskId) => {
  if (isLoading(taskId)) return
  loadingTasks.value.push(taskId)

  try {
    const res = await RetryTask(taskId)
    const data = res.data

    if (data.errno === 0) {
      // 延迟 500ms 等后端处理
      await sleep(500)
      console.log("只刷新当前行")
      console.log(taskId)
      await refreshTask(taskId) // 只刷新当前行
    } else {
      showGlobalToast({ message: data.errmsg || '接口返回错误', type: 'warning', icon: ErrorIcon, duration: 1000 })
    }
  } catch (err) {
    showGlobalToast({ message: err.message || '网络请求失败', type: 'error', icon: ErrorIcon, duration: 1000 })
  } finally {
    loadingTasks.value = loadingTasks.value.filter(id => id !== taskId)
  }
}

// ---------------- 全局定时刷新执行中任务 ----------------
let intervalId = null
const autoRefreshTasks = async () => {
  const runningTasks = tasks.value.filter(task => task.status === 0)
  for (const task of runningTasks) {
    await refreshTask(task.id)
  }
}

onMounted(() => {
  fetchTasks()
  intervalId = setInterval(autoRefreshTasks, 5000) // 每5秒刷新执行中任务
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.sub-navbar {
  margin-top: 10px;
  background: #444;
  padding: 5px;
}
.sub-navbar a {
  color: white;
  margin-right: 15px;
  text-decoration: none;
}
.sub-navbar a.router-link-active {
  font-weight: bold;
  border-bottom: 2px solid #ffd700;
}

.task-table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  margin-top: 20px;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  background: #f9f9f9;
}

.task-table th, .task-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

.task-table th {
  position: sticky;
  top: 0;
  background: #eee;
  z-index: 1;
}

.status-running { color: #1e90ff; }
.status-success { color: #27ae60; }
.status-failed { color: #e74c3c; font-weight: bold; }

button {
  background: #333;
  color: #fff;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background: #ffd700;
  color: #333;
}

pre {
  margin: 0;
  font-size: 12px;
  background: #f3f3f3;
  padding: 4px;
  border-radius: 3px;
  max-width: 240px;
  max-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
}

.pagination {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}
</style>