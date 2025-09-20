// src/utils/toastManager.js
import { createApp, h } from 'vue'
import CustomToast from '@/components/CustomToast.vue'

let toastApp = null
let container = null

export function showGlobalToast({ message, type = 'info', icon = null, duration = 2000 }) {
    if (toastApp && container) {
        toastApp.unmount()
        document.body.removeChild(container)
    }

    container = document.createElement('div')
    document.body.appendChild(container)

    toastApp = createApp({
        render() {
            return h(CustomToast, { message, type, icon, duration })
        }
    })
    toastApp.mount(container)

    // 自动销毁
    setTimeout(() => {
        if (toastApp && container) {
            toastApp.unmount()
            document.body.removeChild(container)
            toastApp = null
            container = null
        }
    }, duration + 300)
}