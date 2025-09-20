// •	导入 Vue Router 的核心函数。
// •	导入页面组件。
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import DataAnalyz from '../views/DataAnalyz.vue'

//  •	定义路由表，每条路由包含：
//  •	path：路由路径
// 	•	component：对应渲染的组件
// 	•	name：路由名称（可选，便于路由跳转或识别）
const routes = [
    { path: '/', component: Home, name: 'Home' },
    { path: '/dataAnalyz', component: DataAnalyz, name: 'DataAnalyz' },
    { path: '/about', component: About, name: 'About' },
]

// •	创建路由实例。
// •	createWebHistory() 使用 HTML5 History 模式，无 #。

const router = createRouter({
    history: createWebHistory(),
    routes
})
// 	•	导出路由实例，在 main.js 中使用。
export default router