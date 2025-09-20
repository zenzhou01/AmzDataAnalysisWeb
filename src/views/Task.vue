<template>
  <div>
    <h2>任务列表</h2>
    <nav class="sub-navbar">
      <router-link to="/task/tasklist">任务列表</router-link>
      <router-link to="/task/taskhistory">任务执行记录</router-link>
    </nav>

    <table class="task-table">
      <thead>
      <tr>
        <th>任务名称</th>
        <th>任务详情</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="task in tasks" :key="task.id">
        <td>{{ task.name }}</td>
        <td>{{ task.desc }}</td>
        <td>
          <button @click="runTask(task)">执行</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {TaskLoadKeywordData} from "../api/request.js";
import {showGlobalToast} from '@/utils/toastManager.js'


const tasks = ref([
  {
    id: 1,
    name: '同步词库数据',
    desc: '把卖家精灵中的词库的所有数据包括历史数据加载过来，执行时间比较久',
    task: TaskLoadKeywordData
  },
])

const runTask = (task) => {
  console.log(`执行任务: ${task.name}`)

  var rsp = task.task({"date": ["202311"]})
  if (rsp.code == 0 && rsp.data.errno ==0){
    showGlobalToast({message: data.errmsg || '接口返回错误', type: 'su', icon: ErrorIcon, duration: 1000})

  }


}
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

/* 表格样式 */
.task-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
  background: #f9f9f9;
}

.task-table th,
.task-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.task-table th {
  background: #eee;
}

button {
  background: #333;
  color: #fff;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}

button:hover {
  background: #ffd700;
  color: #333;
}
</style>