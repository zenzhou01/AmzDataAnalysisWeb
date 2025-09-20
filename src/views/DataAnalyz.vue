<template>
  <div class="data-analyz">
    <!-- 搜索表单 -->
    <div class="form-wrapper">
      <h2>数据分析</h2>
      <div class="form-section">

        <!-- 第一排 -->
        <div class="form-row">
          <!-- 关键词输入框 -->
          <div class="form-item keyword-item">
            <label for="keyword_list">关键词：</label>
            <div class="keyword-wrapper">
              <!-- 单行输入 -->
              <input
                  v-if="!expanded"
                  id="keyword_list"
                  v-model="query.keyword_list"
                  placeholder="多个关键词换行分隔"
              />
              <!-- 多行弹窗输入 -->
              <div v-else class="textarea-popup">
                <textarea v-model="query.keyword_list" rows="6"></textarea>
                <div class="popup-actions">
                  <button @click="expanded = false">关闭</button>
                </div>
              </div>
              <!-- 放大图标 -->
              <span class="expand-icon" v-if="!expanded" @click="expanded = true">🔍</span>
            </div>
          </div>

          <!-- 站点下拉 -->
          <div class="form-item">
            <label for="site">站点：</label>
            <el-select v-model="query.site" placeholder="请选择站点" size="small">
              <el-option v-for="site in siteOptions" :key="site" :label="site" :value="site"/>
            </el-select>
          </div>

          <!-- 月份下拉 -->
          <div class="form-item">
            <label for="month">月份：</label>
            <el-select v-model="query.month" placeholder="请选择月份" size="small">
              <el-option v-for="m in monthOptions" :key="m" :label="m" :value="m"/>
            </el-select>
          </div>
        </div>

        <!-- 第二排 -->
        <div class="form-row">
          <!-- 词库名单选 -->
          <div class="form-item">
            <label for="library_nmae">词库名：</label>
            <el-select
                v-model="query.library_nmae"
                placeholder="请选择词库"
                size="small"
                clearable
                @change="handleLibraryChange"
            >
              <el-option v-for="lib in libraryOptions" :key="lib" :label="lib" :value="lib"/>
            </el-select>
          </div>

          <!-- Tags 多选 -->
          <div class="form-item">
            <label for="tags">Tags：</label>
            <el-select
                v-model="query.tags"
                multiple
                filterable
                placeholder="请先选择词库"
                :disabled="!query.library_nmae"
                clearable
                size="small"
                class="tags-select"
            >
              <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag"/>
            </el-select>
          </div>

          <!-- 查询按钮 -->
          <div class="form-item">
            <button class="btn" @click="handleSearch" :disabled="loading">
              {{ loading ? '查询中...' : '查询' }}
            </button>
          </div>
        </div>

      </div>
      <hr/>
    </div>

    <!-- 筛选条件提示条 -->
    <div v-if="Object.keys(filters).length" class="filter-bar">
      <span v-for="(vals,key) in filters" :key="key" class="filter-tag">
        {{ getColLabel(key) }} = {{ vals.join(',') }}
        <span class="remove-tag" @click="clearOneFilter(key)">×</span>
      </span>
      <button class="clear-btn" @click="clearAllFilters">清除所有筛选</button>
    </div>

    <!-- 表格 -->
    <StickyTable v-if="results.length" :columns="columns" :data="results" v-model:filters="filters"/>
    <p v-else class="no-data">暂无数据</p>
  </div>
</template>

<script setup>
import {reactive, ref, watch, onMounted} from 'vue'
import StickyTable from '@/components/StickyTable.vue'
import {AmzDataAnalysisOpeartor, GetLibraryOptions, GetTagOptions} from '@/api/request.js'
import {showGlobalToast} from '@/utils/toastManager.js'
import ErrorIcon from '@/components/icons/ErrorIcon.vue'
import 'element-plus/dist/index.css'
import {ElSelect, ElOption} from 'element-plus'

// 表单选项
const siteOptions = ['US'] //, 'UK', 'DE', 'FR', 'JP', 'CA'
const monthOptions = []
const current = new Date()

let year = current.getFullYear()
let month = current.getMonth() // 上个月，getMonth() 返回 0~11

// 如果当前是1月，上个月是上一年的12月
if (month === 0) {
  month = 12
  year -= 1
}

// 循环倒推到 2023-07
while (year > 2023 || (year === 2023 && month >= 7)) {
  monthOptions.push(`${year}-${month.toString().padStart(2, '0')}`)
  month -= 1
  if (month === 0) {
    month = 12
    year -= 1
  }
}

// 响应式数据
const query = reactive({
  keyword_list: '',
  site: '',
  month: '',
  library_nmae: '', // 单选
  tags: []
})
const results = ref([])
const columns = ref([{key: '_placeholder', label: '', prop: '_placeholder'}])
const loading = ref(false)
const filters = ref({})
const libraryOptions = ref([])
const tagOptions = ref([])
const expanded = ref(false)

// 工具函数
const parseList = str => str.split('\n').map(s => s.trim()).filter(Boolean)
const getColLabel = prop => columns.value.find(c => c.prop === prop)?.label || prop
const clearOneFilter = key => {
  filters.value = {...filters.value};
  delete filters.value[key];
  filters.value = {...filters.value}
}
const clearAllFilters = () => {
  filters.value = {}
}

