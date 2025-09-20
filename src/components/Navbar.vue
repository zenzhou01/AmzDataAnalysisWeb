<!--•	<template>：Vue 模板区域，写页面的 HTML 结构。-->
<!--  •	<nav class="navbar">：导航栏容器，给 CSS 样式用的类名 navbar。-->
<!--    •	<router-link>：Vue Router 提供的组件，类似 <a>，点击后会导航到对应路由而不会刷新页面。-->
<!--      •	v-for="link in links"：循环渲染数组 links 中的每一项。-->
<!--      •	:key="link.path"：循环渲染时必须提供唯一 key，用于 Vue 高效更新 DOM。-->
<!--      •	:to="link.path"：动态绑定路由路径，每个链接指向 link.path。-->
<!--      •	class="nav-link"：固定 CSS 类，用于样式。-->
<!--      •	:class="{ active: isActive(link.path) }"：动态绑定类，如果 isActive(link.path) 返回 true，会加上 active 类。
              active 是一个标记当前路由链接正在被选中的 CSS 类。-->
<!--      •	{{ link.name }}：插值表达式，显示链接文字。{{}} 类似引用变量-->

<template>
  <nav class="navbar">
    <router-link
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        class="nav-link"
        :class="{ active: isActive(link.path) }"

    >
      {{ link.name }}
    </router-link>
  </nav>
</template>

<!--•	<script setup>：Vue 3 推荐的组合式 API 语法糖，写起来更简洁。-->
<!--•	import { ref } from 'vue'：导入 ref，用于创建响应式数据。-->
<!--•	import { useRoute } from 'vue-router'：导入 useRoute 钩子，用来获取当前路由信息。-->
<!--•	const links = ref([...])：定义一个响应式数组 links，包含导航栏的每个链接名称和路径。-->
<!--•	const route = useRoute()：获取当前路由对象，可以访问当前路径 route.path。-->
<!--•	const isActive = (path) => route.path === path：判断当前路由是否是传入路径，用于高亮当前导航。-->

<script setup>
import {ref} from 'vue'
import {useRoute} from 'vue-router'

const links = ref([
  {name: '首页', path: '/'},
  {name: '数据分析', path: '/dataAnalyz'},
  {name: '关于', path: '/about'},
])

const route = useRoute()
const isActive = (path) => route.path === path
</script>

<!--
// •	<style>：写 CSS 样式。
// •	.navbar：设置导航栏为水平布局 flex，背景颜色深灰，内边距 10px。
// •	.nav-link：设置文字颜色白色、无下划线、右边距 20px。
// •	.nav-link.active：当导航当前页面高亮时，文字加粗并加底部白色边框。
// •	.nav-link:hover：鼠标悬停时文字变金色。
-->

<style>
.navbar {
  display: flex;
  background-color: #333;
  padding: 10px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  margin-right: 20px;
}

.nav-link.active {
  font-weight: bold;
  border-bottom: 2px solid #fff;
}

.nav-link:hover {
  color: #ffd700;
}
</style>