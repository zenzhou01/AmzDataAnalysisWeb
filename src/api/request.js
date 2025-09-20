import axios from 'axios'


// npm run dev 会默认使用 development 模式 → import.meta.env.MODE === "development"
// npm run build 默认是 production → import.meta.env.MODE === "production"

const env = import.meta.env.MODE // 'development' 或 'production'

// 动态导入 JSON 配置
let apiConfig
if (env === 'production') {
    apiConfig = await import('@/config/api/prod/http.json')
} else {
    apiConfig = await import('@/config/api/dev/http.json')
}


export function AmzDataAnalysisOpeartor(params) {
    var serviceConfig = apiConfig.default[0].AmzDataAnalysis
    var servicePath = serviceConfig.service.opeartor.path
    var baseURL = `http://${serviceConfig.host}:${serviceConfig.port}`

    var request = axios.create({
        baseURL,
        timeout: 5000
    })
    return request.post(servicePath, params)
}


export function GetLibraryOptions() {
    var serviceConfig = apiConfig.default[0].AmzDataAnalysis
    var servicePath = serviceConfig.service.getLibraryOptions.path
    var baseURL = `http://${serviceConfig.host}:${serviceConfig.port}`

    var request = axios.create({
        baseURL,
        timeout: 5000
    })
    return request.get(servicePath)
}

export function GetTagOptions(params) {
    console.log(params)
    var serviceConfig = apiConfig.default[0].AmzDataAnalysis
    var servicePath = serviceConfig.service.getTagOptions.path
    var baseURL = `http://${serviceConfig.host}:${serviceConfig.port}`

    var request = axios.create({
        baseURL,
        timeout: 5000
    })
    return request.get(servicePath, {params:params})
}


export function TaskExcute(taskname,taskparams) {
    var serviceConfig = apiConfig.default[0].AmzDataAnalysis
    var servicePath = serviceConfig.service.taskExcute.path
    var baseURL = `http://${serviceConfig.host}:${serviceConfig.port}`

    var request = axios.create({
        baseURL,
        timeout: 5000
    })
    return request.post(servicePath, {"task_name":taskname,"task_params":taskparams})
}
