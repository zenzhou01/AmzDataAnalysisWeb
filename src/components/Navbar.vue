<template>
  <nav class="navbar">
    <div
        v-for="link in links"
        :key="link.path"
        class="nav-item"
    >
      <!-- 一级导航 -->
      <router-link
          :to="link.path"
          class="nav-link"
          :class="{ active: isActive(link.path) }"
          v-if="!link.children"
      >
        {{ link.name }}
      </router-link>

      <!-- 带子菜单的一级导航 -->
      <div class="nav-dropdown" v-else>
        <span class="nav-link">{{ link.name }}</span>
        <div class="dropdown-menu">
          <router-link
              v-for="sublink in link.children"
              :key="sublink.path"
              :to="sublink.path"
              class="dropdown-link"
              :class="{ active: isActive(sublink.path) }"
          >
            {{ sublink.name }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const links = ref([
  { name: '首页', path: '/' },
  { name: '数据分析', path: '/dataAnalyz' },
  {
    name: '任务',
    path: '/task',
    children: [
      { name: '任务列表', path: '/task/tasklist' },
      { name: '任务执行记录', path: '/task/taskhistory' },
    ]
  },
  { name: '关于', path: '/about' },
])

const route = useRoute()
const isActive = (path) => route.path === path
</script>

<style>
.navbar {
  display: flex;
  background-color: #333;
  padding: 10px;
}

.nav-item {
  position: relative;
  margin-right: 20px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  padding: 5px 10px;
}

.nav-link.active {
  font-weight: bold;
  border-bottom: 2px solid #fff;
}

.nav-link:hover {
  color: #ffd700;
}

/* 下拉菜单 */
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  display: none;
  position: absolute;
  background-color: #444;
  min-width: 120px;
  top: 100%;
  left: 0;
  z-index: 1000;
  border-radius: 4px;
}

.dropdown-link {
  display: block;
  padding: 8px 12px;
  color: #fff;
  text-decoration: none;
}

.dropdown-link:hover {
  background-color: #555;
  color: #ffd700;
}

.nav-dropdown:hover .dropdown-menu {
  display: block;
}
</style>