// 获取词库
const fetchLibrary = async () => {
  try {
    const res = await GetLibraryOptions()
    libraryOptions.value = res.data.data || []
  } catch (err) {
    showGlobalToast({message: err.message || '获取词库失败', type: 'error', icon: ErrorIcon, duration: 1000})
  }
}

// 获取 tags
const fetchTags = async (library_name) => {
  try {
    const res = await GetTagOptions({library_name})
    tagOptions.value = res.data.data || []
    query.tags = query.tags.filter(t => tagOptions.value.includes(t))
  } catch (err) {
    showGlobalToast({message: err.message || '获取 tags 失败', type: 'error', icon: ErrorIcon, duration: 1000})
  }
}

// 处理词库选择或清空
const handleLibraryChange = (value) => {
  if (!value) {
    query.tags = []
    tagOptions.value = []
    return
  }
  fetchTags(value)
}

// 初始化
onMounted(fetchLibrary)

// 搜索
const handleSearch = async () => {
  loading.value = true
  const payload = {
    keyword_list: parseList(query.keyword_list),
    site: query.site,
    month: query.month,
    library_nmae: query.library_nmae,
    tags: query.tags
  }
  try {
    const response = await AmzDataAnalysisOpeartor({operator: '挖掘利基关键词市场-Web', query: payload})
    const data = response.data
    if (data.errno !== 0) {
      showGlobalToast({message: data.errmsg || '接口返回错误', type: 'warning', icon: ErrorIcon, duration: 1000})
      results.value = []
      columns.value = [{key: '_placeholder', label: '', prop: '_placeholder'}]
    } else {
      results.value = (data.data || []).map(item => {
        const newItem = {}
        Object.keys(item).filter(k => k).forEach(key => {
          newItem[key] = item[key] != null ? item[key] : ''
        })
        return newItem
      })
      columns.value = results.value[0] ? Object.keys(results.value[0]).map(k => ({
        key: k,
        label: k,
        prop: k
      })) : [{key: '_placeholder', label: '', prop: '_placeholder'}]
    }
  } catch (err) {
    showGlobalToast({message: err.message || '网络请求失败', type: 'error', icon: ErrorIcon, duration: 1000})
    results.value = []
    columns.value = [{key: '_placeholder', label: '', prop: '_placeholder'}]
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.data-analyz {
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.form-wrapper {
  flex: 0 0 auto;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 150px;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 4px;
}

.form-item label {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  min-width: 60px;
}

.form-item input,
.form-item select,
.form-item .el-select {
  width: 220px;
  box-sizing: border-box;
}

.tags-select {
  width: 300px !important;
}

.btn {
  padding: 6px 14px;
  background-color: #409eff;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.btn:hover {
  background-color: #66b1ff;
}

.filter-bar {
  margin: 10px 0;
  padding: 6px 10px;
  background: #f0f9ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tag {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.remove-tag {
  margin-left: 4px;
  cursor: pointer;
  color: red;
}

.clear-btn {
  border: none;
  background: transparent;
  color: red;
  cursor: pointer;
  font-size: 12px;
}

.no-data {
  text-align: center;
  margin-top: 20px;
}

.el-select {
  font-size: 14px !important;
}

.el-select .el-input__inner {
  height: 32px !important;
  padding-right: 24px;
}

.el-select .el-select__caret {
  width: 12px !important;
  height: 12px !important;
  margin-top: -6px;
}

.tags-select .el-select__tags {
  max-height: 80px;
  overflow-y: auto;
}

/* ----------------- 关键词输入框扩展样式 ----------------- */
.keyword-item .keyword-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 220px; /* 和 input 一样宽 */
}

/* input 内部留出图标空间 */
.keyword-item input {
  width: 100%;
  padding-right: 28px; /* 留出图标空间 */
  box-sizing: border-box;
  border: 1px solid #dcdfe6; /* 与 el-input 默认边框颜色一致 */
  border-radius: 4px;
  height: 32px; /* 与 el-input 高度一致 */
  font-size: 14px; /* 与 el-input 字号一致 */
  color: #303133; /* 输入文字颜色统一 */
}

/* placeholder 样式 */
.keyword-item input::placeholder {
  color: #c0c4cc; /* 与 el-input placeholder 颜色一致 */
  font-size: 14px; /* 与 el-input placeholder 字号一致 */
}

/* 放大图标绝对定位到 input 右侧 */
.keyword-item .expand-icon {
  position: absolute;
  right: 6px; /* 距离右边框6px，可调 */
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  color: #999;
}

/* 多行 textarea 弹窗样式 */
.textarea-popup {
  position: absolute;
  top: 36px;
  left: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.textarea-popup textarea {
  width: 100%;
  box-sizing: border-box;
  font-size: 14px;
  padding: 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  color: #303133;
}

.textarea-popup .popup-actions {
  margin-top: 6px;
  text-align: right;
}

.textarea-popup .popup-actions button {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  background-color: #409eff;
  color: #fff;
  border-radius: 3px;
  cursor: pointer;
}

.textarea-popup .popup-actions button:hover {
  background-color: #66b1ff;
}
</style>
